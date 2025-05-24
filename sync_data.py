# sync_data.py (향상된 자동 업데이트 버전)

import requests
import mysql.connector
import os
import schedule
import time
import threading
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("policy_sync.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# .env 파일에서 환경 변수 로드
load_dotenv()

# 환경 변수에서 설정값 읽기
API_KEY = os.getenv("SEOUL_API_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# API 기본 정보
SEOUL_API_BASE_URL = "http://openapi.seoul.go.kr:8088"
SERVICE_NAME = "VwSmpBizInfo"
REQUEST_TYPE = "json"
CHUNK_SIZE = 100


class PolicySyncService:
    """정책 데이터 자동 동기화 서비스"""

    def __init__(self):
        self.db_config = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
            "database": DB_NAME,
        }

    def get_db_connection(self):
        """데이터베이스 연결"""
        try:
            return mysql.connector.connect(**self.db_config)
        except mysql.connector.Error as err:
            logger.error(f"DB 연결 실패: {err}")
            raise err

    def fetch_seoul_policies(self):
        """서울시 Open API에서 모든 정책 데이터를 가져오는 함수"""
        all_policies = []
        start_index = 1
        total_count = 0

        logger.info("서울시 API에서 정책 데이터 가져오기 시작...")

        while True:
            end_index = start_index + CHUNK_SIZE - 1
            api_url = f"{SEOUL_API_BASE_URL}/{API_KEY}/{REQUEST_TYPE}/{SERVICE_NAME}/{start_index}/{end_index}"

            try:
                response = requests.get(api_url, timeout=30)
                response.raise_for_status()
                data = response.json()

                # API 자체 결과 코드 체크
                result_info = data.get(SERVICE_NAME, {}).get("RESULT")
                if not result_info or result_info.get("CODE") != "INFO-000":
                    logger.warning(f"API 응답 오류: {result_info}")
                    break

                # 첫 호출 시 전체 개수 저장
                if start_index == 1:
                    total_count = data.get(SERVICE_NAME, {}).get("list_total_count", 0)
                    if not isinstance(total_count, int):
                        total_count = int(total_count)
                    logger.info(f"총 정책 개수: {total_count}")
                    if total_count == 0:
                        logger.warning("가져올 데이터가 없습니다.")
                        break

                # 실제 데이터(row) 추출
                policies = data.get(SERVICE_NAME, {}).get("row", [])
                if not policies:
                    logger.info("더 이상 가져올 데이터가 없습니다.")
                    break

                all_policies.extend(policies)
                logger.info(
                    f"{len(policies)}개 데이터 추가됨 (현재까지 {len(all_policies)}개)"
                )

                # 다음 시작 위치 계산
                start_index += CHUNK_SIZE
                if start_index > total_count:
                    break

                # API 부하 방지를 위한 잠시 대기
                time.sleep(0.5)

            except requests.exceptions.RequestException as e:
                logger.error(f"HTTP 요청 오류: {e}")
                break
            except Exception as e:
                logger.error(f"데이터 처리 중 오류: {e}")
                break

        logger.info(f"데이터 가져오기 완료. 총 {len(all_policies)}개")
        return all_policies

    def get_existing_policies(self):
        """기존 DB의 정책 목록을 가져옴 (신규 정책 감지용)"""
        conn = None
        cursor = None
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                """
                SELECT id, biz_nm, updated_at 
                FROM policies 
                ORDER BY updated_at DESC
            """
            )

            existing_policies = cursor.fetchall()
            logger.info(f"기존 정책 {len(existing_policies)}개 조회됨")
            return existing_policies

        except mysql.connector.Error as err:
            logger.error(f"기존 정책 조회 실패: {err}")
            return []
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def save_to_db_with_tracking(self, policies):
        """정책을 DB에 저장하면서 신규/업데이트 추적"""
        conn = None
        cursor = None

        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            logger.info(f"DB 저장 시작... ({len(policies)}개)")

            # 기존 정책명 목록 가져오기 (중복 확인용)
            cursor.execute("SELECT biz_nm FROM policies")
            existing_policy_names = {row[0] for row in cursor.fetchall()}

            # 저장 통계
            stats = {"new": 0, "updated": 0, "unchanged": 0, "new_policies": []}

            # INSERT ... ON DUPLICATE KEY UPDATE SQL 구문
            sql = """
            INSERT INTO policies (
                biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm, biz_nm, biz_cn,
                utztn_trpr_cn, utztn_mthd_cn, oper_hr_cn, aref_cn, trgt_child_age,
                trgt_itrst, trgt_rgn, deviw_site_addr, aply_site_addr
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON DUPLICATE KEY UPDATE
                biz_lclsf_nm = VALUES(biz_lclsf_nm), 
                biz_mclsf_nm = VALUES(biz_mclsf_nm),
                biz_sclsf_nm = VALUES(biz_sclsf_nm), 
                biz_cn = VALUES(biz_cn),
                utztn_trpr_cn = VALUES(utztn_trpr_cn), 
                utztn_mthd_cn = VALUES(utztn_mthd_cn),
                oper_hr_cn = VALUES(oper_hr_cn), 
                aref_cn = VALUES(aref_cn),
                trgt_child_age = VALUES(trgt_child_age), 
                trgt_itrst = VALUES(trgt_itrst),
                trgt_rgn = VALUES(trgt_rgn), 
                deviw_site_addr = VALUES(deviw_site_addr),
                aply_site_addr = VALUES(aply_site_addr),
                updated_at = CURRENT_TIMESTAMP
            """

            for policy in policies:
                policy_name = policy.get("BIZ_NM")
                if not policy_name:
                    continue

                # 신규 정책인지 확인
                is_new = policy_name not in existing_policy_names

                values = (
                    policy.get("BIZ_LCLSF_NM"),
                    policy.get("BIZ_MCLSF_NM"),
                    policy.get("BIZ_SCLSF_NM"),
                    policy.get("BIZ_NM"),
                    policy.get("BIZ_CN"),
                    policy.get("UTZTN_TRPR_CN"),
                    policy.get("UTZTN_MTHD_CN"),
                    policy.get("OPER_HR_CN"),
                    policy.get("AREF_CN"),
                    policy.get("TRGT_CHILD_AGE"),
                    policy.get("TRGT_ITRST"),
                    policy.get("TRGT_RGN"),
                    policy.get("DEVIW_SITE_ADDR"),
                    policy.get("APLY_SITE_ADDR"),
                )

                try:
                    cursor.execute(sql, values)

                    if is_new:
                        stats["new"] += 1
                        stats["new_policies"].append(
                            {
                                "name": policy_name,
                                "category": policy.get("BIZ_MCLSF_NM", "기타"),
                                "target": policy.get("UTZTN_TRPR_CN", "")[:100],
                            }
                        )
                        logger.info(f"신규 정책 추가: {policy_name}")
                    else:
                        # affected_rows로 실제 업데이트 여부 확인
                        if cursor.rowcount > 1:  # INSERT는 1, UPDATE는 2
                            stats["updated"] += 1
                        else:
                            stats["unchanged"] += 1

                except mysql.connector.Error as err:
                    logger.error(f"정책 저장 오류 ({policy_name}): {err}")
                    continue

            conn.commit()

            # 저장 결과 로깅
            logger.info(
                f"""
DB 저장 완료:
- 신규 정책: {stats['new']}개
- 업데이트: {stats['updated']}개  
- 변경 없음: {stats['unchanged']}개
"""
            )

            # 신규 정책이 있으면 자세히 로깅
            if stats["new_policies"]:
                logger.info("신규 정책 목록:")
                for policy in stats["new_policies"][:10]:  # 최대 10개만
                    logger.info(f"  - {policy['name']} ({policy['category']})")
                if len(stats["new_policies"]) > 10:
                    logger.info(f"  ... 외 {len(stats['new_policies']) - 10}개 더")

            return stats

        except mysql.connector.Error as err:
            logger.error(f"DB 저장 실패: {err}")
            if conn:
                conn.rollback()
            return None
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def get_recent_policies(self, days=7):
        """최근 N일 내 추가/업데이트된 정책 조회"""
        conn = None
        cursor = None
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # 최근 N일 내 생성/업데이트된 정책
            cutoff_date = datetime.now() - timedelta(days=days)

            cursor.execute(
                """
                SELECT 
                    id, biz_nm, biz_cn, utztn_trpr_cn, 
                    biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm,
                    trgt_child_age, trgt_rgn, deviw_site_addr,
                    created_at, updated_at
                FROM policies 
                WHERE created_at >= %s OR updated_at >= %s
                ORDER BY 
                    CASE 
                        WHEN created_at >= %s THEN created_at 
                        ELSE updated_at 
                    END DESC
                LIMIT 20
            """,
                (cutoff_date, cutoff_date, cutoff_date),
            )

            recent_policies = cursor.fetchall()
            logger.info(f"최근 {days}일 내 정책 {len(recent_policies)}개 조회")
            return recent_policies

        except mysql.connector.Error as err:
            logger.error(f"최근 정책 조회 실패: {err}")
            return []
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def sync_policies(self):
        """정책 동기화 메인 함수"""
        try:
            logger.info("=== 정책 동기화 시작 ===")
            start_time = datetime.now()

            # 1. 서울시 API에서 데이터 가져오기
            policies = self.fetch_seoul_policies()
            if not policies:
                logger.warning("가져온 정책 데이터가 없습니다.")
                return False

            # 2. DB에 저장하면서 변경사항 추적
            stats = self.save_to_db_with_tracking(policies)
            if stats is None:
                logger.error("DB 저장 실패")
                return False

            # 3. 소요 시간 계산
            end_time = datetime.now()
            duration = end_time - start_time

            logger.info(
                f"""
=== 정책 동기화 완료 ===
소요 시간: {duration.total_seconds():.1f}초
처리된 정책: {len(policies)}개
신규 정책: {stats['new']}개
업데이트: {stats['updated']}개
"""
            )

            return True

        except Exception as e:
            logger.error(f"정책 동기화 실패: {e}")
            return False


# 스케줄러 설정
def setup_scheduler():
    """자동 스케줄링 설정"""
    policy_service = PolicySyncService()

    # 매일 오전 6시에 동기화
    schedule.every().day.at("06:00").do(policy_service.sync_policies)

    # 매주 월요일 오전 9시에 동기화 (추가)
    schedule.every().monday.at("09:00").do(policy_service.sync_policies)

    logger.info("자동 스케줄링 설정 완료:")
    logger.info("- 매일 오전 6시 정책 동기화")
    logger.info("- 매주 월요일 오전 9시 정책 동기화")


def run_scheduler():
    """스케줄러 실행 (백그라운드 스레드용)"""
    setup_scheduler()

    while True:
        schedule.run_pending()
        time.sleep(60)  # 1분마다 체크


def start_auto_sync():
    """자동 동기화 시작 (백그라운드)"""
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    logger.info("자동 동기화 백그라운드 스레드 시작됨")


# 메인 실행 부분
if __name__ == "__main__":
    policy_service = PolicySyncService()

    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "sync":
            # 즉시 동기화
            policy_service.sync_policies()

        elif command == "recent":
            # 최근 정책 조회
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
            recent = policy_service.get_recent_policies(days)
            print(f"\n최근 {days}일 내 정책 {len(recent)}개:")
            for policy in recent:
                print(f"- {policy['biz_nm']} ({policy['updated_at']})")

        elif command == "auto":
            # 자동 스케줄링 시작
            print("자동 정책 동기화 서비스 시작...")
            print("종료하려면 Ctrl+C를 누르세요.")
            try:
                run_scheduler()
            except KeyboardInterrupt:
                print("\n자동 동기화 서비스 종료됨")

        else:
            print("사용법:")
            print("  python sync_data.py sync     # 즉시 동기화")
            print("  python sync_data.py recent   # 최근 7일 정책 조회")
            print("  python sync_data.py recent 3 # 최근 3일 정책 조회")
            print("  python sync_data.py auto     # 자동 스케줄링 시작")
    else:
        # 기본 동작: 즉시 동기화
        policy_service.sync_policies()

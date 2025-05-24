# sync_data.py (수정된 버전 - 실제 변경사항만 추적)

import requests
import mysql.connector
import os
import schedule
import time
import threading
import hashlib
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
    """정책 데이터 자동 동기화 서비스 (실제 변경사항 추적)"""

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

    def create_content_hash(self, policy_data):
        """정책 내용의 해시값 생성 (변경사항 감지용)"""
        # 주요 내용들을 합쳐서 해시 생성
        content_parts = [
            str(policy_data.get("BIZ_NM", "")),
            str(policy_data.get("BIZ_CN", "")),
            str(policy_data.get("UTZTN_TRPR_CN", "")),
            str(policy_data.get("UTZTN_MTHD_CN", "")),
            str(policy_data.get("OPER_HR_CN", "")),
            str(policy_data.get("AREF_CN", "")),
            str(policy_data.get("TRGT_CHILD_AGE", "")),
            str(policy_data.get("TRGT_RGN", "")),
            str(policy_data.get("DEVIW_SITE_ADDR", "")),
            str(policy_data.get("APLY_SITE_ADDR", "")),
        ]

        content_string = "|".join(content_parts)
        return hashlib.md5(content_string.encode("utf-8")).hexdigest()

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

    def get_existing_policies_with_hash(self):
        """기존 DB의 정책 목록을 해시값과 함께 가져옴"""
        conn = None
        cursor = None
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                """
                SELECT biz_nm, content_hash, id, updated_at 
                FROM policies 
                ORDER BY updated_at DESC
            """
            )

            existing_policies = cursor.fetchall()

            # 정책명을 키로 하는 딕셔너리 생성
            policies_dict = {}
            for policy in existing_policies:
                policies_dict[policy["biz_nm"]] = policy

            logger.info(f"기존 정책 {len(existing_policies)}개 조회됨")
            return policies_dict

        except mysql.connector.Error as err:
            logger.error(f"기존 정책 조회 실패: {err}")
            return {}
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def save_to_db_with_real_change_tracking(self, policies):
        """정책을 DB에 저장하면서 실제 변경사항만 추적"""
        conn = None
        cursor = None

        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            logger.info(f"DB 저장 시작... ({len(policies)}개)")

            # 기존 정책들의 해시값 가져오기
            existing_policies = self.get_existing_policies_with_hash()

            # 저장 통계
            stats = {
                "new": 0,
                "updated": 0,
                "unchanged": 0,
                "new_policies": [],
                "updated_policies": [],
            }

            # 테이블에 content_hash 컬럼이 없다면 추가
            try:
                cursor.execute(
                    "ALTER TABLE policies ADD COLUMN content_hash VARCHAR(32)"
                )
                conn.commit()
                logger.info("content_hash 컬럼 추가됨")
            except mysql.connector.Error:
                # 이미 존재하면 무시
                pass

            # INSERT ... ON DUPLICATE KEY UPDATE SQL 구문 (content_hash 포함)
            sql = """
            INSERT INTO policies (
                biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm, biz_nm, biz_cn,
                utztn_trpr_cn, utztn_mthd_cn, oper_hr_cn, aref_cn, trgt_child_age,
                trgt_itrst, trgt_rgn, deviw_site_addr, aply_site_addr, content_hash
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
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
                content_hash = VALUES(content_hash),
                updated_at = CASE 
                    WHEN content_hash != VALUES(content_hash) THEN CURRENT_TIMESTAMP
                    ELSE updated_at
                END
            """

            for policy in policies:
                policy_name = policy.get("BIZ_NM")
                if not policy_name:
                    continue

                # 새로운 해시값 계산
                new_hash = self.create_content_hash(policy)

                # 기존 정책 정보 확인
                existing_policy = existing_policies.get(policy_name)

                if not existing_policy:
                    # 완전히 새로운 정책
                    is_new = True
                    is_updated = False
                elif existing_policy.get("content_hash") != new_hash:
                    # 내용이 변경된 정책
                    is_new = False
                    is_updated = True
                else:
                    # 변경사항 없는 정책
                    is_new = False
                    is_updated = False
                    stats["unchanged"] += 1
                    continue  # 저장하지 않고 넘어감

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
                    new_hash,
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
                    elif is_updated:
                        stats["updated"] += 1
                        stats["updated_policies"].append(
                            {
                                "name": policy_name,
                                "category": policy.get("BIZ_MCLSF_NM", "기타"),
                                "target": policy.get("UTZTN_TRPR_CN", "")[:100],
                            }
                        )
                        logger.info(f"정책 업데이트: {policy_name}")

                except mysql.connector.Error as err:
                    logger.error(f"정책 저장 오류 ({policy_name}): {err}")
                    continue

            conn.commit()

            # 저장 결과 로깅
            logger.info(
                f"""
DB 저장 완료:
- 신규 정책: {stats['new']}개
- 실제 업데이트: {stats['updated']}개  
- 변경 없음: {stats['unchanged']}개
"""
            )

            # 변경사항이 있는 경우만 자세히 로깅
            if stats["new_policies"]:
                logger.info("신규 정책 목록:")
                for policy in stats["new_policies"][:5]:
                    logger.info(f"  - {policy['name']} ({policy['category']})")
                if len(stats["new_policies"]) > 5:
                    logger.info(f"  ... 외 {len(stats['new_policies']) - 5}개 더")

            if stats["updated_policies"]:
                logger.info("업데이트된 정책 목록:")
                for policy in stats["updated_policies"][:5]:
                    logger.info(f"  - {policy['name']} ({policy['category']})")
                if len(stats["updated_policies"]) > 5:
                    logger.info(f"  ... 외 {len(stats['updated_policies']) - 5}개 더")

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

    def get_truly_recent_policies(self, days=7):
        """실제로 최근에 변경된 정책만 조회"""
        conn = None
        cursor = None
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # 최근 N일 내에 실제로 생성되거나 업데이트된 정책만
            cutoff_date = datetime.now() - timedelta(days=days)

            cursor.execute(
                """
                SELECT 
                    id, biz_nm, biz_cn, utztn_trpr_cn, 
                    biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm,
                    trgt_child_age, trgt_rgn, deviw_site_addr, aply_site_addr,
                    created_at, updated_at,
                    CASE 
                        WHEN created_at >= %s THEN 'new'
                        WHEN updated_at >= %s AND updated_at > created_at THEN 'updated'
                        ELSE 'existing'
                    END as policy_status,
                    CASE 
                        WHEN created_at >= %s THEN created_at 
                        ELSE updated_at 
                    END as recent_date
                FROM policies 
                WHERE (created_at >= %s) OR (updated_at >= %s AND updated_at > created_at)
                ORDER BY recent_date DESC
                LIMIT 50
            """,
                (cutoff_date, cutoff_date, cutoff_date, cutoff_date, cutoff_date),
            )

            recent_policies = cursor.fetchall()
            logger.info(
                f"실제 최근 {days}일 내 변경된 정책 {len(recent_policies)}개 조회"
            )
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
        """정책 동기화 메인 함수 (실제 변경사항만 추적)"""
        try:
            logger.info("=== 정책 동기화 시작 ===")
            start_time = datetime.now()

            # 1. 서울시 API에서 데이터 가져오기
            policies = self.fetch_seoul_policies()
            if not policies:
                logger.warning("가져온 정책 데이터가 없습니다.")
                return {
                    "success": False,
                    "message": "API에서 데이터를 가져올 수 없습니다.",
                }

            # 2. DB에 저장하면서 실제 변경사항만 추적
            stats = self.save_to_db_with_real_change_tracking(policies)
            if stats is None:
                logger.error("DB 저장 실패")
                return {"success": False, "message": "데이터베이스 저장 실패"}

            # 3. 소요 시간 계산
            end_time = datetime.now()
            duration = end_time - start_time

            # 4. 결과 메시지 생성
            total_changes = stats["new"] + stats["updated"]
            if total_changes == 0:
                message = "동기화 완료: 새로운 변경사항이 없습니다."
            else:
                message = (
                    f"동기화 완료: 신규 {stats['new']}개, 업데이트 {stats['updated']}개"
                )

            logger.info(
                f"""
=== 정책 동기화 완료 ===
소요 시간: {duration.total_seconds():.1f}초
처리된 정책: {len(policies)}개
신규 정책: {stats['new']}개
실제 업데이트: {stats['updated']}개
변경 없음: {stats['unchanged']}개
"""
            )

            return {
                "success": True,
                "message": message,
                "stats": stats,
                "total_changes": total_changes,
            }

        except Exception as e:
            logger.error(f"정책 동기화 실패: {e}")
            return {"success": False, "message": f"동기화 실패: {str(e)}"}


# 기존 스케줄러 코드는 동일...
def setup_scheduler():
    """자동 스케줄링 설정"""
    policy_service = PolicySyncService()

    schedule.every().day.at("06:00").do(policy_service.sync_policies)
    schedule.every().monday.at("09:00").do(policy_service.sync_policies)

    logger.info("자동 스케줄링 설정 완료:")
    logger.info("- 매일 오전 6시 정책 동기화")
    logger.info("- 매주 월요일 오전 9시 정책 동기화")


def run_scheduler():
    """스케줄러 실행 (백그라운드 스레드용)"""
    setup_scheduler()

    while True:
        schedule.run_pending()
        time.sleep(60)


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
            result = policy_service.sync_policies()
            print(f"동기화 결과: {result['message']}")

        elif command == "recent":
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
            recent = policy_service.get_truly_recent_policies(days)
            print(f"\n실제 최근 {days}일 내 변경된 정책 {len(recent)}개:")
            for policy in recent:
                status = "🆕" if policy["policy_status"] == "new" else "🔄"
                print(f"{status} {policy['biz_nm']} ({policy['updated_at']})")

        elif command == "auto":
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
        result = policy_service.sync_policies()
        print(f"동기화 결과: {result['message']}")

import requests
import mysql.connector  # 또는 pymysql 사용 시 import pymysql
import os
from dotenv import load_dotenv
import math  # 페이지 계산 위해 추가

# .env 파일에서 환경 변수 로드
load_dotenv()

# 환경 변수에서 설정값 읽기
API_KEY = os.getenv("SEOUL_API_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")  # 기본값 3306
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# API 기본 정보
SEOUL_API_BASE_URL = "http://openapi.seoul.go.kr:8088"
SERVICE_NAME = "VwSmpBizInfo"
REQUEST_TYPE = "json"
CHUNK_SIZE = (
    100  # 한 번에 가져올 데이터 개수 (API 최대치 확인 필요, 보통 100 또는 1000)
)


def fetch_seoul_policies():
    """서울시 Open API에서 모든 정책 데이터를 가져오는 함수"""
    all_policies = []
    start_index = 1
    total_count = 0

    print("데이터 가져오기 시작...")

    while True:
        end_index = start_index + CHUNK_SIZE - 1
        api_url = f"{SEOUL_API_BASE_URL}/{API_KEY}/{REQUEST_TYPE}/{SERVICE_NAME}/{start_index}/{end_index}"
        print(f"  Fetching: {start_index} - {end_index}")

        try:
            response = requests.get(api_url)
            response.raise_for_status()  # HTTP 오류 체크
            data = response.json()

            # API 자체 결과 코드 체크
            result_info = data.get(SERVICE_NAME, {}).get("RESULT")  # 중첩 구조 고려
            if not result_info or result_info.get("CODE") != "INFO-000":
                print(f"  API 오류 발생: {result_info}")
                break  # 오류 발생 시 중단

            # 첫 호출 시 전체 개수 저장
            if start_index == 1:
                total_count = data.get(SERVICE_NAME, {}).get("list_total_count", 0)
                if not isinstance(total_count, int):  # 간혹 문자열로 오는 경우 대비
                    total_count = int(total_count)
                print(f"  총 데이터 개수 확인: {total_count}")
                if total_count == 0:
                    print("  가져올 데이터가 없습니다.")
                    break

            # 실제 데이터(row) 추출 및 리스트에 추가
            policies = data.get(SERVICE_NAME, {}).get("row", [])
            if not policies:  # 더 이상 가져올 데이터가 없으면 종료
                print("  더 이상 가져올 데이터가 없습니다.")
                break

            all_policies.extend(policies)
            print(f"  {len(policies)}개 데이터 추가됨 (현재까지 {len(all_policies)}개)")

            # 다음 시작 위치 계산 및 종료 조건 확인
            start_index += CHUNK_SIZE
            if start_index > total_count:
                break

        except requests.exceptions.RequestException as e:
            print(f"  HTTP 요청 오류: {e}")
            break  # 네트워크 오류 시 중단
        except Exception as e:
            print(f"  데이터 처리 중 오류: {e}")
            break  # 기타 오류 시 중단

    print(f"데이터 가져오기 완료. 총 {len(all_policies)}개")
    return all_policies


def save_to_db(policies):
    """가져온 정책 리스트를 MySQL DB에 저장하는 함수"""
    conn = None  # finally에서 사용하기 위해 None으로 초기화
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
        )
        cursor = conn.cursor()
        print(f"\nDB 저장 시작... ({len(policies)}개)")

        # INSERT ... ON DUPLICATE KEY UPDATE SQL 구문 준비
        # policies 테이블의 컬럼 순서와 VALUES 안의 %s 개수, UPDATE 할 컬럼 목록을 일치시켜야 함
        sql = """
        INSERT INTO policies (
            biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm, biz_nm, biz_cn,
            utztn_trpr_cn, utztn_mthd_cn, oper_hr_cn, aref_cn, trgt_child_age,
            trgt_itrst, trgt_rgn, deviw_site_addr, aply_site_addr
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) ON DUPLICATE KEY UPDATE
            biz_lclsf_nm = VALUES(biz_lclsf_nm), biz_mclsf_nm = VALUES(biz_mclsf_nm),
            biz_sclsf_nm = VALUES(biz_sclsf_nm), biz_cn = VALUES(biz_cn),
            utztn_trpr_cn = VALUES(utztn_trpr_cn), utztn_mthd_cn = VALUES(utztn_mthd_cn),
            oper_hr_cn = VALUES(oper_hr_cn), aref_cn = VALUES(aref_cn),
            trgt_child_age = VALUES(trgt_child_age), trgt_itrst = VALUES(trgt_itrst),
            trgt_rgn = VALUES(trgt_rgn), deviw_site_addr = VALUES(deviw_site_addr),
            aply_site_addr = VALUES(aply_site_addr)
            -- id, created_at, updated_at은 자동으로 처리되므로 명시적 업데이트 불필요
        """

        saved_count = 0
        for policy in policies:
            # API 응답의 키와 테이블 컬럼명을 맞춰서 값을 튜플로 준비
            # .get(key, None) 을 사용하여 API 응답에 해당 키가 없을 경우 None 처리
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
                saved_count += 1
            except mysql.connector.Error as err:
                print(f"  DB 저장 오류 발생 (데이터: {policy.get('BIZ_NM')}): {err}")
                # 오류 발생 시 해당 데이터는 건너뛰거나 별도 처리 가능

        conn.commit()  # 모든 작업 완료 후 커밋
        print(f"DB 저장 완료. {saved_count}개 처리됨.")

    except mysql.connector.Error as err:
        print(f"DB 연결 또는 작업 오류: {err}")
    finally:
        # 연결 및 커서 자원 해제
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            print("DB 연결 해제됨.")


# --- 메인 실행 부분 (최종 확인) ---
if __name__ == "__main__":
    # 데이터를 한 번만 가져옵니다.
    fetched_policies = fetch_seoul_policies()

    # 가져온 데이터가 있을 경우에만 DB 저장을 시도합니다.
    if fetched_policies:
        save_to_db(fetched_policies)  # <-- 주석(#)이 없어야 합니다!
        # print("DB 저장 로직은 아직 구현되지 않았습니다.") <-- 이 라인은 삭제하거나 주석처리(#) 하세요.
    else:
        print("가져온 데이터가 없어 DB 저장을 진행하지 않습니다.")

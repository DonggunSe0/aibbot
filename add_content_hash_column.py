# add_content_hash_column.py (기존 테이블에 content_hash 컬럼 추가)

import mysql.connector
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# DB 설정
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "seoul_childcare_db")


def add_content_hash_column():
    """기존 policies 테이블에 content_hash 컬럼 추가"""
    conn = None
    cursor = None

    try:
        # DB 연결
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
        )
        cursor = conn.cursor()

        print("DB 연결 성공")

        # content_hash 컬럼이 있는지 확인
        cursor.execute(
            """
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'policies' 
            AND COLUMN_NAME = 'content_hash'
        """,
            (DB_NAME,),
        )

        column_exists = cursor.fetchone()[0] > 0

        if column_exists:
            print("✅ content_hash 컬럼이 이미 존재합니다.")
        else:
            print("content_hash 컬럼이 없습니다. 추가하는 중...")

            # content_hash 컬럼 추가
            cursor.execute(
                """
                ALTER TABLE policies 
                ADD COLUMN content_hash VARCHAR(64) COMMENT '콘텐츠 해시 (변경 감지용)'
            """
            )

            # 인덱스 추가
            try:
                cursor.execute(
                    "CREATE INDEX idx_policies_content_hash ON policies(content_hash)"
                )
                print("인덱스도 추가되었습니다.")
            except mysql.connector.Error as idx_err:
                if idx_err.errno == 1061:  # Duplicate key name
                    print("인덱스가 이미 존재합니다.")
                else:
                    print(f"인덱스 추가 중 오류: {idx_err}")

            conn.commit()
            print("✅ content_hash 컬럼이 성공적으로 추가되었습니다.")

        # 테이블 구조 확인
        cursor.execute("DESCRIBE policies")
        columns = cursor.fetchall()

        print("\n현재 policies 테이블 구조:")
        for column in columns:
            print(f"  - {column[0]} ({column[1]})")

        # content_hash가 NULL인 기존 레코드 개수 확인
        cursor.execute("SELECT COUNT(*) FROM policies WHERE content_hash IS NULL")
        null_hash_count = cursor.fetchone()[0]

        if null_hash_count > 0:
            print(f"\n⚠️  주의: {null_hash_count}개 정책의 content_hash가 NULL입니다.")
            print("다음 명령으로 해시를 생성하세요:")
            print("  python sync_data.py sync")
        else:
            print("\n✅ 모든 정책에 content_hash가 설정되어 있습니다.")

    except mysql.connector.Error as err:
        print(f"❌ DB 오류: {err}")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
        print("DB 연결 해제됨")

    return True


if __name__ == "__main__":
    print("=== policies 테이블에 content_hash 컬럼 추가 ===")
    success = add_content_hash_column()
    if success:
        print("\n✅ 작업 완료! 이제 정확한 변경 감지가 가능합니다.")
    else:
        print("\n❌ 작업 실패")

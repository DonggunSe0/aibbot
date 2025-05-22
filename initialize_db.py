import mysql.connector
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# 데이터베이스 연결 정보
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "seoul_childcare_db") # .env 파일에 DB_NAME이 없다면 기본값 사용
DB_PORT = os.getenv("DB_PORT", "3306")

def initialize_database():
    """
    database/schema.sql 파일을 읽어 데이터베이스 스키마(테이블)를 생성합니다.
    """
    conn = None
    cursor = None
    try:
        # MySQL 서버에 연결 (초기에는 특정 데이터베이스를 지정하지 않음)
        print(f"MySQL 서버에 연결 중... (Host: {DB_HOST}:{DB_PORT}, User: {DB_USER})")
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            connect_timeout=10 # 연결 타임아웃 10초
        )
        cursor = conn.cursor()
        print("MySQL 서버에 성공적으로 연결되었습니다.")

        # schema.sql 파일 경로 설정
        # 이 스크립트가 프로젝트 루트에 있다고 가정합니다.
        schema_file_path = os.path.join("database", "schema.sql")
        
        if not os.path.exists(schema_file_path):
            print(f"오류: 스키마 파일을 찾을 수 없습니다. 경로: '{schema_file_path}'")
            print("스크립트가 프로젝트 루트 디렉토리에서 실행되고 있는지, database/schema.sql 파일이 존재하는지 확인하세요.")
            return

        print(f"'{schema_file_path}' 파일에서 스키마를 읽는 중...")
        with open(schema_file_path, 'r', encoding='utf-8') as f:
            # 파일 전체 내용을 읽음
            sql_script = f.read()

        # SQL 스크립트를 개별 명령문으로 분리 (간단한 ';' 기준 분리)
        # 주석이나 문자열 내 세미콜론이 복잡하게 얽혀있지 않은 단순한 schema.sql에 적합
        sql_statements = [statement.strip() for statement in sql_script.split(';') if statement.strip()]

        if not sql_statements:
            print("스키마 파일에서 실행할 SQL 문을 찾지 못했습니다.")
            return

        print(f"총 {len(sql_statements)}개의 SQL 문을 실행합니다.")

        for i, statement in enumerate(sql_statements):
            if not statement:  # 비어있는 문장 건너뛰기
                continue
            
            # 실행할 SQL 문 일부를 출력
            print(f"\n[{i+1}/{len(sql_statements)}] 실행: {statement[:120]}{'...' if len(statement) > 120 else ''}")
            
            try:
                cursor.execute(statement)
                
                if statement.upper().startswith("SELECT"):
                    # SELECT 문의 경우 결과를 읽어야 Unread result 오류를 피할 수 있습니다.
                    # 여기서는 결과를 단순히 소진하거나, 필요시 출력할 수 있습니다.
                    result = cursor.fetchall() # 또는 fetchone(), stored_results() 등
                    if statement.upper().strip() == "SELECT 'SCHEMA CREATION COMPLETE.' AS STATUS":
                        if result and result[0]:
                            print(f"스크립트 완료 메시지: {result[0][0]}")
                        else:
                            print("스크립트 완료 메시지를 가져오지 못했습니다.")
                    # 다른 SELECT 문에 대한 처리도 필요하면 여기에 추가
                elif not statement.upper().startswith("SELECT"):
                    conn.commit()
                
                print("성공적으로 실행되었습니다.")

                if statement.upper().startswith("USE"):
                    cursor.execute("SELECT DATABASE()")
                    current_db_result = cursor.fetchone()
                    if current_db_result and current_db_result[0]:
                        print(f"현재 데이터베이스 컨텍스트: '{current_db_result[0]}'")
                    else:
                        # USE 문 실행 후에도 DATABASE()가 null을 반환하는 경우는 거의 없지만, 로깅.
                        print(f"USE {DB_NAME} 실행 후 데이터베이스 컨텍스트를 확인하지 못했습니다.")

            except mysql.connector.Error as err:
                print(f"오류 발생: {err}")
                print(f"실패한 SQL 문: {statement}")
                raise  # 오류 발생 시 스크립트 중단

        print("\n모든 스키마 SQL 문이 성공적으로 실행되었습니다.")
        print(f"데이터베이스 '{DB_NAME}'에 'policies' 테이블과 'users' 테이블이 생성되었을 것입니다.")

    except mysql.connector.Error as err:
        print(f"데이터베이스 오류: {err}")
        if hasattr(err, 'errno'):
            if err.errno == 1049: # 알 수 없는 데이터베이스
                print(f"힌트: '{DB_NAME}' 데이터베이스가 존재하지 않을 수 있습니다. 스키마 파일에 'CREATE DATABASE IF NOT EXISTS {DB_NAME}' 문장이 올바르게 포함되어 있는지 확인하세요.")
            elif err.errno == 1045: # 접근 거부
                print(f"힌트: 사용자 '{DB_USER}'의 접근이 거부되었습니다. .env 파일의 DB_USER, DB_PASSWORD 설정을 확인하세요.")
            elif err.errno == 2003: # MySQL 서버 연결 불가
                 print(f"힌트: MySQL 서버({DB_HOST}:{DB_PORT})에 연결할 수 없습니다. MySQL 서버가 실행 중이고 접근 가능한지 확인하세요.")
    except FileNotFoundError:
        print(f"오류: 스키마 파일 '{schema_file_path}'을 찾을 수 없습니다.")
    except Exception as e:
        print(f"예상치 못한 오류 발생: {e}")
    finally:
        if cursor:
            cursor.close()
            print("데이터베이스 커서가 닫혔습니다.")
        if conn and conn.is_connected():
            conn.close()
            print("데이터베이스 연결이 해제되었습니다.")

if __name__ == "__main__":
    print("데이터베이스 초기화 스크립트를 시작합니다...")
    initialize_database() 
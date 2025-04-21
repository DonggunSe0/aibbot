# RAG 챗봇 초기 프로토타입 백엔드 구현

**목표:** 서울시 출산/육아 정책 정보 제공 RAG 챗봇 프로토타입 구현

## 구현 내용

**적용 기술 스택:**

* **백엔드:** Python, Flask
* **프론트엔드:** React (예정)
* **데이터베이스:** MySQL
* **AI 엔진:** Google Gemini API + RAG 패턴

**데이터베이스 설정:**

* `seoul_childcare_db` 데이터베이스 사용.
* `policies` 테이블 스키마 정의 완료 (`database/schema.sql` 파일 참조).

**데이터 동기화:**

* 서울 열린데이터광장 Open API (`VwSmpBizInfo`) 연동됨.
* `sync_data.py` 스크립트로 `policies` 테이블에 데이터 142건 적재 기능 구현됨.

**백엔드 API:**

* Flask 기반 API 서버 (`backend/app.py`) 구축됨.
* `/api/ask` (POST) 엔드포인트 구현됨.

**RAG 로직 (테스트용 단순 구현):**

* `/api/ask` 요청 시 JSON body의 `question` 필드를 정확한 `biz_nm`(사업명)으로 간주함.
* `policies` 테이블에서 해당 `biz_nm`과 정확히 일치하는 레코드 검색 (`search_policies_basic` 함수).
* 일치 데이터 발견 시: 해당 정책의 `id` 포함 정보를 Context로 구성하여 LLM(Gemini)에 전달, 정책 ID 추출 및 지정된 형식의 답변 생성 요청 (`generate_answer_with_llm` 함수).
* 일치 데이터 미발견 시: "찾을 수 없음" 메시지를 직접 반환 (LLM 호출 없음).

**기타:**

* `.env` 파일을 통한 환경 변수 로딩 문제 해결됨 (`override=True` 적용).
* 기본적인 RAG 데이터 흐름 (DB 조회 -> LLM 호출 -> 응답) 작동 확인함.

## 로컬 환경 설정 방법

1.  **사전 요구사항:** `Python` (3.8+ 권장), `MySQL Server`, `Git` 설치 필요.
2.  **코드 복제:** 터미널에서 `git clone <저장소_URL> <원하는_로컬_폴더명>` 실행.
3.  **가상 환경 및 라이브러리 설치:**
    * 프로젝트 루트 폴더(`Aibbot` 등)로 이동.
    * `python -m venv venv` 실행하여 가상 환경 생성.
    * 가상 환경 활성화 (OS별 명령어 실행: e.g., `source venv/bin/activate` 또는 `.\venv\Scripts\activate`).
    * 루트 폴더의 `requirements.txt`로 라이브러리 설치: `pip install -r requirements.txt`
    * `backend` 폴더의 `requirements.txt`로 라이브러리 설치: `pip install -r backend/requirements.txt`
4.  **`.env` 파일 생성 및 설정:**
    * **`AIBBOT/backend/`** 폴더 안에 `.env` 파일을 **직접 생성**하고 아래 내용을 **실제 값으로 교체**하여 입력
        ```dotenv
        GOOGLE_API_KEY=YOUR_GEMINI_API_KEY # Gemini API 키
        SEOUL_API_KEY=YOUR_SEOUL_API_KEY    # 서울시 Open API 키
        DB_HOST=localhost                   # DB 호스트 (보통 localhost)
        DB_PORT=3306                        # DB 포트 (기본값 3306)
        DB_USER=YOUR_MYSQL_USER             # DB 사용자명 (MySQL 설치 시 설정한 값)
        DB_PASSWORD=YOUR_MYSQL_PASSWORD     # DB 비밀번호 (MySQL 설치 시 설정한 값)
        DB_NAME=seoul_childcare_db          # DB 이름
        ```
    * **(주: API 키 등 민감 정보는 팀 내 보안 채널로 공유 필요)**
5.  **데이터베이스 스키마 생성:**
    * 로컬 MySQL 서버에 접속합니다 (예: MySQL Workbench, DBeaver, VS Code SQLTools 사용).
    * `database/schema.sql` 파일의 내용을 실행하여 `seoul_childcare_db` 데이터베이스와 `policies` 테이블을 생성합니다.
6.  **데이터베이스 데이터 적재:**
    * 터미널에서 프로젝트 루트 폴더(`Aibbot` 등)로 이동합니다.
    * 가상 환경이 활성화된 상태에서 `python sync_data.py` 를 실행합니다. (데이터 142건 적재)
7.  **백엔드 서버 실행:**
    * 터미널에서 `backend` 폴더로 이동합니다 (`cd backend`).
    * 가상 환경이 활성화된 상태에서 `python app.py` 를 실행합니다.
    * 서버가 `http://127.0.0.1:5001` 에서 실행되는 것을 확인합니다.

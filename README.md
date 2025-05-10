# Aibbot 백엔드 시스템

## 1. 시스템 개요

Aibbot 백엔드는 사용자가 입력한 서울시 육아 정책의 정확한 이름에 대해 해당 정책의 고유 ID를 반환하는 시스템이다.

**작동 흐름:**

1.  **데이터 수집 및 저장 (`sync_data.py`)**:
    * 서울시 열린데이터광장의 출산/육아 정책 Open API를 호출하여 정책 데이터를 수집한다.
    * 수집된 데이터(정책 ID, 정책명, 내용, 대상 등)는 MySQL 데이터베이스에 저장된다.
    * 이 과정은 주기적으로 실행되어 데이터베이스의 정보를 최신 상태로 유지한다.

2.  **API 요청 접수 (`app.py`)**:
    * 클라이언트(프론트엔드 UI 등)로부터 특정 정책명을 포함한 API 요청 (`/api/ask`)을 받는다.

3.  **데이터베이스 조회 (`app.py` 내 `search_policies_basic` 함수)**:
    * 요청받은 정책명과 정확히 일치하는 데이터를 MySQL 데이터베이스에서 검색한다.

4.  **LLM을 통한 답변 생성 (RAG 방식, `app.py` 내 `generate_answer_with_llm` 함수)**:
    * 데이터베이스에서 해당 정책 정보를 찾은 경우, 이 정보를 컨텍스트로 활용한다.
    * Google Gemini LLM에 "주어진 정책 정보에서 정책 ID를 특정 형식으로 추출하라"는 지시와 함께, DB에서 찾은 정책 정보를 전달한다.
    * LLM은 제공된 컨텍스트를 기반으로 요청된 형식에 맞춰 답변(예: "정책 ID는 \[ID번호] 입니다.")을 생성한다.
    * DB에서 정책 정보를 찾지 못한 경우, "정책을 찾을 수 없습니다." 메시지를 생성한다.

5.  **API 응답 반환 (`app.py`)**:
    * 최종 생성된 답변을 클라이언트에게 JSON 형태로 반환한다.

## 2. 주요 파일 및 기능

* **`Aibbot/backend/app.py`**:
    * **역할**: Flask 기반의 주 백엔드 애플리케이션.
    * **주요 기능**:
        * API 엔드포인트 (`/api/ask`) 제공: 사용자로부터 정책명을 입력받아 처리.
        * `search_policies_basic(exact_biz_nm)`: DB에서 정확한 정책명으로 정책 정보 검색.
        * `generate_answer_with_llm(policy_data_dict, original_question)`: 검색된 정책 정보를 컨텍스트로 하여 LLM(Gemini)을 호출, 정책 ID 추출 및 답변 생성.
        * 환경 변수 로드, DB 및 LLM API 초기 설정.

* **`Aibbot/sync_data.py`**:
    * **역할**: 서울시 Open API로부터 정책 데이터를 가져와 DB에 동기화.
    * **주요 기능**:
        * `Workspace_seoul_policies()`: Open API 호출 및 데이터 수집.
        * `save_to_db(policies)`: 수집된 데이터를 `policies` 테이블에 저장 (중복 시 업데이트, 신규 시 삽입).

* **`Aibbot/database/schema.sql`**:
    * **역할**: MySQL 데이터베이스(`seoul_childcare_db`) 및 `policies` 테이블 구조 정의.
    * **`policies` 테이블 주요 컬럼**: `id` (PK), `biz_nm` (사업명, UNIQUE), `biz_cn` (사업내용), `utztn_trpr_cn` (이용대상내용) 등.

* **`Aibbot/backend/requirements.txt`**:
    * `app.py` 실행에 필요한 Python 패키지 목록. (Flask, Flask-Cors, mysql-connector-python, google-generativeai 등)

* **`Aibbot/requirements.txt`**:
    * `sync_data.py` 실행에 필요한 Python 패키지 목록. (requests, mysql-connector-python, python-dotenv 등)

* **`Aibbot/test_api.py`**:
    * 백엔드 `/api/ask` 엔드포인트 기능 테스트용 스크립트.

## 3. RAG (Retrieval Augmented Generation) 작동 원리

본 시스템은 간소화된 형태의 RAG 패러다임을 적용하여 LLM의 답변 정확도와 관련성을 향상시킨다.

1.  **검색 (Retrieval)**:
    * 사용자가 입력한 "정확한 정책 이름"을 검색어로 사용한다.
    * 로컬 MySQL 데이터베이스 (`policies` 테이블)에서 이 검색어와 일치하는 정책의 상세 정보(ID, 내용, 대상 등 포함)를 조회한다.
    * 이 조회된 정보가 LLM에게 제공될 **컨텍스트(context)**가 된다.

2.  **증강 (Augmentation)**:
    * LLM에게 단순히 사용자 질문만 전달하는 대신, 검색 단계에서 얻은 컨텍스트(DB 조회 결과)를 프롬프트에 명시적으로 포함시켜 "증강"한다.
    * **프롬프트 예시**:
        ```
        # 시스템 지시문: 주어진 정보에서 특정 데이터를 정확히 추출하고 지시된 형식으로 답변하라.
        # 제공된 '정보'를 바탕으로 '질문'에 답변하라. 답변은 한국어로 작성.

        [정보]
        정책 ID: {retrieved_policy_id}
        정책명: {retrieved_policy_name}
        대상: {retrieved_policy_target}
        내용: {retrieved_policy_content}

        [질문]
        위 '정보'에서 '{exact_policy_name_from_user}' 정책의 '정책 ID' 값을 찾아 
        '정책 ID는 [ID번호] 입니다.' 형식으로 정확하게 알려주세요.

        [답변]
        ```
    * 이를 통해 LLM은 외부 최신 정보(DB 데이터)를 참조하여 답변을 생성하며, 정보 누락이나 부정확한 추론(hallucination) 가능성을 줄인다.

3.  **생성 (Generation)**:
    * 증강된 프롬프트를 Google Gemini LLM에 전달한다.
    * LLM은 주어진 컨텍스트와 구체적인 지시사항에 따라, 요청된 정보(정책 ID)를 추출하여 지정된 형식의 답변을 생성한다.
    * LLM의 `temperature` 값을 낮게(0.1) 설정하여, 창의적 답변보다는 사실 기반의 정확한 정보 추출을 유도한다.

**요약**: Aibbot은 사용자의 정확한 정책명 입력을 받아, 로컬 DB에서 관련 정보를 검색하고, 이 정보를 LLM 프롬프트에 컨텍스트로 주입하여 LLM이 해당 컨텍스트에 기반한 정확한 정책 ID를 반환하도록 하는 RAG 방식을 사용한다. 이는 LLM이 최신 또는 특정 도메인의 정보를 활용하여 보다 신뢰도 높은 답변을 생성하도록 돕는다.

# AIBBOT/backend/app.py (Proof-of-Concept: biz_nm -> id Version)

# --- Imports ---
import os
import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai

# --- Load Environment Variables ---
print("--- .env 파일 로드 시도 ---")
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path=dotenv_path, override=True)
    print(f".env file loaded from: {dotenv_path}")
else:
    load_dotenv(override=True)
    print("Warning: .env file not found via find_dotenv(). Loading from CWD.")

# --- Configuration ---
# LLM API Key Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"!!! Error configuring Gemini API: {e}")
else:
    print("!!! CRITICAL WARNING: GOOGLE_API_KEY environment variable not found.")

# DB Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)  # Allow all origins for development

# --- Helper Functions ---


def search_policies_basic(exact_biz_nm):
    """DB에서 정확한 biz_nm으로 정책 정보(ID 포함)를 찾아 딕셔너리로 반환 (증명용)"""
    policy_data = None
    conn = None
    cursor = None
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        print("[DB Error] DB connection info missing.")
        return None
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connect_timeout=5,
        )
        cursor = conn.cursor(dictionary=True)
        print(f"DB Searching for exact biz_nm: '{exact_biz_nm}'")
        # id를 포함하여 필요한 컬럼 조회
        cursor.execute(
            "SELECT id, biz_nm, biz_cn, utztn_trpr_cn FROM policies WHERE biz_nm = %s",
            (exact_biz_nm,),  # 정확히 일치하는 biz_nm 검색
        )
        result = cursor.fetchone()  # 일치하는 것은 하나거나 없음
        if result:
            policy_data = result
            print(
                f"DB Search Found Policy: ID={result.get('id')}, Name={result.get('biz_nm')}"
            )
        else:
            print("Exact match not found in DB.")
    except mysql.connector.Error as err:
        print(f"[DB Error] DB Search/Connection Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
    # 찾은 정책 데이터(dict) 또는 None 반환
    return policy_data


def generate_answer_with_llm(policy_data_dict, original_question):
    """검색된 정책 정보(dict)를 바탕으로 LLM에게 ID 추출 및 답변 생성 요청"""
    if not GOOGLE_API_KEY:
        return "LLM API 키가 설정되지 않아 답변을 생성할 수 없습니다."

    # Context는 이제 DB에서 찾은 policy_data_dict 또는 None
    if policy_data_dict:
        # --- 정책을 찾았을 경우: LLM에게 ID 추출 요청 ---
        try:
            # 사용자 요청 모델 이름 사용
            model_name = "models/gemini-2.5-flash-preview-04-17"
            model = genai.GenerativeModel(model_name)
            print(f"Using LLM Model: {model_name}")

            # LLM에게 전달할 정보(Context) 구성 (ID 포함)
            context_for_prompt = f"""--- 정책 정보 ---
정책 ID: {policy_data_dict.get('id', '정보 없음')}
정책명: {policy_data_dict.get('biz_nm', '정보 없음')}
대상: {policy_data_dict.get('utztn_trpr_cn', '정보 없음')}
내용: {policy_data_dict.get('biz_cn', '정보 없음')}
--- 정보 끝 ---"""

            # LLM에게 내릴 구체적인 지시사항 (ID 추출 요청)
            llm_question = f"주어진 '정보'에서 '{policy_data_dict.get('biz_nm')}' 정책의 '정책 ID' 값을 찾아서 '정책 ID는 [ID번호] 입니다.' 형식으로 정확하게 알려주세요."

            # RAG 프롬프트 구성
            prompt = f"""당신은 주어진 정보에서 특정 데이터를 정확히 추출하고 지시된 형식으로 답변하는 AI입니다.
주어진 '정보'를 바탕으로 '질문'에 대해 답변해주세요. 답변은 질문에서 요구한 형식대로 정확하게 작성해야 합니다.
답변은 한국어로 해주세요.

[정보]
{context_for_prompt}

[질문]
{llm_question}

[답변]"""
            print("Context found, asking LLM to extract ID with RAG prompt.")

            # API 호출 설정 (사실적 추출을 위해 temperature 낮춤)
            generation_config = genai.types.GenerationConfig(temperature=0.1)
            safety_settings = [
                {"category": c, "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
                for c in [
                    "HARM_CATEGORY_HARASSMENT",
                    "HARM_CATEGORY_HATE_SPEECH",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "HARM_CATEGORY_DANGEROUS_CONTENT",
                ]
            ]

            # LLM API 호출
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=safety_settings,
            )
            answer = response.text.strip()  # 앞뒤 공백 제거
            print(f"LLM generation successful. Raw answer: {answer}")
            return answer

        except Exception as e:
            print(f"[LLM Error] LLM API call/processing error: {e}")
            return "답변 생성 중 오류가 발생했습니다."
        # --- 정책 찾았을 경우 끝 ---

    else:
        # --- 정책을 찾지 못했을 경우: LLM 호출 없이 직접 메시지 반환 ---
        print("No exact match context from DB, returning policy not found message.")
        # original_question 변수에는 사용자가 입력한 biz_nm이 들어있음
        return f"'{original_question}'이라는 이름의 정책을 데이터베이스에서 찾을 수 없습니다. 정확한 정책 이름을 다시 확인해주세요."


# --- API Endpoint ---
@app.route("/")
def home():
    return "Flask 백엔드 서버 동작 중! (in backend folder)"


@app.route("/api/ask", methods=["POST"])
def handle_ask():
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    data = request.get_json()
    # 사용자의 'question' 입력을 찾으려는 정확한 'biz_nm'으로 간주
    biz_nm_to_search = data.get("question")
    if (
        not biz_nm_to_search
        or not isinstance(biz_nm_to_search, str)
        or not biz_nm_to_search.strip()
    ):
        return (
            jsonify(
                {
                    "error": "Field 'question' (expected exact biz_nm) is missing or empty"
                }
            ),
            400,
        )

    print(f"\n--- New Request Received ---")
    print(f"Searching for exact biz_nm: {biz_nm_to_search}")

    # DB에서 biz_nm으로 정확히 일치하는 정책 데이터(딕셔너리) 검색
    policy_data_dict = search_policies_basic(biz_nm_to_search)  # 반환값: dict or None

    # LLM/답변 생성 함수 호출 (정책 못 찾은 경우도 이 함수 안에서 처리됨)
    response_text = generate_answer_with_llm(policy_data_dict, biz_nm_to_search)

    print(f"Final Answer Prepared.")
    # 결과 반환
    return jsonify({"answer": response_text})


# --- App Run ---
if __name__ == "__main__":
    print(f"Starting Flask server... Access at http://127.0.0.1:5001")
    app.run(debug=True, port=5001)

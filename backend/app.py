# AIBBOT/backend/app.py

import os
import mysql.connector  # DB 사용을 위해 주석 해제
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
import openai

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
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    print("OpenAI API key configured successfully.")
else:
    print("!!! CRITICAL WARNING: OPENAI_API_KEY environment variable not found.")

# DB Configuration (주석 해제 및 값 확인)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Helper Functions ---


# DB에서 샘플 정책 데이터를 가져오는 테스트 함수
def get_sample_policies_from_db(limit=3):
    """DB에서 샘플 정책 정보(최대 limit 개수)를 가져와 리스트로 반환"""
    policies = []
    conn = None
    cursor = None
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        print("[DB Error] DB connection info missing for sample policies.")
        raise ValueError(
            "DB connection information is missing."
        )  # 오류 발생시켜서 호출부에 알림

    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connect_timeout=5,
        )
        # 결과를 딕셔너리 형태로 받기 위해 cursor 설정
        cursor = conn.cursor(dictionary=True)
        print(f"DB Fetching sample policies (limit: {limit})")

        # id, biz_nm, biz_cn 컬럼을 가져오도록 수정 (테스트용으로 필요한 컬럼 선택)
        cursor.execute(
            f"SELECT id, biz_nm, biz_cn, utztn_trpr_cn FROM policies LIMIT %s", (limit,)
        )
        policies = cursor.fetchall()
        if policies:
            print(f"DB Fetch Found {len(policies)} sample policies.")
        else:
            print("No sample policies found in DB.")

    except mysql.connector.Error as err:
        print(f"[DB Error] DB Fetch Sample Error: {err}")
        raise err  # 오류를 다시 발생시켜 호출부에 알림
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
    return policies


# (기존 search_policies_basic 함수는 필요시 나중에 다시 활용)


def generate_chat_response_from_llm(user_message, conversation_history=None):
    # ... (이 함수 내용은 이전과 동일하게 유지) ...
    if not OPENAI_API_KEY:
        return "LLM API 키가 설정되지 않아 답변을 생성할 수 없습니다."
    try:
        model_name = "gpt-3.5-turbo"
        print(f"Using LLM Model: {model_name} for chat.")
        messages = [
            {
                "role": "system",
                "content": "당신은 사용자에게 친절하게 응답하는 AI 챗봇입니다.",
            }
        ]
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})
        print(f"Sending to LLM with messages: {messages}")
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model=model_name, messages=messages, temperature=0.7, max_tokens=1000
        )
        answer = response.choices[0].message.content.strip()
        print(f"LLM chat response successful. Raw answer: {answer}")
        return answer
    except Exception as e:
        print(f"[LLM Error] LLM API call/processing error: {e}")
        # ... (오류 로깅 부분) ...
        return "채팅 응답 생성 중 오류가 발생했습니다."


# --- API Endpoints ---
@app.route("/")
def home():
    return "Flask 백엔드 서버 동작 중! (DB Test Ready)"


# 새로운 DB 테스트용 엔드포인트
@app.route("/api/test-db", methods=["GET"])
def handle_test_db():
    try:
        sample_data = get_sample_policies_from_db(limit=3)  # 예시로 3개 데이터 가져오기
        # sample_data가 비어있는 리스트일 수도 있으므로, 데이터 존재 여부로 판단하지 않고 성공으로 간주
        return jsonify(
            {
                "success": True,
                "data": sample_data,
                "message": (
                    "데이터를 성공적으로 조회했습니다."
                    if sample_data
                    else "조회할 데이터가 없습니다."
                ),
            }
        )
    except ValueError as ve:  # DB 접속 정보 누락 시
        print(f"[API DB Test Error] Configuration error: {ve}")
        return jsonify({"success": False, "message": str(ve)}), 500
    except mysql.connector.Error as db_err:  # DB 자체 오류 시
        print(f"[API DB Test Error] Database query error: {db_err}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"데이터베이스 오류: {db_err.msg if hasattr(db_err, 'msg') else str(db_err)}",
                }
            ),
            500,
        )
    except Exception as e:
        print(f"[API DB Test Error] Unexpected error: {e}")
        return jsonify({"success": False, "message": f"서버 내부 오류: {str(e)}"}), 500


@app.route("/api/chat", methods=["POST"])
def handle_chat():
    # ... (이 함수 내용은 이전과 동일하게 유지) ...
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    data = request.get_json()
    user_message = data.get("message")
    if (
        not user_message
        or not isinstance(user_message, str)
        or not user_message.strip()
    ):
        return jsonify({"error": "Field 'message' is missing or empty"}), 400
    print(f"\n--- New Chat Request Received ---")
    print(f"User message: {user_message}")
    response_text = generate_chat_response_from_llm(user_message)
    print(f"Final Chat Answer Prepared.")
    return jsonify({"answer": response_text})


# --- App Run ---
if __name__ == "__main__":
    print(f"Starting Flask server (DB Test Ready)... Access at http://127.0.0.1:5001")
    app.run(debug=True, port=5001)

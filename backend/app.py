# AIBBOT/backend/app.py (OpenAI Chat-focused Version)

# --- Imports ---
import os

# import mysql.connector # DB 관련 기능은 일단 비활성화
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
# LLM API Key Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    try:
        openai.api_key = OPENAI_API_KEY
        print("OpenAI API key configured successfully.")
    except Exception as e:
        print(f"!!! Error configuring OpenAI API: {e}")
else:
    print("!!! CRITICAL WARNING: OPENAI_API_KEY environment variable not found.")

# DB Configuration (현재 사용 안 함, 주석 처리)
# DB_HOST = os.getenv("DB_HOST", "localhost")
# DB_PORT = os.getenv("DB_PORT", "3306")
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASSWORD")
# DB_NAME = os.getenv("DB_NAME")

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)  # Allow all origins for development

# --- Helper Functions ---

# def search_policies_basic(exact_biz_nm):
#     """DB에서 정확한 biz_nm으로 정책 정보(ID 포함)를 찾아 딕셔너리로 반환 (현재 비활성화)"""
#     policy_data = None
#     conn = None
#     cursor = None
#     if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
#         print("[DB Error] DB connection info missing.")
#         return None
#     try:
#         conn = mysql.connector.connect(
#             host=DB_HOST,
#             port=DB_PORT,
#             user=DB_USER,
#             password=DB_PASSWORD,
#             database=DB_NAME,
#             connect_timeout=5,
#         )
#         cursor = conn.cursor(dictionary=True)
#         print(f"DB Searching for exact biz_nm: '{exact_biz_nm}'")
#         cursor.execute(
#             "SELECT id, biz_nm, biz_cn, utztn_trpr_cn FROM policies WHERE biz_nm = %s",
#             (exact_biz_nm,),
#         )
#         result = cursor.fetchone()
#         if result:
#             policy_data = result
#             print(
#                 f"DB Search Found Policy: ID={result.get('id')}, Name={result.get('biz_nm')}"
#             )
#         else:
#             print("Exact match not found in DB.")
#     except mysql.connector.Error as err:
#         print(f"[DB Error] DB Search/Connection Error: {err}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn and conn.is_connected():
#             conn.close()
#     return policy_data


def generate_chat_response_from_llm(
    user_message, conversation_history=None
):  # 이전 대화 내용 추가 (선택적)
    """사용자 메시지를 받아 LLM에게 일반적인 채팅 응답을 요청"""
    if not OPENAI_API_KEY:
        return "LLM API 키가 설정되지 않아 답변을 생성할 수 없습니다."

    try:
        model_name = "gpt-3.5-turbo"  # 또는 "gpt-4o", "gpt-4o-mini" 등
        print(f"Using LLM Model: {model_name} for chat.")

        messages = []
        # 시스템 메시지: AI의 역할이나 페르소나를 설정할 수 있습니다.
        messages.append(
            {
                "role": "system",
                "content": "당신은 사용자에게 친절하게 응답하는 AI 챗봇입니다.",
            }
        )

        # 이전 대화 내용이 있다면 추가 (간단한 예시, 실제로는 더 정교한 관리가 필요할 수 있음)
        if conversation_history:
            for entry in conversation_history:
                messages.append({"role": entry["role"], "content": entry["content"]})

        # 현재 사용자 메시지 추가
        messages.append({"role": "user", "content": user_message})

        print(f"Sending to LLM with messages: {messages}")

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.7,  # 일반적인 채팅을 위해 약간 높임 (0.0 ~ 1.0)
            max_tokens=1000,  # 응답 최대 길이 (필요시 조절)
        )
        answer = response.choices[0].message.content.strip()
        print(f"LLM chat response successful. Raw answer: {answer}")
        return answer

    except Exception as e:
        print(f"[LLM Error] LLM API call/processing error: {e}")
        if hasattr(e, "response") and e.response:
            try:
                error_detail = e.response.json()
                print(f"OpenAI API Error Detail: {error_detail}")
            except:  # pylint: disable=bare-except
                print(f"OpenAI API Raw Error Response: {e.response.text}")
        return "채팅 응답 생성 중 오류가 발생했습니다."


# --- API Endpoint ---
@app.route("/")
def home():
    return "Flask 백엔드 서버 동작 중! (Chat Mode)"


@app.route("/api/chat", methods=["POST"])  # 엔드포인트 이름을 /api/chat으로 변경
def handle_chat():  # 함수 이름도 변경
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()
    user_message = data.get("message")  # 이제 'question' 대신 'message' 필드를 기대
    # conversation_history = data.get("history", []) # 클라이언트에서 이전 대화 기록을 보낼 경우

    if (
        not user_message
        or not isinstance(user_message, str)
        or not user_message.strip()
    ):
        return jsonify({"error": "Field 'message' is missing or empty"}), 400

    print(f"\n--- New Chat Request Received ---")
    print(f"User message: {user_message}")
    # print(f"Conversation history: {conversation_history}") # 기록 로깅

    # LLM 채팅 응답 생성 함수 호출
    # response_text = generate_chat_response_from_llm(user_message, conversation_history)
    response_text = generate_chat_response_from_llm(
        user_message
    )  # 우선 간단히 현재 메시지만 전달

    print(f"Final Chat Answer Prepared.")
    return jsonify({"answer": response_text})


# --- App Run ---
if __name__ == "__main__":
    print(f"Starting Flask server (Chat Mode)... Access at http://127.0.0.1:5001")
    app.run(debug=True, port=5001)

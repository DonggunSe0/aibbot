# AIBBOT/backend/app.py (최종 버전)

import os
import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
import openai
from werkzeug.security import generate_password_hash, check_password_hash

# 향상된 RAG 서비스 임포트
from rag_service import EnhancedAibbotRAGService

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

# DB Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# 향상된 RAG 서비스 초기화
db_config = {
    'host': DB_HOST,
    'port': DB_PORT,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME
}

try:
    openai_client = openai.OpenAI() if OPENAI_API_KEY else None
    enhanced_rag_service = EnhancedAibbotRAGService(db_config, openai_client) if openai_client else None
    print("Enhanced RAG Service 초기화 성공")
except Exception as e:
    print(f"Enhanced RAG Service 초기화 실패: {e}")
    enhanced_rag_service = None

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Helper Functions for DB Connection ---
def get_db_connection():
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        print("[DB Error] DB connection info missing.")
        raise ValueError("DB connection information is missing.")
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connect_timeout=5
        )
        return conn
    except mysql.connector.Error as err:
        print(f"[DB Error] Connection failed: {err}")
        raise err

# DB에서 샘플 정책 데이터를 가져오는 테스트 함수
def get_sample_policies_from_db(limit=3):
    """DB에서 샘플 정책 정보(최대 limit 개수)를 가져와 리스트로 반환"""
    policies = []
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        print(f"DB Fetching sample policies (limit: {limit})")
        cursor.execute(
            f"SELECT id, biz_nm, biz_cn, utztn_trpr_cn, biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm, trgt_child_age, deviw_site_addr FROM policies LIMIT %s", (limit,)
        )
        policies = cursor.fetchall()
        if policies:
            print(f"DB Fetch Found {len(policies)} sample policies.")
        else:
            print("No sample policies found in DB.")
    except (ValueError, mysql.connector.Error) as err:
        print(f"[DB Error] DB Fetch Sample Error: {err}")
        raise
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
    return policies

# 특정 ID의 정책 상세 정보를 가져오는 함수
def get_policy_details_from_db(policy_id):
    """DB에서 특정 ID의 정책 상세 정보를 가져와 딕셔너리로 반환"""
    policy_details = None
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        print(f"DB Fetching policy details for id: {policy_id}")
        query = """
            SELECT 
                id, biz_nm, biz_cn, utztn_trpr_cn, 
                biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm, 
                trgt_child_age, deviw_site_addr, utztn_mthd_cn, 
                oper_hr_cn, aref_cn, aply_site_addr, created_at, updated_at
            FROM policies 
            WHERE id = %s
        """
        cursor.execute(query, (policy_id,))
        policy_details = cursor.fetchone()
        if policy_details:
            print(f"DB Found policy details for id: {policy_id}.")
        else:
            print(f"No policy found in DB with id: {policy_id}.")
    except (ValueError, mysql.connector.Error) as err:
        print(f"[DB Error] DB Fetch Policy Details Error: {err}")
        raise
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
    return policy_details

def generate_chat_response_from_llm(user_message, conversation_history=None):
    """기존 단순 채팅 응답 함수 (RAG 사용하지 않는 경우)"""
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
        return "채팅 응답 생성 중 오류가 발생했습니다."

# --- API Endpoints ---
@app.route("/")
def home():
    return "Flask 백엔드 서버 동작 중! (Enhanced RAG Service Ready)"

@app.route("/api/test-db", methods=["GET"])
def handle_test_db():
    try:
        sample_data = get_sample_policies_from_db(limit=3)
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
    except (ValueError, mysql.connector.Error) as err:
        print(f"[API DB Test Error] Database or config error: {err}")
        return jsonify({"success": False, "message": str(err)}), 500
    except Exception as e:
        print(f"[API DB Test Error] Unexpected error: {e}")
        return jsonify({"success": False, "message": f"서버 내부 오류: {str(e)}"}), 500

@app.route("/api/policy/<int:policy_id>", methods=["GET"])
def handle_get_policy_details(policy_id):
    try:
        policy_data = get_policy_details_from_db(policy_id)
        if policy_data:
            policy_field_parts = [
                policy_data.get('biz_lclsf_nm'),
                policy_data.get('biz_mclsf_nm'),
                policy_data.get('biz_sclsf_nm')
            ]
            policy_data['policy_field'] = ' > '.join(filter(None, policy_field_parts))
            return jsonify({"success": True, "data": policy_data})
        else:
            return jsonify({"success": False, "message": "해당 ID의 정책을 찾을 수 없습니다."}), 404
    except (ValueError, mysql.connector.Error) as err:
        print(f"[API Policy Details Error] Database or config error: {err}")
        return jsonify({"success": False, "message": str(err)}), 500
    except Exception as e:
        print(f"[API Policy Details Error] Unexpected error: {e}")
        return jsonify({"success": False, "message": f"서버 내부 오류: {str(e)}"}), 500

@app.route("/api/chat", methods=["POST"])
def handle_chat():
    """향상된 RAG 기반 채팅 API"""
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    data = request.get_json()
    user_message = data.get("message")
    user_profile = data.get("user_profile")  # 프론트엔드에서 사용자 프로필 전달
    user_id = data.get("user_id")  # 로그인한 사용자 ID (선택적)
    
    if not user_message or not isinstance(user_message, str) or not user_message.strip():
        return jsonify({"error": "Field 'message' is missing or empty"}), 400
    
    print(f"\n--- New Enhanced RAG Chat Request ---")
    print(f"User message: {user_message}")
    print(f"User profile provided: {bool(user_profile)}")
    print(f"User ID: {user_id}")
    
    # Enhanced RAG 서비스 사용 가능 여부 확인
    if not enhanced_rag_service or not OPENAI_API_KEY:
        print("Enhanced RAG Service 또는 OpenAI API 키가 없어서 기본 채팅으로 처리")
        response_text = generate_chat_response_from_llm(user_message)
        return jsonify({
            "answer": response_text,
            "processing_pipeline": "Fallback to basic chat"
        })
    
    try:
        # Enhanced RAG 처리 (QUA → HRA → AGA)
        rag_result = enhanced_rag_service.process_query(
            user_query=user_message,
            user_profile=user_profile
        )
        
        # 응답 구성
        response_data = {
            "answer": rag_result['answer'],
            "cited_policies": rag_result.get('cited_policies', []),
            "personalized": rag_result.get('personalized', False),
            "search_results_count": rag_result.get('search_results_count', 0),
            "confidence_score": rag_result.get('confidence_score', 0),
            "processing_pipeline": rag_result.get('processing_pipeline', 'Enhanced RAG'),
            "query_analysis": rag_result.get('query_analysis', {})
        }
        
        print(f"Enhanced RAG Response prepared:")
        print(f"- 참조 정책: {len(rag_result.get('cited_policies', []))}개")
        print(f"- 개인화: {rag_result.get('personalized', False)}")
        print(f"- 신뢰도: {rag_result.get('confidence_score', 0):.2f}")
        print(f"- 처리 파이프라인: {rag_result.get('processing_pipeline', 'Enhanced RAG')}")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"[Enhanced RAG Chat Error] Enhanced RAG 처리 중 오류: {e}")
        # Enhanced RAG 실패 시 기본 채팅으로 폴백
        fallback_response = generate_chat_response_from_llm(user_message)
        return jsonify({
            "answer": fallback_response,
            "cited_policies": [],
            "personalized": False,
            "processing_pipeline": "Fallback due to error",
            "error": f"Enhanced RAG 처리 중 문제가 발생하여 기본 응답으로 처리했습니다: {str(e)}"
        })

# --- User Authentication Endpoints ---
@app.route("/api/signup", methods=["POST"])
def handle_signup():
    if not request.is_json:
        return jsonify({"success": False, "message": "Request body must be JSON"}), 400
    
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email") # 선택 사항

    if not username or not password:
        return jsonify({"success": False, "message": "사용자 이름과 비밀번호는 필수입니다."}), 400
    
    # 비밀번호 길이 등 기본 유효성 검사
    if len(password) < 4:
        return jsonify({"success": False, "message": "비밀번호는 최소 4자 이상이어야 합니다."}), 400

    hashed_password = generate_password_hash(password)
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 사용자 이름 중복 확인
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "이미 사용 중인 사용자 이름입니다."}), 409
        
        # 이메일 중복 확인 (이메일이 제공된 경우)
        if email:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"success": False, "message": "이미 사용 중인 이메일입니다."}), 409

        cursor.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
            (username, hashed_password, email)
        )
        conn.commit()
        return jsonify({"success": True, "message": "회원가입이 성공적으로 완료되었습니다."}), 201
    except (ValueError, mysql.connector.Error) as err:
        print(f"[API Signup Error] Database or config error: {err}")
        if isinstance(err, mysql.connector.Error) and err.errno == 1062:
            return jsonify({"success": False, "message": "사용자 이름 또는 이메일이 이미 존재합니다."}), 409
        return jsonify({"success": False, "message": f"회원가입 중 오류 발생: {err}"}), 500
    except Exception as e:
        print(f"[API Signup Error] Unexpected error: {e}")
        return jsonify({"success": False, "message": "서버 내부 오류가 발생했습니다."}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/login", methods=["POST"])
def handle_login():
    if not request.is_json:
        return jsonify({"success": False, "message": "Request body must be JSON"}), 400

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "사용자 이름과 비밀번호를 입력해주세요."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user["password_hash"], password):
            user_info = {"id": user["id"], "username": user["username"]}
            return jsonify({"success": True, "message": "로그인 성공!", "user": user_info})
        else:
            return jsonify({"success": False, "message": "사용자 이름 또는 비밀번호가 올바르지 않습니다."}), 401
    except (ValueError, mysql.connector.Error) as err:
        print(f"[API Login Error] Database or config error: {err}")
        return jsonify({"success": False, "message": f"로그인 중 오류 발생: {err}"}), 500
    except Exception as e:
        print(f"[API Login Error] Unexpected error: {e}")
        return jsonify({"success": False, "message": "서버 내부 오류가 발생했습니다."}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# --- App Run ---
if __name__ == "__main__":
    print(f"Starting Flask server (Enhanced RAG Service Ready)...")
    print(f"RAG Pipeline: QUA → HRA → AGA")
    print(f"Access at http://127.0.0.1:5001")
    app.run(debug=True, port=5001)
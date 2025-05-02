from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import openai

# .env에서 API 키 로드
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Flask 앱 생성
app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST'])
def ask():
    user_input = request.json.get("message")

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 서울시 출산·육아 상담 챗봇입니다."},
            {"role": "user", "content": user_input}
        ]
    )

    answer = response['choices'][0]['message']['content']
    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(debug=True)

# test_api.py 수정

import requests
import json

api_url = "http://127.0.0.1:5001/api/ask"
# 테스트하려는 정확한 한글 정책 이름 입력
my_question = "난임부부 지원"

headers = {"Content-Type": "application/json"}
data = {"question": my_question}

try:
    print(f'질문 전송 중: "{my_question}"')
    response = requests.post(api_url, headers=headers, json=data, timeout=60)
    response.raise_for_status()

    response_data = response.json()
    print("\n[서버 응답 성공]")
    print(json.dumps(response_data, indent=2, ensure_ascii=False))

except requests.exceptions.Timeout:
    print("\n[요청 실패] 서버 응답 시간 초과 (Timeout)")
except requests.exceptions.ConnectionError:
    print(
        f"\n[요청 실패] 서버 연결 실패. Flask 서버({api_url})가 실행 중인지 확인하세요."
    )
except requests.exceptions.RequestException as e:
    print(f"\n[요청 실패] 요청 중 오류 발생: {e}")
    try:
        print("서버 응답 내용:", response.text)
    except NameError:
        pass
except Exception as e:
    print(f"[실패] 기타 오류 발생: {e}")

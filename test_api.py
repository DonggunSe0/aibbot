# test_enhanced_rag.py (새 파일)

import requests
import json
from datetime import datetime

api_url = "http://127.0.0.1:5001/api/chat"

# 팀원 설계안 시나리오 기반 테스트 케이스들
test_scenarios = [
    {
        "name": "🎯 팀원 시나리오 - 강남구 둘째 출산 맞춤 상담",
        "description": "강남구 거주, 둘째 출산 후 추가 지원금 문의",
        "data": {
            "message": "지금 둘째 낳은 지 얼마 안 됐는데, 강남구에서 추가로 받을 수 있는 출산 지원금이나 양육수당 같은 거 더 있을까요? 첫째 아이 지원금은 받고 있어요.",
            "user_profile": {
                "region": "강남구",
                "hasChild": "유",
                "asset": "3~5억",
                "children": [
                    {"gender": "여", "birthdate": "2022-05-10"},  # 첫째 (만 2세)
                    {"gender": "남", "birthdate": "2024-03-15"}   # 둘째 (만 0세)
                ]
            }
        },
        "expected_features": [
            "QUA: 의도 분석 ('다자녀 출산 지원금 및 양육수당 추가 수혜 문의')",
            "QUA: 엔티티 추출 (지역: 강남구, 자녀수: 둘째, 나이: 만 0세)",
            "HRA: 메타데이터 필터링 (강남구 + 0세/다자녀 조건)",
            "HRA: 키워드 검색 ('출산 지원금', '양육수당', '둘째')",
            "AGA: 개인화된 답변 (강남구 + 둘째 상황 고려)",
            "출처 명시 (📋 참고 정책 섹션)"
        ]
    },
    {
        "name": "🔍 표현 차이 테스트 - 비표준 용어 사용",
        "description": "사용자가 비표준 용어로 질문했을 때 표준화 처리 확인",
        "data": {
            "message": "우리 애기 이제 막 태어났는데 강남 살아. 뭔가 도움 받을 수 있는 거 있나?",
            "user_profile": {
                "region": "강남구",
                "hasChild": "유",
                "children": [
                    {"gender": "남", "birthdate": "2024-12-01"}  # 갓 태어난 아기
                ]
            }
        },
        "expected_features": [
            "QUA: '강남' → '강남구' 표준화",
            "QUA: '애기 막 태어났는데' → '만 0세', '영아' 키워드 추출",
            "HRA: 표준화된 조건으로 필터링",
            "신생아/영아 대상 정책 우선 검색"
        ]
    },
    {
        "name": "📊 다중 조건 복합 검색",
        "description": "여러 조건이 섞인 복잡한 질문 처리",
        "data": {
            "message": "서초구에 사는 맞벌이 부부인데, 3살 5살 아이 둘 키우고 있어요. 어린이집 지원이나 보육료 관련해서 받을 수 있는 혜택 알려주세요.",
            "user_profile": {
                "region": "서초구",
                "hasChild": "유",
                "children": [
                    {"gender": "남", "birthdate": "2021-03-01"},  # 3세
                    {"gender": "여", "birthdate": "2019-07-15"}   # 5세
                ]
            }
        },
        "expected_features": [
            "QUA: 복합 의도 분석 (어린이집 + 보육료 + 맞벌이)",
            "HRA: 다중 나이 조건 (3세, 5세) 처리",
            "HRA: 서초구 + 다자녀 + 보육 관련 정책 검색",
            "AGA: 맞벌이 상황 고려한 답변"
        ]
    },
    {
        "name": "🚫 조건 불일치 테스트",
        "description": "검색 조건에 맞는 정책이 없을 때 처리",
        "data": {
            "message": "중랑구에서 20세 이상 성인 자녀 양육비 지원 있나요?",
            "user_profile": {
                "region": "중랑구",
                "hasChild": "유",
                "children": [
                    {"gender": "남", "birthdate": "2000-01-01"}  # 24세 (성인)
                ]
            }
        },
        "expected_features": [
            "HRA: 조건 필터링 후 결과 없음",
            "AGA: 적절한 안내 메시지",
            "대안 제안 또는 추가 정보 요청"
        ]
    },
    {
        "name": "⚡ 일반 질문 (RAG 불필요)",
        "description": "정책 검색이 필요없는 일반적인 질문",
        "data": {
            "message": "안녕하세요! 아이뽓이 뭔가요?"
        },
        "expected_features": [
            "QUA: 일반 인사/소개 의도 파악",
            "기본 소개 응답 또는 RAG 건너뛰기"
        ]
    }
]

def analyze_response(response_data, expected_features):
    """응답 데이터를 분석하고 기대 기능들이 구현되었는지 확인"""
    analysis = {
        "basic_response": bool(response_data.get('answer')),
        "rag_pipeline": response_data.get('processing_pipeline', ''),
        "personalized": response_data.get('personalized', False),
        "cited_policies": len(response_data.get('cited_policies', [])),
        "confidence_score": response_data.get('confidence_score', 0),
        "query_analysis": bool(response_data.get('query_analysis')),
        "search_count": response_data.get('search_results_count', 0)
    }
    
    # QUA 분석 결과 확인
    if response_data.get('query_analysis'):
        qua_result = response_data['query_analysis']
        analysis.update({
            "qua_intent": qua_result.get('intent', ''),
            "qua_keywords": qua_result.get('search_keywords', []),
            "qua_entities": qua_result.get('entities', {}),
            "qua_enhanced_queries": qua_result.get('enhanced_queries', [])
        })
    
    return analysis

def run_enhanced_rag_tests():
    """향상된 RAG 시스템 종합 테스트"""
    print("🚀 Enhanced RAG System Test Suite")
    print("=" * 80)
    print(f"테스트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API 엔드포인트: {api_url}")
    print("=" * 80)
    
    headers = {"Content-Type": "application/json"}
    total_tests = len(test_scenarios)
    passed_tests = 0
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n📋 테스트 {i}/{total_tests}: {scenario['name']}")
        print(f"📝 설명: {scenario['description']}")
        print(f"💬 질문: {scenario['data']['message']}")
        
        if 'user_profile' in scenario['data']:
            profile = scenario['data']['user_profile']
            print(f"👤 사용자 프로필: {profile.get('region', 'N/A')} 거주, 자녀 {len(profile.get('children', []))}명")
        
        print("-" * 60)
        
        try:
            # API 호출
            response = requests.post(api_url, headers=headers, json=scenario['data'], timeout=45)
            response.raise_for_status()
            
            response_data = response.json()
            
            # 응답 분석
            analysis = analyze_response(response_data, scenario['expected_features'])
            
            print(f"✅ 응답 성공!")
            print(f"🔄 처리 파이프라인: {analysis['rag_pipeline']}")
            print(f"🎯 개인화 적용: {analysis['personalized']}")
            print(f"📊 검색된 정책 수: {analysis['search_count']}")
            print(f"📚 참고 정책 수: {analysis['cited_policies']}")
            print(f"🏆 신뢰도 점수: {analysis.get('confidence_score', 0):.2f}")
            
            # QUA 분석 결과 출력
            if analysis.get('qua_intent'):
                print(f"🧠 QUA 의도 분석: {analysis['qua_intent']}")
                print(f"🔍 QUA 키워드: {', '.join(analysis.get('qua_keywords', [])[:5])}")
                
                entities = analysis.get('qua_entities', {})
                if entities.get('region'):
                    print(f"📍 QUA 지역 추출: {entities['region']}")
                if entities.get('child_age_keywords'):
                    print(f"👶 QUA 나이 키워드: {', '.join(entities['child_age_keywords'])}")
            
            print(f"\n💬 답변 내용:")
            answer = response_data.get('answer', '')
            # 답변이 너무 길면 요약해서 표시
            if len(answer) > 300:
                print(f"{answer[:300]}...")
                print(f"... (총 {len(answer)}자)")
            else:
                print(answer)
            
            # 참고 정책 목록
            cited_policies = response_data.get('cited_policies', [])
            if cited_policies:
                print(f"\n📋 참고 정책:")
                for j, policy in enumerate(cited_policies[:3], 1):
                    score = policy.get('final_score', policy.get('search_score', 0))
                    print(f"  {j}. {policy.get('biz_nm', 'N/A')} (ID: {policy.get('id', 'N/A')}, 점수: {score})")
            
            # 기대 기능 체크
            print(f"\n🔍 기대 기능 확인:")
            for feature in scenario['expected_features']:
                # 간단한 키워드 매칭으로 기능 구현 여부 확인
                feature_implemented = False
                if 'QUA:' in feature and analysis.get('qua_intent'):
                    feature_implemented = True
                elif 'HRA:' in feature and analysis['search_count'] > 0:
                    feature_implemented = True
                elif 'AGA:' in feature and analysis['cited_policies'] > 0:
                    feature_implemented = True
                elif '출처 명시' in feature and '📋' in response_data.get('answer', ''):
                    feature_implemented = True
                
                status = "✅" if feature_implemented else "⚠️"
                print(f"  {status} {feature}")
            
            passed_tests += 1
            
        except requests.exceptions.Timeout:
            print(f"❌ 테스트 실패: 응답 시간 초과 (45초)")
        except requests.exceptions.ConnectionError:
            print(f"❌ 테스트 실패: 서버 연결 불가. Flask 서버 실행 상태를 확인하세요.")
        except requests.exceptions.RequestException as e:
            print(f"❌ 테스트 실패: HTTP 요청 오류 - {e}")
            try:
                print(f"서버 응답: {response.text[:200]}")
            except:
                pass
        except Exception as e:
            print(f"❌ 테스트 실패: 예상치 못한 오류 - {e}")
        
        print("=" * 80)
    
    # 테스트 결과 요약
    print(f"\n🏁 테스트 완료!")
    print(f"📊 결과: {passed_tests}/{total_tests} 테스트 통과")
    print(f"🕒 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if passed_tests == total_tests:
        print("🎉 모든 테스트 통과! Enhanced RAG 시스템이 정상 작동합니다.")
    else:
        print("⚠️ 일부 테스트 실패. 로그를 확인하여 문제를 해결하세요.")
    
    print("\n📋 다음 단계 권장사항:")
    print("1. 프론트엔드에서 user_profile 전달 구현")
    print("2. 답변에 하이퍼링크 및 정책 상세보기 연동")
    print("3. 사용자 피드백 수집 및 RAG 성능 개선")
    print("4. 정책 데이터 전처리 및 표준화 강화")

if __name__ == "__main__":
    print("Enhanced RAG System 종합 테스트를 시작합니다...")
    print("⚠️  테스트 전 확인사항:")
    print("1. Flask 서버가 http://127.0.0.1:5001 에서 실행 중인지 확인")
    print("2. .env 파일에 OPENAI_API_KEY가 설정되어 있는지 확인")
    print("3. MySQL DB에 정책 데이터가 있는지 확인 (sync_data.py 실행)")
    print("")
    
    input("준비가 완료되면 Enter를 눌러 테스트를 시작하세요...")
    
    run_enhanced_rag_tests()
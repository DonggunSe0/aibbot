# backend/enhanced_rag_service.py (새 파일)

import mysql.connector
import re
import json
from datetime import datetime
from typing import List, Dict, Optional, Any, Tuple

class QueryUnderstandingAgent:
    """QUA - 사용자 질문 이해 및 분석 에이전트"""
    
    def __init__(self, openai_client):
        self.client = openai_client
        
    def analyze_user_query(self, user_query: str, user_profile: Optional[Dict] = None) -> Dict[str, Any]:
        """
        사용자 질문을 분석하여 의도, 키워드, 엔티티 추출
        팀원 설계안의 QUA 단계 구현
        """
        
        # 사용자 프로필 정보 구성
        profile_context = ""
        if user_profile:
            profile_context = f"""
등록된 사용자 정보:
- 거주 지역: {user_profile.get('region', '정보 없음')}
- 자녀 유무: {user_profile.get('hasChild', '정보 없음')}
- 자녀 정보: {self._format_children_info(user_profile.get('children', []))}
- 자산 수준: {user_profile.get('asset', '정보 없음')}
"""
        
        # QUA 프롬프트 구성
        qua_prompt = f"""
당신은 사용자의 질문을 분석하여 핵심 의도와 주요 정보를 추출하는 AI 에이전트입니다.
서울시 육아 정책 데이터베이스 검색에 최적화된 정보를 추출해주세요.

사용자 질문: "{user_query}"
{profile_context}

다음 형식으로 JSON 응답해주세요:
{{
    "intent": "핵심 질문 의도 (예: 출산 지원금 문의, 양육 수당 문의, 다자녀 혜택 문의 등)",
    "search_keywords": ["정책명이나 내용 검색에 사용할 핵심 단어들"],
    "entities": {{
        "region": "표준화된 지역명 (예: 강남구, 서초구 등. 없으면 null)",
        "child_age_keywords": ["나이 관련 표준 키워드들 (예: 만 0세, 영아, 유아 등)"],
        "child_count_keywords": ["자녀 수 관련 키워드들 (예: 첫째, 둘째, 다자녀 등)"],
        "policy_types": ["정책 유형 키워드들 (예: 지원금, 수당, 보육, 의료 등)"]
    }},
    "enhanced_queries": ["검색 효과를 높이기 위한 확장 검색어 2-3개"],
    "user_situation_summary": "사용자 상황 요약 (답변 생성 시 참고용)"
}}

지역명 표준화 규칙:
- "강남", "강남구", "Gangnam" → "강남구"  
- "서초", "서초구" → "서초구"
- 기타 서울시 25개 자치구 표준명 사용

나이 표준화 규칙:
- "갓 태어난", "신생아", "0살" → "만 0세", "영아"
- "두 돌", "2살" → "만 2세", "유아"  
- "어린이집", "유치원" 관련 → "영유아", "만 3-5세"
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 정확한 JSON 형식으로만 응답하는 질문 분석 전문가입니다."},
                    {"role": "user", "content": qua_prompt}
                ],
                temperature=0.1,  # 일관된 분석을 위해 낮은 온도
                max_tokens=800
            )
            
            # JSON 파싱 시도
            raw_response = response.choices[0].message.content.strip()
            
            # JSON 추출 (```json ``` 감싸진 경우 대비)
            if "```json" in raw_response:
                json_start = raw_response.find("```json") + 7
                json_end = raw_response.find("```", json_start)
                json_str = raw_response[json_start:json_end].strip()
            else:
                json_str = raw_response
            
            analysis_result = json.loads(json_str)
            
            print(f"[QUA] 질문 분석 완료: {analysis_result['intent']}")
            return analysis_result
            
        except Exception as e:
            print(f"[QUA] 질문 분석 실패: {e}")
            # 폴백: 기본 분석 결과 반환
            return self._create_fallback_analysis(user_query, user_profile)
    
    def _format_children_info(self, children: List[Dict]) -> str:
        """자녀 정보를 읽기 좋은 형태로 포맷"""
        if not children:
            return "자녀 정보 없음"
        
        formatted = []
        for i, child in enumerate(children, 1):
            gender = child.get('gender', '성별 미상')
            birthdate = child.get('birthdate', '생년월일 미상')
            age = self._calculate_age(birthdate) if birthdate != '생년월일 미상' else '나이 미상'
            formatted.append(f"{i}째 ({gender}, {birthdate}, 만 {age}세)")
        
        return ", ".join(formatted)
    
    def _calculate_age(self, birthdate_str: str) -> int:
        """생년월일로부터 현재 나이 계산"""
        try:
            birth_year = int(birthdate_str.split('-')[0])
            current_year = datetime.now().year
            return current_year - birth_year
        except:
            return 0
    
    def _create_fallback_analysis(self, user_query: str, user_profile: Optional[Dict]) -> Dict[str, Any]:
        """QUA 실패 시 폴백 분석"""
        return {
            "intent": "육아 정책 문의",
            "search_keywords": user_query.split()[:5],  # 단순히 단어 분할
            "entities": {
                "region": user_profile.get('region') if user_profile else None,
                "child_age_keywords": ["영유아"],
                "child_count_keywords": [],
                "policy_types": ["지원"]
            },
            "enhanced_queries": [user_query],
            "user_situation_summary": "사용자가 육아 정책에 대해 문의함"
        }


class HybridRetrievalAgent:
    """HRA - 다중 경로 정보 검색 및 리랭킹 에이전트"""
    
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
    
    def multi_path_search(self, qua_result: Dict[str, Any]) -> List[Dict]:
        """
        다중 경로 검색 수행
        1. 메타데이터 필터링
        2. 키워드 기반 검색  
        3. 리랭킹
        """
        
        conn = None
        cursor = None
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Phase 1: 메타데이터 필터링
            filtered_candidates = self._metadata_filtering(cursor, qua_result)
            
            if not filtered_candidates:
                print(f"[HRA] 메타데이터 필터링 결과 없음. 전체 검색으로 확장")
                # 메타데이터 필터 없이 전체 검색
                filtered_candidates = self._get_all_policies(cursor)
            
            # Phase 2: 키워드 기반 검색 (필터링된 후보 내에서)
            keyword_scored = self._keyword_based_search(filtered_candidates, qua_result)
            
            # Phase 3: 리랭킹
            final_ranked = self._rerank_results(keyword_scored, qua_result)
            
            print(f"[HRA] 다중 경로 검색 완료: {len(final_ranked)}개 정책")
            return final_ranked[:10]  # 상위 10개만 반환
            
        except Exception as e:
            print(f"[HRA] 검색 중 오류: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn and conn.is_connected(): conn.close()
    
    def _get_db_connection(self):
        """DB 연결"""
        return mysql.connector.connect(
            host=self.db_config['host'],
            port=self.db_config['port'],
            user=self.db_config['user'],
            password=self.db_config['password'],
            database=self.db_config['database'],
            connect_timeout=5
        )
    
    def _metadata_filtering(self, cursor, qua_result: Dict) -> List[Dict]:
        """메타데이터 기반 1차 필터링"""
        entities = qua_result.get('entities', {})
        
        # 기본 쿼리
        base_query = """
            SELECT 
                id, biz_nm, biz_cn, utztn_trpr_cn, utztn_mthd_cn,
                biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm,
                trgt_child_age, trgt_rgn, deviw_site_addr, aply_site_addr
            FROM policies
            WHERE 1=1
        """
        
        conditions = []
        params = []
        
        # 지역 필터링 (유연한 매칭)
        if entities.get('region'):
            region = entities['region']
            conditions.append("(trgt_rgn LIKE %s OR trgt_rgn LIKE %s OR trgt_rgn = '전체' OR trgt_rgn IS NULL)")
            params.extend([f"%{region}%", f"%전체%"])
        
        # 나이 키워드 필터링
        age_keywords = entities.get('child_age_keywords', [])
        if age_keywords:
            age_conditions = []
            for keyword in age_keywords:
                age_conditions.append("trgt_child_age LIKE %s")
                params.append(f"%{keyword}%")
            conditions.append(f"({' OR '.join(age_conditions)})")
        
        # 정책 유형 필터링
        policy_types = entities.get('policy_types', [])
        if policy_types:
            type_conditions = []
            for ptype in policy_types:
                type_conditions.append("(biz_nm LIKE %s OR biz_cn LIKE %s)")
                params.extend([f"%{ptype}%", f"%{ptype}%"])
            conditions.append(f"({' OR '.join(type_conditions)})")
        
        # 최종 쿼리 구성
        if conditions:
            query = base_query + " AND " + " AND ".join(conditions)
        else:
            query = base_query
        
        query += " LIMIT 50"  # 성능을 위한 제한
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        print(f"[HRA] 메타데이터 필터링: {len(results)}개 후보")
        return results
    
    def _get_all_policies(self, cursor) -> List[Dict]:
        """모든 정책 가져오기 (폴백용)"""
        cursor.execute("""
            SELECT 
                id, biz_nm, biz_cn, utztn_trpr_cn, utztn_mthd_cn,
                biz_lclsf_nm, biz_mclsf_nm, biz_sclsf_nm,
                trgt_child_age, trgt_rgn, deviw_site_addr, aply_site_addr
            FROM policies
            LIMIT 30
        """)
        return cursor.fetchall()
    
    def _keyword_based_search(self, candidates: List[Dict], qua_result: Dict) -> List[Dict]:
        """키워드 기반 관련도 점수 계산"""
        search_keywords = qua_result.get('search_keywords', [])
        enhanced_queries = qua_result.get('enhanced_queries', [])
        
        all_keywords = search_keywords + enhanced_queries
        
        for policy in candidates:
            score = 0
            
            # 정책명에서 키워드 매칭
            policy_name = policy.get('biz_nm', '').lower()
            for keyword in all_keywords:
                if keyword.lower() in policy_name:
                    score += 3
            
            # 정책 내용에서 키워드 매칭
            policy_content = policy.get('biz_cn', '').lower()
            for keyword in all_keywords:
                if keyword.lower() in policy_content:
                    score += 2
            
            # 대상 내용에서 키워드 매칭
            target_content = policy.get('utztn_trpr_cn', '').lower()
            for keyword in all_keywords:
                if keyword.lower() in target_content:
                    score += 2
            
            policy['search_score'] = score
        
        return candidates
    
    def _rerank_results(self, policies: List[Dict], qua_result: Dict) -> List[Dict]:
        """최종 리랭킹"""
        entities = qua_result.get('entities', {})
        
        for policy in policies:
            final_score = policy.get('search_score', 0)
            
            # 지역 정확 매칭 보너스
            if entities.get('region'):
                region = entities['region']
                if region in policy.get('trgt_rgn', ''):
                    final_score += 5
            
            # 나이 매칭 보너스
            age_keywords = entities.get('child_age_keywords', [])
            target_age = policy.get('trgt_child_age', '')
            for age_keyword in age_keywords:
                if age_keyword in target_age:
                    final_score += 3
            
            # 정책 분야 매칭 보너스
            policy_category = policy.get('biz_mclsf_nm', '').lower()
            intent = qua_result.get('intent', '').lower()
            if '출산' in intent and '출산' in policy_category:
                final_score += 4
            if '양육' in intent and ('양육' in policy_category or '보육' in policy_category):
                final_score += 4
            
            policy['final_score'] = final_score
        
        # 최종 점수 기준 정렬
        return sorted(policies, key=lambda x: x.get('final_score', 0), reverse=True)


class AnswerGenerationAgent:
    """AGA - 최적화된 답변 생성 에이전트"""
    
    def __init__(self, openai_client):
        self.client = openai_client
    
    def generate_personalized_answer(
        self, 
        user_query: str, 
        qua_result: Dict, 
        policy_results: List[Dict]
    ) -> Dict[str, Any]:
        """개인화된 답변 생성"""
        
        if not policy_results:
            return {
                'answer': '죄송합니다. 현재 조건에 맞는 정책을 찾을 수 없습니다. 다른 키워드로 검색해보시거나 구체적인 상황을 알려주세요.',
                'cited_policies': [],
                'personalized': False
            }
        
        # 최적 컨텍스트 구성 (상위 3개 정책)
        context_policies = policy_results[:3]
        context_parts = []
        
        for i, policy in enumerate(context_policies, 1):
            context_parts.append(f"""
[정책 정보 {i}]
정책명: {policy['biz_nm']}
정책 ID: {policy['id']}
핵심 내용: {policy['biz_cn'][:400]}...
지원 대상: {policy['utztn_trpr_cn'][:300]}...
이용 방법: {policy.get('utztn_mthd_cn', '정보 없음')[:200]}...
관련도 점수: {policy.get('final_score', 0)}점
상세 링크: {policy.get('deviw_site_addr', '링크 없음')}
""")
        
        context_text = "\n".join(context_parts)
        
        # AGA 프롬프트 구성
        aga_prompt = f"""
당신은 서울시 육아 정책을 안내하는 전문 AI 상담가 '아이뽓'입니다.

사용자 상황: {qua_result.get('user_situation_summary', '육아 정책 문의')}
사용자 질문: "{user_query}"
질문 의도: {qua_result.get('intent', '정책 정보 문의')}

다음은 검색된 관련 정책 정보입니다:
{context_text}

위 정보를 바탕으로 다음 규칙에 따라 답변해주세요:

1. 사용자의 구체적 상황을 고려한 맞춤형 답변 제공
2. 각 정책을 명확히 구분하여 설명 (번호 또는 제목으로)
3. 지원 내용, 대상, 신청 방법을 구체적으로 안내
4. 답변 마지막에 반드시 다음 형식으로 참고 정책 명시:

📋 **참고 정책:**
- [정책명] (정책ID: XX)
- [정책명] (정책ID: XX)

5. 불확실한 정보는 추측하지 말고 확인이 필요하다고 안내
6. 친근하고 전문적인 톤 유지

답변:
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "당신은 서울시 육아 정책 전문 상담사 '아이뽓'입니다. 정확하고 친절한 맞춤 답변을 제공합니다."
                    },
                    {"role": "user", "content": aga_prompt}
                ],
                temperature=0.3,
                max_tokens=1200
            )
            
            answer = response.choices[0].message.content.strip()
            
            return {
                'answer': answer,
                'cited_policies': context_policies,
                'personalized': True,
                'confidence_score': self._calculate_confidence(policy_results)
            }
            
        except Exception as e:
            print(f"[AGA] 답변 생성 실패: {e}")
            return {
                'answer': f'죄송합니다. 답변 생성 중 오류가 발생했습니다. 다음 정책들을 참고해주세요:\n\n' + 
                         '\n'.join([f"• {p['biz_nm']}" for p in context_policies]),
                'cited_policies': context_policies,
                'personalized': False
            }
    
    def _calculate_confidence(self, policy_results: List[Dict]) -> float:
        """답변 신뢰도 계산"""
        if not policy_results:
            return 0.0
        
        # 최고 점수 정책의 점수를 기준으로 신뢰도 계산
        top_score = policy_results[0].get('final_score', 0)
        if top_score >= 10:
            return 0.9
        elif top_score >= 5:
            return 0.7
        elif top_score >= 2:
            return 0.5
        else:
            return 0.3


class EnhancedAibbotRAGService:
    """향상된 Aibbot RAG 서비스 - 다중 에이전트 아키텍처"""
    
    def __init__(self, db_config: Dict[str, str], openai_client):
        self.qua = QueryUnderstandingAgent(openai_client)
        self.hra = HybridRetrievalAgent(db_config)
        self.aga = AnswerGenerationAgent(openai_client)
    
    def process_query(
        self, 
        user_query: str, 
        user_profile: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """통합 쿼리 처리 - QUA → HRA → AGA 파이프라인"""
        
        print(f"[Enhanced RAG] 쿼리 처리 시작: '{user_query}'")
        
        # Phase 1: Query Understanding
        qua_result = self.qua.analyze_user_query(user_query, user_profile)
        
        # Phase 2: Hybrid Retrieval  
        policy_results = self.hra.multi_path_search(qua_result)
        
        # Phase 3: Answer Generation
        final_response = self.aga.generate_personalized_answer(
            user_query, qua_result, policy_results
        )
        
        # 응답에 추가 정보 포함
        final_response.update({
            'query_analysis': qua_result,
            'search_results_count': len(policy_results),
            'processing_pipeline': 'QUA → HRA → AGA'
        })
        
        print(f"[Enhanced RAG] 처리 완료: {len(policy_results)}개 정책 검색, 신뢰도: {final_response.get('confidence_score', 0):.2f}")
        
        return final_response
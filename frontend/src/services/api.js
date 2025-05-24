// frontend/src/services/api.js (완전히 수정된 버전)
import axios from 'axios';

const API_BASE_URL = '/api'; // Vite 프록시를 사용

// 사용자 프로필 가져오기 헬퍼 함수
const getUserProfile = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('사용자 프로필 로드 오류:', error);
    return null;
  }
};

// 향상된 채팅 API 호출 함수 (사용자 프로필 자동 포함)
export const sendMessageToChat = async (messageText, includeProfile = true) => {
  try {
    const requestData = {
      message: messageText,
    };

    // 사용자 프로필 자동 포함 (옵션)
    if (includeProfile) {
      const userProfile = getUserProfile();
      if (userProfile) {
        requestData.user_profile = userProfile;
        console.log('사용자 프로필 포함하여 전송:', userProfile);
      } else {
        console.log('저장된 사용자 프로필 없음 - 일반 검색으로 진행');
      }
    }

    const response = await axios.post(`${API_BASE_URL}/chat`, requestData);
    return response.data; // { answer, cited_policies, personalized, confidence_score 등 }
  } catch (error) {
    console.error("API 요청 중 오류 발생 (chat):", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('채팅 API 요청 중 서버 오류가 발생했습니다.');
  }
};

// 맞춤 정책 찾기 전용 API 함수 (프로필 필수)
export const findPersonalizedPolicies = async (messageText = "내 상황에 맞는 정책을 찾아주세요") => {
  const userProfile = getUserProfile();
  
  if (!userProfile || !userProfile.region || !userProfile.hasChild) {
    throw new Error('개인 맞춤 정책 검색을 위해서는 먼저 내 정보를 등록해주세요. (지역, 자녀 정보 필수)');
  }

  try {
    const requestData = {
      message: messageText,
      user_profile: userProfile,
      personalized_search: true // 맞춤 검색임을 명시
    };

    console.log('맞춤 정책 검색 요청:', requestData);

    const response = await axios.post(`${API_BASE_URL}/chat`, requestData);
    return response.data;
  } catch (error) {
    console.error("맞춤 정책 검색 중 오류:", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('맞춤 정책 검색 중 오류가 발생했습니다.');
  }
};

// 새로 나온 정책 조회 API (완전히 수정된 버전)
export const fetchRecentPolicies = async (days = 7, limit = 10) => {
  try {
    const params = new URLSearchParams({
      days: days.toString(),
      limit: limit.toString()
    });
    
    console.log(`실제 최근 ${days}일 내 변경된 정책 ${limit}개 조회 요청`);
    
    const response = await axios.get(`${API_BASE_URL}/recent-policies?${params}`);
    const result = response.data;
    
    // 응답 로깅
    console.log('API 응답:', {
      success: result.success,
      dataCount: result.data ? result.data.length : 0,
      summary: result.summary,
      newPolicies: result.summary?.new_policies || 0,
      updatedPolicies: result.summary?.updated_policies || 0
    });
    
    return result; // { success: true, data: [...], summary: {...} }
  } catch (error) {
    console.error("새로 나온 정책 조회 중 오류:", error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.message || error.message || '새로 나온 정책 조회 중 알 수 없는 서버 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};

// 기존 DB 테스트용 API (호환성 유지)
export const fetchTestDataFromDB = async () => {
  try {
    // 새로운 API로 리디렉션 (기존 코드 호환성 유지)
    console.log("fetchTestDataFromDB 호출됨 -> fetchRecentPolicies로 리디렉션");
    const result = await fetchRecentPolicies(7, 10);
    
    // 기존 형식에 맞게 변환
    return {
      success: result.success,
      data: result.data || [],
      message: result.summary?.message || "최근 정책을 조회했습니다."
    };
  } catch (error) {
    console.error("API 요청 중 오류 발생 (test-db fallback):", error.message);
    throw error;
  }
};

// 정책 ID로 상세 정보 가져오기
export const fetchPolicyDetailById = async (policyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/policy/${policyId}`);
    return response.data; // 기대 형식: { success: true, data: {...} } 또는 { success: false, message: "..." }
  } catch (error) {
    console.error(`API 요청 중 오류 발생 (policy/${policyId}):`, error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.message || error.message || `정책 상세 정보(ID: ${policyId}) 요청 중 알 수 없는 서버 오류가 발생했습니다.`;
    throw new Error(errorMessage);
  }
};

// 수동 정책 동기화 API (관리자용)
export const syncPoliciesManually = async () => {
  try {
    console.log('수동 정책 동기화 요청');
    const response = await axios.post(`${API_BASE_URL}/sync-policies`);
    const result = response.data;
    
    console.log('동기화 응답:', {
      success: result.success,
      message: result.message,
      changes: result.changes
    });
    
    return result; // { success: true, message: "...", changes: {...} }
  } catch (error) {
    console.error("수동 정책 동기화 중 오류:", error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('정책 동기화 중 서버 오류가 발생했습니다.');
  }
};

// 회원가입 API 호출 함수
export const signupUser = async (userData) => {
  // userData: { username, password, email (optional) }
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, userData);
    return response.data; // { success: true, message: "..." } 또는 { success: false, message: "..." }
  } catch (error) {
    console.error("API 요청 중 오류 발생 (signup):", error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('회원가입 API 요청 중 서버 오류가 발생했습니다.');
  }
};

// 로그인 API 호출 함수
export const loginUser = async (credentials) => {
  // credentials: { username, password }
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    return response.data; // { success: true, message: "...", user: { id, username } } 또는 { success: false, message: "..." }
  } catch (error) {
    console.error("API 요청 중 오류 발생 (login):", error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('로그인 API 요청 중 서버 오류가 발생했습니다.');
  }
};

// 사용자 프로필 유효성 검사 함수
export const validateUserProfile = () => {
  const userProfile = getUserProfile();
  
  if (!userProfile) {
    return { valid: false, message: '사용자 정보가 등록되지 않았습니다.' };
  }

  const requiredFields = ['region', 'hasChild'];
  const missingFields = [];

  if (!userProfile.region) missingFields.push('거주 지역');
  if (!userProfile.hasChild) missingFields.push('자녀 유무');

  if (missingFields.length > 0) {
    return { 
      valid: false, 
      message: `다음 정보가 필요합니다: ${missingFields.join(', ')}` 
    };
  }

  return { valid: true, profile: userProfile };
};

// 사용자 프로필 요약 정보 가져오기 (UI 표시용)
export const getUserProfileSummary = () => {
  const userProfile = getUserProfile();
  
  if (!userProfile) {
    return '정보 미등록';
  }

  const parts = [];
  
  if (userProfile.region) {
    parts.push(`${userProfile.region} 거주`);
  }
  
  if (userProfile.hasChild === '유' && userProfile.children) {
    const childCount = userProfile.children.length;
    parts.push(`자녀 ${childCount}명`);
  } else if (userProfile.hasChild === '무') {
    parts.push('자녀 없음');
  }

  return parts.length > 0 ? parts.join(', ') : '정보 미등록';
};

// 새로 나온 정책 분석 함수 (완전히 수정된 버전)
export const analyzeRecentPolicies = (policiesData) => {
  if (!policiesData || !policiesData.data) {
    return {
      isEmpty: true,
      message: "조회된 정책이 없습니다."
    };
  }

  const policies = policiesData.data;
  const summary = policiesData.summary || {};
  
  // 실제 API 응답의 summary 값을 우선 사용
  const newCount = summary.new_policies || 0;
  const updatedCount = summary.updated_policies || 0;
  const totalCount = policies.length;
  
  console.log('정책 분석:', {
    totalCount,
    newCount,
    updatedCount,
    summary
  });
  
  const analysis = {
    isEmpty: totalCount === 0,
    totalCount: totalCount,
    newCount: newCount,
    updatedCount: updatedCount,
    categories: {},
    recentDays: policiesData.query_params?.days || 7,
    message: summary.message || `${totalCount}개의 정책을 찾았습니다.`
  };

  // 카테고리별 분류
  policies.forEach(policy => {
    const category = policy.biz_mclsf_nm || '기타';
    analysis.categories[category] = (analysis.categories[category] || 0) + 1;
  });

  // 상태별 메시지 구성 (수정된 로직)
  if (totalCount === 0) {
    analysis.statusMessage = "변경된 정책 없음";
  } else if (newCount > 0 && updatedCount > 0) {
    analysis.statusMessage = `신규 ${newCount}개, 업데이트 ${updatedCount}개`;
  } else if (newCount > 0) {
    analysis.statusMessage = `신규 정책 ${newCount}개`;
  } else if (updatedCount > 0) {
    analysis.statusMessage = `업데이트된 정책 ${updatedCount}개`;
  } else {
    // 목록에는 있지만 실제 변경사항이 없는 경우 (이론적으로 발생하지 않아야 함)
    analysis.statusMessage = "최신 정책";
  }

  console.log('분석 결과:', analysis);
  return analysis;
};
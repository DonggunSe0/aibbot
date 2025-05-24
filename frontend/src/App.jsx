// frontend/src/App.jsx (최종 버전 - 실제 새 정책 기능 포함)
import { useState, useEffect } from 'react';
import TopBar from './components/common/TopBar';
import MenuSelector from './components/interactive/MenuSelector';
import FAQList from './components/interactive/FAQList';
import ChatBox from './components/chat/ChatBox';
import InputBar from './components/common/InputBar';
import MyPageModal from './components/modals/MyPageModal';
import LoginModal from './components/modals/LoginModal';
import PolicyDetailModal from './components/modals/PolicyDetailModal';
import SignupModal from './components/modals/SignupModal';
import LoadingIndicator from './components/common/LoadingIndicator';
import { 
  sendMessageToChat, 
  findPersonalizedPolicies,
  fetchRecentPolicies,
  analyzeRecentPolicies,
  fetchPolicyDetailById,
  validateUserProfile,
  getUserProfileSummary,
  syncPoliciesManually
} from './services/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState('');

  // 새로운 정책 관련 상태 (기존 DB 테스트 대체)
  const [recentPoliciesData, setRecentPoliciesData] = useState(null);
  const [recentPoliciesError, setRecentPoliciesError] = useState(null);
  const [isRecentPoliciesLoading, setIsRecentPoliciesLoading] = useState(false);
  const [policiesAnalysis, setPoliciesAnalysis] = useState(null);

  // 정책 상세 정보 모달용 상태
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState(null);
  const [isPolicyDetailModalOpen, setIsPolicyDetailModalOpen] = useState(false);
  const [policyDetailError, setPolicyDetailError] = useState(null);
  const [isPolicyDetailLoading, setIsPolicyDetailLoading] = useState(false);

  // 사용자 프로필 상태
  const [userProfileSummary, setUserProfileSummary] = useState('');

  // 관리자 기능 상태
  const [isSyncing, setIsSyncing] = useState(false);

  // 사용자 프로필 요약 업데이트
  useEffect(() => {
    const updateProfileSummary = () => {
      setUserProfileSummary(getUserProfileSummary());
    };
    
    updateProfileSummary();
    
    // localStorage 변경 감지
    const handleStorageChange = () => {
      updateProfileSummary();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleStorageChange);
    };
  }, [isMyPageOpen]);

  // 로그인 성공 시 처리
  const handleLoginSuccess = (userData, message) => {
    setCurrentUser(userData);
    setAuthMessage(message || '로그인 되었습니다.');
    setIsLoginOpen(false);
  };

  // 회원가입 성공 시 처리
  const handleSignupSuccess = (message) => {
    setAuthMessage(message || '회원가입 성공! 이제 로그인할 수 있습니다.');
    setIsSignupModalOpen(false);
    setIsLoginOpen(true);
  };

  // TopBar의 로그인 버튼 클릭 핸들러
  const handleTopBarLoginClick = () => {
    if (currentUser) {
      setIsMyPageOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  // 새로 나온 정책 조회 함수
  const loadRecentPolicies = async (days = 7) => {
    setRecentPoliciesData(null);
    setRecentPoliciesError(null);
    setIsRecentPoliciesLoading(true);
    setPoliciesAnalysis(null);
    
    try {
      console.log(`최근 ${days}일 내 정책 조회 시작`);
      const result = await fetchRecentPolicies(days, 15); // 최대 15개 조회
      
      if (result.success) {
        setRecentPoliciesData(result);
        const analysis = analyzeRecentPolicies(result);
        setPoliciesAnalysis(analysis);
        
        const responseMessage = {
          sender: 'gpt',
          text: `📋 ${analysis.message}\n\n${analysis.statusMessage}를 확인할 수 있습니다. 정책 이름을 클릭하시면 자세한 내용을 확인할 수 있어요.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'policy-list'
        };
        setMessages(prev => [...prev, responseMessage]);
        
        console.log('새로 나온 정책 조회 성공:', analysis);
      } else {
        setRecentPoliciesError(result.message || "정책 목록을 불러오는데 실패했습니다.");
        const errorMessage = {
          sender: 'gpt',
          text: `❌ 정책 목록 로딩 실패: ${result.message || "알 수 없는 오류"}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setRecentPoliciesError(error.message);
      const errorMessage = {
        sender: 'gpt',
        text: `❌ 오류 발생: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsRecentPoliciesLoading(false);
    }
  };

  // 수동 정책 동기화 함수
  const handleManualSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      console.log('수동 정책 동기화 시작');
      const result = await syncPoliciesManually();
      
      if (result.success) {
        setAuthMessage('정책 동기화가 완료되었습니다! 새로운 정책을 확인해보세요.');
        // 동기화 후 최신 정책 다시 로드
        setTimeout(() => {
          loadRecentPolicies(1); // 최근 1일 내 정책 조회
        }, 1000);
      } else {
        setAuthMessage('정책 동기화 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('수동 동기화 실패:', error);
      setAuthMessage('정책 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMenuSelect = async (menuName) => {
    // 사용자 메시지 먼저 추가
    const userMessage = {
      sender: 'user',
      text: menuName,
      timestamp: new Date().toLocaleTimeString()
    };
    
    if (menuName === '내 정보 등록/수정') {
      setMessages(prev => [...prev, userMessage]);
      setIsMyPageOpen(true);
      
      const guideMessage = {
        sender: 'gpt',
        text: '개인 맞춤 정책 추천을 위해 내 정보를 등록해주세요!\n\n📍 거주 지역, 자녀 정보 등을 입력하시면 더 정확한 정책을 추천해드릴 수 있어요.',
        timestamp: new Date().toLocaleTimeString(),
        type: 'guide'
      };
      setMessages(prev => [...prev, guideMessage]);
      
    } else if (menuName === '새로 나온 정책 보기') {
      setMessages(prev => [...prev, userMessage]);
      await loadRecentPolicies(7); // 최근 7일 내 정책 조회
      
    } else if (menuName === '맞춤 정책 찾기') {
      setMessages(prev => [...prev, userMessage]);
      
      const profileValidation = validateUserProfile();
      
      if (!profileValidation.valid) {
        const warningMessage = {
          sender: 'gpt',
          text: `⚠️ ${profileValidation.message}\n\n맞춤 정책 추천을 위해서는 먼저 "내 정보 등록/수정"에서 정보를 입력해주세요.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'warning'
        };
        setMessages(prev => [...prev, warningMessage]);
        return;
      }
      
      setIsLoading(true);
      try {
        const personalizedQuery = `${userProfileSummary} 상황에서 받을 수 있는 모든 정책을 자세히 알려주세요. 신청 방법과 지원 내용도 포함해서 설명해주세요.`;
        
        const data = await findPersonalizedPolicies(personalizedQuery);
        const responseMessage = {
          sender: 'gpt',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString(),
          cited_policies: data.cited_policies || [],
          personalized: true,
          confidence_score: data.confidence_score || 0,
          type: 'personalized'
        };
        setMessages(prev => [...prev, responseMessage]);
      } catch (error) {
        const errorMessage = {
          sender: 'gpt',
          text: `❌ 맞춤 정책 검색 실패: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      
    } else {
      setMessages(prev => [...prev, userMessage]);
      handleChatSend(menuName);
    }
  };

  const handlePolicyItemClick = async (policyId) => {
    if (!policyId) {
      console.error("Policy ID is missing.");
      setPolicyDetailError("정책 ID가 없어 상세 정보를 불러올 수 없습니다.");
      return;
    }
    setSelectedPolicyDetail(null);
    setPolicyDetailError(null);
    setIsPolicyDetailLoading(true);
    setIsPolicyDetailModalOpen(true);
    try {
      const result = await fetchPolicyDetailById(policyId);
      if (result.success) {
        setSelectedPolicyDetail(result.data);
      } else {
        setPolicyDetailError(result.message || `ID ${policyId} 정책 상세 정보를 불러오는데 실패했습니다.`);
      }
    } catch (error) {
      setPolicyDetailError(error.message || `ID ${policyId} 정책 상세 정보 로딩 중 심각한 오류 발생.`);
    } finally {
      setIsPolicyDetailLoading(false);
    }
  };

  const handleChatSend = async (text) => {
    setIsLoading(true);
    try {
      const data = await sendMessageToChat(text, true);
      const gptMessage = {
        sender: 'gpt',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        cited_policies: data.cited_policies || [],
        personalized: data.personalized || false,
        confidence_score: data.confidence_score || 0
      };
      setMessages(prev => [...prev, gptMessage]);
    } catch (error) {
      const errorMessageText = error.error || error.message || 'GPT 응답을 가져오는 데 실패했습니다.';
      const errorMessage = {
        sender: 'gpt',
        text: errorMessageText,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaqOrInputSend = (text) => {
    const userMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    handleChatSend(text);
  };

  useEffect(() => {
    if (authMessage) {
      const timer = setTimeout(() => {
        setAuthMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [authMessage]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 font-sans">
      <TopBar 
        onLoginClick={handleTopBarLoginClick} 
        currentUser={currentUser} 
        onLogout={() => { 
          setCurrentUser(null); 
          setAuthMessage('로그아웃 되었습니다.'); 
        }} 
      />
      
      {/* 개선된 알림 메시지 */}
      {authMessage && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl text-sm z-[150] backdrop-blur-sm border transition-all duration-300 animate-fade-in-down
                        ${currentUser || authMessage.includes('성공') || authMessage.includes('완료')
                          ? 'bg-green-100/90 text-green-800 border-green-200' 
                          : 'bg-red-100/90 text-red-800 border-red-200'}`}
        >
          <div className="flex items-center gap-2">
            {currentUser || authMessage.includes('성공') || authMessage.includes('완료') ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {authMessage}
          </div>
        </div>
      )}

      <main className="flex-grow overflow-y-auto pt-20 pb-24">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 웰컴 섹션 + 프로필 요약 */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg mb-6 animate-bounce-gentle">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              안녕하세요! <span className="text-pink-600">아이뽓</span>입니다
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-3">
              서울시 임신·출산·육아 정책을 쉽고 빠르게 찾아드려요.<br />
              아래 메뉴를 선택하거나 궁금한 내용을 질문해보세요.
            </p>
            
            {/* 사용자 프로필 요약 + 관리자 기능 */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/70 rounded-full text-xs text-gray-600 border border-gray-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>{userProfileSummary}</span>
              </div>
              
              {/* 관리자 기능: 수동 동기화 버튼 */}
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100/70 hover:bg-blue-200/70 rounded-full text-xs text-blue-700 border border-blue-200 transition-colors disabled:opacity-50"
                title="최신 정책 데이터로 업데이트"
              >
                {isSyncing ? (
                  <LoadingIndicator size="sm" color="blue" />
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>{isSyncing ? '동기화 중...' : '정책 업데이트'}</span>
              </button>
            </div>
          </div>

          {/* 메뉴 선택기 */}
          <MenuSelector onSelect={handleMenuSelect} />
          
          {/* FAQ 리스트 */}
          <FAQList onSelect={handleFaqOrInputSend} />
          
          {/* 새로 나온 정책 표시 */}
          {isRecentPoliciesLoading && (
            <div className="my-6 p-6 border border-blue-200 rounded-2xl bg-blue-50/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <LoadingIndicator size="sm" />
                <p className="text-blue-700 font-medium">최신 정책을 불러오는 중...</p>
              </div>
            </div>
          )}
          
          {recentPoliciesError && !isRecentPoliciesLoading && (
            <div className="my-6 p-6 border border-red-200 rounded-2xl bg-red-50/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">정책 목록 로딩 오류</h4>
                  <p className="text-sm text-red-700">{recentPoliciesError}</p>
                </div>
              </div>
            </div>
          )}
          
          {recentPoliciesData && !isRecentPoliciesLoading && (
            <div className="my-6 p-6 border border-gray-200 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-800">새로 나온 정책</h4>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {recentPoliciesData.data.length}개
                </span>
                {policiesAnalysis && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {policiesAnalysis.statusMessage}
                  </span>
                )}
              </div>
              
              {recentPoliciesData.data.length > 0 ? (
                <div className="grid gap-3">
                  {recentPoliciesData.data.map((policy) => (
                    <div 
                      key={policy.id} 
                      onClick={() => handlePolicyItemClick(policy.id)}
                      className="group p-4 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-100 hover:border-pink-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-gray-800 group-hover:text-pink-600 transition-colors">
                              {policy.biz_nm || '제목 없음'}
                            </h5>
                            {policy.policy_status === 'new' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">신규</span>
                            )}
                            {policy.policy_status === 'updated' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">업데이트</span>
                            )}
                          </div>
                          {policy.biz_cn && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {policy.biz_cn.substring(0, 100)}...
                            </p>
                          )}
                          {policy.biz_mclsf_nm && (
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {policy.biz_mclsf_nm}
                            </span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">새로 나온 정책이 없습니다.</p>
              )}
            </div>
          )}
          
          {/* 채팅 박스 */}
          <ChatBox 
            messages={messages} 
            isLoading={isLoading} 
            onPolicyClick={handlePolicyItemClick}
          />
        </div>
      </main>
  
      {/* 입력바 */}
      <InputBar onSend={handleFaqOrInputSend} isLoading={isLoading} />
  
      {/* 모달들 */}
      {isMyPageOpen && (
        <MyPageModal 
          onClose={() => {
            setIsMyPageOpen(false);
            window.dispatchEvent(new Event('userProfileUpdated'));
          }} 
          currentUser={currentUser} 
        />
      )}
  
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => {
            setIsLoginOpen(false);
            setIsSignupModalOpen(true);
          }}
        />
      )}

      {isSignupModalOpen && (
        <SignupModal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          onSignupSuccess={handleSignupSuccess}
        />
      )}

      {isPolicyDetailModalOpen && (
        <PolicyDetailModal
          isOpen={isPolicyDetailModalOpen}
          onClose={() => {
            setIsPolicyDetailModalOpen(false);
            setSelectedPolicyDetail(null);
            setPolicyDetailError(null);
          }}
          policy={selectedPolicyDetail}
          isLoading={isPolicyDetailLoading}
          error={policyDetailError}
        />
      )}
    </div>
  );
}

export default App;
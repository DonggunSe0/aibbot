// frontend/src/App.jsx (UI 개선 버전)
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
import { sendMessageToChat, fetchTestDataFromDB, fetchPolicyDetailById } from './services/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState('');

  // DB 테스트용 상태
  const [dbTestData, setDbTestData] = useState(null);
  const [dbTestError, setDbTestError] = useState(null);
  const [isDbTestLoading, setIsDbTestLoading] = useState(false);

  // 정책 상세 정보 모달용 상태
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState(null);
  const [isPolicyDetailModalOpen, setIsPolicyDetailModalOpen] = useState(false);
  const [policyDetailError, setPolicyDetailError] = useState(null);
  const [isPolicyDetailLoading, setIsPolicyDetailLoading] = useState(false);

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

  const handleMenuSelect = async (menuName) => {
    if (menuName === '내 정보 등록/수정') {
      setIsMyPageOpen(true);
    } else if (menuName === '새로 나온 정책 보기') {
      // 사용자 메시지 추가 (타이핑 애니메이션과 함께)
      setMessages((prevMessages) => [...prevMessages, { 
        sender: 'user', 
        text: menuName,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setDbTestData(null);
      setSelectedPolicyDetail(null);
      setDbTestError(null);
      setIsDbTestLoading(true);
      
      try {
        const result = await fetchTestDataFromDB();
        if (result.success) {
          setDbTestData(result.data);
          setMessages((prevMessages) => [...prevMessages, { 
            sender: 'gpt', 
            text: result.message || "DB에서 정책 목록을 성공적으로 불러왔습니다. 자세히 보려면 정책 이름을 클릭하세요.",
            timestamp: new Date().toLocaleTimeString(),
            type: 'policy-list'
          }]);
        } else {
          setDbTestError(result.message || "DB 정책 목록을 불러오는데 실패했습니다.");
          setMessages((prevMessages) => [...prevMessages, { 
            sender: 'gpt', 
            text: `DB 테스트 오류: ${result.message || "알 수 없는 오류"}`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'error'
          }]);
        }
      } catch (error) {
        setDbTestError(error.message || "DB 정책 목록 로딩 중 심각한 오류 발생.");
        setMessages((prevMessages) => [...prevMessages, { 
          sender: 'gpt', 
          text: `DB 테스트 중 오류: ${error.message || "알 수 없는 오류"}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error'
        }]);
      } finally {
        setIsDbTestLoading(false);
      }
    } else { 
      setMessages((prevMessages) => [...prevMessages, { 
        sender: 'user', 
        text: menuName,
        timestamp: new Date().toLocaleTimeString()
      }]);
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
      const data = await sendMessageToChat(text);
      const gptMessage = { 
        sender: 'gpt', 
        text: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        cited_policies: data.cited_policies || [],
        personalized: data.personalized || false,
        confidence_score: data.confidence_score || 0
      };
      setMessages((prevMessages) => [...prevMessages, gptMessage]);
    } catch (error) {
      const errorMessageText = error.error || error.message || 'GPT 응답을 가져오는 데 실패했습니다.';
      const errorMessage = { 
        sender: 'gpt', 
        text: errorMessageText,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaqOrInputSend = (text) => {
    setMessages((prevMessages) => [...prevMessages, { 
      sender: 'user', 
      text,
      timestamp: new Date().toLocaleTimeString()
    }]);
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
                        ${currentUser || authMessage.includes('성공') 
                          ? 'bg-green-100/90 text-green-800 border-green-200' 
                          : 'bg-red-100/90 text-red-800 border-red-200'}`}
        >
          <div className="flex items-center gap-2">
            {currentUser || authMessage.includes('성공') ? (
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
          {/* 개선된 웰컴 섹션 */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg mb-6 animate-bounce-gentle">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              안녕하세요! <span className="text-pink-600">아이뽓</span>입니다
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
              서울시 임신·출산·육아 정책을 쉽고 빠르게 찾아드려요.<br />
              아래 메뉴를 선택하거나 궁금한 내용을 질문해보세요.
            </p>
          </div>

          {/* 개선된 메뉴 선택기 */}
          <MenuSelector onSelect={handleMenuSelect} />
          
          {/* 개선된 FAQ 리스트 */}
          <FAQList onSelect={handleFaqOrInputSend} />
          
          {/* DB 테스트 결과 표시 (개선된 디자인) */}
          {isDbTestLoading && (
            <div className="my-6 p-6 border border-blue-200 rounded-2xl bg-blue-50/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <LoadingIndicator size="sm" />
                <p className="text-blue-700 font-medium">정책 목록을 불러오는 중...</p>
              </div>
            </div>
          )}
          
          {dbTestError && !isDbTestLoading && (
            <div className="my-6 p-6 border border-red-200 rounded-2xl bg-red-50/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">정책 목록 로딩 오류</h4>
                  <p className="text-sm text-red-700">{dbTestError}</p>
                </div>
              </div>
            </div>
          )}
          
          {dbTestData && !isDbTestLoading && (
            <div className="my-6 p-6 border border-gray-200 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-800">새로 나온 정책</h4>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {dbTestData.length}개
                </span>
              </div>
              
              {dbTestData.length > 0 ? (
                <div className="grid gap-3">
                  {dbTestData.map((policy) => (
                    <div 
                      key={policy.id} 
                      onClick={() => handlePolicyItemClick(policy.id)}
                      className="group p-4 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-100 hover:border-pink-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800 group-hover:text-pink-600 transition-colors">
                            {policy.biz_nm || '제목 없음'}
                          </h5>
                          {policy.biz_cn && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {policy.biz_cn.substring(0, 100)}...
                            </p>
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
          <ChatBox messages={messages} isLoading={isLoading} />
        </div>
      </main>
  
      {/* 입력바 - 개선된 디자인 */}
      <InputBar onSend={handleFaqOrInputSend} isLoading={isLoading} />
  
      {/* 모달들 */}
      {isMyPageOpen && (
        <MyPageModal onClose={() => setIsMyPageOpen(false)} currentUser={currentUser} />
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
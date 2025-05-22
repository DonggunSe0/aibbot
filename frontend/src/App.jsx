// aibbot/frontend/src/App.jsx
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
import { sendMessageToChat, fetchTestDataFromDB, fetchPolicyDetailById } from './services/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState('');

  // DB 테스트용 상태 추가 (기존 정책 목록 가져오기용)
  const [dbTestData, setDbTestData] = useState(null);
  const [dbTestError, setDbTestError] = useState(null);
  const [isDbTestLoading, setIsDbTestLoading] = useState(false);

  // 정책 상세 정보 모달용 상태 추가
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
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: menuName }]);
      setDbTestData(null);
      setSelectedPolicyDetail(null);
      setDbTestError(null);
      setIsDbTestLoading(true);
      try {
        const result = await fetchTestDataFromDB();
        if (result.success) {
          setDbTestData(result.data);
          setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: result.message || "DB에서 정책 목록을 성공적으로 불러왔습니다. 자세히 보려면 정책 이름을 클릭하세요." }]);
        } else {
          setDbTestError(result.message || "DB 정책 목록을 불러오는데 실패했습니다.");
          setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: `DB 테스트 오류: ${result.message || "알 수 없는 오류"}` }]);
        }
      } catch (error) {
        setDbTestError(error.message || "DB 정책 목록 로딩 중 심각한 오류 발생.");
        setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: `DB 테스트 중 오류: ${error.message || "알 수 없는 오류"}` }]);
      } finally {
        setIsDbTestLoading(false);
      }
    } else { 
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: menuName }]);
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
    try {
      const data = await sendMessageToChat(text);
      const gptMessage = { sender: 'gpt', text: data.answer };
      setMessages((prevMessages) => [...prevMessages, gptMessage]);
    } catch (error) {
      const errorMessageText = error.error || error.message || 'GPT 응답을 가져오는 데 실패했습니다.';
      const errorMessage = { sender: 'gpt', text: errorMessageText };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const handleFaqOrInputSend = (text) => {
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', text }]);
    handleChatSend(text);
  };

  useEffect(() => {
    if (authMessage) {
      const timer = setTimeout(() => {
        setAuthMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authMessage]);
  
  return (
    <div className="flex flex-col min-h-screen bg-main-yellow font-sans">
      <TopBar onLoginClick={handleTopBarLoginClick} currentUser={currentUser} onLogout={() => { setCurrentUser(null); setAuthMessage('로그아웃 되었습니다.'); }} />
      
      {authMessage && (
        <div 
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 p-3 rounded-md shadow-lg text-sm z-[150] 
                      ${currentUser || authMessage.includes('성공') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {authMessage}
        </div>
      )}

      <main className="flex-grow overflow-y-auto pt-[76px] pb-[80px]">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 text-center leading-relaxed">
            <div className="text-4xl mt-6 mb-4">🤖</div>
            <p>
              안녕하세요. 임신출산육아봇입니다.<br />
              아래 메뉴를 선택하거나 궁금한 내용을 질문해보세요.
            </p>
          </div>
          <MenuSelector onSelect={handleMenuSelect} />
          <FAQList onSelect={handleFaqOrInputSend} />
          
          {isDbTestLoading && (
            <div className="my-4 p-4 border rounded-md bg-blue-100 text-blue-700">
              <p>정책 목록을 불러오는 중...</p>
            </div>
          )}
          {dbTestError && !isDbTestLoading && (
            <div className="my-4 p-4 border rounded-md bg-red-100 text-red-700">
              <h4 className="font-bold mb-1">정책 목록 오류:</h4>
              <p className="text-sm">{dbTestError}</p>
            </div>
          )}
          {dbTestData && !isDbTestLoading && (
            <div className="my-4 p-4 border rounded-md bg-gray-100">
              <h4 className="font-bold mb-2">새로 나온 정책 (클릭하여 상세보기):</h4>
              {dbTestData.length > 0 ? (
                <ul className="space-y-2">
                  {dbTestData.map((policy) => (
                    <li 
                      key={policy.id} 
                      onClick={() => handlePolicyItemClick(policy.id)}
                      className="p-3 bg-white rounded-md shadow hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-sm text-gray-800">{policy.biz_nm || '제목 없음'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">새로 나온 정책이 없습니다.</p>
              )}
            </div>
          )}
          <ChatBox messages={messages} />
        </div>
      </main>
  
      <InputBar onSend={handleFaqOrInputSend} />
  
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
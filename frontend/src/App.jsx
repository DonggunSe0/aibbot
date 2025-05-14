// aibbot/frontend/src/App.jsx
import { useState } from 'react';
import TopBar from './components/common/TopBar';
import MenuSelector from './components/interactive/MenuSelector';
import FAQList from './components/interactive/FAQList';
import ChatBox from './components/chat/ChatBox';
import InputBar from './components/common/InputBar';
import MyPageModal from './components/modals/MyPageModal';
import LoginModal from './components/modals/LoginModal';
// import axios from 'axios'; // 이제 api.js 사용
import { sendMessageToChat, fetchTestDataFromDB } from './services/api'; // 수정된 API 임포트

function App() {
  const [messages, setMessages] = useState([]);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // DB 테스트용 상태 추가
  const [dbTestData, setDbTestData] = useState(null);
  const [dbTestError, setDbTestError] = useState(null);
  const [isDbTestLoading, setIsDbTestLoading] = useState(false);


  const handleMenuSelect = async (menuName) => { // async 유지 (다른 메뉴가 API 호출할 수 있으므로)
    if (menuName === '내 정보 등록/수정') {
      // "내 정보 등록/수정" 메뉴 선택 시:
      // 채팅창에 메시지를 추가하지 않고 바로 모달을 엽니다.
      setIsMyPageOpen(true);
    } else if (menuName === '새로 나온 정책 보기') {
      // 이 버튼은 DB 테스트용으로 사용 중입니다.
      // 사용자가 메뉴를 선택했음을 채팅창에 먼저 표시
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: menuName }]);
      setDbTestData(null);
      setDbTestError(null);
      setIsDbTestLoading(true);
      try {
        const result = await fetchTestDataFromDB();
        if (result.success) {
          setDbTestData(result.data);
          setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: result.message || "DB 테스트 데이터를 성공적으로 불러왔습니다." }]);
        } else {
          setDbTestError(result.message || "DB 테스트 데이터를 불러오는데 실패했습니다.");
          setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: `DB 테스트 오류: ${result.message || "알 수 없는 오류"}` }]);
        }
      } catch (error) {
        setDbTestError(error.message || "DB 테스트 중 심각한 오류 발생.");
        setMessages((prevMessages) => [...prevMessages, { sender: 'gpt', text: `DB 테스트 중 오류: ${error.message || "알 수 없는 오류"}` }]);
      } finally {
        setIsDbTestLoading(false);
      }
    } else { // '맞춤 정책 찾기' 및 기타 메뉴 (존재한다면)
      // 사용자가 메뉴를 선택했음을 채팅창에 먼저 표시
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: menuName }]);
      // 해당 메뉴 이름을 채팅 메시지로 간주하여 API로 전송
      handleChatSend(menuName);
    }
  };

  // 채팅 메시지 전송을 위한 별도 함수
  const handleChatSend = async (text) => {
    // 사용자가 입력한 메시지 표시는 호출부에서 담당하거나, 여기서 일괄 처리할 수 있음
    // 여기서는 handleFaqOrInputSend에서 사용자 메시지를 추가하므로, 여기서는 API 호출에만 집중
    try {
      const data = await sendMessageToChat(text); // API 서비스 함수 사용
      const gptMessage = { sender: 'gpt', text: data.answer };
      setMessages((prevMessages) => [...prevMessages, gptMessage]);
    } catch (error) {
      const errorMessageText = error.error || error.message || 'GPT 응답을 가져오는 데 실패했습니다.';
      const errorMessage = { sender: 'gpt', text: errorMessageText };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // FAQList와 InputBar에서 사용할 핸들러
  const handleFaqOrInputSend = (text) => {
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', text }]);
    handleChatSend(text); // 순수 채팅 전송 함수 호출
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-main-yellow font-sans">
      <TopBar onLoginClick={() => setIsLoginOpen(true)} />
      
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
          
          {/* DB 테스트 데이터 표시 영역 */}
          {isDbTestLoading && (
            <div className="my-4 p-4 border rounded-md bg-blue-100 text-blue-700">
              <p>DB 테스트 데이터를 불러오는 중...</p>
            </div>
          )}
          {dbTestError && (
            <div className="my-4 p-4 border rounded-md bg-red-100 text-red-700">
              <h4 className="font-bold mb-1">DB 테스트 오류:</h4>
              <p className="text-sm">{dbTestError}</p>
            </div>
          )}
          {dbTestData && !isDbTestLoading && ( // 로딩 중이 아닐 때만 데이터 표시
            <div className="my-4 p-4 border rounded-md bg-gray-100">
              <h4 className="font-bold mb-2">DB 테스트 결과 (최대 3개):</h4>
              {dbTestData.length > 0 ? (
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                  {JSON.stringify(dbTestData, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-600">DB에서 가져올 데이터가 없습니다.</p>
              )}
            </div>
          )}

          <ChatBox messages={messages} />
        </div>
      </main>
  
      <InputBar onSend={handleFaqOrInputSend} />
  
      {isMyPageOpen && (
        <MyPageModal onClose={() => setIsMyPageOpen(false)} />
      )}
  
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLogin={(data) => {
            console.log('로그인 정보:', data);
          }}
        />
      )}
    </div>
  );
}

export default App;
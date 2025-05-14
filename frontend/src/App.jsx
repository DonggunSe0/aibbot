// aibbot/frontend/src/App.jsx
import { useState } from 'react';
import TopBar from './components/common/TopBar';
import MenuSelector from './components/interactive/MenuSelector';
import FAQList from './components/interactive/FAQList';
import ChatBox from './components/chat/ChatBox';
import InputBar from './components/common/InputBar';
import MyPageModal from './components/modals/MyPageModal';
import LoginModal from './components/modals/LoginModal';
import axios from 'axios';
// import './App.css'; // 필요 시 활성화

function App() {
  const [messages, setMessages] = useState([]);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleMenuSelect = (menuName) => {
    if (menuName === '내 정보 등록/수정') {
      // 채팅창에 메시지 없이 모달만 엽니다.
      setIsMyPageOpen(true);
    } else {
      // 그 외 모든 메뉴 선택은 해당 메뉴 이름을 채팅 메시지로 간주하여 처리합니다.
      // 사용자가 메뉴를 클릭했다는 것을 채팅창에 표시하고, 백엔드로 질문을 보냅니다.
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: menuName }]);
      handleSend(menuName, true); // menuClick 플래그를 true로 전달
    }
  };

  const handleSend = async (text, isMenuClick = false) => {
    // isMenuClick이 true가 아닐 때만 (즉, InputBar에서 직접 입력했을 때만) 사용자 메시지를 추가합니다.
    // MenuSelector나 FAQList를 통한 호출은 해당 컴포넌트나 handleMenuSelect에서 이미 사용자 메시지를 추가했다고 가정합니다.
    // FAQList는 onSelect={handleSend}로 직접 연결되어 있으므로, FAQList 클릭 시 text가 바로 사용자 메시지로 가게 됩니다.
    if (!isMenuClick) {
        // FAQList에서 직접 handleSend를 호출하는 경우, 이미 messages에 추가되지 않도록 조정
        // 이전에 FAQList가 handleSend를 직접 호출하도록 했으므로, 
        // setMessages((prevMessages) => [...prevMessages, { sender: 'user', text }]); 이 부분이
        // FAQList 클릭 시와 InputBar 입력 시 모두 적용되도록 합니다.
        // MenuSelector의 경우는 handleMenuSelect에서 이미 사용자 메시지를 추가합니다.
        
        // 가장 일관된 방식: handleSend는 순수하게 API 통신만 담당하고,
        // 메시지 목록에 사용자 입력을 추가하는 것은 호출하는 쪽(InputBar, FAQList, handleMenuSelect)에서 명시적으로 수행
        // 아래는 단순화된 버전: handleSend 호출 시 항상 API 요청을 보냄
        // 사용자 메시지 표시는 호출 전/후에 적절히 관리
    }
    // 위 주석 참고: 아래 로직은 MenuSelector, FAQList, InputBar 모두에서 사용자 메시지가 표시되도록 함.
    // MenuSelector의 경우 handleMenuSelect에서 이미 메시지를 추가하므로, 여기서는 중복될 수 있어 조건부로 추가할 수 있으나,
    // 일관성을 위해 handleSend는 항상 사용자 메시지 로그를 남기고 API를 호출한다고 가정하고,
    // 호출하는 쪽에서 중복 로그를 남기지 않도록 주의.
    // 여기서는 가장 단순한 형태로, handleSend가 호출되면 항상 API를 보낸다고 가정.
    // setMessages는 App.jsx의 상태이므로, 여기서 일관되게 관리.

    // InputBar에서 직접 입력하거나, FAQList에서 클릭한 경우 사용자 메시지를 여기서 추가
    // MenuSelector는 handleMenuSelect에서 사용자 메시지를 추가하고, handleSend를 호출하므로
    // isMenuClick 플래그를 사용해 중복 추가를 방지할 수 있지만, 현재 MenuSelector가 handleSend를 직접 부르지 않으므로 괜찮습니다.
    // handleMenuSelect에서 setMessages와 handleSend(menuName, true)를 분리했으므로,
    // 여기서 다시 사용자 메시지를 추가할 필요는 없습니다. (handleMenuSelect에서 이미 추가했기 때문)
    // 다만 FAQList는 handleSend를 직접 호출하므로, FAQList 클릭 시 사용자 메시지 표시가 필요합니다.

    // 일관성을 위해, handleSend는 전달받은 text를 API로 보내는 역할만 하고,
    // UI에 사용자 메시지를 표시하는 것은 각 이벤트 핸들러(handleMenuSelect, FAQList의 onClick, InputBar의 onSubmit)에서 직접 setMessages를 호출하도록 변경하는 것이 더 명확할 수 있습니다.
    // 여기서는 이전 구조를 최대한 유지하면서, FAQList와 InputBar의 경우 사용자 메시지가 표시되도록 합니다.

    // === 메시지 추가 로직 수정 ===
    // handleSend는 API 통신만 담당하도록 하고, 메시지 표시는 각 호출부에서 담당하도록 변경하는 것이 좋으나,
    // 이전 요청("작동 잘 되는 버전")에 따라 최소한의 수정으로 일관된 동작을 목표로 합니다.
    // MenuSelector는 handleMenuSelect에서 setMessages 후 handleSend(menuName, true) 호출
    // FAQList는 onClick 시 setMessages 후 handleSend(question, false) 호출
    // InputBar는 onSubmit 시 setMessages 후 handleSend(text, false) 호출

    // 현재 handleSend는 menuName 또는 text를 인자로 받습니다.
    // InputBar.jsx는 onSend(input) -> handleSend(input) 호출
    // FAQList.jsx는 onSelect(q) -> handleSend(q) 호출
    // MenuSelector.jsx는 onSelect(menu.label) -> handleMenuSelect(menu.label) -> (내부에서 setMessages 후) handleSend(menu.label, true) 호출

    // 따라서, handleSend가 호출되기 전에 사용자 메시지는 messages 상태에 추가되어 있다고 가정합니다.

    try {
      const res = await axios.post('/api/chat', {
        message: text, // 백엔드로 보내는 메시지
      });
      const gptMessage = { sender: 'gpt', text: res.data.answer };
      setMessages((prevMessages) => [...prevMessages, gptMessage]);
    } catch (error) {
      console.error("서버 오류:", error);
      const errorMessageText = error.response?.data?.error || 'GPT 응답을 가져오는 데 실패했습니다.';
      const errorMessage = { sender: 'gpt', text: errorMessageText };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // FAQList와 InputBar에서 사용할 새로운 핸들러
  const handleFaqOrInputSend = (text) => {
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', text }]);
    handleSend(text);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-main-yellow font-sans">
      <TopBar onLoginClick={() => setIsLoginOpen(true)} />
      
      <main className="flex-grow overflow-y-auto pt-[76px] pb-[80px]">
        {/* 메인 콘텐츠 최대 너비를 5xl로 약간 넓힘 (약 1024px) */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 text-center leading-relaxed">
            <div className="text-4xl mt-6 mb-4">🤖</div>
            <p>
              안녕하세요. 임신출산육아봇입니다.<br />
              아래 메뉴를 선택하거나 궁금한 내용을 질문해보세요.
            </p>
          </div>
          <MenuSelector onSelect={handleMenuSelect} />
          <FAQList onSelect={handleFaqOrInputSend} /> {/* 변경 */}
          <ChatBox messages={messages} />
        </div>
      </main>
  
      <InputBar onSend={handleFaqOrInputSend} /> {/* 변경 */}
  
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
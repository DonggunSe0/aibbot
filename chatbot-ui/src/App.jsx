import { useState } from 'react'
import TopBar from './TopBar'
import MenuSelector from './MenuSelector'
import ChatBox from './ChatBox'
import InputBar from './InputBar'
import MyPageModal from './MyPageModal'
import axios from 'axios'



function App() {
  const [messages, setMessages] = useState([])
  const [isMyPageOpen, setIsMyPageOpen] = useState(false)

  const handleMenuSelect = (menuName) => {
    setMessages((prev) => [...prev, { sender: 'user', text: menuName }])

    if (menuName === '내 정보 등록/수정') {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'gpt',
          text: `맞춤 정책을 찾기 위해서는 내 정보 등록이 필요합니다.\n\n지역, 자녀유무, 자산에 본인이 해당하는 항목을 체크하고 검색 버튼을 클릭해 주세요.`,
        },
      ])

      setTimeout(() => {
        setIsMyPageOpen(true)
      }, 1000) // ⏱️ 1초 후 모달 열기
    }
  }

  const handleSend = async (text) => {
    // 1. 사용자 메시지 추가
    setMessages((prev) => [...prev, { sender: 'user', text }])
  
    try {
      // 2. Flask로 POST 요청 보내기
      const res = await axios.post('http://localhost:5000/ask', {
        message: text,
      })
  
      // 3. GPT 응답을 메시지에 추가
      setMessages((prev) => [...prev, { sender: 'gpt', text: res.data.answer }])
    } catch (error) {
      console.error("서버 오류:", error)
      setMessages((prev) => [...prev, { sender: 'gpt', text: 'GPT 응답을 가져오는 데 실패했습니다.' }])
    }
  }
  

  return (
    <div className="pt-[60px] pb-[70px] bg-main-yellow min-h-screen">
      <TopBar />
      <div className="max-w-[600px] mx-auto p-[10px]">
        <div className="mb-[20px]">
          <p className="pt-[30px] pb-[20px] text-center leading-relaxed">
            안녕하세요. 임신출산육아봇입니다.<br />
            아래 메뉴를 선택하거나 궁금한 내용을 질문해보세요.
          </p>
        </div>
        <MenuSelector onSelect={handleMenuSelect} />
        <ChatBox messages={messages} />
      </div>
      <InputBar onSend={handleSend} />
      {isMyPageOpen && <MyPageModal onClose={() => setIsMyPageOpen(false)} />}
    </div>
    
  )  
}

export default App

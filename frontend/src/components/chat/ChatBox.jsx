// src/components/chat/ChatBox.jsx
import React, { useEffect, useRef } from 'react';

function ChatBox({ messages }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col mt-4 space-y-2"> {/* px-0 md:px-4 제거, 부모에서 패딩 관리 */}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${
            msg.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-xl border-2 ${
              msg.sender === 'user' 
                ? 'bg-main-pink text-gray-800 border-pink-300 self-end'
                : 'bg-white text-gray-800 border-gray-300 self-start'
            }`}
          >
            <p className="text-sm whitespace-pre-line">{msg.text}</p>
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatBox;
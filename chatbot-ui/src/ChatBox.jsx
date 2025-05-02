function ChatBox({ messages }) {
  return (
    <div className="flex flex-col px-4 mt-4 space-y-2">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${
            msg.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-xl border-2 bg-white border-main-pink ${
              msg.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <p className="text-sm text-gray-800 whitespace-pre-line">{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatBox

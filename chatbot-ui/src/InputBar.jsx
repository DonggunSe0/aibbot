import { useState } from 'react'

function InputBar({ onSend }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSend(input)
      setInput('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 w-full flex items-center gap-2 bg-white border-t border-gray-200 px-4 py-3 z-50"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="궁금한 내용을 입력하세요..."
        className="flex-1 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-main-pink"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-main-pink text-white rounded-md hover:bg-pink-300 transition-colors"
      >
        전송
      </button>
    </form>
  )
}

export default InputBar

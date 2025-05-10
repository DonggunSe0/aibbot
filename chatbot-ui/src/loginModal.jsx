import { useState } from 'react'

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onLogin) onLogin({ email, password })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4 text-center">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="ID"
            placeholder="아이디"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-main-pink text-white rounded hover:bg-pink-300"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal

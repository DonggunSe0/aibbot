// src/components/modals/LoginModal.jsx
import { useState } from 'react';

function LoginModal({ onClose, onLogin }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin({ id, password });
    // onClose(); // 로그인 성공/실패 여부에 따라 닫도록 하려면 이 부분을 onLogin 콜백 내부에서 처리
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-main-pink focus:border-main-pink"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-main-pink focus:border-main-pink"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-main-pink text-white rounded-md hover:bg-pink-300 transition-colors"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
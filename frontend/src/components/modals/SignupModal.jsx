import React, { useState } from 'react';
import { signupUser } from '../../services/api'; // API 서비스 임포트

const SignupModal = ({ isOpen, onClose, onSignupSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // 선택 사항
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const userData = { username, password, email };
      const response = await signupUser(userData);
      if (response.success) {
        onSignupSuccess(response.message || '회원가입 성공! 로그인 해주세요.'); // 성공 메시지 전달
        onClose(); // 모달 닫기
      } else {
        setError(response.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto my-8 transform transition-all">
        <div className="px-6 py-4 border-b border-gray-200 relative">
          <h3 className="text-lg leading-6 font-bold text-gray-900 text-center">회원가입</h3>
          <button onClick={onClose} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{error}</p>}
          <div>
            <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700">아이디 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="signup-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">비밀번호 <span className="text-red-500">*</span></label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="4"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">최소 4자 이상 입력해주세요.</p>
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">이메일 (선택)</label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-main-pink hover:bg-pink-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupModal; 
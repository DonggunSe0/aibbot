import { useState } from 'react';
import { loginUser } from '../../services/api';

function LoginModal({ onClose, onLoginSuccess, onNavigateToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await loginUser({ username, password });
      if (response.success) {
        if (onLoginSuccess) onLoginSuccess(response.user, response.message);
        onClose();
      } else {
        setError(response.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">로그인</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-100 p-2 rounded mb-4 text-center">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          <div className="flex flex-col space-y-3 pt-2">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-main-pink text-black rounded-md hover:bg-pink-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSignup();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                아직 회원이 아니신가요? 회원가입
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;

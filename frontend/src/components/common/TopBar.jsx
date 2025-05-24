// frontend/src/components/common/TopBar.jsx (향상된 버전)
import { useState } from 'react';

function TopBar({ onLoginClick, currentUser, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserButtonClick = () => {
    if (currentUser) {
      setShowUserMenu(!showUserMenu);
    } else {
      onLoginClick();
    }
  };

  const handleLogout = () => {
    onLogout();
    setShowUserMenu(false);
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-[100] shadow-sm">
      <div className="w-full max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 섹션 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                아이뽓 AIBBOT
              </h1>
              <p className="text-xs text-gray-500">서울시 육아 정책 AI 상담사</p>
            </div>
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              onClick={handleUserButtonClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
            >
              {currentUser ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 hidden sm:block">
                    {currentUser.username}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 hidden sm:block">로그인</span>
                </>
              )}
            </button>

            {/* 드롭다운 메뉴 */}
            {currentUser && showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{currentUser.username}</p>
                  <p className="text-xs text-gray-500">로그인됨</p>
                </div>
                
                <button
                  onClick={() => {
                    onLoginClick(); // 마이페이지 열기
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  내 정보 관리
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  로그아웃
                </button>
              </div>
            )}

            {/* 외부 클릭 감지용 오버레이 */}
            {showUserMenu && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
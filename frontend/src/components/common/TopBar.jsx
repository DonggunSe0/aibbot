// src/components/common/TopBar.jsx
function TopBar({ onLoginClick }) {
  return (
    <div className="fixed top-0 left-0 w-full bg-main-pink py-4 px-5 z-[50] shadow-md h-[60px] flex items-center">
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">아이뽓 AIBBOT</h1>
        <button
          onClick={onLoginClick}
          className="text-2xl hover:text-pink-500"
          title="로그인"
        >
          👤
        </button>
      </div>
    </div>
  );
}

export default TopBar;
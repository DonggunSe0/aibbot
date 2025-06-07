// frontend/src/components/interactive/MenuSelector.jsx (향상된 버전)
function MenuSelector({ onSelect }) {
  const menus = [
    { 
      label: '내 정보 등록/수정', 
      emoji: '📝', 
      description: '개인 맞춤 정책 추천을 위한 정보 입력',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      label: '새로 나온 정책 보기', 
      emoji: '🏛️', 
      description: '최신 서울시 육아 정책 목록 확인',
      color: 'from-green-400 to-green-600'
    },
    { 
      label: '맞춤 정책 찾기', 
      emoji: '🎯', 
      description: '내 상황에 맞는 정책 AI 추천',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {menus.map((menu, index) => (
        <button
          key={index}
          onClick={() => onSelect(menu.label)}
          className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 p-1 text-center overflow-hidden"
        >
          {/* 배경 그라데이션 효과 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${menu.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          
          {/* 이모지 */}
          <div className="relative mb-2">
            <div className="inline-flex items-center justify-center w-16 h-12 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">{menu.emoji}</span>
            </div>
          </div>
          
          {/* 제목 */}
          <h3 className="relative font-semibold text-gray-800 mb-0.5 group-hover:text-gray-900 transition-colors">
            {menu.label}
          </h3>
          
          {/* 설명 */}
          <p className="relative text-sm text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
            {menu.description}
          </p>
          
          {/* 호버 시 화살표 */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}

export default MenuSelector;
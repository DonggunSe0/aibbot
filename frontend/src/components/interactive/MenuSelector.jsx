// src/components/interactive/MenuSelector.jsx
function MenuSelector({ onSelect }) {
  const menus = [
    { label: '내 정보 등록/수정', emoji: '📝' },
    { label: '새로 나온 정책 보기', emoji: '🏛️' },
    { label: '맞춤 정책 찾기', emoji: '🎯' }
  ];

  return (
    <div className="flex w-full justify-between gap-3 mt-4">
      {menus.map((menu, index) => (
        <button
          key={index}
          onClick={() => onSelect(menu.label)}
          className="flex-1 bg-white text-black py-3 text-sm font-medium rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center min-h-[100px] justify-center"
        >
          <span className="text-3xl md:text-5xl mb-1">{menu.emoji}</span>
          <span className="text-xs md:text-sm">{menu.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MenuSelector;
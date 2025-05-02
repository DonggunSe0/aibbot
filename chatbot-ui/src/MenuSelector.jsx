function MenuSelector({ onSelect }) {
  const menus = ['내 정보 등록/수정', '새로 나온 정책 보기', '맞춤 정책 찾기']

  return (
    <div className="flex w-full justify-between gap-3 px-4 mt-4">
      {menus.map((menu, index) => (
        <button
          key={index}
          onClick={() => onSelect(menu)}
          className="flex-1 bg-white text-black py-3 text-sm font-medium rounded-2xl shadow-sm hover:shadow-md transition-all"
        >
          {menu}
        </button>
      ))}
    </div>
  )
}

export default MenuSelector

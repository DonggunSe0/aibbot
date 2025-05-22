// src/components/interactive/CategorySelector.jsx
function CategorySelector({ onSelect }) {
  const categories = ['임신', '출산', '육아'];

  return (
    <div className="my-6">
      <p className="text-center text-gray-700 mb-3">궁금한 주제를 선택해주세요:</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="bg-main-pink text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-pink-300 transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySelector;
function CategorySelector({ onSelect }) {
    const categories = ['임신', '출산', '육아']
  
    return (
      <div>
        <p>궁금한 주제를 선택해주세요:</p>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            style={{ margin: '5px', padding: '10px' }}
          >
            {cat}
          </button>
        ))}
      </div>
    )
  }
  
  export default CategorySelector
  
// src/components/interactive/FAQList.jsx
function FAQList({ onSelect }) {
  const faqs = [
    "출산 지원금 알려줘",
    "산모 건강관리 서비스 뭐 있어?",
    "어린이집 신청 방법 알려줘",
    "임신부 교통비 지원돼?"
  ];

  return (
    <div className="my-6">
      <div className="flex items-center justify-center mb-4">
        <div className="flex-grow h-px bg-gray-300"></div>
        <span className="px-4 text-sm text-gray-600">자주 묻는 질문 (FAQ)</span>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div>
  
      <div className="flex flex-wrap gap-3 justify-center">
        {faqs.map((q, i) => (
          <button
            key={i}
            onClick={() => {
              if (typeof onSelect === 'function') onSelect(q);
            }}
            className="bg-white px-3 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FAQList;
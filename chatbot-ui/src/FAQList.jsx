function FAQList({ onSelect }) {
    const faqs = [
      "출산 지원금 알려줘",
      "산모 건강관리 서비스 뭐 있어?",
      "어린이집 신청 방법 알려줘",
      "임신부 교통비 지원돼?"
    ]
  
    return (
      <div className="my-6">
        {/* 구분선 + 제목 */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-black-500"> FAQ </span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>
  
        {/* FAQ 버튼 목록 */}
        <div className="flex flex-wrap gap-3 justify-center">
          {faqs.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                if (typeof onSelect === 'function') onSelect(q)
              }}
              className="bg-white px-3 py-2 border rounded-full text-sm hover:bg-gray-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  export default FAQList
  
// frontend/src/components/interactive/FAQList.jsx (향상된 버전)
import { useState } from 'react';

function FAQList({ onSelect }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const faqs = [
    {
      text: "출산 지원금 알려줘",
      icon: "💰",
      category: "출산 지원"
    },
    {
      text: "산모 건강관리 서비스 뭐 있어?",
      icon: "🏥",
      category: "건강 관리"
    },
    {
      text: "어린이집 신청 방법 알려줘",
      icon: "🏫",
      category: "보육 시설"
    },
    {
      text: "임신부 교통비 지원돼?",
      icon: "🚌",
      category: "교통 지원"
    },
    {
      text: "육아휴직 급여 얼마나 받아?",
      icon: "👶",
      category: "육아 휴직"
    },
    {
      text: "다자녀 혜택 뭐가 있어?",
      icon: "👨‍👩‍👧‍👦",
      category: "다자녀 지원"
    }
  ];

  return (
    <div className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-3">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 w-12"></div>
          {/* "자주 묻는 질문" 텍스트와 아이콘 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">자주 묻는 질문</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 w-12"></div>

          {/* "열기/접기" 버튼을 아이콘 옆에 위치 */}
          <div
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors duration-200"
          >
            <span className="text-xs text-gray-400">
              {isOpen ? '접기' : '열기'}
            </span>
            <svg 
              className={`w-3 h-3 text-gray transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

        </div>
      </div>
          
      {/* FAQ 버튼들 */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {faqs.map((faq, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof onSelect === 'function') onSelect(faq.text);
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-gray-200 hover:border-pink-200 rounded-xl p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {/* 카테고리 태그 */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 group-hover:bg-pink-100 text-xs text-gray-600 group-hover:text-pink-700 rounded-full transition-colors">
                {faq.category}
              </span>
              
              {/* 호버 시 화살표 */}
              <div className={`transition-all duration-200 ${
                hoveredIndex === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-8px]'
              }`}>
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* 아이콘과 질문 텍스트 */}
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{faq.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium leading-relaxed">
                {faq.text}
              </span>
            </div>
            
            {/* 호버 효과 배경 */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </button>
        ))}
        </div>
      )}
      
      {/* 추가 질문 유도 텍스트 */}
      {isOpen && (
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            다른 궁금한 점이 있으시면 아래 채팅창에 직접 질문해보세요! 
            <span className="inline-block ml-1">💬</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default FAQList;
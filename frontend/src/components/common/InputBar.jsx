// frontend/src/components/common/InputBar.jsx (향상된 버전)
import { useState, useRef, useEffect } from 'react';

function InputBar({ onSend, isLoading }) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      // 전송 후 textarea 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-lg z-[50]">
      <div className="w-full max-w-4xl mx-auto px-4 py-2">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
            isFocused 
              ? 'border-pink-300 shadow-pink-100' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isLoading ? "아이뽓이 답변하는 중..." : "궁금한 육아 정책을 물어보세요... (Shift+Enter로 줄바꿈)"}
              disabled={isLoading}
              className="w-full p-3 pr-10 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500 min-h-[40px] max-h-[120px]"
              rows="1"
            />
            
            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 bottom-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              )}
            </button>
          </div>
          
          {/* 힌트 텍스트 */}
          <div className="flex items-center justify-between mt-1 px-2">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>💡 예시: "강남구 출산 지원금", "어린이집 보육료"</span>
            </div>
            <div className="text-xs text-gray-400">
              {input.length}/500
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputBar;
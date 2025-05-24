// frontend/src/components/chat/ChatBox.jsx (향상된 버전)
import React, { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '../common/LoadingIndicator';

function ChatBox({ messages, isLoading }) {
  const chatEndRef = useRef(null);
  const [expandedMessage, setExpandedMessage] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePolicyClick = (policy) => {
    if (policy.deviw_site_addr) {
      window.open(policy.deviw_site_addr, '_blank');
    }
  };

  const formatMessage = (text) => {
    // 정책 참조 섹션을 찾아서 하이퍼링크로 변환
    const policyReferenceRegex = /📋\s*\*\*참고\s*정책:\*\*\s*([\s\S]*?)(?=\n\n|\n$|$)/;
    const match = text.match(policyReferenceRegex);
    
    if (match) {
      const beforePolicy = text.substring(0, match.index);
      const policySection = match[1];
      const afterPolicy = text.substring(match.index + match[0].length);
      
      return (
        <div>
          <div className="whitespace-pre-line mb-4">{beforePolicy}</div>
          <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-gray-700">참고 정책</span>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-line">{policySection}</div>
          </div>
          {afterPolicy && <div className="whitespace-pre-line mt-4">{afterPolicy}</div>}
        </div>
      );
    }
    
    return <div className="whitespace-pre-line">{text}</div>;
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';
    const isError = msg.type === 'error';
    const isPolicyList = msg.type === 'policy-list';
    
    return (
      <div
        key={index}
        className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 아바타 */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            isUser 
              ? 'bg-gradient-to-br from-pink-400 to-purple-500' 
              : 'bg-gradient-to-br from-blue-400 to-cyan-500'
          }`}>
            {isUser ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-white text-lg">🤖</span>
            )}
          </div>

          {/* 메시지 콘텐츠 */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* 메시지 버블 */}
            <div
              className={`relative px-4 py-3 rounded-2xl shadow-md backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${
                isUser
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-pink-300'
                  : isError
                  ? 'bg-red-50/90 text-red-800 border-red-200'
                  : isPolicyList
                  ? 'bg-blue-50/90 text-blue-800 border-blue-200'
                  : 'bg-white/90 text-gray-800 border-gray-200'
              }`}
            >
              {/* 메시지 내용 */}
              <div className="text-sm leading-relaxed">
                {formatMessage(msg.text)}
              </div>

              {/* 개인화 및 신뢰도 표시 */}
              {!isUser && msg.personalized && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-green-600 font-medium">개인 맞춤</span>
                  </div>
                  
                  {msg.confidence_score && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-blue-600 font-medium">
                        신뢰도 {Math.round(msg.confidence_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 참고 정책 버튼들 */}
              {!isUser && msg.cited_policies && msg.cited_policies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">참고 정책 ({msg.cited_policies.length}개)</div>
                  <div className="flex flex-wrap gap-2">
                    {msg.cited_policies.slice(0, 3).map((policy, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePolicyClick(policy)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {policy.biz_nm && policy.biz_nm.length > 15 
                          ? `${policy.biz_nm.substring(0, 15)}...` 
                          : policy.biz_nm}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 말풍선 꼬리 */}
              <div
                className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                  isUser
                    ? 'right-[-6px] bg-gradient-to-br from-pink-500 to-purple-600'
                    : 'left-[-6px] bg-white border-l border-b border-gray-200'
                }`}
              />
            </div>

            {/* 타임스탬프 */}
            {msg.timestamp && (
              <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col mt-6 space-y-1 min-h-[400px] max-h-[600px] overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm">대화를 시작해보세요!</p>
            <p className="text-xs text-gray-400 mt-1">궁금한 육아 정책을 물어보세요.</p>
          </div>
        </div>
      ) : (
        messages.map((msg, i) => renderMessage(msg, i))
      )}

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-start mb-6">
          <div className="flex gap-3 max-w-[85%]">
            {/* 아바타 */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🤖</span>
            </div>
            
            {/* 타이핑 애니메이션 */}
            <div className="bg-white/90 px-4 py-3 rounded-2xl shadow-md border border-gray-200 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <LoadingIndicator size="sm" />
                <span className="text-sm text-gray-600">아이뽓이 답변을 생각하고 있어요...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatBox;
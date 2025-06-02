// frontend/src/components/chat/ChatBox.jsx (정책 링크 연결 버전)
import React, { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '../common/LoadingIndicator';

function ChatBox({ messages, isLoading, onPolicyClick }) {
  const chatEndRef = useRef(null);
  const [expandedMessage, setExpandedMessage] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePolicyClick = (policy) => {
    // 1순위: 정책 상세 모달 열기 (onPolicyClick이 있는 경우)
    if (onPolicyClick && policy.id) {
      onPolicyClick(policy.id);
      return;
    }
    
    // 2순위: 외부 링크 열기
    if (policy.deviw_site_addr) {
      window.open(policy.deviw_site_addr, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 3순위: 신청하기 링크 열기
    if (policy.aply_site_addr) {
      window.open(policy.aply_site_addr, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 마지막: 정책 ID만 있는 경우 알림
    alert(`정책 상세 정보: ${policy.biz_nm || '정책명 없음'} (ID: ${policy.id || 'N/A'})`);
  };

  const formatMessage = (text = '') => {
    // 참고 정책 텍스트 패턴 (📋 **참고 정책:** 부터 다음 빈 줄 또는 문장 끝까지)
    const policyReferenceRegex = /📋\s*\*\*참고\s*정책:\*\*\s*([\s\S]*?)(?=\n\n|\n$|$)/;

    // 텍스트에서 참고 정책 부분 삭제
    const newText = text.replace(policyReferenceRegex, '');

    // 나머지 텍스트를 줄바꿈 유지하여 렌더링
    return <div className="whitespace-pre-line">{newText.trim()}</div>;
  };

  const getMessageTypeStyle = (msg) => {
    if (msg.sender === 'user') {
      return 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-pink-300';
    }
    
    switch (msg.type) {
      case 'error':
        return 'bg-red-50/90 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-50/90 text-amber-800 border-amber-200';
      case 'policy-list':
        return 'bg-blue-50/90 text-blue-800 border-blue-200';
      case 'personalized':
        return 'bg-green-50/90 text-green-800 border-green-200';
      case 'guide':
        return 'bg-purple-50/90 text-purple-800 border-purple-200';
      default:
        return 'bg-white/90 text-gray-800 border-gray-200';
    }
  };

  const renderMessage = (msg, index) => {
  const isUser = msg.sender === 'user';

  return (
    <div key={index} className={`flex mb-6 flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 아바타 */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
          isUser 
            ? 'bg-gradient-to-br from-pink-400 to-purple-500' 
            : msg.type === 'personalized'
            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
            : msg.type === 'error' || msg.type === 'warning'
            ? 'bg-gradient-to-br from-red-400 to-orange-500'
            : 'bg-gradient-to-br from-blue-400 to-cyan-500'
        }`}>
          {/* 아이콘 */}
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : msg.type === 'personalized' ? (
            <span className="text-white text-lg">🎯</span>
          ) : msg.type === 'error' ? (
            <span className="text-white text-lg">⚠️</span>
          ) : msg.type === 'warning' ? (
            <span className="text-white text-lg">💡</span>
          ) : (
            <span className="text-white text-lg">🤖</span>
          )}
        </div>

        {/* 메시지 콘텐츠 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 메시지 버블 */}
          <div
            className={`relative px-4 py-3 rounded-2xl shadow-md backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${getMessageTypeStyle(msg)}`}
          >
            {/* 메시지 내용 */}
            <div className="text-sm leading-relaxed">
              {formatMessage(msg.text)}
            </div>

            {/* 개인화 및 신뢰도 표시 */}
            {!isUser && (msg.personalized || msg.confidence_score) && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-current border-opacity-20">
                {msg.personalized && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">개인 맞춤</span>
                  </div>
                )}

                {msg.confidence_score && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">
                      신뢰도 {Math.round(msg.confidence_score * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 말풍선 꼬리 */}
            <div
              className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                isUser
                  ? 'right-[-6px] bg-gradient-to-br from-pink-500 to-purple-600'
                  : `left-[-6px] ${getMessageTypeStyle(msg).split(' ')[0]} border-l border-b border-opacity-20`
              }`}
            />
          </div>

          {/* 타임스탬프 */}
          {msg.timestamp && (
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {msg.timestamp}
            </div>
          )}

          {/* 참고 정책 카드 */}
          {!isUser && msg.cited_policies && msg.cited_policies.length > 0 && (
            <div className="mt-3 flex overflow-x-auto gap-4 max-w">
              {msg.cited_policies.slice(0, 3).map((policy, i) => (
                <div
                  key={i}
                  onClick={() => handlePolicyClick(policy)}
                  className="flex-shrink-0 w-60 min-h-[120px] cursor-pointer rounded-lg border-l-4 border-blue-400 bg-gray-50 p-3 shadow hover:shadow-lg transition flex flex-col"
                  title={`${policy.biz_nm} 상세보기`}
                >
                  <div className="font-semibold text-gray-900 whitespace-normal break-words">
                    {policy.biz_nm || `정책 ${policy.id}`}
                  </div>
                  <div className="mt-auto inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded border border-blue-300 self-start">
                    {policy.application_period || '상시'}
                  </div>
                </div>
              ))}
              {msg.cited_policies.length > 3 && (
                <div className="flex-shrink-0 w-20 h-32 flex items-center justify-center text-xs text-gray-500 select-none">
                  +{msg.cited_policies.length - 3}개 더
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

          
            
             

  return (
    <div className="flex flex-col mt-6 space-y-1 min-h-[400px] max-h-[600px] overflow-y-auto pb-20">
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
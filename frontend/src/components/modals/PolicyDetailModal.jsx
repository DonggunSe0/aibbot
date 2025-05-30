import React from 'react';

const PolicyDetailModal = ({ isOpen, onClose, policy, isLoading, error }) => {
  if (!isOpen) return null;

  const renderDetailRow = (label, value) => (
    <div className="flex text-sm py-2 border-b border-gray-200">
      <dt className="w-24 font-bold text-black shrink-0">{label}</dt>
      <dd className="text-gray-600 whitespace-pre-wrap">{value || '-'}</dd>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden">
          
          {/* Top Bar */}
          <div className="bg-[#FFCCE1] flex items-center justify-center relative px-4 py-3 rounded-t-lg">
            <h3 className="text-base font-bold text-gray-900 text-center w-full">
              {policy?.biz_nm || '정책 정보'}
            </h3>
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E195AB] hover:text-gray-800"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 overflow-y-auto">
            {isLoading && <p className="text-center text-gray-700">불러오는 중...</p>}
            {error && <p className="text-center text-red-600">오류: {error}</p>}
            {!isLoading && !error && policy && (
              <>
                {/* 정책 요약 */}
                <p className="text-sm text-gray-500 font-medium mb-2 border-b-2 border-pink-300 pb-1">
                  ✔ 한 눈에 보는 정책 요약
                </p>

                {renderDetailRow('정책 번호', policy?.id)}
                {renderDetailRow('정책 분야', policy?.policy_field)}
                {renderDetailRow('정책 설명', policy?.biz_cn)}
                {renderDetailRow('지원 내용', policy?.utztn_trpr_cn)}
                {renderDetailRow('신청 기간', policy?.application_period || '상시')}

                {/* 신청자격 및 추가정보 */}
                <p className="text-sm font-bold text-gray-800 mt-4 mb-2 border-b-2 border-pink-300 pb-1">
                  ✅ 신청자격 및 추가정보
                </p>
                {renderDetailRow('연령', policy?.trgt_child_age)}
                {renderDetailRow('이용 방법', policy?.utztn_mthd_cn)}
                {renderDetailRow('운영 시간', policy?.oper_hr_cn)}
                {renderDetailRow('문의처', policy?.aref_cn)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      {policy?.deviw_site_addr && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50">
          <a
            href={policy.deviw_site_addr}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white text-sm px-5 py-2 rounded-full shadow-md hover:bg-blue-700 transition"
          >
            자세히 보기
          </a>
        </div>
      )}
    </>
  );
};

export default PolicyDetailModal;

import React from 'react';

const PolicyDetailModal = ({ isOpen, onClose, policy, isLoading, error }) => {
  if (!isOpen) return null;

  const renderDetailItem = (label, value) => {
    if (value === null || value === undefined || value === '') {
      // 값이 없거나, null, undefined, 빈 문자열인 경우 "-"로 표시
      // 또는 해당 항목을 아예 렌더링하지 않을 수도 있음
      return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-600">{label}</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">-</dd>
        </div>
      );
    }
    // 링크인 경우 처리 (예: deviw_site_addr, aply_site_addr)
    if ((label === '자세히 보기' || label === '신청하기') && typeof value === 'string' && value.startsWith('http')) {
      return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-600">{label}</dt>
          <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              링크 바로가기
            </a>
          </dd>
        </div>
      );
    }
    // 일반 텍스트 처리 (줄바꿈 유지)
    return (
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{value}</dd>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto my-8 transform transition-all">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            정책 정보
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading && <p className="text-center text-gray-700">상세 정보를 불러오는 중...</p>}
          {error && <p className="text-center text-red-600">오류: {error}</p>}
          {policy && !isLoading && !error && (
            <dl className="divide-y divide-gray-200">
              {renderDetailItem('정책명', policy.biz_nm)}
              {renderDetailItem('정책 번호', policy.id)} {/* 사용자가 보여준 이미지의 '정책 번호' 형식과는 다름 */}
              {renderDetailItem('정책 분야', policy.policy_field)} {/* App.jsx에서 조합된 필드 */}
              {renderDetailItem('정책 설명', policy.biz_cn)}
              {renderDetailItem('지원 내용', policy.utztn_trpr_cn)} 
              {/* 신청 기간은 현재 백엔드에서 제공하지 않으므로 주석 처리 또는 "-" 표시 */}
              {renderDetailItem('신청 기간', '-')} {/* 또는 policy.application_period 등으로 DB에 추가 후 사용 */}
              
              <div className="py-3">
                <h4 className="text-md font-semibold text-gray-800 mb-2 border-t pt-3">신청자격 및 추가정보</h4>
              </div>
              {renderDetailItem('연령', policy.trgt_child_age)}
              {renderDetailItem('이용 방법', policy.utztn_mthd_cn)}
              {renderDetailItem('운영 시간', policy.oper_hr_cn)}
              {renderDetailItem('문의처', policy.aref_cn)}
              {renderDetailItem('자세히 보기', policy.deviw_site_addr)}
              {renderDetailItem('신청하기', policy.aply_site_addr)}
              {/* 필요시 추가 필드 렌더링 */}
              {/* {renderDetailItem('데이터 생성일', policy.created_at)} */}
              {/* {renderDetailItem('데이터 수정일', policy.updated_at)} */}
            </dl>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 text-right border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailModal; 
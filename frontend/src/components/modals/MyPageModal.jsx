// src/components/modals/MyPageModal.jsx
import { useState, useEffect } from 'react';

function MyPageModal({ onClose }) {
  const [region, setRegion] = useState('');
  const [hasChild, setHasChild] = useState('무');
  const [asset, setAsset] = useState('');
  const [children, setChildren] = useState([{ gender: '', birthdate: '' }]);
  const [income, setIncome] = useState('');
  const [familyType, setFamilyType] = useState('');
  const [hasDisability, setHasDisability] = useState('');
  const [isPregnant, setIsPregnant] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [housingType, setHousingType] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);



  const regions = [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구',
    '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구',
    '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구',
    '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  const assetRanges = [
    '1억 미만', '1~2억', '2~3억', '3~5억', '5억 이상'
  ];
  const incomeLevels = ['중위소득 50% 이하', '중위소득 100% 이하', '중위소득 150% 이하', '중위소득 초과'];
  const familyTypes = ['일반가구', '한부모가구', '다자녀가구', '다문화가구'];
  const jobStatuses = ['재직', '구직', '무직', '자영업'];
  const housingTypes = ['자가', '전세', '월세', '공공임대'];



  useEffect(() => {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      const data = JSON.parse(saved);
      setRegion(data.region || '');
      setHasChild(data.hasChild || '무');
      setAsset(data.asset || '');
      setChildren(data.children?.length ? data.children : [{ gender: '', birthdate: '' }]);
      setIncome(data.income || '');
      setFamilyType(data.familyType || '');
      setHasDisability(data.hasDisability || '');
      setIsPregnant(data.isPregnant || '');
      setJobStatus(data.jobStatus || '');
      setHousingType(data.housingType || '');

    }
  }, []);

  useEffect(() => {
    if (hasChild === '무') {
      setChildren([{ gender: '', birthdate: '' }]);
    }
  }, [hasChild]);

  const handleChildChange = (index, field, value) => {
    const updatedChildren = [...children];
    updatedChildren[index][field] = value;
    setChildren(updatedChildren);
  };

  const addChildField = () => {
    setChildren([...children, { gender: '', birthdate: '' }]);
  };

  const removeChildField = (index) => {
    if (children.length > 1) {
        const updatedChildren = children.filter((_, i) => i !== index);
        setChildren(updatedChildren);
    } else {
        setChildren([{ gender: '', birthdate: '' }]);
    }
  };


  const handleSave = () => {
    const userInfo = {
      region,
      hasChild,
      asset,
      income,
      familyType,
      children: hasChild === '유' ? children.filter(c => c.birthdate || c.gender) : [],
      hasDisability,
      isPregnant,
      jobStatus,
      housingType,
      children: hasChild === '유' ? children.filter(c => c.birthdate || c.gender) : [],
    };
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    let alertMessage = `저장된 정보:
    지역: ${region || '선택 안 함'}
    자녀 유무: ${hasChild}
    `;

    if (hasChild === '유' && userInfo.children.length > 0) {
      alertMessage += "자녀 정보:\n";
      userInfo.children.forEach((c, i) => {
        alertMessage += `  자녀${i + 1}: ${c.gender || '성별 미선택'}, ${c.birthdate || '생일 미입력'}\n`;
      });
    }

    if (!agreePrivacy) {
      alert("개인정보 제공에 동의해 주세요.");
      return;
    }

    alertMessage += `자산: ${asset || '선택 안 함'}\n`;
    alertMessage += `소득 수준: ${income || '선택 안 함'}\n`;
    alertMessage += `가구 유형: ${familyType || '선택 안 함'}\n`;
    alertMessage += `장애 여부: ${hasDisability || '선택 안 함'}\n`;
    alertMessage += `임신 여부: ${isPregnant || '선택 안 함'}\n`;
    alertMessage += `직업 상태: ${jobStatus || '선택 안 함'}\n`;
    alertMessage += `주거 형태: ${housingType || '선택 안 함'}`;

    alert(alertMessage);
    onClose();
};

  return (
    

    <div className="fixed inset-0 flex justify-center items-center z-[100] bg-black bg-opacity-30 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-lg">
        <div className="bg-main-pink text-white w-full text-center rounded-t-xl">
          <h3 className="text-xl font-bold py-3">내 정보 등록/수정</h3>
        </div>

        <div className="bg-white p-6">
        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-main-pink focus:border-main-pink"
          >
            <option value="">선택하세요</option>
            {regions.map((gu) => (
              <option key={gu} value={gu}>{gu}</option>
            ))}
          </select>
        </div>
    
        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">자녀 유무</label>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            {['유', '무'].map((value) => (
              <label key={value} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="hasChild"
                  value={value}
                  checked={hasChild === value}
                  onChange={(e) => setHasChild(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        {hasChild === '유' && (
          <div className="mb-5 p-4 border border-gray-200 rounded-md bg-gray-50">
            <label className="block mb-3 font-medium text-gray-700">자녀 정보</label>
            {children.map((child, index) => (
              <div key={index} className="relative mb-4 p-3 border border-gray-300 rounded-md">
                 {children.length > 0 && (
                    <button
                        type="button"
                        onClick={() => removeChildField(index)}
                        className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-700 p-1"
                        title="이 자녀 정보 삭제"
                    >
                        삭제
                    </button>
                 )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">성별</label>
                    <div className="flex gap-x-4 gap-y-1 flex-wrap">
                      {['남', '여'].map((gender) => (
                        <label key={gender} className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            value={gender}
                            checked={child.gender === gender}
                            onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                            className="mr-1.5 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                          />
                          {gender}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">생년월일</label>
                    <input
                      type="date"
                      value={child.birthdate}
                      onChange={(e) => handleChildChange(index, 'birthdate', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-main-pink focus:border-main-pink"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={addChildField}
                className="text-sm text-main-pink border border-main-pink bg-white px-3 py-1.5 rounded-md hover:bg-pink-50 transition-colors"
              >
                + 자녀 추가
              </button>
            </div>
          </div>
        )}

        <div className="mb-5">  
          <label className="block mb-1.5 font-medium text-gray-700">임신 여부</label>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            {['임신 중', '임신 준비 중', '해당없음'].map((value) => (
              <label key={value} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isPregnant"
                  value={value}
                  checked={isPregnant === value}
                  onChange={(e) => setIsPregnant(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5">  
          <label className="block mb-1.5 font-medium text-gray-700">가구 유형</label>
          <select
            value={familyType}
            onChange={(e) => setFamilyType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-main-pink focus:border-main-pink"
          >
            <option value="">선택하세요</option>
            {familyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">소득 수준</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {incomeLevels.map((level) => (
              <label key={level} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="income"
                  value={level}
                  checked={income === level}
                  onChange={(e) => setIncome(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">  
          <label className="block mb-1.5 font-medium text-gray-700">자산</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {assetRanges.map((range) => (
              <label key={range} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="asset"
                  value={range}
                  checked={asset === range}
                  onChange={(e) => setAsset(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {range}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">직업 상태</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {jobStatuses.map((status) => (
              <label key={status} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="jobStatus"
                  value={status}
                  checked={jobStatus === status}
                  onChange={(e) => setJobStatus(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {status}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">주거 형태</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {housingTypes.map((type) => (
              <label key={type} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="housingType"
                  value={type}
                  checked={housingType === type}
                  onChange={(e) => setHousingType(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5"> 
          <label className="block mb-1.5 font-medium text-gray-700">장애 여부</label>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            {['있음', '없음'].map((value) => (
              <label key={value} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="hasDisability"
                  value={value}
                  checked={hasDisability === value}
                  onChange={(e) => setHasDisability(e.target.value)}
                  className="mr-2 h-4 w-4 text-main-pink focus:ring-pink-300 border-gray-300"
                />
                {value}
              </label>
            ))} 
          </div>
        </div>

        <div className="mb-6">
          <label className="inline-flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 text-main-pink border-gray-300"
            />
            <span className="text-sm text-gray-700 leading-snug">
              입력한 정보는 정책 추천에 활용되며, 이에 동의합니다. <br />
              <a
                href="https://www.privacy.go.kr" // 또는 실제 개인정보처리방침 URL
                target="_blank"
                rel="noopener noreferrer"
                className="text-main-pink underline hover:text-pink-600"
              >
                개인정보처리방침 보기
              </a>
            </span>
          </label>
        </div>



        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-main-pink text-white rounded-md hover:bg-pink-300 transition-colors"
          >
            저장
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default MyPageModal;
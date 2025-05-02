import { useState, useEffect } from 'react'

function MyPageModal({ onClose }) {
  const [region, setRegion] = useState('')
  const [hasChild, setHasChild] = useState('무')
  const [asset, setAsset] = useState('')
  const [children, setChildren] = useState([{ gender: '', birthdate: '' }])

  const regions = [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구',
    '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구',
    '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구',
    '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ]

  const assetRanges = [
    '1억 미만',
    '1~2억',
    '2~3억',
    '3~5억',
    '5억 이상'
  ]

  // 자녀 유무가 '무'로 바뀌면 자녀 입력 초기화
  useEffect(() => {
    const saved = localStorage.getItem('userInfo')
    if (saved) {
      const data = JSON.parse(saved)
      setRegion(data.region || '')
      setHasChild(data.hasChild || '무')
      setAsset(data.asset || '')
      setChildren(data.children?.length ? data.children : [{ gender: '', birthdate: '' }])
    }
  }, [])
  

  const handleSave = () => {
    const childInfo = hasChild === '유'
      ? children.map((c, i) => `자녀${i + 1}: ${c.gender}, ${c.birthdate}`).join('\n')
      : '없음'
    
      const userInfo = {
        region,
        hasChild,
        asset,
        children,
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

    alert(`지역: ${region}
자녀 유무: ${hasChild}
${hasChild === '유' ? childInfo : ''}
자산: ${asset}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-20">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">내 정보 등록/수정</h3>

        {/* 지역 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">선택하세요</option>
            {regions.map((gu) => (
              <option key={gu} value={gu}>{gu}</option>
            ))}
          </select>
        </div>

        {/* 자녀 유무 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">자녀 유무</label>
          <div className="flex gap-6">
            {['유', '무'].map((value) => (
              <label key={value} className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasChild"
                  value={value}
                  checked={hasChild === value}
                  onChange={(e) => setHasChild(e.target.value)}
                  className="mr-2"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        {/* 자녀 정보 필드들 */}
        {hasChild === '유' && (
          <>
            {children.map((child, index) => (
  <div key={index} className="flex flex-col gap-1 mb-3">
    <div className="flex items-center gap-4">
      {/* 성별 */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">성별</label>
        <div className="flex gap-4">
          {['남', '여'].map((gender) => (
            <label key={gender} className="inline-flex items-center">
              <input
                type="radio"
                name={`gender-${index}`}
                value={gender}
                checked={child.gender === gender}
                onChange={(e) => {
                  const updated = [...children]
                  updated[index].gender = e.target.value
                  setChildren(updated)
                }}
                className="mr-1"
              />
              {gender}
            </label>
          ))}
        </div>
      </div>


      {/* 생년월일 */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600">생년월일</label>
        <input
          type="date"
          value={child.birthdate}
          onChange={(e) => {
            const updated = [...children]
            updated[index].birthdate = e.target.value
            setChildren(updated)
          }}
          className="border border-gray-300 rounded-md px-3 py-1"
        />
      </div>

      {/* 삭제 버튼 */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={() => {
            const updated = [...children]
            updated.splice(index, 1)
            setChildren(updated)
          }}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          ❌
        </button>
      </div>
    </div>
  </div>
))}


            {/* 자녀 추가 버튼 */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() =>
                  setChildren([...children, { gender: '', birthdate: '' }])
                }
                className="text-sm text-main-pink border border-main-pink px-2 py-1 rounded hover:bg-pink-50"
              >
                + 자녀 추가
              </button>
            </div>
          </>
        )}

        {/* 자산 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">자산</label>
          <div className="flex flex-wrap gap-4">
            {assetRanges.map((range) => (
              <label key={range} className="inline-flex items-center">
                <input
                  type="radio"
                  name="asset"
                  value={range}
                  checked={asset === range}
                  onChange={(e) => setAsset(e.target.value)}
                  className="mr-2"
                />
                {range}
              </label>
            ))}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-main-pink text-white rounded-md hover:bg-pink-300"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyPageModal

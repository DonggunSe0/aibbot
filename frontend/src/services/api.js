// src/services/api.js
import axios from 'axios';

const API_BASE_URL = '/api'; // Vite 프록시를 사용

// 기존 채팅 API 호출 함수 (예시, 실제 사용하고 있는 함수로 대체하거나 참고)
export const sendMessageToChat = async (messageText) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: messageText,
    });
    return response.data; // { answer: "..." }
  } catch (error) {
    console.error("API 요청 중 오류 발생 (chat):", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('채팅 API 요청 중 서버 오류가 발생했습니다.');
  }
};

// DB 테스트용 API 호출 함수
export const fetchTestDataFromDB = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/test-db`);
    return response.data; // 기대 형식: { success: true, data: [...], message: "..." } 또는 { success: false, message: "..." }
  } catch (error) {
    console.error("API 요청 중 오류 발생 (test-db):", error.response ? error.response.data : error.message);
    // 오류 객체에 response가 있고, 그 안에 data.message가 있다면 그것을 사용, 아니면 일반 오류 메시지
    const errorMessage = error.response?.data?.message || error.message || 'DB 테스트 데이터 요청 중 알 수 없는 서버 오류가 발생했습니다.';
    throw new Error(errorMessage); // 일관된 오류 처리를 위해 Error 객체로 throw
  }
};
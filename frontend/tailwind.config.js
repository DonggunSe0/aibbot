/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Tailwind CSS를 적용할 파일 경로
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'], // 'Pretendard' 폰트가 시스템에 설치되어 있거나 웹폰트로 로드되어야 합니다.
      },
      colors: {
        'main-pink': '#FFCCE1',
        'main-yellow': '#FFF5D7',
      },
    },
  },
  plugins: [],
}
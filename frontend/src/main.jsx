import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // 전역 CSS 파일 임포트

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
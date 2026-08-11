import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Vercel Analytics 불러오기 (React/Vite 전용 경로)
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* 분석용 태그 추가 */}
    <Analytics />
  </StrictMode>
);

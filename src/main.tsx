import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';

// Performance Metrics Observer (Web Vitals)
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const logMetric = (metric: any) => {
    console.log(`[Performance Metric] ${metric.name}:`, metric.value);
  };
  
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => logMetric({ name: entry.name, value: entry.startTime || entry.duration }));
    });
    observer.observe({ type: 'first-input', buffered: true });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('PerformanceObserver not fully supported in this environment');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

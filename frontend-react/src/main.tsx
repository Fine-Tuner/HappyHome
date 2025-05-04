import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 무시
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

// MSW 초기화 후 앱 렌더링
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
});

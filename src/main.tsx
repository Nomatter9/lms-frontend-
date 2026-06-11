import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" closeButton />
      <App />
    </QueryClientProvider>
  </StrictMode>
);
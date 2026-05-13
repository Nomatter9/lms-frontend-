import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {Toaster} from 'sonner';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <Toaster richColors position="top-right" closeButton />
    <App />
  </StrictMode>
);
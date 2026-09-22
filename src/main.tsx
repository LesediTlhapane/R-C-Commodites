import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RouterProvider } from './lib/router.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </RouterProvider>
  </StrictMode>,
);

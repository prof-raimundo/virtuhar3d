import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { VirtuharApp } from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(rootElement).render(
  <StrictMode>
    <VirtuharApp />
  </StrictMode>,
);

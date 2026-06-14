import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root puuttuu index.html:stä');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

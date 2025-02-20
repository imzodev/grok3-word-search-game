import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
import { Analytics } from "@vercel/analytics/react"

root.render(
  <React.StrictMode>
    <Analytics />
    <App />
  </React.StrictMode>
);
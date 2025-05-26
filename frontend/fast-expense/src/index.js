import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // 👈 importa el provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider> {/* 👈 envuelve App aquí */}
      <App />
    </AuthProvider>
  </BrowserRouter>
);

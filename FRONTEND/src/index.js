import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppJSONplacehold from './placeholder/apps_jsonplacehold.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/datauser" element={<App />} />
        <Route path="/testing" element={<AppJSONplacehold />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
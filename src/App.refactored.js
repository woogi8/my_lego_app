import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LegoProvider } from './context/LegoContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import ListPage from './pages/ListPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ImportExportPage from './pages/ImportExportPage';
import './App.css';

function App() {
  return (
    <LegoProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Navigate to="/app/list" replace />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="list" element={<ListPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="import-export" element={<ImportExportPage />} />
          </Route>
        </Routes>
      </Router>
    </LegoProvider>
  );
}

export default App;
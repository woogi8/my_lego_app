import React, { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1>레고 관리 시스템</h1>
        </header>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
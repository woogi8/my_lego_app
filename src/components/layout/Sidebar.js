import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const menuItems = [
    { path: '/app/list', label: '레고 목록', icon: '📋' },
    { path: '/app/register', label: '레고 등록', icon: '➕' },
    { path: '/app/analytics', label: '분석', icon: '📊' },
    { path: '/app/import-export', label: '가져오기/내보내기', icon: '📂' },
  ];

  return (
    <div className={`sidebar ${isOpen ? '' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <h2>{isOpen ? '레고 관리' : 'L'}</h2>
        <button className="sidebar-toggle" onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {isOpen && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
import React from 'react';
import { useLegoContext } from '../../context/LegoContext';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const { legoList } = useLegoContext();

  return (
    <header className="header">
      <button className="header-menu-btn" onClick={onMenuClick}>
        ☰
      </button>
      <div className="header-content">
        <h1>레고 관리 시스템</h1>
        <div className="header-stats">
          <span>총 {legoList.length}개 레고</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
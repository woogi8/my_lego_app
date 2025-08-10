import React from 'react';
import './MainScreen.css';

const MainScreen = ({ onEnter }) => {
  return (
    <div className="main-screen">
      <div className="main-content">
        <div className="main-image-container">
          <img 
            src="https://images.brickset.com/sets/images/6036-1.jpg" 
            alt="레고 메인 이미지" 
            className="main-image"
          />
        </div>
        <div className="main-title">
          <h1>레고 관리 시스템</h1>
          <p>나만의 레고 컬렉션을 관리해보세요</p>
        </div>
        <button className="enter-button" onClick={onEnter}>
          들어가기
        </button>
      </div>
    </div>
  );
};

export default MainScreen;
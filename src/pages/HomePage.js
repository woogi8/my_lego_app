import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/app');
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-image-container">
          <img 
            src="https://images.brickset.com/sets/images/6036-1.jpg" 
            alt="레고 메인 이미지" 
            className="home-image"
          />
        </div>
        <div className="home-title">
          <h1>레고 관리 시스템</h1>
          <p>나만의 레고 컬렉션을 관리해보세요</p>
        </div>
        <button className="enter-button" onClick={handleEnter}>
          들어가기
        </button>
      </div>
    </div>
  );
};

export default HomePage;
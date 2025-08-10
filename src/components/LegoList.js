import React from 'react';
import './LegoList.css';

const LegoList = () => {
  return (
    <div className="lego-list">
      <h2>레고 목록</h2>
      <div className="empty-state">
        <p>아직 등록된 레고가 없습니다.</p>
        <p>레고를 등록해보세요!</p>
      </div>
    </div>
  );
};

export default LegoList;
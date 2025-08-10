import React, { useState, useEffect } from 'react';
import { useLegoContext } from '../context/LegoContext';
import { calculateProfitRate, formatCurrency, filterAndSortLegos, getUniqueThemes } from '../utils/legoUtils';
import LegoForm from '../components/forms/LegoForm';
import './ListPage.css';

const ListPage = () => {
  const { legoList, deleteLego, updateLego } = useLegoContext();
  const [filteredList, setFilteredList] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [sortBy, setSortBy] = useState('none');
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = filterAndSortLegos(legoList, selectedTheme, sortBy);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lego => 
        lego['제품명']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lego['레고 번호']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lego['테마']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredList(filtered);
  }, [legoList, selectedTheme, sortBy, searchTerm]);

  const handleDelete = async (index) => {
    if (window.confirm('정말로 이 레고를 삭제하시겠습니까?')) {
      try {
        await deleteLego(index);
        alert('레고가 삭제되었습니다.');
      } catch (error) {
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleEditSubmit = async (formData) => {
    try {
      const updatedData = {
        '출시일': formData.releaseDate,
        '레고 번호': formData.legoNumber,
        '제품명': formData.productName,
        '테마': formData.theme,
        '구입일': formData.purchaseDate,
        '정가 (원)': formData.retailPrice,
        '구입 가격 (원)': formData.purchasePrice,
        '현재 시세 (원)': formData.currentPrice,
        '상태': formData.status,
        '이미지 URL': formData.imageUrl
      };
      
      await updateLego(editingIndex, updatedData);
      setEditingIndex(null);
      alert('레고가 수정되었습니다.');
    } catch (error) {
      alert(`수정 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  const themes = getUniqueThemes(legoList);

  if (editingIndex !== null) {
    const legoToEdit = legoList[editingIndex];
    return (
      <div className="list-page">
        <LegoForm 
          initialData={{ ...legoToEdit, index: editingIndex }}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
        />
      </div>
    );
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>레고 목록</h2>
        <div className="list-controls">
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={selectedTheme} 
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="theme-select"
          >
            {themes.map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="none">정렬 없음</option>
            <option value="name-asc">이름순</option>
            <option value="profit-desc">수익률 높은순</option>
            <option value="profit-asc">수익률 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="price-asc">가격 낮은순</option>
          </select>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-state">
          <p>등록된 레고가 없습니다.</p>
          <p>레고를 등록해보세요!</p>
        </div>
      ) : (
        <div className="lego-grid">
          {filteredList.map((lego, index) => {
            const profitRate = calculateProfitRate(lego);
            const originalIndex = legoList.indexOf(lego);
            
            return (
              <div key={originalIndex} className="lego-card">
                <div className="lego-card-image">
                  {lego['이미지 URL'] && (
                    <img 
                      src={lego['이미지 URL']} 
                      alt={lego['제품명']}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="lego-card-content">
                  <h3>{lego['제품명']}</h3>
                  <p className="lego-number">#{lego['레고 번호']}</p>
                  <p className="lego-theme">{lego['테마']}</p>
                  <div className="lego-prices">
                    <div className="price-item">
                      <span className="price-label">구입가:</span>
                      <span className="price-value">{formatCurrency(lego['구입 가격 (원)'])}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">현재가:</span>
                      <span className="price-value">{formatCurrency(lego['현재 시세 (원)'])}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">수익률:</span>
                      <span className={`price-value ${profitRate >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                        {profitRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="lego-status">
                    <span className="status-badge">{lego['상태'] || '미지정'}</span>
                  </div>
                  <div className="lego-actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => handleEdit(originalIndex)}
                    >
                      수정
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(originalIndex)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListPage;
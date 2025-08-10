import React, { useState, useEffect } from 'react';
import { useLegoContext } from '../../context/LegoContext';
import { generateImageUrl } from '../../utils/legoUtils';
import './LegoForm.css';

const LegoForm = ({ initialData = null, onSubmit, onCancel }) => {
  const { addLego, updateLego } = useLegoContext();
  const isEditMode = initialData !== null;

  const [formData, setFormData] = useState({
    releaseDate: '',
    legoNumber: '',
    productName: '',
    theme: '',
    purchaseDate: '',
    retailPrice: '',
    purchasePrice: '',
    currentPrice: '',
    status: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        releaseDate: initialData['출시일'] || '',
        legoNumber: initialData['레고 번호'] || '',
        productName: initialData['제품명'] || '',
        theme: initialData['테마'] || '',
        purchaseDate: initialData['구입일'] || '',
        retailPrice: initialData['정가 (원)'] || '',
        purchasePrice: initialData['구입 가격 (원)'] || '',
        currentPrice: initialData['현재 시세 (원)'] || '',
        status: initialData['상태'] || '',
        imageUrl: initialData['이미지 URL'] || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'legoNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        imageUrl: generateImageUrl(value) || prev.imageUrl
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await updateLego(initialData.index, formData);
      } else {
        await addLego(formData);
      }
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // Reset form if not in edit mode
      if (!isEditMode) {
        setFormData({
          releaseDate: '',
          legoNumber: '',
          productName: '',
          theme: '',
          purchaseDate: '',
          retailPrice: '',
          purchasePrice: '',
          currentPrice: '',
          status: '',
          imageUrl: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`오류가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <form className="lego-form" onSubmit={handleSubmit}>
      <h2>{isEditMode ? '레고 수정' : '레고 등록'}</h2>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="legoNumber">레고 번호 *</label>
          <input
            type="text"
            id="legoNumber"
            name="legoNumber"
            value={formData.legoNumber}
            onChange={handleInputChange}
            required
            placeholder="예: 10280"
          />
        </div>

        <div className="form-group">
          <label htmlFor="productName">제품명 *</label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            required
            placeholder="예: Flower Bouquet"
          />
        </div>

        <div className="form-group">
          <label htmlFor="theme">테마</label>
          <input
            type="text"
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleInputChange}
            placeholder="예: Creator Expert"
          />
        </div>

        <div className="form-group">
          <label htmlFor="releaseDate">출시일</label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            value={formData.releaseDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="purchaseDate">구입일</label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="retailPrice">정가 (원)</label>
          <input
            type="number"
            id="retailPrice"
            name="retailPrice"
            value={formData.retailPrice}
            onChange={handleInputChange}
            placeholder="예: 69900"
          />
        </div>

        <div className="form-group">
          <label htmlFor="purchasePrice">구입 가격 (원)</label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleInputChange}
            placeholder="예: 55000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="currentPrice">현재 시세 (원)</label>
          <input
            type="number"
            id="currentPrice"
            name="currentPrice"
            value={formData.currentPrice}
            onChange={handleInputChange}
            placeholder="예: 85000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">상태</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="">선택하세요</option>
            <option value="미개봉">미개봉</option>
            <option value="개봉">개봉</option>
            <option value="조립완료">조립완료</option>
            <option value="전시중">전시중</option>
            <option value="보관중">보관중</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="imageUrl">이미지 URL</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="자동으로 생성됩니다"
          />
        </div>
      </div>

      {formData.imageUrl && (
        <div className="image-preview">
          <img 
            src={formData.imageUrl} 
            alt={formData.productName || '레고 이미지'}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditMode ? '수정하기' : '등록하기'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
};

export default LegoForm;
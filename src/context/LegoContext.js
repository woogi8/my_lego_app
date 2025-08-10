import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import legoApi from '../api/legoApi';

const LegoContext = createContext();

export const useLegoContext = () => {
  const context = useContext(LegoContext);
  if (!context) {
    throw new Error('useLegoContext must be used within LegoProvider');
  }
  return context;
};

export const LegoProvider = ({ children }) => {
  const [legoList, setLegoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [sortBy, setSortBy] = useState('none');

  const loadLegoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.getAllLegos();
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error loading LEGO data:', err);
      setError(err.message);
      
      // Try localStorage fallback
      try {
        const savedData = localStorage.getItem('legoData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setLegoList(parsedData);
          return parsedData;
        }
      } catch (localErr) {
        console.error('Failed to load from localStorage:', localErr);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addLego = useCallback(async (legoData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedData = {
        '출시일': legoData.releaseDate || '',
        '레고 번호': legoData.legoNumber || '',
        '제품명': legoData.productName || '',
        '테마': legoData.theme || '',
        '구입일': legoData.purchaseDate || '',
        '정가 (원)': legoData.retailPrice || '',
        '구입 가격 (원)': legoData.purchasePrice || '',
        '현재 시세 (원)': legoData.currentPrice || '',
        '상태': legoData.status || '',
        '이미지 URL': legoData.imageUrl || ''
      };

      const result = await legoApi.addLego(formattedData);
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result;
      } else {
        throw new Error(result.error || 'Failed to add LEGO');
      }
    } catch (err) {
      console.error('Error adding LEGO:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLego = useCallback(async (index, legoData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.updateLego(index, legoData);
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result;
      } else {
        throw new Error(result.error || 'Failed to update LEGO');
      }
    } catch (err) {
      console.error('Error updating LEGO:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLego = useCallback(async (index) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.deleteLego(index);
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete LEGO');
      }
    } catch (err) {
      console.error('Error deleting LEGO:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromExcel = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const XLSX = await import('xlsx');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const importedData = jsonData.map(row => ({
              '출시일': row['출시일'] || '',
              '레고 번호': row['레고 번호'] || '',
              '제품명': row['제품명'] || '',
              '테마': row['테마'] || '',
              '구입일': row['구입일'] || '',
              '정가 (원)': row['정가 (원)'] || '',
              '구입 가격 (원)': row['구입 가격 (원)'] || '',
              '현재 시세 (원)': row['현재 시세 (원)'] || '',
              '상태': row['상태'] || '',
              '이미지 URL': row['이미지 URL'] || '',
              '등록 시간': row['등록 시간'] || new Date().toLocaleString(),
              '수정 시간': row['수정 시간'] || ''
            }));

            const result = await legoApi.replaceLegos(importedData);
            
            if (result.success) {
              setLegoList(result.data);
              localStorage.setItem('legoData', JSON.stringify(result.data));
              resolve(result);
            } else {
              throw new Error(result.error || 'Failed to import data');
            }
          } catch (err) {
            reject(err);
          }
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    } catch (err) {
      console.error('Error importing from Excel:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToExcel = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      
      const worksheet = XLSX.utils.json_to_sheet(legoList);
      
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 60 }, { wch: 20 }, { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

      XLSX.writeFile(workbook, 'my_lego_list.xlsx');
      
      return true;
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(err.message);
      throw err;
    }
  }, [legoList]);

  // Load data on mount
  useEffect(() => {
    loadLegoData();
  }, [loadLegoData]);

  const value = {
    legoList,
    loading,
    error,
    selectedTheme,
    sortBy,
    setSelectedTheme,
    setSortBy,
    loadLegoData,
    addLego,
    updateLego,
    deleteLego,
    importFromExcel,
    exportToExcel
  };

  return (
    <LegoContext.Provider value={value}>
      {children}
    </LegoContext.Provider>
  );
};

export default LegoContext;
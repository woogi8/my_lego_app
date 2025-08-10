import { useState, useEffect, useCallback } from 'react';
import legoApi from '../api/legoApi';

const useLegoData = () => {
  const [legoList, setLegoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLegoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.getAllLegos();
      
      if (result.success) {
        setLegoList(result.data);
        // Backup to localStorage
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error loading LEGO data:', err);
      setError(err.message);
      
      // Try to load from localStorage as fallback
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
      const result = await legoApi.addLego(legoData);
      
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

  const bulkAddLegos = useCallback(async (legosArray) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.bulkAddLegos(legosArray);
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result;
      } else {
        throw new Error(result.error || 'Failed to bulk add LEGOs');
      }
    } catch (err) {
      console.error('Error bulk adding LEGOs:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceLegos = useCallback(async (legosArray) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await legoApi.replaceLegos(legosArray);
      
      if (result.success) {
        setLegoList(result.data);
        localStorage.setItem('legoData', JSON.stringify(result.data));
        return result;
      } else {
        throw new Error(result.error || 'Failed to replace LEGOs');
      }
    } catch (err) {
      console.error('Error replacing LEGOs:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadLegoData();
  }, [loadLegoData]);

  return {
    legoList,
    loading,
    error,
    loadLegoData,
    addLego,
    updateLego,
    deleteLego,
    bulkAddLegos,
    replaceLegos
  };
};

export default useLegoData;
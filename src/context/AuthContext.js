import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 로컬스토리지에서 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUser);
        } catch (error) {
          console.error('사용자 데이터 파싱 오류:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 로그인 함수
  const login = async (username, password) => {
    try {
      console.log('🔐 로그인 시도:', { username, password });
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📋 응답 데이터:', data);

      if (response.ok) {
        // 인증 성공
        const { token, user: userData } = data;
        
        // 로컬스토리지에 저장
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // 상태 업데이트
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      } else {
        // 인증 실패
        console.error('로그인 실패:', data.message);
        return false;
      }
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      return false;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    // 로컬스토리지에서 제거
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // 상태 초기화
    setIsAuthenticated(false);
    setUser(null);
  };

  // 인증 토큰 가져오기
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    getAuthToken,
    token: getAuthToken(), // 토큰도 직접 제공
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
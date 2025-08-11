import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 로컬스토리지에서 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUser);
          console.log('기존 로그인 상태 복원:', parsedUser);
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Vercel Functions를 사용한 로그인
  const login = async (username, password) => {
    try {
      console.log('🔐 Vercel Function 로그인 시도:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📋 로그인 응답:', data);

      if (response.ok && data.success) {
        console.log('✅ 로그인 성공:', data.user);
        
        // 로컬스토리지에 저장
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // 상태 업데이트
        setIsAuthenticated(true);
        setUser(data.user);
        
        return true;
      } else {
        console.log('❌ 로그인 실패:', data.message);
        return false;
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      return false;
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUser(null);
    console.log('로그아웃 완료');
  };

  // 토큰 가져오기
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
    token: getAuthToken(),
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
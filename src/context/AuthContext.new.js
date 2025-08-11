import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 서버리스 인증 상태 확인 중...');
        
        // 서버리스 상태 확인 - v2.0.5
        try {
          const baseUrl = window.location.origin;
          const statusUrl = `${baseUrl}/api/status`;
          console.log('🔍 상태 확인 URL:', statusUrl);
          
          const statusResponse = await fetch(statusUrl);
          if (statusResponse.ok) {
            console.log('✅ 서버리스 함수 연결 성공');
          }
        } catch (statusError) {
          console.log('⚠️ 서버리스 상태 확인 실패:', statusError.message);
        }

        // 로컬스토리지에서 인증 상태 복원
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUser);
          console.log('✅ 기존 로그인 상태 복원:', parsedUser);
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

  // 서버리스 로그인 (Vercel Functions) - v2.0.5 CACHE BUSTER
  const login = async (username, password) => {
    try {
      console.log('🔐 서버리스 로그인 시도 v2.0.5 FORCE UPDATE:', username);
      
      // 동적 베이스 URL 생성 - 캐시 문제 해결
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/auth/login`;
      
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📋 서버리스 로그인 응답:', data);

      if (response.ok && data.success) {
        console.log('✅ 서버리스 로그인 성공:', data.user);
        
        // 로컬스토리지에 저장
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // 상태 업데이트
        setIsAuthenticated(true);
        setUser(data.user);
        
        return { success: true, message: data.message };
      } else {
        console.log('❌ 서버리스 로그인 실패:', data.message);
        return { success: false, message: data.message || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('서버리스 로그인 오류:', error);
      return { 
        success: false, 
        message: '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.' 
      };
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
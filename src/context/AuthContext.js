import React, { createContext, useState, useEffect, useContext } from 'react';
import { checkServerStatus, showServerErrorDialog } from '../utils/serverManager';

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
      
      // 먼저 서버 상태 확인
      console.log('🔍 서버 상태 확인 중...');
      const isServerRunning = await checkServerStatus();
      
      if (!isServerRunning) {
        console.error('🚨 서버가 실행되지 않았습니다.');
        showServerErrorDialog();
        return false;
      }
      
      console.log('✅ 서버 연결 확인됨. 로그인 진행 중...');
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 response.ok:', response.ok);
      
      const data = await response.json();
      console.log('📋 응답 데이터:', data);
      console.log('📋 data.success:', data.success);

      if (response.ok && data.success) {
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
      
      // 서버 연결 실패인지 확인
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        console.error('🚨 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        console.error('💡 해결 방법:');
        console.error('   1. start-full-app.bat 실행');
        console.error('   2. 또는 터미널에서: cd server && node server.js');
        console.error('   3. 또는: npm run dev');
        
        // 사용자에게 더 명확한 오류 메시지 표시를 위한 상태 업데이트
        alert('🚨 서버에 연결할 수 없습니다!\n\n해결 방법:\n1. start-full-app.bat 실행\n2. 또는 터미널에서 "cd server && node server.js"\n3. 또는 "npm run dev"\n\n서버가 실행된 후 다시 로그인해주세요.');
      }
      
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
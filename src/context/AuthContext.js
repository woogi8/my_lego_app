import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

// 하드코딩된 사용자 정보 (완전히 클라이언트에서만 작동)
const USERS = {
  'woogi': {
    password: 'woogi01!',
    name: '우기',
    role: 'admin'
  },
  'lei': {
    password: 'lei01!',
    name: '레이', 
    role: 'admin'
  }
};

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

  // 완전히 클라이언트 사이드 로그인 (서버 불필요)
  const login = (username, password) => {
    console.log('로그인 시도:', username);
    
    // 사용자 확인
    if (USERS[username] && USERS[username].password === password) {
      console.log('로그인 성공:', username);
      
      const userData = {
        username: username,
        name: USERS[username].name,
        role: USERS[username].role
      };
      
      const token = `token_${username}_${Date.now()}`;
      
      // 로컬스토리지에 저장
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // 상태 업데이트
      setIsAuthenticated(true);
      setUser(userData);
      
      return Promise.resolve(true);
    } else {
      console.log('로그인 실패:', username, '사용 가능한 계정:', Object.keys(USERS));
      return Promise.resolve(false);
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
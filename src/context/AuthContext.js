import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

// 하드코딩된 사용자 정보 (서버 없이 작동)
const HARDCODED_USERS = [
  {
    username: 'woogi',
    password: 'woogi01!',
    name: '우기',
    role: 'admin'
  },
  {
    username: 'lei',
    password: 'lei01!',
    name: '레이',
    role: 'admin'
  }
];

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

  // 로그인 함수 (하드코딩된 사용자로 서버 없이 작동)
  const login = async (username, password) => {
    // Promise로 감싸서 async 동작 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔐 로그인 시도:', { username, password: '***' });
        
        // 하드코딩된 사용자 정보에서 확인
        const user = HARDCODED_USERS.find(
          u => u.username === username && u.password === password
        );
        
        if (user) {
          console.log('✅ 로그인 성공:', username);
          
          // 토큰 생성 (서버 없이 로컬에서 생성)
          const token = `token_${username}_${Date.now()}`;
          
          // 사용자 데이터 준비
          const userData = {
            username: user.username,
            name: user.name,
            role: user.role
          };
          
          // 로컬스토리지에 저장
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(userData));
          
          // 상태 업데이트
          setIsAuthenticated(true);
          setUser(userData);
          
          resolve(true);
        } else {
          console.log('❌ 로그인 실패: 잘못된 아이디 또는 비밀번호');
          console.log('입력된 정보:', { username, password });
          console.log('사용 가능한 계정:', HARDCODED_USERS.map(u => u.username));
          resolve(false);
        }
      }, 100); // 약간의 딜레이 추가
    });
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
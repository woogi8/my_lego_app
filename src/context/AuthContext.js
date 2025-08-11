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

  // 하드코딩된 사용자 정보 (로컬 개발용)
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

  // Vercel Functions 또는 로컬 폴백 로그인
  const login = async (username, password) => {
    try {
      console.log('🔐 로그인 시도:', username);
      
      // Vercel Functions 시도
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Vercel Functions 로그인 응답:', data);

          if (data.success) {
            console.log('✅ Vercel Functions 로그인 성공:', data.user);
            
            // 로컬스토리지에 저장
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // 상태 업데이트
            setIsAuthenticated(true);
            setUser(data.user);
            
            return true;
          }
        }
      } catch (fetchError) {
        console.log('🔄 Vercel Functions 실패, 로컬 폴백 사용:', fetchError.message);
      }

      // 로컬 폴백 인증
      if (USERS[username] && USERS[username].password === password) {
        console.log('✅ 로컬 폴백 로그인 성공:', username);
        
        const userData = {
          username: username,
          name: USERS[username].name,
          role: USERS[username].role
        };
        
        const token = `local_token_${username}_${Date.now()}`;
        
        // 로컬스토리지에 저장
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // 상태 업데이트
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      }

      console.log('❌ 로그인 실패:', username);
      return false;
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
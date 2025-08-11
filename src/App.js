import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext.new';
import PrivateRoute from './components/PrivateRoute';
import LegoRegister from './components/LegoRegister';
import './App.css';

// 헤더에 로그아웃 버튼을 포함하는 컴포넌트
const AppHeader = () => {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      zIndex: 1000,
      padding: '1rem',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '0 0 0 8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <span style={{ fontSize: '0.9rem', color: '#666' }}>
        환영합니다, <strong>{user?.name || user?.username}</strong>님!
      </span>
      <button
        onClick={logout}
        style={{
          padding: '6px 12px',
          background: '#ff4757',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.target.style.background = '#ff3742'}
        onMouseOut={(e) => e.target.style.background = '#ff4757'}
      >
        로그아웃
      </button>
    </div>
  );
};

function AppContent() {
  const { isAuthenticated } = useContext(AuthContext);

  // 로그인되지 않은 상태에서는 PrivateRoute가 로그인 화면을 보여줌
  if (!isAuthenticated) {
    return <PrivateRoute />;
  }

  // 로그인된 상태에서 바로 레고 관리 화면 표시
  return (
    <>
      <AppHeader />
      <LegoRegister />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
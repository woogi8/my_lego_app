import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login form submitted:', formData.username);
      const success = await login(formData.username, formData.password);
      
      if (!success) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다. 계정: woogi/woogi01! 또는 lei/lei01!');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 실패: 서버 연결을 확인하거나 아이디/비밀번호를 다시 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="container">
        <div className="login-content">
          <div className="login-header fade-in">
            <div className="logo">
              <span className="logo-icon">🧱</span>
              <h1>LEGO Collection</h1>
            </div>
            <p className="subtitle text-gray">Sign in to manage your collection</p>
          </div>
          
          <div className="login-form-container slide-up">
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="woogi 또는 lei"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                <div>테스트 계정:</div>
                <div><strong>woogi</strong> / <strong>woogi01!</strong></div>
                <div><strong>lei</strong> / <strong>lei01!</strong></div>
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
                style={{ width: '100%', marginTop: '24px' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* 버전 정보 */}
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#333',
              fontWeight: 'bold',
              padding: '5px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              버전 v2.0.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
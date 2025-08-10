import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegoForm from '../components/forms/LegoForm';

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    alert('레고가 성공적으로 등록되었습니다!');
    // Optionally navigate to list page after successful registration
    // navigate('/app/list');
  };

  return (
    <div className="register-page">
      <LegoForm onSubmit={handleSubmit} />
    </div>
  );
};

export default RegisterPage;
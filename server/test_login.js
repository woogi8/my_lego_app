const axios = require('axios');

const testLogin = async () => {
  const testCases = [
    { username: 'woogi', password: 'woogi01!' },
    { username: 'lei', password: 'lei01!' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n🔐 로그인 테스트: ${testCase.username} / ${testCase.password}`);
      
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username: testCase.username,
        password: testCase.password
      });

      console.log('✅ 로그인 성공:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ 로그인 실패:', error.response.status, error.response.data);
      } else {
        console.log('❌ 네트워크 오류:', error.message);
      }
    }
  }
};

testLogin();
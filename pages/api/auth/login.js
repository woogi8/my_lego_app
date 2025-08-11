// Vercel Function: /api/auth/login
export default function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { username, password } = req.body;
    
    console.log('🔐 Vercel Function 로그인 시도 v2.1.1:', username, new Date().toISOString());

    // 하드코딩된 사용자 정보
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

    // 사용자 인증
    if (USERS[username] && USERS[username].password === password) {
      console.log('✅ 로그인 성공:', username);
      
      const userData = {
        username: username,
        name: USERS[username].name,
        role: USERS[username].role
      };
      
      const token = `token_${username}_${Date.now()}`;
      
      return res.status(200).json({
        success: true,
        token: token,
        user: userData,
        message: '로그인 성공'
      });
    } else {
      console.log('❌ 로그인 실패:', username);
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
}
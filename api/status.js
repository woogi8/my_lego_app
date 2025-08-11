// Vercel Function: /api/status
export default function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('📊 서버리스 상태 확인 요청');

    return res.status(200).json({
      success: true,
      status: 'active',
      message: 'Vercel 서버리스 함수가 정상적으로 실행 중입니다',
      timestamp: new Date().toISOString(),
      platform: 'Vercel Functions'
    });
  } catch (error) {
    console.error('상태 확인 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
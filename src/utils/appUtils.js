// 완전한 서버리스 앱 - 더 이상 서버 상태 확인 불필요
// Cache Buster: v2.0.3-${Date.now()}

export const isServerless = () => {
  console.log('🎉 서버리스 환경 - 서버 확인 불필요');
  return true;
};

export const getAppInfo = () => {
  return {
    version: '2.0.3',
    architecture: 'Serverless (Vercel Functions + Supabase)',
    serverRequired: false
  };
};
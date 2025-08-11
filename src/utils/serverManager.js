// 서버리스 구조 - 서버 상태 확인 불필요
// Vercel Functions로 완전히 대체됨
// Cache Buster: v2.0.1-${Date.now()}

export const checkServerStatus = async () => {
  // 서버리스 환경에서는 항상 false 반환 (로컬 폴백 사용)
  console.log('🎉 서버리스 환경 - localhost 서버 확인 생략');
  return false;
};

export const startServerInstructions = () => {
  return `
🎉 완전한 서버리스 구조입니다!

이 앱은 Vercel Functions를 사용하여 서버 없이 작동합니다:
✅ 로그인: Vercel Functions 또는 로컬 폴백
✅ 데이터베이스: Supabase 직접 연결
✅ 배포: Vercel 서버리스

로컬 서버가 필요하지 않습니다.
`;
};

export const showServerErrorDialog = () => {
  // 서버리스 환경에서는 오류 다이얼로그 불필요
  console.log('🎉 서버리스 환경 - 서버 오류 다이얼로그 생략');
};
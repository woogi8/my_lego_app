// 서버 상태 확인 및 관리 유틸리티

export const checkServerStatus = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/status', {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const startServerInstructions = () => {
  const instructions = `
🚨 서버가 실행되지 않았습니다!

로그인하려면 서버가 필요합니다. 아래 방법 중 하나를 선택하세요:

✅ 가장 쉬운 방법:
   → start-full-app.bat 파일을 더블클릭

✅ 명령어로 실행:
   → 터미널에서 "npm run dev"
   
✅ 서버만 별도 실행:
   → 터미널에서 "cd server && node server.js"

서버가 실행되면 자동으로 로그인됩니다.
`;
  
  return instructions;
};

export const showServerErrorDialog = () => {
  const message = startServerInstructions();
  
  if (window.confirm(message + '\n\n"확인"을 누르면 서버 실행 방법 페이지를 엽니다.')) {
    // GitHub README 페이지 열기
    window.open('https://github.com/woogi8/my_lego_app#-실행-방법', '_blank');
  }
};
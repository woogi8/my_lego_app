const { supabase, TABLES } = require('./config/supabase');

(async () => {
  try {
    console.log('🔍 lego_user 테이블에서 모든 사용자 조회 중...');
    const { data: users, error } = await supabase
      .from(TABLES.USERS)
      .select('user_id, user_pw, user_name, user_role');

    if (error) {
      console.error('❌ 데이터베이스 조회 오류:', error);
      return;
    }

    console.log('📋 조회된 사용자 목록:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. 아이디: ${user.user_id}`);
      console.log(`   비밀번호: ${user.user_pw} (길이: ${user.user_pw ? user.user_pw.length : 0})`);
      console.log(`   이름: ${user.user_name || 'N/A'}`);
      console.log(`   역할: ${user.user_role || 'N/A'}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('❌ 등록된 사용자가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
})();
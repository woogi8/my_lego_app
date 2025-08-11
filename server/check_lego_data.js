const { supabase } = require('./config/supabase');

(async () => {
  try {
    console.log('🔍 Supabase에서 레고 데이터 조회 중...');
    
    // my_lego_list 테이블에서 모든 데이터 조회
    const { data: legos, error, count } = await supabase
      .from('my_lego_list')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10); // 처음 10개만 확인

    if (error) {
      console.error('❌ 데이터베이스 조회 오류:', error);
      return;
    }

    console.log('📊 총 레고 개수:', count);
    console.log('📋 처음 10개 레고 목록:');
    
    if (legos && legos.length > 0) {
      legos.forEach((lego, index) => {
        console.log(`\n${index + 1}. 레고 번호: ${lego.lego_number || 'N/A'}`);
        console.log(`   제품명: ${lego.product_name || 'N/A'}`);
        console.log(`   테마: ${lego.theme || 'N/A'}`);
        console.log(`   사용자: ${lego.user_id || 'N/A'}`);
        console.log(`   등록일: ${lego.created_at || 'N/A'}`);
      });
    } else {
      console.log('❌ 레고 데이터가 없습니다.');
    }

    // 특정 사용자(woogi)의 레고만 조회
    const { data: woogiLegos, error: woogiError, count: woogiCount } = await supabase
      .from('my_lego_list')
      .select('*', { count: 'exact' })
      .eq('user_id', 'woogi');

    if (!woogiError) {
      console.log(`\n👤 woogi 사용자의 레고 개수: ${woogiCount}`);
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
})();
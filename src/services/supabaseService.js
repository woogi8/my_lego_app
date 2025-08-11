import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
// 환경 변수에서 가져오거나 하드코딩 (데모용)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kwgkbhzrhuyubpxsnchg.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2tiaHpyaHV5dWJweHNuY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMxOTI0OTEsImV4cCI6MjAzODc2ODQ5MX0.YdTGFg2gwPIClLwS7lVKYqGhPJYGQ1R5xjRiuHkIjCc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 레고 서비스 클래스
class LegoService {
  // 모든 레고 조회
  async getAllLegos() {
    try {
      console.log('🔍 Supabase에서 레고 목록 조회 중...');
      
      const { data, error, count } = await supabase
        .from('my_lego_list')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase 조회 오류:', error);
        throw error;
      }

      // DB 컬럼명을 한국어로 변환
      const transformedData = (data || []).map(lego => ({
        '출시일': lego.release_date,
        '레고 번호': lego.lego_number,
        '제품명': lego.product_name,
        '테마': lego.theme,
        '구입일': lego.purchase_date,
        '정가 (원)': lego.retail_price,
        '구입 가격 (원)': lego.purchase_price,
        '현재 시세 (원)': lego.current_market_price,
        '상태': lego.condition,
        '이미지 URL': lego.image_url || (lego.lego_number ? `https://images.brickset.com/sets/images/${lego.lego_number}-1.jpg` : ''),
        '등록 시간': lego.created_at,
        '수정 시간': lego.updated_at,
        'id': lego.id
      }));

      console.log(`✅ ${transformedData.length}개 레고 조회 성공`);
      return { success: true, data: transformedData };
    } catch (error) {
      console.error('레고 조회 실패:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  // 레고 추가
  async addLego(legoData) {
    try {
      console.log('📝 새 레고 추가 중...', legoData);
      
      // 한국어 컬럼명을 DB 컬럼명으로 변환
      const dbLego = {
        release_date: legoData['출시일'],
        lego_number: legoData['레고 번호'],
        product_name: legoData['제품명'],
        theme: legoData['테마'],
        purchase_date: legoData['구입일'],
        retail_price: legoData['정가 (원)'],
        purchase_price: legoData['구입 가격 (원)'],
        current_market_price: legoData['현재 시세 (원)'],
        condition: legoData['상태'],
        image_url: legoData['이미지 URL'] || (legoData['레고 번호'] ? `https://images.brickset.com/sets/images/${legoData['레고 번호']}-1.jpg` : ''),
        user_id: 'woogi' // 현재 사용자 (하드코딩)
      };

      const { data, error } = await supabase
        .from('my_lego_list')
        .insert([dbLego])
        .select();

      if (error) {
        console.error('❌ 레고 추가 실패:', error);
        throw error;
      }

      console.log('✅ 레고 추가 성공:', data);
      
      // 전체 목록 다시 조회
      return await this.getAllLegos();
    } catch (error) {
      console.error('레고 추가 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 레고 수정
  async updateLego(id, legoData) {
    try {
      console.log('📝 레고 수정 중...', id, legoData);
      
      // 한국어 컬럼명을 DB 컬럼명으로 변환
      const dbLego = {
        release_date: legoData['출시일'],
        lego_number: legoData['레고 번호'],
        product_name: legoData['제품명'],
        theme: legoData['테마'],
        purchase_date: legoData['구입일'],
        retail_price: legoData['정가 (원)'],
        purchase_price: legoData['구입 가격 (원)'],
        current_market_price: legoData['현재 시세 (원)'],
        condition: legoData['상태'],
        image_url: legoData['이미지 URL']
      };

      const { data, error } = await supabase
        .from('my_lego_list')
        .update(dbLego)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ 레고 수정 실패:', error);
        throw error;
      }

      console.log('✅ 레고 수정 성공:', data);
      
      // 전체 목록 다시 조회
      return await this.getAllLegos();
    } catch (error) {
      console.error('레고 수정 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 레고 삭제
  async deleteLego(id) {
    try {
      console.log('🗑️ 레고 삭제 중...', id);
      
      const { error } = await supabase
        .from('my_lego_list')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 레고 삭제 실패:', error);
        throw error;
      }

      console.log('✅ 레고 삭제 성공');
      
      // 전체 목록 다시 조회
      return await this.getAllLegos();
    } catch (error) {
      console.error('레고 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 대량 추가
  async bulkAddLegos(legosArray) {
    try {
      console.log('📦 대량 레고 추가 중...', legosArray.length, '개');
      
      // 한국어 컬럼명을 DB 컬럼명으로 변환
      const dbLegos = legosArray.map(lego => ({
        release_date: lego['출시일'],
        lego_number: lego['레고 번호'],
        product_name: lego['제품명'],
        theme: lego['테마'],
        purchase_date: lego['구입일'],
        retail_price: lego['정가 (원)'],
        purchase_price: lego['구입 가격 (원)'],
        current_market_price: lego['현재 시세 (원)'],
        condition: lego['상태'],
        image_url: lego['이미지 URL'] || (lego['레고 번호'] ? `https://images.brickset.com/sets/images/${lego['레고 번호']}-1.jpg` : ''),
        user_id: 'woogi'
      }));

      const { data, error } = await supabase
        .from('my_lego_list')
        .insert(dbLegos)
        .select();

      if (error) {
        console.error('❌ 대량 추가 실패:', error);
        throw error;
      }

      console.log('✅ 대량 추가 성공:', data.length, '개');
      
      // 전체 목록 다시 조회
      return await this.getAllLegos();
    } catch (error) {
      console.error('대량 추가 오류:', error);
      return { success: false, error: error.message };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const legoService = new LegoService();
export default legoService;
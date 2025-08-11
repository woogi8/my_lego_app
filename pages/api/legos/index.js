// Vercel Function: /api/legos (GET, POST, PUT)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // 모든 레고 조회
      console.log('🔍 Vercel Function: 레고 목록 조회');
      
      const { data: legos, error, count } = await supabase
        .from('my_lego_list')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ DB 조회 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      // DB 컬럼명을 한국어로 변환
      const transformedData = (legos || []).map(lego => ({
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
      return res.status(200).json({ success: true, data: transformedData });

    } else if (req.method === 'POST') {
      // 새 레고 추가
      const newLego = req.body;
      console.log('📝 Vercel Function: 새 레고 추가', newLego);
      
      // 한국어 컬럼명을 DB 컬럼명으로 변환
      const dbLego = {
        release_date: newLego['출시일'],
        lego_number: newLego['레고 번호'],
        product_name: newLego['제품명'],
        theme: newLego['테마'],
        purchase_date: newLego['구입일'],
        retail_price: newLego['정가 (원)'],
        purchase_price: newLego['구입 가격 (원)'],
        current_market_price: newLego['현재 시세 (원)'],
        condition: newLego['상태'],
        image_url: newLego['이미지 URL'] || (newLego['레고 번호'] ? `https://images.brickset.com/sets/images/${newLego['레고 번호']}-1.jpg` : ''),
        user_id: 'woogi'
      };

      const { data, error } = await supabase
        .from('my_lego_list')
        .insert([dbLego])
        .select();

      if (error) {
        console.error('❌ 레고 추가 실패:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      
      console.log('✅ 레고 추가 성공:', data);
      
      // 전체 목록 다시 조회하여 반환
      const { data: allLegos, error: fetchError } = await supabase
        .from('my_lego_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ 데이터 재조회 오류:', fetchError);
        return res.status(500).json({ success: false, error: fetchError.message });
      }

      const transformedData = allLegos.map(lego => ({
        '출시일': lego.release_date,
        '레고 번호': lego.lego_number,
        '제품명': lego.product_name,
        '테마': lego.theme,
        '구입일': lego.purchase_date,
        '정가 (원)': lego.retail_price,
        '구입 가격 (원)': lego.purchase_price,
        '현재 시세 (원)': lego.current_market_price,
        '상태': lego.condition,
        '이미지 URL': lego.image_url,
        '등록 시간': lego.created_at,
        '수정 시간': lego.updated_at,
        'id': lego.id
      }));
      
      return res.status(200).json({ 
        success: true, 
        message: '레고가 성공적으로 추가되었습니다.',
        data: transformedData 
      });

    } else if (req.method === 'PUT') {
      // 전체 데이터 덮어쓰기
      const { data: newData } = req.body;
      console.log('🔄 Vercel Function: 전체 데이터 덮어쓰기', newData.length);
      
      // 기존 데이터 삭제 후 새 데이터 삽입
      const { error: deleteError } = await supabase
        .from('my_lego_list')
        .delete()
        .neq('id', 0); // 모든 데이터 삭제

      if (deleteError) {
        console.error('❌ 기존 데이터 삭제 실패:', deleteError);
        return res.status(500).json({ success: false, error: deleteError.message });
      }

      // 새 데이터 삽입
      const dbData = newData.map(item => ({
        release_date: item['출시일'],
        lego_number: item['레고 번호'],
        product_name: item['제품명'],
        theme: item['테마'],
        purchase_date: item['구입일'],
        retail_price: item['정가 (원)'],
        purchase_price: item['구입 가격 (원)'],
        current_market_price: item['현재 시세 (원)'],
        condition: item['상태'],
        image_url: item['이미지 URL'] || (item['레고 번호'] ? `https://images.brickset.com/sets/images/${item['레고 번호']}-1.jpg` : ''),
        user_id: 'woogi'
      }));

      const { data, error } = await supabase
        .from('my_lego_list')
        .insert(dbData)
        .select();

      if (error) {
        console.error('❌ 데이터 덮어쓰기 실패:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log('✅ 데이터 덮어쓰기 성공:', data.length);
      return res.status(200).json({ 
        success: true, 
        message: '데이터가 성공적으로 덮어써졌습니다.',
        data: newData 
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
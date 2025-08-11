// Vercel Function: /api/legos/[id] (PUT, DELETE)
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

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      // 레고 수정
      const updatedLego = req.body;
      console.log('📝 Vercel Function: 레고 수정', id, updatedLego);
      
      // 한국어 컬럼명을 DB 컬럼명으로 변환
      const dbLego = {
        release_date: updatedLego['출시일'],
        lego_number: updatedLego['레고 번호'],
        product_name: updatedLego['제품명'],
        theme: updatedLego['테마'],
        purchase_date: updatedLego['구입일'],
        retail_price: updatedLego['정가 (원)'],
        purchase_price: updatedLego['구입 가격 (원)'],
        current_market_price: updatedLego['현재 시세 (원)'],
        condition: updatedLego['상태'],
        image_url: updatedLego['이미지 URL'],
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('my_lego_list')
        .update(dbLego)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ 레고 수정 실패:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log('✅ 레고 수정 성공:', data);
      
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
        message: '레고가 성공적으로 수정되었습니다.',
        data: transformedData 
      });

    } else if (req.method === 'DELETE') {
      // 레고 삭제
      console.log('🗑️ Vercel Function: 레고 삭제', id);
      
      const { error } = await supabase
        .from('my_lego_list')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 레고 삭제 실패:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log('✅ 레고 삭제 성공');
      
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
        message: '레고가 성공적으로 삭제되었습니다.',
        data: transformedData 
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
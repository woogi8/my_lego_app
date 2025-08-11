const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('SUPABASE_URL:', supabaseUrl ? '설정됨' : '미설정');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '미설정');
  process.exit(1);
}

// 서비스 역할 키를 사용한 클라이언트 (서버용)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 테이블 이름 상수
const TABLES = {
  LEGO_ITEMS: 'my_lego_list',  // 실제 테이블 이름
  USERS: 'lego_user'  // 사용자 테이블 이름
};

// 데이터베이스 스키마 매핑
const COLUMN_MAPPING = {
  // 한국어 -> 영어 컬럼명 매핑
  '출시일': 'release_date',
  '레고 번호': 'lego_number', 
  '제품명': 'product_name',
  '테마': 'theme',
  '구입일': 'purchase_date',
  '정가 (원)': 'retail_price',
  '구입 가격 (원)': 'purchase_price', 
  '현재 시세 (원)': 'current_market_price',
  '상태': 'condition',
  '이미지 URL': 'image_url',
  '등록일': 'created_at'
};

// 영어 -> 한국어 컬럼명 역매핑
const REVERSE_COLUMN_MAPPING = Object.fromEntries(
  Object.entries(COLUMN_MAPPING).map(([ko, en]) => [en, ko])
);

module.exports = {
  supabase,
  TABLES,
  COLUMN_MAPPING,
  REVERSE_COLUMN_MAPPING
};
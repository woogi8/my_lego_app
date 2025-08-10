import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정
const supabaseUrl = 'https://hpwxhlhfmvgtplmosgar.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)

// 테이블 이름 상수
export const TABLES = {
  LEGO_ITEMS: 'lego_items'
}

// 데이터베이스 스키마 매핑
export const COLUMN_MAPPING = {
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
  '이미지 URL': 'image_url'
}

// 영어 -> 한국어 컬럼명 역매핑
export const REVERSE_COLUMN_MAPPING = Object.fromEntries(
  Object.entries(COLUMN_MAPPING).map(([ko, en]) => [en, ko])
)
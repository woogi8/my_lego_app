const express = require('express');
const cors = require('cors');
const supabaseService = require('./services/supabaseService');
const { supabase, TABLES } = require('./config/supabase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 인증 미들웨어 (lego_user 테이블 사용)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.'
    });
  }
  
  // 토큰에서 사용자 정보 추출
  try {
    // 간단한 토큰 검증 (token_username_timestamp 형태)
    const tokenParts = token.split('_');
    if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 토큰 형식입니다.'
      });
    }
    
    const username = tokenParts[1];
    const timestamp = tokenParts[2];
    
    // lego_user 테이블에서 사용자 존재 여부 확인
    const { data: users, error } = await supabase
      .from(TABLES.USERS)
      .select('user_id, user_name, user_role')
      .eq('user_id', username)
      .limit(1);

    if (error) {
      console.error('❌ 사용자 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '인증 검증 중 오류가 발생했습니다.'
      });
    }

    if (!users || users.length === 0) {
      return res.status(403).json({
        success: false,
        message: '존재하지 않는 사용자입니다.'
      });
    }

    const user = users[0];
    
    // 토큰 만료 검증 (24시간)
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const tokenAge = currentTime - tokenTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    
    if (tokenAge > maxAge) {
      return res.status(403).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    }
    
    // 사용자 정보를 request에 추가
    req.user = {
      user_id: user.user_id,
      username: user.user_id, // 호환성을 위해 username으로도 설정
      name: user.user_name || user.user_id,
      role: user.user_role || 'user',
      userId: user.user_id, // user_id로 사용할 고유 식별자
      token: token
    };
    
    console.log('🔐 인증된 사용자:', req.user.username, '(ID:', req.user.userId + ')');
    next();
    
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(403).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
};

// ========== 인증 관련 API ==========

// 로그인 (lego_user 테이블 사용)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 로그인 시도:', username);
    
    // lego_user 테이블에서 사용자 조회
    const { data: users, error } = await supabase
      .from(TABLES.USERS)
      .select('user_id, user_pw, user_name, user_role')
      .eq('user_id', username)
      .limit(1);

    if (error) {
      console.error('❌ 데이터베이스 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 사용자가 존재하지 않는 경우
    if (!users || users.length === 0) {
      console.log('❌ 로그인 실패: 존재하지 않는 사용자');
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = users[0];

    // 비밀번호 확인
    if (user.user_pw !== password) {
      console.log('❌ 로그인 실패: 잘못된 비밀번호');
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 로그인 성공
    const token = `token_${username}_${Date.now()}`;
    
    console.log('✅ 로그인 성공:', username);
    
    res.json({
      success: true,
      token,
      user: {
        username: user.user_id,
        name: user.user_name || user.user_id,
        role: user.user_role || 'user'
      }
    });

  } catch (error) {
    console.error('로그인 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// ========== 레고 아이템 API ==========

// 1. 모든 레고 데이터 조회 (인증 필요)
app.get('/api/legos', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 API 호출: GET /api/legos');
    console.log('👤 인증된 사용자:', req.user.userId);
    
    const data = await supabaseService.getAllLegoItems(req.user.userId);
    
    console.log(`✅ API 응답: ${data.length}개 데이터 반환`);
    res.json({ success: true, data });
    
  } catch (error) {
    console.error('API 오류 - 레고 조회:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '데이터 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 2. 새 레고 추가 (인증 필요)
app.post('/api/legos', authenticateToken, async (req, res) => {
  try {
    console.log('➕ API 호출: POST /api/legos');
    console.log('📝 요청 데이터:', req.body);
    console.log('👤 인증된 사용자:', req.user.userId);
    
    const newItem = await supabaseService.createLegoItem(req.body, req.user.userId);
    
    console.log('✅ 레고 추가 완료');
    res.json({ success: true, data: newItem });
    
  } catch (error) {
    console.error('API 오류 - 레고 추가:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '데이터 추가 중 오류가 발생했습니다.' 
    });
  }
});

// 3. 레고 수정 (ID 기반으로 변경, 인증 필요)
app.put('/api/legos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ API 호출: PUT /api/legos/${id}`);
    console.log('📝 수정 데이터:', req.body);
    console.log('👤 인증된 사용자:', req.user.userId);
    
    const updatedItem = await supabaseService.updateLegoItem(id, req.body, req.user.userId);
    
    console.log('✅ 레고 수정 완료');
    res.json({ success: true, data: updatedItem });
    
  } catch (error) {
    console.error('API 오류 - 레고 수정:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '데이터 수정 중 오류가 발생했습니다.' 
    });
  }
});

// 4. 레고 삭제 (ID 기반으로 변경, 인증 필요)
app.delete('/api/legos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ API 호출: DELETE /api/legos/${id}`);
    console.log('👤 인증된 사용자:', req.user.userId);
    
    await supabaseService.deleteLegoItem(id, req.user.userId);
    
    console.log('✅ 레고 삭제 완료');
    res.json({ success: true });
    
  } catch (error) {
    console.error('API 오류 - 레고 삭제:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '데이터 삭제 중 오류가 발생했습니다.' 
    });
  }
});

// 5. 일괄 레고 추가 (인증 필요)
app.post('/api/legos/bulk', authenticateToken, async (req, res) => {
  try {
    console.log('📦 API 호출: POST /api/legos/bulk');
    console.log('👤 인증된 사용자:', req.user.userId);
    const { data: itemsData } = req.body;
    
    if (!Array.isArray(itemsData)) {
      return res.status(400).json({
        success: false,
        error: '데이터는 배열 형태여야 합니다.'
      });
    }
    
    console.log(`📝 ${itemsData.length}개 아이템 일괄 추가 시작`);
    
    const newItems = await supabaseService.bulkCreateLegoItems(itemsData, req.user.userId);
    
    console.log('✅ 일괄 추가 완료');
    res.json({ success: true, data: newItems });
    
  } catch (error) {
    console.error('API 오류 - 일괄 추가:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '일괄 추가 중 오류가 발생했습니다.' 
    });
  }
});

// 6. 전체 데이터 덮어쓰기 (인증 필요)
app.put('/api/legos', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 API 호출: PUT /api/legos (전체 데이터 덮어쓰기)');
    console.log('👤 인증된 사용자:', req.user.userId);
    const { data: itemsData } = req.body;
    
    if (!Array.isArray(itemsData)) {
      return res.status(400).json({
        success: false,
        error: '데이터는 배열 형태여야 합니다.'
      });
    }
    
    console.log(`📝 ${itemsData.length}개 아이템으로 전체 데이터 교체`);
    
    const newItems = await supabaseService.replaceAllLegoItems(itemsData, req.user.userId);
    
    console.log('✅ 전체 데이터 교체 완료');
    res.json({ success: true, data: newItems });
    
  } catch (error) {
    console.error('API 오류 - 전체 데이터 교체:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '데이터 교체 중 오류가 발생했습니다.' 
    });
  }
});

// 7. 데이터베이스 상태 확인
app.get('/api/status', async (req, res) => {
  try {
    console.log('📊 API 호출: GET /api/status');
    
    const status = await supabaseService.getStatus();
    
    res.json(status);
    
  } catch (error) {
    console.error('API 오류 - 상태 확인:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '상태 확인 중 오류가 발생했습니다.' 
    });
  }
});

// 8. 데이터베이스 디버깅 엔드포인트 (임시)
app.get('/api/debug/data', async (req, res) => {
  try {
    console.log('🔧 API 호출: GET /api/debug/data');
    
    const { data, error } = await supabase
      .from('my_lego_list')
      .select('id, lego_number, product_name, user_id')
      .order('id');
    
    if (error) {
      throw error;
    }
    
    console.log('📊 현재 데이터베이스 상태:');
    data.forEach(item => {
      console.log(`  - ID: ${item.id}, 레고번호: ${item.lego_number}, 제품명: ${item.product_name}, user_id: ${item.user_id || 'NULL'}`);
    });
    
    res.json({ 
      success: true, 
      data: data,
      message: '디버깅 데이터를 성공적으로 조회했습니다.'
    });
    
  } catch (error) {
    console.error('API 오류 - 디버깅:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '디버깅 데이터 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 9. 마이그레이션 엔드포인트 (엑셀 -> Supabase)
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('🚀 API 호출: POST /api/migrate');
    
    // 기존 엑셀 파일에서 데이터 읽기
    const XLSX = require('xlsx');
    const fs = require('fs-extra');
    const path = require('path');
    
    const EXCEL_FILE_PATH = path.join(__dirname, '..', 'my_lego_list.xlsx');
    
    if (!await fs.pathExists(EXCEL_FILE_PATH)) {
      return res.status(404).json({
        success: false,
        error: '엑셀 파일이 존재하지 않습니다.'
      });
    }
    
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 엑셀에서 ${excelData.length}개 데이터 읽기 완료`);
    
    // Supabase로 데이터 마이그레이션
    const migratedData = await supabaseService.replaceAllLegoItems(excelData);
    
    console.log('✅ 마이그레이션 완료');
    res.json({ 
      success: true, 
      message: `${migratedData.length}개 데이터가 Supabase로 마이그레이션되었습니다.`,
      data: migratedData
    });
    
  } catch (error) {
    console.error('API 오류 - 마이그레이션:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '마이그레이션 중 오류가 발생했습니다.' 
    });
  }
});

// 6. Brickset에서 레고 정보 가져오기
app.get('/api/brickset/:setNumber', authenticateToken, async (req, res) => {
  try {
    const { setNumber } = req.params;
    console.log('🔍 Brickset 정보 조회:', setNumber);
    
    // Brickset URL 구성
    const bricksetUrl = `https://brickset.com/sets/${setNumber}`;
    
    // 참고: 실제 구현시에는 웹 스크래핑 라이브러리나 Brickset API를 사용해야 함
    // 여기서는 예시 데이터를 반환
    // 실제로는 puppeteer, playwright 또는 Brickset API를 사용하여 구현
    
    // 임시 응답 (실제 구현시 스크래핑 또는 API 호출로 대체)
    res.json({
      success: false,
      message: 'Brickset 정보 가져오기 기능은 CORS 정책으로 인해 서버에서 구현이 필요합니다.',
      note: '실제 구현시 puppeteer나 Brickset API를 사용하세요.'
    });
    
  } catch (error) {
    console.error('Brickset 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== 서버 시작 ==========

const startServer = async () => {
  try {
    // Supabase 연결 테스트
    console.log('🔌 Supabase 연결 테스트 중...');
    const isConnected = await supabaseService.testConnection();
    
    if (!isConnected) {
      console.error('❌ Supabase 연결 실패! 환경변수를 확인하세요.');
      console.error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 올바르게 설정되었는지 확인하세요.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 레고 관리 시스템 백엔드 서버 (Supabase 버전)');
      console.log('================================================');
      console.log(`📡 서버 주소: http://localhost:${PORT}`);
      console.log(`🗄️ 데이터베이스: Supabase PostgreSQL`);
      console.log(`🌐 Supabase URL: ${process.env.SUPABASE_URL}`);
      console.log('');
      console.log('💡 사용 가능한 API 엔드포인트:');
      console.log('   POST   /api/auth/login     - 로그인');
      console.log('   GET    /api/legos          - 모든 레고 조회');
      console.log('   POST   /api/legos          - 새 레고 추가');
      console.log('   PUT    /api/legos/:id      - 레고 수정');
      console.log('   DELETE /api/legos/:id      - 레고 삭제');
      console.log('   POST   /api/legos/bulk     - 일괄 추가');
      console.log('   PUT    /api/legos          - 전체 데이터 덮어쓰기');
      console.log('   GET    /api/status         - 상태 확인');
      console.log('   POST   /api/migrate        - 엑셀 -> Supabase 마이그레이션');
      console.log('================================================');
    });
  } catch (error) {
    console.error('🔥 예상치 못한 오류:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n👋 서버를 종료합니다...');
  process.exit(0);
});

// 서버 시작
startServer();
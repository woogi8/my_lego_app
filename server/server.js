const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const { supabase, TABLES } = require('./config/supabase');

const app = express();
const PORT = 3001;

// 엑셀 파일 경로
const EXCEL_FILE_PATH = path.join(__dirname, '..', 'my_lego_list.xlsx');

// 미들웨어
app.use(cors());
app.use(express.json());

// DB에서 사용자 정보를 조회하므로 하드코딩된 사용자 정보 제거

// 초기 엑셀 파일 생성 함수
const createInitialExcelFile = async () => {
  try {
    // 파일이 이미 존재하는지 확인
    if (await fs.pathExists(EXCEL_FILE_PATH)) {
      console.log('✅ my_lego_list.xlsx 파일이 이미 존재합니다:', EXCEL_FILE_PATH);
      return;
    }

    // 초기 데이터 (빈 데이터)
    const initialData = [];

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(initialData);
    
    // 헤더 설정
    XLSX.utils.sheet_add_aoa(worksheet, [[
      '출시일', '레고 번호', '제품명', '테마', '구입일', 
      '정가 (원)', '구입 가격 (원)', '현재 시세 (원)', '상태', 
      '이미지 URL', '등록 시간', '수정 시간'
    ]], { origin: 'A1' });

    // 열 너비 설정
    const colWidths = [
      { wch: 12 }, // 출시일
      { wch: 12 }, // 레고 번호
      { wch: 25 }, // 제품명
      { wch: 15 }, // 테마
      { wch: 12 }, // 구입일
      { wch: 15 }, // 정가
      { wch: 15 }, // 구입 가격
      { wch: 15 }, // 현재 시세
      { wch: 12 }, // 상태
      { wch: 60 }, // 이미지 URL
      { wch: 20 }, // 등록 시간
      { wch: 20 }  // 수정 시간
    ];
    worksheet['!cols'] = colWidths;

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

    // 파일 저장
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
    
    console.log('📁 초기 my_lego_list.xlsx 파일이 생성되었습니다:', EXCEL_FILE_PATH);
  } catch (error) {
    console.error('❌ 초기 파일 생성 오류:', error);
  }
};

// 엑셀 파일에서 데이터 읽기
const readExcelData = async () => {
  try {
    // 파일이 존재하지 않으면 초기 파일 생성
    if (!await fs.pathExists(EXCEL_FILE_PATH)) {
      console.log('❌ 엑셀 파일이 존재하지 않습니다:', EXCEL_FILE_PATH);
      await createInitialExcelFile();
      return [];
    }

    console.log('📖 엑셀 파일 읽기 시도:', EXCEL_FILE_PATH);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    console.log('📋 워크시트 목록:', workbook.SheetNames);
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 다양한 옵션으로 데이터 읽기 시도
    let data = XLSX.utils.sheet_to_json(worksheet);
    
    // 데이터가 비어있거나 컬럼이 하나만 있으면 다른 옵션으로 시도
    if (data.length === 0 || (data.length > 0 && Object.keys(data[0]).length <= 1)) {
      console.log('🔄 첫 번째 시도 실패 또는 불완전한 데이터, 헤더 옵션으로 재시도');
      const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (arrayData.length > 1) {
        // 첫 번째 행을 헤더로 사용
        const headers = arrayData[0].filter(h => h && h.toString().trim() !== '');
        console.log('📋 발견된 헤더:', headers);
        
        const jsonData = [];
        for (let i = 1; i < arrayData.length; i++) {
          const row = {};
          headers.forEach((header, index) => {
            const value = arrayData[i][index];
            row[header] = (value !== null && value !== undefined) ? value.toString().trim() : '';
          });
          
          // 모든 값이 비어있지 않은 행만 포함
          const hasData = Object.values(row).some(val => val && val !== '');
          if (hasData) {
            // 레고 번호가 있으면 이미지 URL 자동 생성
            if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
              const legoNumber = row['레고 번호'].toString().trim();
              // ISBN이나 특수 코드가 아닌 일반 레고 번호만 처리
              if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
                row['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
              }
            }
            jsonData.push(row);
          }
        }
        data = jsonData;
        console.log('🔄 헤더 방식으로 재구성된 데이터 개수:', data.length);
      }
    }
    
    console.log('📊 읽어온 데이터 개수:', data.length);
    console.log('📝 첫 번째 데이터 샘플:', data[0] || '데이터 없음');
    console.log('📝 컬럼명 확인:', data.length > 0 ? Object.keys(data[0]) : '데이터 없음');
    
    // 빈 행 필터링 및 이미지 URL 생성
    const filteredData = data.filter(row => {
      return Object.values(row).some(value => value && value.toString().trim() !== '');
    }).map(row => {
      // 레고 번호가 있으면 이미지 URL 자동 생성
      if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
        const legoNumber = row['레고 번호'].toString().trim();
        // ISBN이나 특수 코드가 아닌 일반 레고 번호만 처리
        if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
          row['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
        }
      }
      return row;
    });
    
    console.log('🧹 빈 행 제거 후 데이터 개수:', filteredData.length);
    
    return filteredData;
  } catch (error) {
    console.error('❌ 엑셀 파일 읽기 오류:', error);
    return [];
  }
};

// 엑셀 파일에 데이터 쓰기
const writeExcelData = async (data) => {
  try {
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 열 너비 설정
    const colWidths = [
      { wch: 12 }, // 출시일
      { wch: 12 }, // 레고 번호
      { wch: 25 }, // 제품명
      { wch: 15 }, // 테마
      { wch: 12 }, // 구입일
      { wch: 15 }, // 정가
      { wch: 15 }, // 구입 가격
      { wch: 15 }, // 현재 시세
      { wch: 12 }, // 상태
      { wch: 60 }, // 이미지 URL
      { wch: 20 }, // 등록 시간
      { wch: 20 }  // 수정 시간
    ];
    worksheet['!cols'] = colWidths;

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

    // 파일 저장
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
    
    return true;
  } catch (error) {
    console.error('엑셀 파일 쓰기 오류:', error);
    return false;
  }
};

// API 엔드포인트들

// 0. 로그인 인증 (DB 조회 방식)
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

// 인증 미들웨어 (DB 조회 방식)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.'
    });
  }
  
  try {
    // 토큰에서 사용자 정보 추출
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
      username: user.user_id,
      name: user.user_name || user.user_id,
      role: user.user_role || 'user'
    };
    
    next();
    
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(403).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
};

// 1. 모든 레고 데이터 조회
app.get('/api/legos', async (req, res) => {
  try {
    console.log('🔍 API 호출: GET /api/legos');
    const data = await readExcelData();
    console.log(`✅ API 응답: ${data.length}개 데이터 반환`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ 데이터 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 새 레고 추가
app.post('/api/legos', async (req, res) => {
  try {
    const newLego = req.body;
    
    // 기존 데이터 읽기
    const existingData = await readExcelData();
    
    // 새 데이터 추가
    const legoWithTimestamp = {
      ...newLego,
      '등록 시간': new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    // 이미지 URL이 없거나 비어있으면 자동 생성
    if (legoWithTimestamp['레고 번호'] && (!legoWithTimestamp['이미지 URL'] || legoWithTimestamp['이미지 URL'] === '')) {
      const legoNumber = legoWithTimestamp['레고 번호'].toString().trim();
      if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
        legoWithTimestamp['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
      }
    }
    
    existingData.push(legoWithTimestamp);
    
    // 파일에 저장
    const success = await writeExcelData(existingData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: '레고가 성공적으로 추가되었습니다.',
        data: existingData 
      });
    } else {
      res.status(500).json({ success: false, error: '파일 저장 실패' });
    }
  } catch (error) {
    console.error('레고 추가 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 레고 수정
app.put('/api/legos/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const updatedLego = req.body;
    
    // 기존 데이터 읽기
    const existingData = await readExcelData();
    
    // 인덱스 유효성 검사
    if (index < 0 || index >= existingData.length) {
      return res.status(400).json({ success: false, error: '유효하지 않은 인덱스입니다.' });
    }
    
    // 데이터 수정 (등록 시간은 유지, 수정 시간 추가)
    existingData[index] = {
      ...updatedLego,
      '등록 시간': existingData[index]['등록 시간'], // 기존 등록 시간 유지
      '수정 시간': new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    // 파일에 저장
    const success = await writeExcelData(existingData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: '레고가 성공적으로 수정되었습니다.',
        data: existingData 
      });
    } else {
      res.status(500).json({ success: false, error: '파일 저장 실패' });
    }
  } catch (error) {
    console.error('레고 수정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 레고 삭제
app.delete('/api/legos/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    // 기존 데이터 읽기
    const existingData = await readExcelData();
    
    // 인덱스 유효성 검사
    if (index < 0 || index >= existingData.length) {
      return res.status(400).json({ success: false, error: '유효하지 않은 인덱스입니다.' });
    }
    
    // 데이터 삭제
    existingData.splice(index, 1);
    
    // 파일에 저장
    const success = await writeExcelData(existingData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: '레고가 성공적으로 삭제되었습니다.',
        data: existingData 
      });
    } else {
      res.status(500).json({ success: false, error: '파일 저장 실패' });
    }
  } catch (error) {
    console.error('레고 삭제 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 일괄 데이터 추가
app.post('/api/legos/bulk', async (req, res) => {
  try {
    const newLegos = req.body.data;
    
    // 기존 데이터 읽기
    const existingData = await readExcelData();
    
    // 새 데이터들에 타임스탬프 추가
    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const legosWithTimestamp = newLegos.map(lego => {
      const legoWithTime = {
        ...lego,
        '등록 시간': timestamp
      };
      
      // 이미지 URL이 없거나 비어있으면 자동 생성
      if (legoWithTime['레고 번호'] && (!legoWithTime['이미지 URL'] || legoWithTime['이미지 URL'] === '')) {
        const legoNumber = legoWithTime['레고 번호'].toString().trim();
        if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
          legoWithTime['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
        }
      }
      
      return legoWithTime;
    });
    
    // 기존 데이터에 새 데이터들 추가
    const updatedData = [...existingData, ...legosWithTimestamp];
    
    // 파일에 저장
    const success = await writeExcelData(updatedData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `${newLegos.length}개의 레고가 성공적으로 추가되었습니다.`,
        data: updatedData 
      });
    } else {
      res.status(500).json({ success: false, error: '파일 저장 실패' });
    }
  } catch (error) {
    console.error('일괄 추가 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. 전체 데이터 덮어쓰기 (데이터 불러오기용)
app.put('/api/legos', async (req, res) => {
  try {
    let newData = req.body.data;
    
    // 이미지 URL 자동 생성
    newData = newData.map(row => {
      if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
        const legoNumber = row['레고 번호'].toString().trim();
        if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
          row['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
        }
      }
      return row;
    });
    
    // 파일에 저장
    const success = await writeExcelData(newData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: '데이터가 성공적으로 불러와졌습니다.',
        data: newData 
      });
    } else {
      res.status(500).json({ success: false, error: '파일 저장 실패' });
    }
  } catch (error) {
    console.error('데이터 불러오기 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. 파일 상태 확인
app.get('/api/status', async (req, res) => {
  try {
    const fileExists = await fs.pathExists(EXCEL_FILE_PATH);
    const data = await readExcelData();
    
    res.json({
      success: true,
      fileExists,
      filePath: EXCEL_FILE_PATH,
      recordCount: data.length,
      lastUpdated: fileExists ? (await fs.stat(EXCEL_FILE_PATH)).mtime : null
    });
  } catch (error) {
    console.error('상태 확인 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. 엑셀 파일 원시 데이터 디버깅 (개발용)
app.get('/api/debug/excel', async (req, res) => {
  try {
    console.log('🔧 디버깅 API 호출: 엑셀 파일 원시 데이터 확인');
    
    if (!await fs.pathExists(EXCEL_FILE_PATH)) {
      return res.json({
        success: false,
        error: '엑셀 파일이 존재하지 않습니다.',
        filePath: EXCEL_FILE_PATH
      });
    }

    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 다양한 형태로 데이터 읽기
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const range = worksheet['!ref'];
    
    res.json({
      success: true,
      debug: {
        filePath: EXCEL_FILE_PATH,
        worksheetNames: workbook.SheetNames,
        range: range,
        jsonData: {
          count: jsonData.length,
          sample: jsonData.slice(0, 3),
          columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
        },
        arrayData: {
          count: arrayData.length,
          headers: arrayData[0] || [],
          sample: arrayData.slice(0, 4)
        }
      }
    });
  } catch (error) {
    console.error('디버깅 API 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 서버 시작
const startServer = async () => {
  try {
    // 초기 엑셀 파일 생성
    await createInitialExcelFile();
    
    app.listen(PORT, () => {
      console.log('🚀 레고 관리 시스템 백엔드 서버가 시작되었습니다!');
      console.log(`📡 서버 주소: http://localhost:${PORT}`);
      console.log(`📁 엑셀 파일 경로: ${EXCEL_FILE_PATH}`);
      console.log('');
      console.log('💡 사용 가능한 API 엔드포인트:');
      console.log('   GET    /api/legos        - 모든 레고 조회');
      console.log('   POST   /api/legos        - 새 레고 추가');
      console.log('   PUT    /api/legos/:index - 레고 수정');
      console.log('   DELETE /api/legos/:index - 레고 삭제');
      console.log('   POST   /api/legos/bulk   - 일괄 추가');
      console.log('   PUT    /api/legos        - 전체 데이터 덮어쓰기');
      console.log('   GET    /api/status       - 파일 상태 확인');
      console.log('   GET    /api/debug/excel  - 엑셀 파일 디버깅 (개발용)');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 에러 처리
process.on('uncaughtException', (err) => {
  console.error('예상치 못한 오류:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('처리되지 않은 Promise 거부:', err);
  process.exit(1);
});

startServer();
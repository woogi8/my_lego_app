import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const LegoRegister = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    releaseDate: '',
    legoNumber: '',
    productName: '',
    theme: '',
    purchaseDate: '',
    retailPrice: '',
    purchasePrice: '',
    currentPrice: '',
    status: '',
    imageUrl: ''
  });

  const [currentPage, setCurrentPage] = useState('register');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [legoList, setLegoList] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingLegoId, setEditingLegoId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [userModifiedImageUrl, setUserModifiedImageUrl] = useState(false);
  const [fileStatus, setFileStatus] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [sortBy, setSortBy] = useState('none');
  const [filteredAndSortedList, setFilteredAndSortedList] = useState([]);

  // API에서 레고 데이터 불러오기
  const loadLegoData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/legos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : [];
        setLegoList(data);
        // localStorage에도 백업 저장
        localStorage.setItem('legoData', JSON.stringify(data));
        return data;
      } else {
        console.error('데이터 불러오기 실패:', result.error);
        // API 실패시 localStorage에서 불러오기
        const savedData = localStorage.getItem('legoData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const data = Array.isArray(parsedData) ? parsedData : [];
          setLegoList(data);
          return data;
        }
        setLegoList([]);
        return [];
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      // API 오류시 localStorage에서 불러오기
      try {
        const savedData = localStorage.getItem('legoData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const data = Array.isArray(parsedData) ? parsedData : [];
          setLegoList(data);
          return data;
        }
      } catch (localError) {
        console.error('localStorage 불러오기 오류:', localError);
      }
      setLegoList([]);
      return [];
    }
  };

  // 파일 상태 확인 함수
  const loadFileStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      const result = await response.json();
      
      if (result.success) {
        setFileStatus(result);
      }
    } catch (error) {
      console.error('파일 상태 확인 오류:', error);
    }
  };

  // 이미지 URL 생성 함수
  const generateImageUrl = (legoNumber) => {
    return legoNumber ? `https://images.brickset.com/sets/images/${legoNumber}-1.jpg` : '';
  };

  // 이미지 URL 처리 함수 (기존 값이 있으면 유지, 없으면 자동 생성)
  const handleImageUrl = (existingUrl, legoNumber) => {
    // 기존에 사용자가 입력한 URL이 있으면 유지
    if (existingUrl && existingUrl.trim() && !existingUrl.includes('sets/images/')) {
      return existingUrl;
    }
    // 없으면 레고 번호로 자동 생성
    return generateImageUrl(legoNumber);
  };

  // 컴포넌트 마운트시 데이터 불러오기
  useEffect(() => {
    loadLegoData();
    loadFileStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'legoNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        imageUrl: handleImageUrl(prev.imageUrl, value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 수익률 계산 함수
  const calculateProfitRate = (lego) => {
    const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
    const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
    
    if (purchasePrice === 0) return 0;
    return ((currentPrice - purchasePrice) / purchasePrice * 100);
  };

  // 테마 목록 추출 함수
  const getUniqueThemes = (data) => {
    const themes = data
      .map(lego => lego['테마'] || '')
      .filter(theme => theme.trim() !== '')
      .filter((theme, index, arr) => arr.indexOf(theme) === index)
      .sort();
    return ['전체', ...themes];
  };

  // 필터링 및 정렬 함수
  const applyFilterAndSort = (data, theme, sortOrder) => {
    // data가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(data)) {
      return [];
    }
    
    let filtered = data;

    // 테마 필터링
    if (theme !== '전체') {
      filtered = data.filter(lego => lego['테마'] === theme);
    }

    // 정렬
    if (sortOrder === 'profit-desc') {
      filtered = [...filtered].sort((a, b) => calculateProfitRate(b) - calculateProfitRate(a));
    } else if (sortOrder === 'profit-asc') {
      filtered = [...filtered].sort((a, b) => calculateProfitRate(a) - calculateProfitRate(b));
    } else if (sortOrder === 'price-desc') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = parseFloat(a['현재 시세 (원)']) || 0;
        const priceB = parseFloat(b['현재 시세 (원)']) || 0;
        return priceB - priceA;
      });
    } else if (sortOrder === 'price-asc') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = parseFloat(a['현재 시세 (원)']) || 0;
        const priceB = parseFloat(b['현재 시세 (원)']) || 0;
        return priceA - priceB;
      });
    } else if (sortOrder === 'name-asc') {
      filtered = [...filtered].sort((a, b) => (a['제품명'] || '').localeCompare(b['제품명'] || ''));
    }

    return filtered;
  };

  // legoList가 변경될 때 필터링 및 정렬 적용
  useEffect(() => {
    const result = applyFilterAndSort(legoList, selectedTheme, sortBy);
    setFilteredAndSortedList(result);
  }, [legoList, selectedTheme, sortBy]);

  // 분석 관련 함수들
  const getAnalysisData = () => {
    const validData = legoList.filter(lego => {
      const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
      const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
      return purchasePrice > 0 && currentPrice > 0;
    });

    const totalInvestment = validData.reduce((sum, lego) => 
      sum + (parseFloat(lego['구입 가격 (원)']) || 0), 0);
    
    const totalCurrentValue = validData.reduce((sum, lego) => 
      sum + (parseFloat(lego['현재 시세 (원)']) || 0), 0);

    const totalProfit = totalCurrentValue - totalInvestment;
    const totalProfitRate = totalInvestment > 0 ? (totalProfit / totalInvestment * 100) : 0;

    // 수익률 구간별 분석
    const profitRanges = {
      '20% 이상': 0,
      '10-20%': 0,
      '0-10%': 0,
      '0~-10%': 0,
      '-10% 이하': 0
    };

    validData.forEach(lego => {
      const rate = calculateProfitRate(lego);
      if (rate >= 20) profitRanges['20% 이상']++;
      else if (rate >= 10) profitRanges['10-20%']++;
      else if (rate >= 0) profitRanges['0-10%']++;
      else if (rate >= -10) profitRanges['0~-10%']++;
      else profitRanges['-10% 이하']++;
    });

    // 테마별 분석
    const themeAnalysis = {};
    validData.forEach(lego => {
      const theme = lego['테마'] || '미분류';
      if (!themeAnalysis[theme]) {
        themeAnalysis[theme] = {
          count: 0,
          totalInvestment: 0,
          totalCurrentValue: 0,
          items: []
        };
      }
      const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
      const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
      
      themeAnalysis[theme].count++;
      themeAnalysis[theme].totalInvestment += purchasePrice;
      themeAnalysis[theme].totalCurrentValue += currentPrice;
      themeAnalysis[theme].items.push(lego);
    });

    // 테마별 수익률 계산
    Object.keys(themeAnalysis).forEach(theme => {
      const data = themeAnalysis[theme];
      data.profit = data.totalCurrentValue - data.totalInvestment;
      data.profitRate = data.totalInvestment > 0 ? 
        (data.profit / data.totalInvestment * 100) : 0;
    });

    // TOP/WORST 수익률
    const sortedByProfitRate = validData
      .map(lego => ({ ...lego, profitRate: calculateProfitRate(lego) }))
      .sort((a, b) => b.profitRate - a.profitRate);

    // 년도별 분석 (구입일 기준)
    const yearlyAnalysis = {};
    validData.forEach(lego => {
      const purchaseDate = lego['구입일'];
      if (!purchaseDate) return;

      // 다양한 날짜 형식 처리
      let year;
      if (purchaseDate.includes('-')) {
        year = purchaseDate.split('-')[0];
      } else if (purchaseDate.includes('/')) {
        const parts = purchaseDate.split('/');
        // 년/월/일 또는 월/일/년 형식 처리
        if (parts[0].length === 4) {
          year = parts[0]; // 년/월/일
        } else if (parts[2] && parts[2].length === 4) {
          year = parts[2]; // 월/일/년
        } else if (parts[2] && parts[2].length === 2) {
          year = '20' + parts[2]; // 월/일/YY -> 20YY
        }
      } else if (purchaseDate.includes('.')) {
        const parts = purchaseDate.split('.');
        if (parts[0].length === 4) {
          year = parts[0]; // 년.월.일
        } else if (parts[2] && parts[2].length === 4) {
          year = parts[2]; // 일.월.년
        }
      } else if (/^\d{4}/.test(purchaseDate)) {
        year = purchaseDate.substring(0, 4); // 연도가 앞에 오는 경우
      }

      // 유효한 년도인지 확인 (1990-2030 범위)
      if (!year || isNaN(year) || year < 1990 || year > 2030) return;

      if (!yearlyAnalysis[year]) {
        yearlyAnalysis[year] = {
          count: 0,
          totalInvestment: 0,
          totalCurrentValue: 0,
          items: []
        };
      }

      const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
      const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;

      yearlyAnalysis[year].count++;
      yearlyAnalysis[year].totalInvestment += purchasePrice;
      yearlyAnalysis[year].totalCurrentValue += currentPrice;
      yearlyAnalysis[year].items.push(lego);
    });

    // 년도별 수익률 계산
    Object.keys(yearlyAnalysis).forEach(year => {
      const data = yearlyAnalysis[year];
      data.profit = data.totalCurrentValue - data.totalInvestment;
      data.profitRate = data.totalInvestment > 0 ? 
        (data.profit / data.totalInvestment * 100) : 0;
      
      // 평균 수익률 (각 아이템의 개별 수익률의 평균)
      const individualProfitRates = data.items.map(lego => calculateProfitRate(lego));
      data.averageProfitRate = individualProfitRates.length > 0 ?
        individualProfitRates.reduce((sum, rate) => sum + rate, 0) / individualProfitRates.length : 0;
    });

    return {
      totalItems: legoList.length,
      validItems: validData.length,
      totalInvestment,
      totalCurrentValue,
      totalProfit,
      totalProfitRate,
      profitRanges,
      themeAnalysis,
      yearlyAnalysis,
      topPerformers: sortedByProfitRate.slice(0, 5),
      worstPerformers: sortedByProfitRate.slice(-5).reverse()
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('등록된 레고 정보:', formData);
    
    // DB에 저장 함수
    const success = await saveToExcelFile(formData);
    
    if (success) {
      alert('레고가 DB에 정상적으로 저장되었습니다!');
      
      setFormData({
        releaseDate: '',
        legoNumber: '',
        productName: '',
        theme: '',
        purchaseDate: '',
        retailPrice: '',
        purchasePrice: '',
        currentPrice: '',
        status: '',
        imageUrl: ''
      });
    }
  };

  // API를 통해 DB에 저장하는 함수
  const saveToExcelFile = async (data) => {
    try {
      const newRecord = {
        '출시일': data.releaseDate,
        '레고 번호': data.legoNumber,
        '제품명': data.productName,
        '테마': data.theme,
        '구입일': data.purchaseDate,
        '정가 (원)': data.retailPrice,
        '구입 가격 (원)': data.purchasePrice,
        '현재 시세 (원)': data.currentPrice,
        '상태': data.status,
        '이미지 URL': data.imageUrl
      };

      const response = await fetch('http://localhost:3001/api/legos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord)
      });

      const result = await response.json();
      
      if (result.success) {
        // 등록 후 데이터 다시 불러오기
        await loadLegoData();
        
        // 파일 상태 업데이트
        loadFileStatus();
        
        console.log('레고 데이터가 DB에 성공적으로 저장되었습니다.');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('데이터 저장 중 오류:', error);
      alert(`데이터 저장 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  };

  // 엑셀 파일 다운로드 함수
  const downloadExcelFile = (data) => {
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
        { wch: 20 }  // 등록 시간
      ];
      worksheet['!cols'] = colWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

      // 파일 다운로드
      XLSX.writeFile(workbook, 'my_lego_list.xlsx');
      
      console.log('my_lego_list.xlsx 파일 다운로드 완료');
    } catch (error) {
      console.error('엑셀 파일 다운로드 오류:', error);
      alert('엑셀 파일 다운로드 중 오류가 발생했습니다.');
    }
  };


  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 변환
        const convertedData = jsonData.map((row, index) => {
          const keys = Object.keys(row);
          return {
            releaseDate: formatDate(row[keys[0]]) || '',
            legoNumber: String(row[keys[1]] || ''),
            productName: String(row[keys[2]] || ''),
            theme: String(row[keys[3]] || ''),
            purchaseDate: formatDate(row[keys[4]]) || '',
            retailPrice: String(row[keys[5]] || ''),
            purchasePrice: String(row[keys[6]] || ''),
            currentPrice: String(row[keys[7]] || ''),
            status: String(row[keys[8]] || ''),
            // 9번째 컬럼에 이미지 URL이 있으면 사용, 없으면 레고 번호로 자동 생성
            imageUrl: handleImageUrl(row[keys[9]] && String(row[keys[9]]).trim(), row[keys[1]])
          };
        });

        setPreviewData(convertedData);
        console.log('엑셀 파일 로딩 완료:', convertedData);
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다. 올바른 엑셀 파일인지 확인해주세요.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 날짜 포맷 변환 함수
  const formatDate = (value) => {
    if (!value) return '';
    
    // 엑셀 날짜 시리얼 번호인 경우
    if (typeof value === 'number' && value > 25569) {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // 문자열인 경우
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return '';
  };

  // 일괄 등록 핸들러
  const handleBulkSubmit = async () => {
    if (previewData.length === 0) {
      alert('등록할 데이터가 없습니다.');
      return;
    }

    try {
      // 새로운 데이터들 준비
      const newRecords = previewData.map(data => ({
        '출시일': data.releaseDate,
        '레고 번호': data.legoNumber,
        '제품명': data.productName,
        '테마': data.theme,
        '구입일': data.purchaseDate,
        '정가 (원)': data.retailPrice,
        '구입 가격 (원)': data.purchasePrice,
        '현재 시세 (원)': data.currentPrice,
        '상태': data.status,
        '이미지 URL': data.imageUrl
      }));

      const response = await fetch('http://localhost:3001/api/legos/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: newRecords })
      });

      const result = await response.json();
      
      if (result.success) {
        // 일괄 업로드 후 데이터 다시 불러오기
        await loadLegoData();

        // 파일 상태 업데이트
        loadFileStatus();

        // 미리보기 데이터 초기화
        setPreviewData([]);

        alert(`${newRecords.length}개의 레고가 DB에 정상적으로 저장되었습니다!`);

        // 레고 목록 페이지로 이동
        setCurrentPage('list');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('일괄 등록 오류:', error);
      alert(`일괄 등록 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 엑셀 양식 다운로드 함수
  const downloadTemplate = () => {
    try {
      // 샘플 데이터 생성
      const templateData = [
        {
          '출시일': '2023-01-15',
          '레고 번호': '6036',
          '제품명': '레고 캐슬 드래곤 나이츠',
          '테마': 'Castle',
          '구입일': '2023-12-25',
          '정가 (원)': '50000',
          '구입 가격 (원)': '35000',
          '현재 시세 (원)': '45000',
          '상태': '보관 중',
          '이미지 URL': ''
        },
        {
          '출시일': '2023-05-20',
          '레고 번호': '10024',
          '제품명': '레고 크리에이터 시티',
          '테마': 'Creator',
          '구입일': '2023-11-11',
          '정가 (원)': '120000',
          '구입 가격 (원)': '89000',
          '현재 시세 (원)': '110000',
          '상태': '조립 완료',
          '이미지 URL': 'https://example.com/custom-image.jpg'
        },
        {
          '출시일': '2023-08-10',
          '레고 번호': '75192',
          '제품명': '레고 스타워즈 밀레니엄 팰콘',
          '테마': 'Star Wars',
          '구입일': '2024-01-01',
          '정가 (원)': '899000',
          '구입 가격 (원)': '750000',
          '현재 시세 (원)': '850000',
          '상태': '판매 완료',
          '이미지 URL': ''
        }
      ];

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
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
        { wch: 12 }  // 상태
      ];
      worksheet['!cols'] = colWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '레고 등록 양식');

      // 파일 다운로드
      XLSX.writeFile(workbook, '레고_등록_양식.xlsx');
      
      console.log('엑셀 양식 다운로드 완료');
    } catch (error) {
      console.error('양식 다운로드 오류:', error);
      alert('양식 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 수정 시작 함수
  const startEdit = (index, lego) => {
    setEditingIndex(index);
    setEditingLegoId(lego.id); // 실제 DB ID 저장
    setUserModifiedImageUrl(false); // 수정 시작 시 플래그 초기화
    setEditFormData({
      releaseDate: lego['출시일'],
      legoNumber: lego['레고 번호'],
      productName: lego['제품명'],
      theme: lego['테마'] || '',
      purchaseDate: lego['구입일'],
      retailPrice: lego['정가 (원)'],
      purchasePrice: lego['구입 가격 (원)'],
      currentPrice: lego['현재 시세 (원)'] || '',
      status: lego['상태'] || '',
      imageUrl: lego['이미지 URL']
    });
  };

  // 수정 취소 함수
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingLegoId(null);
    setEditFormData({});
    setUserModifiedImageUrl(false); // 플래그 초기화
  };

  // 수정 폼 데이터 변경 핸들러
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'legoNumber') {
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        // 사용자가 이미지 URL을 직접 수정하지 않았을 때만 자동 생성
        imageUrl: userModifiedImageUrl ? prev.imageUrl : handleImageUrl(prev.imageUrl, value)
      }));
    } else if (name === 'imageUrl') {
      // 이미지 URL을 직접 수정한 것으로 표시
      setUserModifiedImageUrl(true);
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 수정 저장 함수
  const saveEdit = async () => {
    try {
      const updatedRecord = {
        '출시일': editFormData.releaseDate,
        '레고 번호': editFormData.legoNumber,
        '제품명': editFormData.productName,
        '테마': editFormData.theme,
        '구입일': editFormData.purchaseDate,
        '정가 (원)': editFormData.retailPrice,
        '구입 가격 (원)': editFormData.purchasePrice,
        '현재 시세 (원)': editFormData.currentPrice,
        '상태': editFormData.status,
        '이미지 URL': editFormData.imageUrl,
        '등록 시간': legoList[editingIndex]['등록 시간'] // 기존 등록 시간 유지
      };

      const response = await fetch(`http://localhost:3001/api/legos/${editingLegoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord)
      });

      const result = await response.json();
      
      if (result.success) {
        // 수정 후 데이터 다시 불러오기
        await loadLegoData();
        
        // 파일 상태 업데이트
        loadFileStatus();
        
        // 수정 모드 종료
        setEditingIndex(null);
        setEditingLegoId(null);
        setEditFormData({});
        setUserModifiedImageUrl(false); // 플래그 초기화

        alert('레고 정보가 DB에 정상적으로 수정되었습니다!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('수정 저장 오류:', error);
      alert(`수정 저장 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 삭제 함수
  const deleteLego = async (legoId) => {
    if (window.confirm('정말로 이 레고를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/legos/${legoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.success) {
          // 삭제 후 데이터 다시 불러오기
          await loadLegoData();
          
          // 파일 상태 업데이트
          loadFileStatus();

          alert('레고가 DB에서 정상적으로 삭제되었습니다!');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  // JavaScript로 강제로 모든 CSS 제거하고 전체 화면 사용
  useEffect(() => {
    const forceFullWidth = () => {
      // 1. 모든 CSS 스타일시트 제거
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
      stylesheets.forEach(sheet => {
        if (sheet.href && !sheet.href.includes('fonts')) {
          sheet.disabled = true;
        }
      });

      // 2. body와 html 강제 설정
      document.documentElement.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow-x: auto !important;
        overflow-y: auto !important;
      `;
      
      document.body.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: none !important;
        overflow-x: auto !important;
        overflow-y: auto !important;
        font-family: Arial, sans-serif !important;
      `;

      // 3. 모든 div 요소 강제 설정
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach(div => {
        const computed = window.getComputedStyle(div);
        if (computed.maxWidth && computed.maxWidth !== 'none') {
          div.style.maxWidth = 'none !important';
        }
        if (computed.width && computed.width.includes('px') && parseInt(computed.width) < window.innerWidth) {
          div.style.width = 'auto !important';
        }
      });

      // 4. React root 요소 강제 설정
      const root = document.getElementById('root');
      if (root) {
        root.style.cssText = `
          width: 100vw !important;
          min-width: 100vw !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        `;
      }

      console.log('강제 전체 화면 적용 완료!');
      console.log('현재 화면 너비:', window.innerWidth);
      console.log('body 너비:', document.body.offsetWidth);
    };

    forceFullWidth();
    
    // 창 크기 변경시에도 재적용
    window.addEventListener('resize', forceFullWidth);
    
    return () => {
      window.removeEventListener('resize', forceFullWidth);
    };
  }, []);

  // 사이드바 컴포넌트
  const renderSidebar = () => (
    <div style={{
      position: 'fixed',
      left: sidebarOpen ? '0' : '-250px',
      top: '0',
      width: '250px',
      height: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      transition: 'left 0.3s ease',
      zIndex: 10000,
      boxShadow: '2px 0 5px rgba(0,0,0,0.3)'
    }}>
      {/* 사이드바 헤더 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#333333',
        borderBottom: '1px solid #000000'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="https://images.brickset.com/sets/images/6036-1.jpg" 
            alt="레고" 
            style={{
              width: '40px',
              height: '30px',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>레고 관리</span>
        </div>
      </div>

      {/* 메뉴 항목들 */}
      <div style={{ padding: '20px 0' }}>
        <button
          onClick={() => setCurrentPage('register')}
          style={{
            width: '100%',
            padding: '15px 20px',
            backgroundColor: currentPage === 'register' ? '#000000' : 'transparent',
            color: 'white',
            border: 'none',
            textAlign: 'left',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (currentPage !== 'register') {
              e.target.style.backgroundColor = '#333333';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'register') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📦</span>
          레고 등록하기
        </button>

        <button
          onClick={() => setCurrentPage('list')}
          style={{
            width: '100%',
            padding: '15px 20px',
            backgroundColor: currentPage === 'list' ? '#000000' : 'transparent',
            color: 'white',
            border: 'none',
            textAlign: 'left',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (currentPage !== 'list') {
              e.target.style.backgroundColor = '#333333';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'list') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📋</span>
          레고 목록
        </button>

        <button
          onClick={() => setCurrentPage('bulk')}
          style={{
            width: '100%',
            padding: '15px 20px',
            backgroundColor: currentPage === 'bulk' ? '#000000' : 'transparent',
            color: 'white',
            border: 'none',
            textAlign: 'left',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (currentPage !== 'bulk') {
              e.target.style.backgroundColor = '#333333';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'bulk') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📂</span>
          레고 일괄 등록
        </button>


        <button
          onClick={() => setCurrentPage('analysis')}
          style={{
            width: '100%',
            padding: '15px 20px',
            backgroundColor: currentPage === 'analysis' ? '#000000' : 'transparent',
            color: 'white',
            border: 'none',
            textAlign: 'left',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (currentPage !== 'analysis') {
              e.target.style.backgroundColor = '#333333';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'analysis') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          수익률 분석
        </button>
      </div>
    </div>
  );

  // 레고 목록 컴포넌트
  const renderLegoList = () => (
    <div style={{ padding: '20px', backgroundColor: '#f8f8f8', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '1.5rem', 
          padding: '15px', 
          background: '#000000', 
          color: 'white', 
          margin: '0',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)',
          flex: 1
        }}>
          📋 레고 목록 ({(legoList || []).length}개)
        </h1>
        
        <button
          onClick={() => {
            console.log('수동 데이터 새로고침 버튼 클릭');
            loadLegoData();
            loadFileStatus();
          }}
          style={{
            marginLeft: '15px',
            padding: '15px 20px',
            backgroundColor: '#000000',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(39, 174, 96, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#333333';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#000000';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 새로고침
        </button>

        <button
          onClick={async () => {
            try {
              console.log('🔧 디버깅: 엑셀 파일 원시 데이터 확인');
              const response = await fetch('http://localhost:3001/api/debug/excel');
              const result = await response.json();
              
              console.log('🔍 디버깅 결과:', result);
              
              if (result.success) {
                alert(`디버깅 정보 (콘솔 확인):\n\n` +
                     `파일 경로: ${result.debug.filePath}\n` +
                     `워크시트: ${result.debug.worksheetNames.join(', ')}\n` +
                     `데이터 범위: ${result.debug.range}\n` +
                     `JSON 데이터: ${result.debug.jsonData.count}개\n` +
                     `배열 데이터: ${result.debug.arrayData.count}개\n` +
                     `헤더: ${result.debug.arrayData.headers.join(', ')}\n\n` +
                     `자세한 내용은 브라우저 콘솔(F12)을 확인하세요.`);
              } else {
                alert(`디버깅 실패: ${result.error}`);
              }
            } catch (error) {
              console.error('디버깅 API 호출 실패:', error);
              alert(`디버깅 API 호출 실패: ${error.message}`);
            }
          }}
          style={{
            marginLeft: '10px',
            padding: '15px 20px',
            backgroundColor: '#000000',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#333333';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#000000';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔧 디버깅
        </button>
      </div>

      {/* 파일 상태 정보 패널 */}
      {fileStatus && (
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: `2px solid #000000`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>
              ✅
            </span>
            <strong style={{ color: '#000000' }}>
              Supabase 데이터베이스 연결됨
            </strong>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666666' }}>
            <div>🗄️ 데이터베이스: PostgreSQL (Supabase)</div>
            <div>📊 저장된 레고 수: {fileStatus?.totalItems || 0}개</div>
            {fileStatus?.timestamp && (
              <div>🕒 마지막 확인: {new Date(fileStatus.timestamp).toLocaleString('ko-KR')}</div>
            )}
          </div>
        </div>
      )}

      {/* 필터 및 정렬 패널 */}
      {legoList.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #000000'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {/* 테마 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#000000' }}>🎯 테마:</span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #bdc3c7',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              >
                {getUniqueThemes(legoList).map(theme => (
                  <option key={theme} value={theme}>
                    {theme} {theme !== '전체' && `(${legoList.filter(l => l['테마'] === theme).length}개)`}
                  </option>
                ))}
              </select>
            </div>

            {/* 정렬 옵션 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#000000' }}>📊 정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #bdc3c7',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              >
                <option value="none">기본 순서</option>
                <option value="profit-desc">💰 수익률 높은 순</option>
                <option value="profit-asc">📉 수익률 낮은 순</option>
                <option value="price-desc">💎 현재 가격 높은 순</option>
                <option value="price-asc">💸 현재 가격 낮은 순</option>
                <option value="name-asc">🔤 제품명 순</option>
              </select>
            </div>

            {/* 결과 개수 표시 */}
            <div style={{ 
              marginLeft: 'auto',
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {selectedTheme === '전체' ? 
                `전체 ${filteredAndSortedList?.length || 0}개` : 
                `${selectedTheme} ${filteredAndSortedList?.length || 0}개`
              }
            </div>
          </div>
        </div>
      )}

      {legoList.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <p style={{ fontSize: '1.5rem', color: '#666666', marginBottom: '20px' }}>
            아직 등록된 레고가 없습니다.
          </p>
          <p style={{ fontSize: '1.2rem', color: '#666666' }}>
            레고를 등록해보세요!
          </p>
          <button
            onClick={() => setCurrentPage('register')}
            style={{
              marginTop: '30px',
              padding: '15px 30px',
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            레고 등록하러 가기
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {(!filteredAndSortedList || filteredAndSortedList.length === 0) ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              fontSize: '1.1rem'
            }}>
              📦 등록된 레고가 없습니다. 
              <button 
                onClick={() => setCurrentPage('register')}
                style={{
                  marginLeft: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                레고 등록하기
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {filteredAndSortedList.map((lego, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: editingIndex === index ? '0 4px 15px rgba(52, 152, 219, 0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                border: editingIndex === index ? '2px solid #000000' : 'none'
              }}
              onMouseOver={(e) => {
                if (editingIndex !== index) {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                }
              }}
              onMouseOut={(e) => {
                if (editingIndex !== index) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                }
              }}>
                {/* 이미지 섹션 */}
                <div 
                  style={{
                    height: '150px',
                    overflow: 'hidden',
                    backgroundColor: '#f8f8f8',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => {
                    const legoNumber = lego['레고 번호'];
                    if (legoNumber) {
                      const bricksetUrl = `https://brickset.com/sets/${legoNumber}-1`;
                      window.open(bricksetUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* 클릭 힌트 오버레이 */}
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}>
                    🔗 클릭시 Brickset
                  </div>

                  {lego['이미지 URL'] ? (
                    <img
                      src={lego['이미지 URL']}
                      alt={lego['제품명']}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'all 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: lego['이미지 URL'] ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666666',
                    fontSize: '2rem',
                    flexDirection: 'column',
                    gap: '5px'
                  }}>
                    🧱
                    <div style={{ fontSize: '0.7rem', color: '#666666' }}>
                      클릭하여 Brickset에서 확인
                    </div>
                  </div>
                </div>

                {/* 정보 섹션 */}
                <div style={{ padding: '15px' }}>
                  {/* 수정/삭제 버튼 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '5px',
                    marginBottom: '10px'
                  }}>
                    {editingIndex === index ? (
                      <>
                        <button
                          onClick={saveEdit}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#000000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✅ 저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#666666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ❌ 취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(index, lego)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#000000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => deleteLego(lego.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#000000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </>
                    )}
                  </div>

                  {editingIndex === index ? (
                    /* 수정 모드 */
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        color: '#000000',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                      }}>
                        📝 수정 중...
                      </h3>

                      {/* 수정 폼 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>제품명</label>
                          <input
                            type="text"
                            name="productName"
                            value={editFormData.productName || ''}
                            onChange={handleEditInputChange}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #bdc3c7',
                              borderRadius: '3px',
                              marginTop: '3px'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>테마</label>
                          <input
                            type="text"
                            name="theme"
                            value={editFormData.theme || ''}
                            onChange={handleEditInputChange}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #bdc3c7',
                              borderRadius: '3px',
                              marginTop: '3px'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>레고 번호</label>
                            <input
                              type="text"
                              name="legoNumber"
                              value={editFormData.legoNumber || ''}
                              onChange={handleEditInputChange}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '0.8rem',
                                border: '1px solid #bdc3c7',
                                borderRadius: '3px',
                                marginTop: '3px'
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>출시일</label>
                            <input
                              type="date"
                              name="releaseDate"
                              value={editFormData.releaseDate || ''}
                              onChange={handleEditInputChange}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '0.8rem',
                                border: '1px solid #bdc3c7',
                                borderRadius: '3px',
                                marginTop: '3px'
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>구입일</label>
                            <input
                              type="date"
                              name="purchaseDate"
                              value={editFormData.purchaseDate || ''}
                              onChange={handleEditInputChange}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '0.8rem',
                                border: '1px solid #bdc3c7',
                                borderRadius: '3px',
                                marginTop: '3px'
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>정가</label>
                            <input
                              type="number"
                              name="retailPrice"
                              value={editFormData.retailPrice || ''}
                              onChange={handleEditInputChange}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '0.8rem',
                                border: '1px solid #bdc3c7',
                                borderRadius: '3px',
                                marginTop: '3px'
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>구입가</label>
                            <input
                              type="number"
                              name="purchasePrice"
                              value={editFormData.purchasePrice || ''}
                              onChange={handleEditInputChange}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '0.8rem',
                                border: '1px solid #bdc3c7',
                                borderRadius: '3px',
                                marginTop: '3px'
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>현재 시세 (선택사항)</label>
                          <input
                            type="number"
                            name="currentPrice"
                            value={editFormData.currentPrice || ''}
                            onChange={handleEditInputChange}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #bdc3c7',
                              borderRadius: '3px',
                              marginTop: '3px'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>상태</label>
                          <select
                            name="status"
                            value={editFormData.status || ''}
                            onChange={handleEditInputChange}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #bdc3c7',
                              borderRadius: '3px',
                              marginTop: '3px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="">상태를 선택하세요</option>
                            <option value="미개봉">📦 미개봉</option>
                            <option value="개봉">📂 개봉</option>
                            <option value="조립 중">🔧 조립 중</option>
                            <option value="조립 완료">✅ 조립 완료</option>
                            <option value="보관 중">📚 보관 중</option>
                            <option value="전시 중">🏆 전시 중</option>
                            <option value="판매 예정">💰 판매 예정</option>
                            <option value="판매 완료">✔️ 판매 완료</option>
                            <option value="분실/파손">❌ 분실/파손</option>
                          </select>
                        </div>

                        {/* 이미지 URL 필드 추가 */}
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000' }}>이미지 URL</label>
                          <input
                            type="url"
                            name="imageUrl"
                            value={editFormData.imageUrl || ''}
                            onChange={handleEditInputChange}
                            placeholder="직접 입력하거나 레고 번호 변경 시 자동 생성"
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #bdc3c7',
                              borderRadius: '3px',
                              marginTop: '3px'
                            }}
                          />
                        </div>

                        {/* 이미지 미리보기 */}
                        {editFormData.imageUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={editFormData.imageUrl}
                              alt="레고 이미지 미리보기"
                              style={{
                                width: '100%',
                                maxWidth: '200px',
                                height: 'auto',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 일반 표시 모드 */
                    <div>
                      <h3 style={{
                        fontSize: '1.1rem',
                        color: '#000000',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                      }}>
                        {lego['제품명'] || '제품명 없음'}
                      </h3>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#000000', fontSize: '0.9rem' }}>레고 번호:</strong>
                    <span style={{ marginLeft: '8px', color: '#666666', fontSize: '0.9rem' }}>
                      {lego['레고 번호']}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#000000', fontSize: '0.9rem' }}>테마:</strong>
                    <span style={{ marginLeft: '8px', color: '#666666', fontSize: '0.9rem' }}>
                      {lego['테마'] || '미설정'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#000000', fontSize: '0.9rem' }}>출시일:</strong>
                    <span style={{ marginLeft: '8px', color: '#666666', fontSize: '0.9rem' }}>
                      {lego['출시일']}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#000000', fontSize: '0.9rem' }}>구입일:</strong>
                    <span style={{ marginLeft: '8px', color: '#666666', fontSize: '0.9rem' }}>
                      {lego['구입일']}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#000000', fontSize: '0.9rem' }}>상태:</strong>
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '0.9rem',
                      color: (() => {
                        const status = lego['상태'];
                        if (status === '판매 완료') return '#000000';
                        if (status === '조립 완료') return '#000000';
                        if (status === '미개봉') return '#000000';
                        if (status === '전시 중') return '#f39c12';
                        return '#666666';
                      })(),
                      fontWeight: 'bold'
                    }}>
                      {lego['상태'] || '미설정'}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666666' }}>정가</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#000000' }}>
                        {parseInt(lego['정가 (원)']).toLocaleString()}원
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666666' }}>구입가</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#000000' }}>
                        {parseInt(lego['구입 가격 (원)']).toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666666' }}>현재시세</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: lego['현재 시세 (원)'] ? '#000000' : '#666666' }}>
                        {lego['현재 시세 (원)'] ? parseInt(lego['현재 시세 (원)']).toLocaleString() + '원' : '미조사'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                        수익률*
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: (() => {
                        const profitRate = calculateProfitRate(lego);
                        if (profitRate > 10) return '#000000';  // 좋은 수익률 (녹색)
                        if (profitRate > 0) return '#f39c12';   // 약간의 수익 (주황색)
                        if (profitRate < -10) return '#000000'; // 큰 손실 (빨간색)
                        if (profitRate < 0) return '#e67e22';   // 작은 손실 (어두운 주황색)
                        return '#666666'; // 무변화 (회색)
                      })()} }>
                        {(() => {
                          const profitRate = calculateProfitRate(lego);
                          return profitRate.toFixed(1) + '%';
                        })()}
                        {(() => {
                          const profitRate = calculateProfitRate(lego);
                          if (profitRate > 20) return ' 🚀';
                          if (profitRate > 10) return ' 📈';
                          if (profitRate > 0) return ' 📊';
                          if (profitRate < -10) return ' 📉';
                          if (profitRate < 0) return ' ⚠️';
                          return '';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 수익 정보 */}
                  {(() => {
                    const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
                    const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
                    const profit = currentPrice - purchasePrice;
                    const profitRate = calculateProfitRate(lego);
                    
                    if (profit !== 0) {
                      return (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: (() => {
                            if (profitRate > 10) return '#f0f0f0'; // 좋은 수익 (연한 녹색)
                            if (profitRate > 0) return '#fff3cd';  // 약간의 수익 (연한 노랑)
                            if (profitRate < -10) return '#f0f0f0'; // 큰 손실 (연한 빨강)
                            if (profitRate < 0) return '#ffeaa7';  // 작은 손실 (연한 주황)
                            return '#e9ecef'; // 무변화 (연한 회색)
                          })(),
                          borderRadius: '4px',
                          textAlign: 'center',
                          border: `1px solid ${(() => {
                            if (profitRate > 10) return '#000000';
                            if (profitRate > 0) return '#f39c12';
                            if (profitRate < -10) return '#000000';
                            if (profitRate < 0) return '#e67e22';
                            return '#666666';
                          })()}`
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            color: (() => {
                              if (profitRate > 10) return '#000000';
                              if (profitRate > 0) return '#b7950b';
                              if (profitRate < -10) return '#922b21';
                              if (profitRate < 0) return '#a04000';
                              return '#5d6d7e';
                            })(),
                            fontWeight: 'bold'
                          }}>
                            {(() => {
                              if (profitRate > 20) return '🚀 대박 수익!';
                              if (profitRate > 10) return '📈 좋은 투자';
                              if (profitRate > 0) return '📊 수익 중';
                              if (profitRate < -20) return '📉 큰 손실';
                              if (profitRate < 0) return '⚠️ 손실 중';
                              return '➖ 변화 없음';
                            })()} {profit > 0 ? '+' : ''}{profit.toLocaleString()}원
                            {!lego['현재 시세 (원)'] && currentPrice === 0 && (
                              <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.7 }}>
                                * 현재 시세 미조사
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.7rem',
                        color: '#666666',
                        textAlign: 'right'
                      }}>
                        등록: {lego['등록 시간']}
                        {lego['수정 시간'] && (
                          <div>수정: {lego['수정 시간']}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* 버튼들 */}
          <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadExcelFile(legoList)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#333333';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              📥 현재 목록 엑셀 다운로드
            </button>
            
            <button
              onClick={() => setCurrentPage('register')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#333333';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ➕ 새 레고 등록하기
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 레고 일괄 등록 컴포넌트
  const renderBulkRegister = () => (
    <div style={{ padding: '20px', backgroundColor: '#f8f8f8', minHeight: '100vh' }}>
      <h1 style={{
        textAlign: 'center', 
        fontSize: '1.5rem', 
        padding: '15px', 
        background: '#000000', 
        color: 'white', 
        margin: '0 0 20px 0',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)'
      }}>
        📂 레고 일괄 등록
      </h1>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '1.5rem',
            color: '#000000',
            marginBottom: '15px'
          }}>
            📋 엑셀 파일 업로드
          </h3>
          <p style={{ color: '#666666', marginBottom: '20px', lineHeight: '1.6' }}>
            엑셀 파일(.xlsx)을 업로드하여 여러 레고를 한번에 등록할 수 있습니다.<br/>
            파일의 첫 번째 행은 헤더로 인식되며, 다음 열 순서를 맞춰주세요:
          </p>
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <strong style={{ color: '#000000' }}>필요한 열 순서:</strong>
              <button
                onClick={downloadTemplate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#333333';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#000000';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                📥 엑셀 양식 다운로드
              </button>
            </div>
            <ul style={{ margin: '10px 0 0 20px', color: '#000000' }}>
              <li>출시일 (예: 2023-01-15)</li>
              <li>레고 번호 (예: 6036)</li>
              <li>제품명 (예: 레고 캐슬)</li>
              <li>테마 (예: Castle)</li>
              <li>구입일 (예: 2023-12-25)</li>
              <li>정가 (원) (예: 50000)</li>
              <li>구입 가격 (원) (예: 35000)</li>
              <li>현재 시세 (원) (예: 45000)</li>
              <li>상태 (예: 보관 중)</li>
              <li>이미지 URL (선택사항 - 비어있으면 레고 번호로 자동 생성)</li>
            </ul>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              border: '1px solid #000000'
            }}>
              <small style={{ color: '#000000', fontWeight: 'bold' }}>
                💡 팁: 양식을 다운로드하여 샘플 데이터를 참고하고, 기존 데이터를 삭제한 후 새로운 데이터를 입력하세요.
              </small>
            </div>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1.1rem',
              border: '2px dashed #000000',
              borderRadius: '8px',
              backgroundColor: '#f8f8f8',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* 미리보기 영역 */}
        {previewData.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h4 style={{
              fontSize: '1.3rem',
              color: '#000000',
              marginBottom: '15px'
            }}>
              📊 미리보기 ({previewData.length}개 항목)
            </h4>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #bdc3c7',
              borderRadius: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#000000', color: 'white' }}>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>출시일</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>레고 번호</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>제품명</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>테마</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>구입일</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>정가</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>구입가</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>현재시세</th>
                    <th style={{ padding: '10px', border: '1px solid #000000' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f8f8'
                    }}>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.releaseDate}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.legoNumber}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.productName}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.theme}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.purchaseDate}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.retailPrice}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.purchasePrice}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.currentPrice}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleBulkSubmit}
              style={{
                width: '100%',
                padding: '20px',
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px',
                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#333333';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
              }}
            >
              🚀 일괄 등록하기 ({previewData.length}개)
            </button>
          </div>
        )}
      </div>
    </div>
  );


  // 수익률 분석 대시보드 컴포넌트
  const renderAnalysisDashboard = () => {
    const analysisData = getAnalysisData();

    return (
      <div style={{ padding: '20px', backgroundColor: '#f8f8f8', minHeight: '100vh' }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          padding: '15px',
          background: '#8e44ad',
          color: 'white',
          margin: '0 0 20px 0',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(142, 68, 173, 0.3)'
        }}>
          📊 레고 수익률 분석 대시보드
        </h1>

        {/* 전체 요약 통계 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '3px solid #000000'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000000', marginBottom: '5px' }}>
                {analysisData.totalItems.toLocaleString()}개
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem' }}>
                전체 레고 수량
              </div>
              <div style={{ color: '#000000', fontSize: '0.8rem', marginTop: '5px' }}>
                분석 가능: {analysisData.validItems.toLocaleString()}개
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '3px solid #000000'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#000000', marginBottom: '5px' }}>
                {analysisData.totalInvestment.toLocaleString()}원
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem' }}>
                총 투자 금액
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '3px solid #000000'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📈</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#000000', marginBottom: '5px' }}>
                {analysisData.totalCurrentValue.toLocaleString()}원
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem' }}>
                현재 평가 금액
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: `3px solid ${analysisData.totalProfit >= 0 ? '#000000' : '#000000'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                {analysisData.totalProfit >= 0 ? '🚀' : '📉'}
              </div>
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: 'bold', 
                color: analysisData.totalProfit >= 0 ? '#000000' : '#000000', 
                marginBottom: '5px' 
              }}>
                {analysisData.totalProfit >= 0 ? '+' : ''}{analysisData.totalProfit.toLocaleString()}원
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem' }}>
                총 수익/손실
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: analysisData.totalProfitRate >= 0 ? '#000000' : '#000000',
                marginTop: '5px'
              }}>
                ({analysisData.totalProfitRate.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        {/* 수익률 구간별 분석 */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            color: '#000000',
            marginBottom: '20px',
            textAlign: 'center',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            📊 수익률 구간별 분포
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px'
          }}>
            {Object.entries(analysisData.profitRanges).map(([range, count]) => {
              const colors = {
                '20% 이상': { bg: '#f0f0f0', border: '#000000', text: '#000000' },
                '10-20%': { bg: '#fff3cd', border: '#f39c12', text: '#b7950b' },
                '0-10%': { bg: '#e9ecef', border: '#6c757d', text: '#495057' },
                '0~-10%': { bg: '#ffeaa7', border: '#e67e22', text: '#a04000' },
                '-10% 이하': { bg: '#f0f0f0', border: '#000000', text: '#922b21' }
              };
              const color = colors[range];
              
              return (
                <div key={range} style={{
                  textAlign: 'center',
                  padding: '15px 10px',
                  backgroundColor: color.bg,
                  border: `2px solid ${color.border}`,
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: color.text,
                    marginBottom: '5px'
                  }}>
                    {count}개
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: color.text,
                    fontWeight: 'bold'
                  }}>
                    {range}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 테마별 수익률 분석 */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            color: '#000000',
            marginBottom: '20px',
            textAlign: 'center',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            🎯 테마별 수익률 분석
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {Object.entries(analysisData.themeAnalysis)
              .sort(([,a], [,b]) => b.profitRate - a.profitRate)
              .slice(0, 6)
              .map(([theme, data]) => (
              <div key={theme} style={{
                padding: '20px',
                backgroundColor: '#f8f8f8',
                borderRadius: '8px',
                border: `3px solid ${data.profitRate >= 0 ? '#000000' : '#000000'}`
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#000000',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🎨 {theme}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '10px' }}>
                  <strong>수량:</strong> {data.count}개
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '10px' }}>
                  <strong>투자액:</strong> {data.totalInvestment.toLocaleString()}원
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '15px' }}>
                  <strong>현재값:</strong> {data.totalCurrentValue.toLocaleString()}원
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: data.profitRate >= 0 ? '#f0f0f0' : '#f0f0f0',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: data.profitRate >= 0 ? '#000000' : '#000000'
                  }}>
                    {data.profitRate >= 0 ? '+' : ''}{data.profit.toLocaleString()}원
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: data.profitRate >= 0 ? '#000000' : '#000000'
                  }}>
                    ({data.profitRate.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP & WORST 수익률 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* TOP 5 */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '3px solid #000000'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              color: '#000000',
              marginBottom: '20px',
              textAlign: 'center',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '10px'
            }}>
              🏆 TOP 5 수익률
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {analysisData.topPerformers.map((lego, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  border: '1px solid #000000'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#000000', fontSize: '0.9rem' }}>
                      #{lego['레고 번호']} {lego['제품명'] || '제품명 없음'}
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.8rem' }}>
                      {lego['테마'] || '미분류'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#000000'
                  }}>
                    +{lego.profitRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WORST 5 */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '3px solid #000000'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              color: '#000000',
              marginBottom: '20px',
              textAlign: 'center',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '10px'
            }}>
              📉 WORST 5 수익률
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {analysisData.worstPerformers.map((lego, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  border: '1px solid #000000'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#000000', fontSize: '0.9rem' }}>
                      #{lego['레고 번호']} {lego['제품명'] || '제품명 없음'}
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.8rem' }}>
                      {lego['테마'] || '미분류'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#000000'
                  }}>
                    {lego.profitRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 년도별 수익률 분석 */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            color: '#000000',
            marginBottom: '20px',
            textAlign: 'center',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            📅 년도별 투자 성과 분석
          </h2>

          {Object.keys(analysisData.yearlyAnalysis).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666666',
              backgroundColor: '#f8f8f8',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                구입일 데이터가 부족합니다
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                레고 등록 시 구입일을 입력하면 년도별 분석을 확인할 수 있습니다
              </div>
            </div>
          ) : (
            <>
              {/* 년도별 요약 통계 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                {Object.entries(analysisData.yearlyAnalysis)
                  .sort(([a], [b]) => b.localeCompare(a)) // 최신 년도부터
                  .slice(0, 5) // 최근 5년만 표시
                  .map(([year, data]) => (
                  <div key={year} style={{
                    padding: '20px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '10px',
                    border: `3px solid ${data.profitRate >= 0 ? '#000000' : '#000000'}`,
                    textAlign: 'center',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#000000',
                      marginBottom: '10px'
                    }}>
                      🗓️ {year}년
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '15px',
                      fontSize: '0.85rem',
                      color: '#666666'
                    }}>
                      <div>
                        <strong>{data.count}</strong>개 구매
                      </div>
                      <div>
                        <strong>{(data.totalInvestment / 10000).toFixed(0)}</strong>만원 투자
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: data.profitRate >= 0 ? '#f0f0f0' : '#f0f0f0',
                      borderRadius: '6px',
                      border: `1px solid ${data.profitRate >= 0 ? '#000000' : '#000000'}`
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: data.profitRate >= 0 ? '#000000' : '#000000'
                      }}>
                        {data.profitRate >= 0 ? '+' : ''}{data.profitRate.toFixed(1)}%
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: data.profitRate >= 0 ? '#000000' : '#922b21',
                        marginTop: '3px'
                      }}>
                        {data.profit >= 0 ? '+' : ''}{(data.profit / 10000).toFixed(1)}만원
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666666',
                        marginTop: '5px'
                      }}>
                        평균: {data.averageProfitRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 년도별 상세 분석 표 */}
              <div style={{
                backgroundColor: '#f8f8f8',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  color: '#000000',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  📊 년도별 상세 투자 현황
                </h3>
                
                <div style={{
                  overflowX: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#000000', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>년도</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>구매수</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>투자액</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>현재값</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>수익/손실</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>수익률</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>평균수익률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisData.yearlyAnalysis)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([year, data], index) => (
                        <tr key={year} style={{
                          backgroundColor: index % 2 === 0 ? '#f8f8f8' : 'white',
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#000000',
                            fontSize: '0.9rem'
                          }}>
                            {year}
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                          }}>
                            {data.count}개
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '0.9rem',
                            color: '#000000',
                            fontWeight: 'bold'
                          }}>
                            {(data.totalInvestment / 10000).toFixed(0)}만원
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '0.9rem',
                            color: '#000000',
                            fontWeight: 'bold'
                          }}>
                            {(data.totalCurrentValue / 10000).toFixed(0)}만원
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '0.9rem',
                            color: data.profit >= 0 ? '#000000' : '#000000',
                            fontWeight: 'bold'
                          }}>
                            {data.profit >= 0 ? '+' : ''}{(data.profit / 10000).toFixed(1)}만원
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: data.profitRate >= 0 ? '#000000' : '#000000',
                            fontWeight: 'bold'
                          }}>
                            {data.profitRate >= 0 ? '+' : ''}{data.profitRate.toFixed(1)}%
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: data.averageProfitRate >= 0 ? '#000000' : '#000000',
                            fontWeight: 'bold'
                          }}>
                            {data.averageProfitRate >= 0 ? '+' : ''}{data.averageProfitRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 추가 인사이트 */}
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  border: '1px solid #000000'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#333333',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    💡 투자 인사이트
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#000000',
                    lineHeight: '1.4'
                  }}>
                    • <strong>최고 수익률 년도:</strong> {
                      Object.entries(analysisData.yearlyAnalysis)
                        .sort(([,a], [,b]) => b.profitRate - a.profitRate)[0]?.[0] || 'N/A'
                    }년 ({
                      Object.entries(analysisData.yearlyAnalysis)
                        .sort(([,a], [,b]) => b.profitRate - a.profitRate)[0]?.[1]?.profitRate?.toFixed(1) || 'N/A'
                    }%)
                    <br/>
                    • <strong>총 투자 년도:</strong> {Object.keys(analysisData.yearlyAnalysis).length}년간
                    <br/>
                    • <strong>연평균 수익률:</strong> {
                      Object.values(analysisData.yearlyAnalysis).length > 0 ?
                        (Object.values(analysisData.yearlyAnalysis)
                          .reduce((sum, data) => sum + data.profitRate, 0) / 
                         Object.values(analysisData.yearlyAnalysis).length).toFixed(1)
                        : 'N/A'
                    }%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // 페이지 변경 시 데이터 새로고침
  useEffect(() => {
    if (currentPage === 'list') {
      console.log('레고 목록 페이지로 이동 - 데이터 새로고침');
      loadLegoData();
      loadFileStatus();
    }
  }, [currentPage]);

  // 메인 컨텐츠 렌더링
  const renderMainContent = () => {
    if (currentPage === 'list') {
      return renderLegoList();
    }
    
    if (currentPage === 'bulk') {
      return renderBulkRegister();
    }


    if (currentPage === 'analysis') {
      return renderAnalysisDashboard();
    }

    // 레고 등록 페이지 - 세로형 레이아웃
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8f8f8', minHeight: '100vh' }}>
        <h1 style={{
          textAlign: 'center', 
          fontSize: '1.5rem', 
          padding: '15px', 
          background: '#000000', 
          color: 'white', 
          margin: '0 0 20px 0',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)'
        }}>
          레고 등록하기
        </h1>

        <form onSubmit={handleSubmit} style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          {/* 출시일 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              📅 출시일
            </label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
            />
          </div>

          {/* 레고 번호 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              🔢 레고 번호
            </label>
            <input
              type="text"
              name="legoNumber"
              value={formData.legoNumber}
              onChange={handleInputChange}
              placeholder="예: 6036"
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 제품명 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              🏷️ 제품명
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="레고 제품명을 입력하세요"
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 테마 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              🎨 테마
            </label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              placeholder="예: Castle, City, Star Wars"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 구입일 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              🛒 구입일
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
            />
          </div>

          {/* 정가 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              💰 정가 (원)
            </label>
            <input
              type="number"
              name="retailPrice"
              value={formData.retailPrice}
              onChange={handleInputChange}
              placeholder="정가를 입력하세요"
              min="0"
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 구입 가격 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              💳 구입 가격 (원)
            </label>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleInputChange}
              placeholder="실제 구입한 가격을 입력하세요"
              min="0"
              required
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 현재 시세 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              📈 현재 시세 (원)
            </label>
            <input
              type="number"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              placeholder="현재 시장 가격을 입력하세요 (선택사항)"
              min="0"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 상태 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              📦 상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">상태를 선택하세요</option>
              <option value="미개봉">📦 미개봉</option>
              <option value="개봉">📂 개봉</option>
              <option value="조립 중">🔧 조립 중</option>
              <option value="조립 완료">✅ 조립 완료</option>
              <option value="보관 중">📚 보관 중</option>
              <option value="전시 중">🏆 전시 중</option>
              <option value="판매 예정">💰 판매 예정</option>
              <option value="판매 완료">✔️ 판매 완료</option>
              <option value="분실/파손">❌ 분실/파손</option>
            </select>
          </div>

          {/* 이미지 URL */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '10px'
            }}>
              🖼️ 이미지 URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="직접 입력하거나 레고 번호 입력시 자동 생성됩니다"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.2rem',
                border: '2px solid #666666',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#f0f0f0',
                color: '#666666'
              }}
            />
            <div style={{ 
              marginTop: '8px', 
              fontSize: '0.9rem', 
              color: '#666666',
              lineHeight: '1.4'
            }}>
              💡 <strong>이미지 URL 사용법:</strong><br/>
              • 직접 이미지 URL을 입력하거나<br/>
              • 레고 번호 입력 시 자동으로 Brickset 이미지가 생성됩니다<br/>
              • 사용자 지정 URL이 우선 적용됩니다
            </div>
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '20px',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#333333';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#000000';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
            }}
          >
            🚀 레고 등록하기
          </button>
        </form>

        {/* 이미지 미리보기 */}
        {formData.imageUrl && (
          <div style={{
            maxWidth: '800px',
            margin: '40px auto',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.8rem', 
              color: '#000000', 
              marginBottom: '20px',
              fontWeight: 'bold'
            }}>
              🖼️ 이미지 미리보기
            </h3>
            <img
              src={formData.imageUrl}
              alt="레고 미리보기"
              style={{
                maxWidth: '100%',
                height: '300px',
                objectFit: 'cover',
                border: '3px solid #000000',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // 메인 레이아웃 렌더링
  return (
    <div>
      {/* 사이드바 */}
      {renderSidebar()}
      
      {/* 햄버거 메뉴 버튼 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: sidebarOpen ? '270px' : '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#000000',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 10001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'left 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#333333'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#000000'}
      >
        ☰
      </button>

      {/* 메인 컨텐츠 */}
      <div style={{
        marginLeft: sidebarOpen ? '250px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        width: sidebarOpen ? 'calc(100vw - 250px)' : '100vw',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        {renderMainContent()}
      </div>
    </div>
  );
};

export default LegoRegister;
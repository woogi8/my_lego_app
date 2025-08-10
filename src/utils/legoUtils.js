export const calculateProfitRate = (lego) => {
  const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
  const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
  
  if (purchasePrice === 0) return 0;
  return ((currentPrice - purchasePrice) / purchasePrice * 100);
};

export const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const getUniqueThemes = (data) => {
  const themes = data
    .map(lego => lego['테마'] || '')
    .filter(theme => theme.trim() !== '')
    .filter((theme, index, arr) => arr.indexOf(theme) === index)
    .sort();
  return ['전체', ...themes];
};

export const filterAndSortLegos = (data, theme, sortOrder) => {
  let filtered = [...data];

  // Apply theme filter
  if (theme !== '전체') {
    filtered = filtered.filter(lego => lego['테마'] === theme);
  }

  // Apply sorting
  switch (sortOrder) {
    case 'profit-desc':
      filtered.sort((a, b) => calculateProfitRate(b) - calculateProfitRate(a));
      break;
    case 'profit-asc':
      filtered.sort((a, b) => calculateProfitRate(a) - calculateProfitRate(b));
      break;
    case 'price-desc':
      filtered.sort((a, b) => {
        const priceA = parseFloat(a['현재 시세 (원)']) || 0;
        const priceB = parseFloat(b['현재 시세 (원)']) || 0;
        return priceB - priceA;
      });
      break;
    case 'price-asc':
      filtered.sort((a, b) => {
        const priceA = parseFloat(a['현재 시세 (원)']) || 0;
        const priceB = parseFloat(b['현재 시세 (원)']) || 0;
        return priceA - priceB;
      });
      break;
    case 'name-asc':
      filtered.sort((a, b) => (a['제품명'] || '').localeCompare(b['제품명'] || ''));
      break;
    default:
      // No sorting
      break;
  }

  return filtered;
};

export const generateImageUrl = (legoNumber) => {
  if (!legoNumber) return '';
  
  const number = legoNumber.toString().trim();
  if (number && !number.startsWith('ISBN') && number.match(/^\d+/)) {
    return `https://images.brickset.com/sets/images/${number}-1.jpg`;
  }
  
  return '';
};

export const parseExcelDate = (dateString) => {
  if (!dateString) return null;

  let year, month, day;

  // Try different date formats
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    }
  } else if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else if (parts[2] && parts[2].length === 4) {
      [month, day, year] = parts;
    } else if (parts[2] && parts[2].length === 2) {
      [month, day] = parts;
      year = '20' + parts[2];
    }
  } else if (dateString.includes('.')) {
    const parts = dateString.split('.');
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else if (parts[2] && parts[2].length === 4) {
      [day, month, year] = parts;
    }
  } else if (/^\d{4}/.test(dateString)) {
    year = dateString.substring(0, 4);
    month = dateString.substring(4, 6) || '01';
    day = dateString.substring(6, 8) || '01';
  }

  // Validate year
  if (!year || isNaN(year) || year < 1990 || year > 2030) {
    return null;
  }

  return { year, month, day };
};
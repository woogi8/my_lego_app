import React, { useState } from 'react';
import { useLegoContext } from '../context/LegoContext';
import './ImportExportPage.css';

const ImportExportPage = () => {
  const { importFromExcel, exportToExcel, legoList } = useLegoContext();
  const [importing, setImporting] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      await importFromExcel(file);
      alert('데이터를 성공적으로 가져왔습니다!');
      e.target.value = ''; // Reset file input
    } catch (error) {
      alert(`데이터 가져오기 실패: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportToExcel();
      alert('Excel 파일이 다운로드되었습니다!');
    } catch (error) {
      alert(`내보내기 실패: ${error.message}`);
    }
  };

  return (
    <div className="import-export-page">
      <h2>데이터 가져오기/내보내기</h2>

      <div className="import-export-grid">
        <div className="import-section">
          <h3>Excel 파일 가져오기</h3>
          <p>기존 Excel 파일에서 레고 데이터를 가져옵니다.</p>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              disabled={importing}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              {importing ? '가져오는 중...' : '파일 선택'}
            </label>
          </div>
          <div className="info-box">
            <h4>지원 형식:</h4>
            <ul>
              <li>Excel 파일 (.xlsx, .xls)</li>
              <li>필수 컬럼: 레고 번호, 제품명</li>
              <li>선택 컬럼: 테마, 출시일, 구입일, 정가, 구입 가격, 현재 시세, 상태</li>
            </ul>
          </div>
        </div>

        <div className="export-section">
          <h3>Excel 파일 내보내기</h3>
          <p>현재 레고 데이터를 Excel 파일로 내보냅니다.</p>
          <button 
            className="export-button" 
            onClick={handleExport}
            disabled={legoList.length === 0}
          >
            Excel 파일 다운로드
          </button>
          <div className="info-box">
            <h4>내보내기 정보:</h4>
            <ul>
              <li>총 {legoList.length}개 레고 데이터</li>
              <li>파일명: my_lego_list.xlsx</li>
              <li>모든 데이터와 이미지 URL 포함</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="backup-section">
        <h3>백업 정보</h3>
        <div className="backup-info">
          <p>데이터는 자동으로 서버의 Excel 파일에 저장됩니다.</p>
          <p>또한 브라우저의 로컬 저장소에도 백업됩니다.</p>
          <div className="backup-status">
            <span>서버 백업: ✅ 활성</span>
            <span>로컬 백업: ✅ 활성</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage;
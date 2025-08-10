const XLSX = require('xlsx');
const fs = require('fs-extra');
const config = require('../config/config');

class ExcelService {
  constructor() {
    this.filePath = config.excelFilePath;
  }

  async ensureFileExists() {
    try {
      if (await fs.pathExists(this.filePath)) {
        console.log('✅ Excel file exists:', this.filePath);
        return true;
      }

      await this.createInitialFile();
      return true;
    } catch (error) {
      console.error('❌ Error ensuring file exists:', error);
      throw error;
    }
  }

  async createInitialFile() {
    try {
      const headers = [
        '출시일', '레고 번호', '제품명', '테마', '구입일',
        '정가 (원)', '구입 가격 (원)', '현재 시세 (원)', '상태',
        '이미지 URL', '등록 시간', '수정 시간'
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 60 }, { wch: 20 }, { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

      XLSX.writeFile(workbook, this.filePath);
      console.log('📁 Initial Excel file created:', this.filePath);
    } catch (error) {
      console.error('❌ Error creating initial file:', error);
      throw error;
    }
  }

  async readData() {
    try {
      await this.ensureFileExists();

      const workbook = XLSX.readFile(this.filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      let data = XLSX.utils.sheet_to_json(worksheet);
      
      // Handle empty or malformed data
      if (data.length === 0 || (data.length > 0 && Object.keys(data[0]).length <= 1)) {
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (arrayData.length > 1) {
          const headers = arrayData[0].filter(h => h && h.toString().trim() !== '');
          const jsonData = [];
          
          for (let i = 1; i < arrayData.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
              const value = arrayData[i][index];
              row[header] = (value !== null && value !== undefined) ? value.toString().trim() : '';
            });
            
            const hasData = Object.values(row).some(val => val && val !== '');
            if (hasData) {
              // Auto-generate image URL if LEGO number exists
              if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
                const legoNumber = row['레고 번호'].toString().trim();
                if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
                  row['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
                }
              }
              jsonData.push(row);
            }
          }
          data = jsonData;
        }
      }
      
      // Filter empty rows and generate image URLs
      const filteredData = data.filter(row => {
        return Object.values(row).some(value => value && value.toString().trim() !== '');
      }).map(row => {
        if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
          const legoNumber = row['레고 번호'].toString().trim();
          if (legoNumber && !legoNumber.startsWith('ISBN') && legoNumber.match(/^\d+/)) {
            row['이미지 URL'] = `https://images.brickset.com/sets/images/${legoNumber}-1.jpg`;
          }
        }
        return row;
      });
      
      console.log(`📊 Read ${filteredData.length} records from Excel file`);
      return filteredData;
    } catch (error) {
      console.error('❌ Error reading Excel data:', error);
      throw error;
    }
  }

  async writeData(data) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 60 }, { wch: 20 }, { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '나의 레고 목록');

      XLSX.writeFile(workbook, this.filePath);
      console.log(`✅ Wrote ${data.length} records to Excel file`);
      return true;
    } catch (error) {
      console.error('❌ Error writing Excel data:', error);
      throw error;
    }
  }

  async getFileStatus() {
    try {
      const exists = await fs.pathExists(this.filePath);
      if (!exists) {
        return {
          exists: false,
          path: this.filePath,
          recordCount: 0,
          lastModified: null
        };
      }

      const stats = await fs.stat(this.filePath);
      const data = await this.readData();

      return {
        exists: true,
        path: this.filePath,
        recordCount: data.length,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('❌ Error getting file status:', error);
      throw error;
    }
  }
}

module.exports = new ExcelService();
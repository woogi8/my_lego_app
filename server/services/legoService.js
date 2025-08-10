const excelService = require('./excelService');
const config = require('../config/config');

class LegoService {
  generateImageUrl(legoNumber) {
    if (!legoNumber) return '';
    
    const number = legoNumber.toString().trim();
    if (number && !number.startsWith('ISBN') && number.match(/^\d+/)) {
      return `https://images.brickset.com/sets/images/${number}-1.jpg`;
    }
    
    return '';
  }

  getCurrentTimestamp() {
    return new Date().toLocaleString(config.dateFormat.locale, config.dateFormat.options);
  }

  async getAllLegos() {
    try {
      return await excelService.readData();
    } catch (error) {
      console.error('Error getting all LEGOs:', error);
      throw new Error('Failed to retrieve LEGO data');
    }
  }

  async addLego(legoData) {
    try {
      const existingData = await excelService.readData();
      
      const newLego = {
        ...legoData,
        '등록 시간': this.getCurrentTimestamp()
      };

      // Auto-generate image URL if not provided
      if (newLego['레고 번호'] && (!newLego['이미지 URL'] || newLego['이미지 URL'] === '')) {
        newLego['이미지 URL'] = this.generateImageUrl(newLego['레고 번호']);
      }
      
      existingData.push(newLego);
      
      const success = await excelService.writeData(existingData);
      
      if (success) {
        return {
          success: true,
          data: existingData,
          message: 'LEGO successfully added'
        };
      }
      
      throw new Error('Failed to save data');
    } catch (error) {
      console.error('Error adding LEGO:', error);
      throw error;
    }
  }

  async updateLego(index, updatedData) {
    try {
      const existingData = await excelService.readData();
      
      if (index < 0 || index >= existingData.length) {
        throw new Error('Invalid index');
      }
      
      existingData[index] = {
        ...updatedData,
        '등록 시간': existingData[index]['등록 시간'], // Keep original registration time
        '수정 시간': this.getCurrentTimestamp()
      };
      
      const success = await excelService.writeData(existingData);
      
      if (success) {
        return {
          success: true,
          data: existingData,
          message: 'LEGO successfully updated'
        };
      }
      
      throw new Error('Failed to save data');
    } catch (error) {
      console.error('Error updating LEGO:', error);
      throw error;
    }
  }

  async deleteLego(index) {
    try {
      const existingData = await excelService.readData();
      
      if (index < 0 || index >= existingData.length) {
        throw new Error('Invalid index');
      }
      
      existingData.splice(index, 1);
      
      const success = await excelService.writeData(existingData);
      
      if (success) {
        return {
          success: true,
          data: existingData,
          message: 'LEGO successfully deleted'
        };
      }
      
      throw new Error('Failed to save data');
    } catch (error) {
      console.error('Error deleting LEGO:', error);
      throw error;
    }
  }

  async bulkAddLegos(legoArray) {
    try {
      const existingData = await excelService.readData();
      const timestamp = this.getCurrentTimestamp();
      
      const newLegos = legoArray.map(lego => {
        const processedLego = {
          ...lego,
          '등록 시간': timestamp
        };
        
        // Auto-generate image URL if not provided
        if (processedLego['레고 번호'] && (!processedLego['이미지 URL'] || processedLego['이미지 URL'] === '')) {
          processedLego['이미지 URL'] = this.generateImageUrl(processedLego['레고 번호']);
        }
        
        return processedLego;
      });
      
      const updatedData = [...existingData, ...newLegos];
      
      const success = await excelService.writeData(updatedData);
      
      if (success) {
        return {
          success: true,
          data: updatedData,
          message: `${legoArray.length} LEGOs successfully added`
        };
      }
      
      throw new Error('Failed to save data');
    } catch (error) {
      console.error('Error bulk adding LEGOs:', error);
      throw error;
    }
  }

  async replaceLegos(newData) {
    try {
      const processedData = newData.map(row => {
        if (row['레고 번호'] && (!row['이미지 URL'] || row['이미지 URL'] === '')) {
          row['이미지 URL'] = this.generateImageUrl(row['레고 번호']);
        }
        return row;
      });
      
      const success = await excelService.writeData(processedData);
      
      if (success) {
        return {
          success: true,
          data: processedData,
          message: 'Data successfully replaced'
        };
      }
      
      throw new Error('Failed to save data');
    } catch (error) {
      console.error('Error replacing LEGO data:', error);
      throw error;
    }
  }

  async getFileStatus() {
    try {
      const status = await excelService.getFileStatus();
      return {
        success: true,
        fileExists: status.exists,
        filePath: status.path,
        recordCount: status.recordCount,
        lastUpdated: status.lastModified
      };
    } catch (error) {
      console.error('Error getting file status:', error);
      throw error;
    }
  }
}

module.exports = new LegoService();
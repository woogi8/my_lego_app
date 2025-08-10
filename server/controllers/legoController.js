const legoService = require('../services/legoService');

class LegoController {
  async getAllLegos(req, res) {
    try {
      console.log('🔍 API call: GET /api/legos');
      const data = await legoService.getAllLegos();
      console.log(`✅ API response: ${data.length} records returned`);
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Error fetching LEGOs:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch LEGO data' 
      });
    }
  }

  async addLego(req, res) {
    try {
      console.log('➕ API call: POST /api/legos');
      const result = await legoService.addLego(req.body);
      res.json(result);
    } catch (error) {
      console.error('❌ Error adding LEGO:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to add LEGO' 
      });
    }
  }

  async updateLego(req, res) {
    try {
      const index = parseInt(req.params.index);
      console.log(`✏️ API call: PUT /api/legos/${index}`);
      
      if (isNaN(index)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid index parameter' 
        });
      }
      
      const result = await legoService.updateLego(index, req.body);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating LEGO:', error);
      const statusCode = error.message === 'Invalid index' ? 400 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message || 'Failed to update LEGO' 
      });
    }
  }

  async deleteLego(req, res) {
    try {
      const index = parseInt(req.params.index);
      console.log(`🗑️ API call: DELETE /api/legos/${index}`);
      
      if (isNaN(index)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid index parameter' 
        });
      }
      
      const result = await legoService.deleteLego(index);
      res.json(result);
    } catch (error) {
      console.error('❌ Error deleting LEGO:', error);
      const statusCode = error.message === 'Invalid index' ? 400 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message || 'Failed to delete LEGO' 
      });
    }
  }

  async bulkAddLegos(req, res) {
    try {
      console.log('➕➕ API call: POST /api/legos/bulk');
      
      if (!req.body.data || !Array.isArray(req.body.data)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid data format. Expected array in "data" field' 
        });
      }
      
      const result = await legoService.bulkAddLegos(req.body.data);
      res.json(result);
    } catch (error) {
      console.error('❌ Error bulk adding LEGOs:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to bulk add LEGOs' 
      });
    }
  }

  async replaceLegos(req, res) {
    try {
      console.log('🔄 API call: PUT /api/legos');
      
      if (!req.body.data || !Array.isArray(req.body.data)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid data format. Expected array in "data" field' 
        });
      }
      
      const result = await legoService.replaceLegos(req.body.data);
      res.json(result);
    } catch (error) {
      console.error('❌ Error replacing LEGO data:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to replace LEGO data' 
      });
    }
  }

  async getStatus(req, res) {
    try {
      console.log('📊 API call: GET /api/status');
      const result = await legoService.getFileStatus();
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to get status' 
      });
    }
  }

  async debugExcel(req, res) {
    try {
      console.log('🔧 Debug API call: GET /api/debug/excel');
      
      const XLSX = require('xlsx');
      const fs = require('fs-extra');
      const config = require('../config/config');
      
      const filePath = config.excelFilePath;
      
      if (!await fs.pathExists(filePath)) {
        return res.json({
          success: false,
          error: 'Excel file does not exist',
          filePath
        });
      }

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const range = worksheet['!ref'];
      
      res.json({
        success: true,
        debug: {
          filePath,
          worksheetNames: workbook.SheetNames,
          range,
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
      console.error('❌ Debug API error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new LegoController();
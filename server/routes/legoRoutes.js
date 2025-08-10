const express = require('express');
const router = express.Router();
const legoController = require('../controllers/legoController');

// LEGO CRUD operations
router.get('/legos', legoController.getAllLegos);
router.post('/legos', legoController.addLego);
router.put('/legos/:index', legoController.updateLego);
router.delete('/legos/:index', legoController.deleteLego);

// Bulk operations
router.post('/legos/bulk', legoController.bulkAddLegos);
router.put('/legos', legoController.replaceLegos);

// Status and debug
router.get('/status', legoController.getStatus);
router.get('/debug/excel', legoController.debugExcel);

module.exports = router;
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const legoRoutes = require('./routes/legoRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const excelService = require('./services/excelService');

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Routes
app.use('/api', legoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'LEGO Management API'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Server initialization
const startServer = async () => {
  try {
    // Ensure Excel file exists
    await excelService.ensureFileExists();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('🚀 LEGO Management System Backend Server Started!');
      console.log(`📡 Server Address: http://localhost:${config.port}`);
      console.log(`📁 Excel File Path: ${config.excelFilePath}`);
      console.log('');
      console.log('💡 Available API Endpoints:');
      console.log('   GET    /api/legos        - Get all LEGOs');
      console.log('   POST   /api/legos        - Add new LEGO');
      console.log('   PUT    /api/legos/:index - Update LEGO');
      console.log('   DELETE /api/legos/:index - Delete LEGO');
      console.log('   POST   /api/legos/bulk   - Bulk add LEGOs');
      console.log('   PUT    /api/legos        - Replace all data');
      console.log('   GET    /api/status       - Get file status');
      console.log('   GET    /api/debug/excel  - Debug Excel file');
      console.log('   GET    /health           - Health check');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('🛑 HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('⚠️ SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('🛑 HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3001,
  excelFilePath: path.join(__dirname, '..', '..', 'my_lego_list.xlsx'),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  dateFormat: {
    locale: 'ko-KR',
    options: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  },
  environment: process.env.NODE_ENV || 'development'
};
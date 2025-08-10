const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error: ' + err.message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid data format';
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = 'File not found';
  } else if (err.code === 'EACCES') {
    status = 403;
    message = 'Permission denied';
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    code: statusCode,
    msg: statusCode === 500 ? '服务器内部错误' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

module.exports = errorHandler;

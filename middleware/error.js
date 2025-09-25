const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  const statusCode = err.statusCode || 500; // Default to 500 if no status code is set
  const message = err.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    // Only send stack trace in development for security
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;

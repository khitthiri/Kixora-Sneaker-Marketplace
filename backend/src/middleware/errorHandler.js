class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;
  if (err.code === 'P2002') { statusCode = 409; message = 'A record with this value already exists'; }
  if (err.code === 'P2025') { statusCode = 404; message = 'Record not found'; }
  if (err.code === 'P2003') { statusCode = 400; message = 'Related record not found'; }
  if (process.env.NODE_ENV === 'development') console.error(err);
  res.status(statusCode).json({ success: false, error: { message } });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, error: { message: `Route ${req.originalUrl} not found` } });
};

module.exports = { AppError, errorHandler, notFound };

const { app } = require('electron');
const path = require('path');
const winston = require('winston');
const { format } = winston;
const fs = require('fs-extra');
const config = require('../config');

// Ensure logs directory exists
fs.ensureDirSync(config.PATHS.LOGS_DIR);

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'neuroshield-monitor' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(config.PATHS.LOGS_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(config.PATHS.LOGS_DIR, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console logging in development
if (!app.isPackaged || process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit in development to allow for debugging
  if (app.isPackaged) process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = logger;

const { app } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const config = {
  // App Info
  APP_NAME: 'NeuroShield Monitor',
  APP_VERSION: '1.0.0',
  
  // Paths
  PATHS: {
    USER_DATA: app.getPath('userData'),
    LOGS_DIR: path.join(app.getPath('userData'), 'logs'),
    CONFIG_DIR: path.join(app.getPath('userData'), 'config'),
    DATABASE_DIR: path.join(app.getPath('userData'), 'data')
  },
  
  // Window settings
  WINDOW: {
    WIDTH: 1200,
    HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEV_TOOLS: isDev,
  },
  
  // Logger settings
  LOG_LEVEL: isDev ? 'debug' : 'info',
  
  // API endpoints
  API: {
    BASE_URL: isDev ? 'http://localhost:3000' : 'https://api.neuroshield.com',
    TIMEOUT: 30000
  },
  
  // Monitoring settings
  MONITORING: {
    POLL_INTERVAL: 5000, // 5 seconds
    MAX_LOG_AGE_DAYS: 30
  }
};

// Development overrides
if (isDev) {
  config.WINDOW.WIDTH = 1400;
  config.WINDOW.HEIGHT = 900;
}

module.exports = config;

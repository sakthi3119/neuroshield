const fs = require('fs-extra');
const path = require('path');
const logger = require('../../shared/logger');
const config = require('../../config');

/**
 * Initialize application data directories
 * @returns {Promise<void>}
 */
async function initAppData() {
  try {
    // Ensure all required directories exist
    await Promise.all([
      fs.ensureDir(config.PATHS.LOGS_DIR),
      fs.ensureDir(config.PATHS.CONFIG_DIR),
      fs.ensureDir(config.PATHS.DATABASE_DIR),
      fs.ensureDir(path.join(config.PATHS.USER_DATA, 'cache')),
      fs.ensureDir(path.join(config.PATHS.USER_DATA, 'screenshots')),
      fs.ensureDir(path.join(config.PATHS.USER_DATA, 'exports'))
    ]);

    // Create default config file if it doesn't exist
    const configFile = path.join(config.PATHS.CONFIG_DIR, 'config.json');
    if (!await fs.pathExists(configFile)) {
      await fs.writeJson(configFile, {
        version: config.APP_VERSION,
        firstRun: true,
        autoStart: true,
        minimizeToTray: true,
        checkForUpdates: true,
        monitoring: {
          enabled: true,
          cpuThreshold: 90,
          memoryThreshold: 85,
          diskThreshold: 90,
          networkThreshold: 80,
          monitorUsb: true,
          monitorProcesses: true,
          monitorNetwork: true
        },
        alerts: {
          enabled: true,
          sound: true,
          desktopNotifications: true,
          emailNotifications: false,
          emailAddress: ''
        },
        logging: {
          level: 'info',
          maxSize: 10, // MB
          maxFiles: 5
        },
        appearance: {
          theme: 'system', // 'light', 'dark', or 'system'
          fontSize: 'medium', // 'small', 'medium', 'large'
          density: 'comfortable' // 'compact', 'comfortable', 'spacious'
        },
        privacy: {
          collectUsageData: false,
          shareCrashReports: true
        }
      }, { spaces: 2 });
    }

    // Create logs directory with .gitkeep
    await fs.ensureFile(path.join(config.PATHS.LOGS_DIR, '.gitkeep'));
    
    logger.info('Application data directories initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize application data:', error);
    throw error;
  }
}

module.exports = initAppData;

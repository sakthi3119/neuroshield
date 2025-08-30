const { app } = require('electron');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../shared/logger');
const config = require('../config');
const fs = require('fs-extra');

let sequelize;
let db = {};

async function initialize() {
  try {
    // Ensure database directory exists
    await fs.ensureDir(config.PATHS.DATABASE_DIR);
    
    const dbPath = path.join(config.PATHS.DATABASE_DIR, 'neuroshield.db');
    
    // Initialize Sequelize with SQLite
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: config.isDev ? msg => logger.debug(msg) : false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });
    
    // Define models
    db.Alert = sequelize.define('Alert', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });
    
    db.Setting = sequelize.define('Setting', {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string'
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'general'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    });
    
    // Define relationships
    // Add relationships here if needed
    
    // Sync database
    await sequelize.sync({ alter: true });
    
    // Initialize default settings if not exists
    await initializeDefaultSettings();
    
    logger.info('Database initialized successfully');
    return db;
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

async function initializeDefaultSettings() {
  const defaultSettings = [
    {
      key: 'monitoring.enabled',
      value: 'true',
      type: 'boolean',
      category: 'monitoring',
      description: 'Enable/disable monitoring'
    },
    {
      key: 'monitoring.cpu_threshold',
      value: '90',
      type: 'number',
      category: 'monitoring',
      description: 'CPU usage threshold percentage'
    },
    {
      key: 'monitoring.memory_threshold',
      value: '90',
      type: 'number',
      category: 'monitoring',
      description: 'Memory usage threshold percentage'
    },
    {
      key: 'alerts.enabled',
      value: 'true',
      type: 'boolean',
      category: 'alerts',
      description: 'Enable/disable alerts'
    },
    {
      key: 'alerts.sound',
      value: 'true',
      type: 'boolean',
      category: 'alerts',
      description: 'Enable/disable alert sounds'
    },
    {
      key: 'app.auto_start',
      value: 'true',
      type: 'boolean',
      category: 'app',
      description: 'Start application on system startup'
    },
    {
      key: 'app.minimize_to_tray',
      value: 'true',
      type: 'boolean',
      category: 'app',
      description: 'Minimize to system tray when closing the window'
    }
  ];
  
  for (const setting of defaultSettings) {
    await db.Setting.findOrCreate({
      where: { key: setting.key },
      defaults: setting
    });
  }
}

// Helper function to get a setting value
async function getSetting(key, defaultValue = null) {
  try {
    const setting = await db.Setting.findByPk(key);
    if (!setting) return defaultValue;
    
    switch (setting.type) {
      case 'number':
        return parseFloat(setting.value);
      case 'boolean':
        return setting.value === 'true';
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch (e) {
          return defaultValue;
        }
      default:
        return setting.value;
    }
  } catch (error) {
    logger.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

// Helper function to set a setting value
async function setSetting(key, value) {
  try {
    const [setting] = await db.Setting.findOrCreate({
      where: { key },
      defaults: { value: String(value), type: typeof value }
    });
    
    if (setting) {
      setting.value = String(value);
      await setting.save();
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error setting setting ${key}:`, error);
    return false;
  }
}

module.exports = {
  initialize,
  getSetting,
  setSetting,
  db: () => db,
  sequelize: () => sequelize
};

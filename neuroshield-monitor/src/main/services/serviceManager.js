const { spawn } = require('child_process');
const path = require('path');
const logger = require('../../shared/logger');
const config = require('../../config');
const db = require('../database');

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start all monitoring services
   * @returns {Promise<void>}
   */
  async startAll() {
    if (this.isMonitoring) {
      logger.warn('Monitoring services are already running');
      return;
    }

    try {
      logger.info('Starting monitoring services...');
      
      // Start hardware monitoring (Python)
      await this.startService('hardware', {
        command: 'python',
        args: [path.join(__dirname, '../../../hardware_monitoring/monitor.py')],
        cwd: path.join(__dirname, '../../../hardware_monitoring')
      });

      // Start file monitoring
      await this.startService('file', {
        command: 'node',
        args: [path.join(__dirname, '../../../final-file-activity/fileMonitor.js')],
        cwd: path.join(__dirname, '../../../final-file-activity')
      });

      // Start USB monitoring
      await this.startService('usb', {
        command: 'node',
        args: [path.join(__dirname, '../../../final-usb-activity/uneuro-monitor/usb_monitor.js')],
        cwd: path.join(__dirname, '../../../final-usb-activity/uneuro-monitor')
      });

      this.isMonitoring = true;
      logger.info('All monitoring services started');
      
      // Update monitoring status in the database
      await db.setSetting('monitoring.enabled', 'true');
      
    } catch (error) {
      logger.error('Failed to start monitoring services:', error);
      throw error;
    }
  }

  /**
   * Stop all monitoring services
   * @returns {Promise<void>}
   */
  async stopAll() {
    if (!this.isMonitoring) {
      logger.warn('No monitoring services are currently running');
      return;
    }

    try {
      logger.info('Stopping monitoring services...');
      
      // Stop all running services
      for (const [name, service] of this.services.entries()) {
        await this.stopService(name);
      }
      
      this.isMonitoring = false;
      logger.info('All monitoring services stopped');
      
      // Update monitoring status in the database
      await db.setSetting('monitoring.enabled', 'false');
      
    } catch (error) {
      logger.error('Failed to stop monitoring services:', error);
      throw error;
    }
  }

  /**
   * Start a specific service
   * @param {string} name - Service name
   * @param {Object} options - Service options
   * @returns {Promise<void>}
   */
  async startService(name, options) {
    if (this.services.has(name)) {
      logger.warn(`Service ${name} is already running`);
      return;
    }

    return new Promise((resolve, reject) => {
      logger.info(`Starting ${name} service...`);
      
      const { command, args = [], cwd } = options;
      const service = spawn(command, args, { cwd, stdio: 'pipe' });
      
      // Store service reference
      this.services.set(name, {
        process: service,
        startTime: new Date(),
        options
      });
      
      // Handle service output
      service.stdout.on('data', (data) => {
        logger.debug(`[${name}] ${data.toString().trim()}`);
      });
      
      service.stderr.on('data', (data) => {
        logger.error(`[${name} error] ${data.toString().trim()}`);
      });
      
      service.on('error', (error) => {
        logger.error(`[${name} error] ${error.message}`);
        this.services.delete(name);
        reject(error);
      });
      
      service.on('close', (code) => {
        if (code !== 0) {
          logger.warn(`Service ${name} exited with code ${code}`);
        } else {
          logger.info(`Service ${name} stopped`);
        }
        this.services.delete(name);
      });
      
      // Wait for service to be ready
      const timeout = setTimeout(() => {
        logger.warn(`Timeout waiting for ${name} service to start`);
        reject(new Error(`Service ${name} startup timeout`));
      }, 10000);
      
      // Simple ready check - can be enhanced with service-specific checks
      const readyCheck = (data) => {
        if (data.toString().includes('ready') || data.toString().includes('listening')) {
          clearTimeout(timeout);
          service.stdout.off('data', readyCheck);
          logger.info(`${name} service started`);
          resolve();
        }
      };
      
      service.stdout.on('data', readyCheck);
    });
  }

  /**
   * Stop a specific service
   * @param {string} name - Service name
   * @returns {Promise<void>}
   */
  async stopService(name) {
    const service = this.services.get(name);
    if (!service) {
      logger.warn(`Service ${name} is not running`);
      return;
    }

    return new Promise((resolve) => {
      logger.info(`Stopping ${name} service...`);
      
      const { process: serviceProcess } = service;
      
      // Handle process termination
      serviceProcess.on('close', () => {
        logger.info(`${name} service stopped`);
        this.services.delete(name);
        resolve();
      });
      
      // Try to gracefully shut down the process
      if (process.platform === 'win32') {
        // On Windows, use taskkill to ensure child processes are also terminated
        const taskkill = spawn('taskkill', ['/pid', serviceProcess.pid, '/f', '/t']);
        taskkill.on('close', () => resolve());
      } else {
        // On Unix-like systems, send SIGTERM
        serviceProcess.kill('SIGTERM');
        
        // Force kill if process doesn't exit
        setTimeout(() => {
          if (this.services.has(name)) {
            serviceProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    });
  }

  /**
   * Restart a specific service
   * @param {string} name - Service name
   * @returns {Promise<void>}
   */
  async restartService(name) {
    const service = this.services.get(name);
    if (!service) {
      logger.warn(`Service ${name} is not running`);
      return this.startService(name, service?.options || {});
    }

    try {
      await this.stopService(name);
      await this.startService(name, service.options);
    } catch (error) {
      logger.error(`Failed to restart ${name} service:`, error);
      throw error;
    }
  }

  /**
   * Get status of all services
   * @returns {Object} Service status
   */
  getStatus() {
    const status = {};
    
    for (const [name, service] of this.services.entries()) {
      status[name] = {
        running: true,
        pid: service.process.pid,
        uptime: Math.floor((new Date() - service.startTime) / 1000) // in seconds
      };
    }
    
    return status;
  }
}

// Create a singleton instance
const serviceManager = new ServiceManager();

// Handle application exit
process.on('exit', () => {
  serviceManager.stopAll().catch(error => {
    console.error('Error stopping services on exit:', error);
  });
});

module.exports = serviceManager;

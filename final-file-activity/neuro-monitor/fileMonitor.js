const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const aiAgent = require('./aiAgent');
const { sendAlert } = require('./emailService');

class FileMonitor {
  constructor(watchPath) {
    this.watchPath = watchPath;
    this.fileOperations = new Map();
    this.setupWatcher();
  }

  setupWatcher() {
    console.log(`Starting file monitoring in: ${this.watchPath}`);
    
    // Configure chokidar with more detailed options
    const watcher = chokidar.watch(this.watchPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      },
      depth: 99, // Monitor subdirectories
      alwaysStat: true,
      followSymlinks: false,
    });

    // Debug logging
    console.log('Setting up file watchers...');

    watcher
      .on('ready', () => {
        console.log('Initial scan complete. Ready for changes.');
      })
      .on('add', async (filePath, stats) => {
        console.log(`File added/copied: ${filePath}`);
        if (stats && stats.size > 0) {
          await this.handleFileOperation(filePath, 'copy');
        }
      })
      .on('change', async (filePath) => {
        console.log(`File modified: ${filePath}`);
        await this.handleFileOperation(filePath, 'modify');
      })
      .on('unlink', async (filePath) => {
        console.log(`File removed/moved: ${filePath}`);
        await this.handleFileOperation(filePath, 'move');
      })
      .on('error', error => {
        console.error(`Watcher error: ${error}`);
      });

    // Additional native fs.watch for redundancy
    fs.watch(this.watchPath, { recursive: true }, async (eventType, filename) => {
      if (!filename) return;
      
      const filePath = path.join(this.watchPath, filename);
      console.log(`Native fs.watch event: ${eventType} - ${filename}`);
      
      try {
        if (fs.existsSync(filePath)) {
          if (eventType === 'rename') {
            console.log(`File operation detected: ${filePath}`);
            await this.handleFileOperation(filePath, 'copy');
          } else if (eventType === 'change') {
            console.log(`File changed: ${filePath}`);
            await this.handleFileOperation(filePath, 'modify');
          }
        }
      } catch (error) {
        console.error('Error in fs.watch handler:', error);
      }
    });
  }

  async handleFileOperation(filePath, operation) {
    try {
      const fileName = path.basename(filePath);
      
      // Skip system files and temporary files
      if (fileName.startsWith('.') || 
          fileName.startsWith('~$') || 
          fileName.endsWith('.tmp')) {
        return;
      }

      // Debug logging
      console.log(`\nFile Operation Detected:
        Operation: ${operation}
        File: ${fileName}
        Path: ${filePath}
        Time: ${new Date().toLocaleString()}`);
      
      // Evaluate the operation using AI Agent
      const result = await aiAgent.evaluateFileOperation(fileName, filePath, operation);
      
      console.log('AI Evaluation Result:', result);

      if (result.shouldAlert) {
        const alertMsg = `
FILE OPERATION VIOLATION REPORT:
• Operation Type: ${operation}
• File Name: ${fileName}
• File Path: ${filePath}
• Sensitivity Level: ${result.sensitivity.toUpperCase()}
• Detection Time: ${new Date().toLocaleString()}
• Operation Count: ${result.operationCount}
• Threshold Status: EXCEEDED
• Sensitivity Threshold: ${result.sensitivity === 'high' ? '1 operation' : '3 operations'}/24hrs

This behavior indicates excessive file operations 
that requires immediate supervisory attention.`;

        await sendAlert(`File Operation Alert - ${result.sensitivity.toUpperCase()} Sensitivity`, alertMsg);
        console.log('Alert sent successfully');
      }
    } catch (error) {
      console.error('Error handling file operation:', error);
    }
  }
}

// Export the FileMonitor class
module.exports = FileMonitor; 
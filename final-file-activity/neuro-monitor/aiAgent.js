const mongoose = require('mongoose');
const natural = require('natural');
const classifier = new natural.BayesClassifier();

// Train the classifier with sample sensitive and less sensitive patterns
function trainClassifier() {
  // High sensitivity patterns
  classifier.addDocument('password', 'high');
  classifier.addDocument('secret', 'high');
  classifier.addDocument('confidential', 'high');
  classifier.addDocument('private', 'high');
  classifier.addDocument('sensitive', 'high');
  classifier.addDocument('financial', 'high');
  classifier.addDocument('personal', 'high');
  
  // Less sensitivity patterns
  classifier.addDocument('public', 'low');
  classifier.addDocument('general', 'low');
  classifier.addDocument('documentation', 'low');
  classifier.addDocument('readme', 'low');
  classifier.addDocument('test', 'low');
  
  classifier.train();
}

mongoose.set('strictQuery', false);

// File Activity Schema
const FileActivitySchema = new mongoose.Schema({
  fileName: String,
  filePath: String,
  operation: String,
  timestamp: { type: Date, default: Date.now },
  employeeId: String,
  deviceName: String,
  sessionId: String,
  sensitivity: String,
  countReset: { type: Boolean, default: false } // Track if this activity was part of a reset cycle
});

const FileActivity = mongoose.model('FileActivity', FileActivitySchema);

class AIAgent {
  constructor() {
    this.HIGH_SENSITIVITY_THRESHOLD = 1;
    this.LOW_SENSITIVITY_THRESHOLD = 3;
    this.isConnected = false;
    this.connectToMongoDB();
    trainClassifier();
  }

  async connectToMongoDB() {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/neuroshield', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.isConnected = true;
      console.log('Successfully connected to MongoDB!');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      this.isConnected = false;
    }
  }

  classifyFileSensitivity(fileName) {
    return classifier.classify(fileName.toLowerCase());
  }

  async evaluateFileOperation(fileName, filePath, operation) {
    try {
      if (!this.isConnected) {
        await this.connectToMongoDB();
      }

      const employeeId = process.env.EMPLOYEE_ID || 'NS2024001';
      const deviceName = process.env.DEVICE_NAME || 'NEUROSHIELD-SYSTEM';
      const sessionId = Date.now().toString();
      
      // Classify file sensitivity
      const sensitivity = this.classifyFileSensitivity(fileName);
      
      console.log(`\nProcessing file operation:
        File: ${fileName}
        Operation: ${operation}
        Sensitivity: ${sensitivity}`);
      
      // Save the new activity
      const activity = new FileActivity({
        fileName,
        filePath,
        operation,
        employeeId,
        deviceName,
        sessionId,
        sensitivity,
        countReset: false
      });
      await activity.save();
      console.log('Activity saved to database');

      // Get unreset activities in last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activities = await FileActivity.find({
        employeeId,
        sensitivity,
        timestamp: { $gte: last24Hours },
        countReset: false
      });

      const operationCount = activities.length;
      const threshold = sensitivity === 'high' ? 
        this.HIGH_SENSITIVITY_THRESHOLD : 
        this.LOW_SENSITIVITY_THRESHOLD;

      console.log(`Current operation count for ${sensitivity} sensitivity: ${operationCount}`);
      console.log(`Threshold: ${threshold}`);

      // Check if threshold is reached
      if (operationCount >= threshold) {
        console.log(`Threshold reached for ${sensitivity} sensitivity`);
        
        // Mark all counted activities as reset
        await FileActivity.updateMany(
          {
            employeeId,
            sensitivity,
            timestamp: { $gte: last24Hours },
            countReset: false
          },
          { $set: { countReset: true } }
        );
        
        console.log('Reset count after threshold reached');
        
        return {
          shouldAlert: true,
          sensitivity,
          operationCount,
          fileName,
          operation
        };
      }

      return {
        shouldAlert: false,
        sensitivity,
        operationCount,
        fileName,
        operation
      };
    } catch (error) {
      console.error('Error in evaluateFileOperation:', error);
      return { shouldAlert: false };
    }
  }
}

const aiAgent = new AIAgent();
module.exports = aiAgent;

// If running this file directly, test the connection
if (require.main === module) {
  console.log('Testing MongoDB connection...');
  // The connection test will run through the constructor
} 
const mongoose = require('mongoose');

// Fix deprecation warnings
mongoose.set('strictQuery', false);

// Updated Schema to include sessionId
const UnauthorizedAppSchema = new mongoose.Schema({
  appName: String,
  timestamp: { type: Date, default: Date.now },
  employeeId: String,
  deviceName: String,
  sessionId: String
});

const UnauthorizedApp = mongoose.model('UnauthorizedApp', UnauthorizedAppSchema);

class AIAgent {
  constructor() {
    // Connect to MongoDB
    this.connectToMongoDB();
    this.lastAppName = null;  // Track last detected app
    this.currentSessionId = null;  // Track current session
    this.THRESHOLD_LIMIT = 5; // Number of unique sessions before alert
  }

  async connectToMongoDB() {
    try {
      await mongoose.connect('mongodb://localhost:27017/neuroshield', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Successfully connected to MongoDB!');
      
      // Test connection
      const testApp = new UnauthorizedApp({ 
        appName: 'TestApp',
        sessionId: 'test-session'
      });
      await testApp.save();
      console.log('Test entry created successfully!');
      await UnauthorizedApp.deleteOne({ appName: 'TestApp' });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1); // Exit if cannot connect to MongoDB
    }
  }

  async evaluateThreshold(appName) {
    try {
      // Generate new session ID if app switched
      if (this.lastAppName !== appName) {
        this.currentSessionId = Date.now().toString();
        this.lastAppName = appName;
      }

      // Get device info
      const employeeId = process.env.EMPLOYEE_ID || 'NS2024001';
      const deviceName = process.env.DEVICE_NAME || 'NEUROSHIELD-SYSTEM';

      // Only log if we have a new session
      if (this.currentSessionId) {
        await new UnauthorizedApp({ 
          appName,
          sessionId: this.currentSessionId,
          employeeId,
          deviceName
        }).save();
        console.log(`Logged unauthorized access for: ${appName} (Session: ${this.currentSessionId})`);
      }

      // Count unique sessions in last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const uniqueSessions = await UnauthorizedApp.distinct('sessionId', {
        appName: appName,
        employeeId: employeeId,
        timestamp: { $gte: last24Hours }
      });

      const uniqueCount = uniqueSessions.length;
      console.log(`Unique sessions in last 24 hours for ${appName}: ${uniqueCount}`);

      // If threshold reached, reset count by removing old entries
      if (uniqueCount >= this.THRESHOLD_LIMIT) {
        await UnauthorizedApp.deleteMany({
          appName: appName,
          employeeId: employeeId
        });
        console.log('Reset count after threshold reached');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in evaluateThreshold:', error);
      return false;
    }
  }

  // Helper method to reset session when switching to allowed app
  resetSession() {
    this.lastAppName = null;
    this.currentSessionId = null;
  }
}

// Create and export a single instance
const aiAgent = new AIAgent();
module.exports = aiAgent;

// If running this file directly, test the connection
if (require.main === module) {
  console.log('Testing MongoDB connection...');
  // The connection test will run through the constructor
} 
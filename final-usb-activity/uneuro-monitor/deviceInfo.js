const os = require('os');

function getDeviceInfo() {
  return {
    deviceId: os.hostname(),
    employeeId: process.env.EMPLOYEE_ID || 'Unknown',  // Can be set in .env
    deviceName: os.hostname(),
    platform: os.platform(),
    osVersion: os.release(),
    username: os.userInfo().username
  };
}

module.exports = { getDeviceInfo }; 
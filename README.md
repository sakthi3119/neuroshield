# NeuroShield

> Enterprise-grade security monitoring platform with ML-powered threat detection and real-time behavioral analysis

<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Electron](https://img.shields.io/badge/Electron-28.0-blue.svg)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)

</div>

---

## Overview

NeuroShield is a comprehensive endpoint security solution designed for enterprise environments. It combines traditional monitoring with machine learning to detect anomalous behavior patterns, unauthorized data transfers, and potential security threats in real-time. Built as a cross-platform desktop application, it provides security teams with actionable insights while maintaining minimal system overhead.

**Key Differentiators:**
- Multi-vector monitoring (file system, USB devices, hardware resources, user behavior)
- Natural Language Processing for file sensitivity classification
- Isolation Forest algorithm for anomaly detection
- Zero-configuration deployment with intelligent defaults
- Automated alert escalation via email notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Service    │  │   Database   │  │   Updater    │     │
│  │   Manager    │  │   (SQLite)   │  │   Module     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
│ File Activity │  │ USB Activity  │  │  Hardware   │
│   Monitor     │  │   Monitor     │  │  Monitor    │
│   (Node.js)   │  │  (Node.js)    │  │  (Python)   │
└───────────────┘  └───────────────┘  └─────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                ┌──────────▼──────────┐
                │   AI/ML Pipeline    │
                │  ┌──────────────┐   │
                │  │ Naive Bayes  │   │
                │  │ Classifier   │   │
                │  └──────────────┘   │
                │  ┌──────────────┐   │
                │  │  Isolation   │   │
                │  │   Forest     │   │
                │  └──────────────┘   │
                └─────────────────────┘
```

### Technology Stack

**Frontend:**
- Electron 28 (Desktop framework)
- HTML5/CSS3 (Modern UI)
- JavaScript ES6+ (Application logic)

**Backend Services:**
- Node.js (File & USB monitoring)
- Python 3.8+ (Hardware monitoring & ML)
- SQLite (Local data persistence)
- MongoDB (Activity logging - optional)

**ML/AI:**
- Natural.js (Naive Bayes text classification)
- scikit-learn (Isolation Forest anomaly detection)
- PyTorch (Advanced threat modeling)
- Transformers (Contextual analysis)

**Infrastructure:**
- Chokidar (File system watcher)
- Nodemailer (SMTP notifications)
- psutil (System metrics)
- pynput (Input monitoring)

---

## Features

### 🔍 Real-Time Monitoring

**File System Surveillance**
- Recursive directory monitoring with sub-ms latency
- Operations tracked: CREATE, MODIFY, DELETE, MOVE
- Automatic file sensitivity classification using NLP
- Configurable watch paths and exclusion rules

**USB Device Management**
- PowerShell integration for device enumeration
- Mass storage device detection
- Connection/disconnection event tracking
- Device whitelist/blacklist support

**System Resource Tracking**
- CPU utilization per process
- Memory consumption patterns
- Network bandwidth usage
- Disk I/O metrics

### 🤖 AI-Powered Threat Detection

**Behavioral Analysis**
- Isolation Forest algorithm identifies statistical anomalies
- Baseline establishment through 7-day training period
- Real-time deviation scoring
- Context-aware threshold adjustment

**File Sensitivity Engine**
- Naive Bayes classifier for content analysis
- Pattern recognition for keywords: "confidential", "secret", "password"
- Risk scoring: HIGH, MEDIUM, LOW
- Alert triggering based on operation + sensitivity matrix

**Anomaly Indicators:**
- Unusual file access patterns outside business hours
- Bulk copy operations exceeding normal thresholds
- Rapid file deletion sequences
- Unauthorized USB data transfers

### 🚨 Alert Management

**Multi-Channel Notifications**
- In-app desktop notifications (Windows Toast API)
- Email alerts with detailed incident reports
- Configurable alert severity levels
- Alert aggregation to prevent flooding

**Incident Response**
- Timestamped activity logs
- Employee/device attribution
- Forensic data export
- Audit trail maintenance

### 📊 Dashboard & Reporting

- Real-time activity feed
- Graphical trend analysis
- Historical data visualization
- Custom report generation
- Export to CSV/JSON formats

---

## Installation

### Prerequisites

Ensure the following are installed on your system:

```bash
# Check Node.js version (v16+ required)
node --version

# Check npm version
npm --version

# Check Python version (3.8+ required)
python --version

# Check Git
git --version
```

### Quick Start

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/neuroshield.git
cd neuroshield
```

**2. Install Node.js dependencies**
```bash
# Main application
cd neuroshield-monitor
npm install

# File monitoring module
cd ../final-file-activity/neuro-monitor
npm install

# USB monitoring module
cd ../../final-usb-activity/uneuro-monitor
npm install
```

**3. Install Python dependencies**
```bash
cd ../../hardware_monitoring
pip install -r requirements.txt
```

**4. Environment configuration**

Create a `.env` file in `neuroshield-monitor/`:
```env
# Email Configuration (for alerts)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ALERT_RECIPIENT=security-team@company.com

# Database
MONGODB_URI=mongodb://localhost:27017/hackify
DB_NAME=neuroshield

# Application
NODE_ENV=production
LOG_LEVEL=info
```

**5. Launch the application**
```bash
cd neuroshield-monitor
npm start
```

---

## Configuration

### Monitoring Settings

Edit `neuroshield-monitor/src/config/index.js`:

```javascript
module.exports = {
  fileMonitoring: {
    watchPaths: ['C:\\Users\\Public\\Documents'],
    excludePatterns: ['*.tmp', '*.log', 'node_modules/**'],
    sensitivity: {
      highThreshold: 1,    // Alert after 1 high-sensitivity file operation
      lowThreshold: 3      // Alert after 3 low-sensitivity operations
    }
  },
  
  usbMonitoring: {
    enabled: true,
    alertOnConnect: true,
    allowedDevices: []  // Empty = all devices flagged
  },
  
  hardwareMonitoring: {
    interval: 5000,  // Poll every 5 seconds
    cpuThreshold: 80,
    memoryThreshold: 90
  }
}
```

### Email Alerts

Configure SMTP settings in `shared/emailTemplate.js`:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

For Gmail, generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your account password.

---

## Building for Production

### Windows Installer

```bash
cd neuroshield-monitor
npm run build

# Output: dist/NeuroShield Setup 1.0.0.exe
```

### Configuration for Build

Edit `neuroshield-monitor/electron-builder.yml`:

```yaml
appId: com.neuroshield.monitor
productName: NeuroShield Monitor
directories:
  output: dist
win:
  target: nsis
  icon: assets/icon.ico
  requestedExecutionLevel: requireAdministrator  # For system monitoring
```

---

## Usage Guide

### First Launch

1. **System Tray Icon**: After launch, NeuroShield minimizes to the system tray
2. **Initial Setup**: Click the tray icon to open settings
3. **Configure Paths**: Add directories to monitor under "File Monitoring"
4. **Test Alerts**: Click "Send Test Alert" to verify email configuration

### Monitoring Operations

**Starting Monitoring:**
```
Dashboard → Start Monitoring
```
All services (file, USB, hardware) start automatically.

**Viewing Alerts:**
```
Alerts Tab → Filter by severity/date
```

**Generating Reports:**
```
Reports → Select date range → Export
```

### Common Scenarios

**Scenario 1: USB Device Detected**
```
Alert: "USB Storage Device Connected"
Details: Device name, timestamp
Action: Review if authorized in device policy
```

**Scenario 2: Sensitive File Copied**
```
Alert: "High Sensitivity File Operation Detected"
Details: Filename, path, employee ID
Action: Verify legitimacy with employee
```

**Scenario 3: Anomalous Behavior**
```
Alert: "Behavioral Anomaly Detected"
Details: Deviation score, activity pattern
Action: Investigate recent employee activities
```

---

## Project Structure

```
neuroshield/
│
├── neuroshield-monitor/          # Main Electron application
│   ├── src/
│   │   ├── main/                 # Main process
│   │   │   ├── main.js          # Application entry
│   │   │   ├── database.js      # SQLite operations
│   │   │   └── services/        # Service orchestration
│   │   ├── renderer/            # Renderer process (UI)
│   │   ├── config/              # Configuration management
│   │   └── shared/              # Shared utilities
│   ├── electron-builder.yml     # Build configuration
│   └── package.json
│
├── final-file-activity/          # File monitoring service
│   └── neuro-monitor/
│       ├── fileMonitor.js       # Chokidar watcher
│       ├── aiAgent.js           # ML classifier
│       └── emailService.js      # Alert dispatcher
│
├── final-usb-activity/           # USB monitoring service
│   └── uneuro-monitor/
│       ├── usb_monitor.js       # PowerShell integration
│       └── usbaiAgent.js        # USB event analysis
│
├── hardware_monitoring/          # Python monitoring service
│   ├── monitor.py               # psutil + pynput
│   └── requirements.txt         # Python dependencies
│
└── shared/                       # Shared modules
    └── emailTemplate.js         # Email formatting
```

---

## Development

### Running in Development Mode

```bash
cd neuroshield-monitor
npm run dev
```

This enables:
- Hot reload
- Detailed logging
- Developer tools
- Debugging endpoints

### Testing Components

**File Monitor:**
```bash
cd final-file-activity/neuro-monitor
node fileMonitor.js
```

**USB Monitor:**
```bash
cd final-usb-activity/uneuro-monitor
node usb_monitor.js
```

**Hardware Monitor:**
```bash
cd hardware_monitoring
python monitor.py
```

### Adding New Features

**Example: Adding a new alert type**

1. Define schema in `database.js`:
```javascript
db.Alert = sequelize.define('Alert', {
  type: DataTypes.STRING,
  customField: DataTypes.STRING  // Add here
});
```

2. Update service in `serviceManager.js`:
```javascript
async logAlert(type, data) {
  await db.Alert.create({
    type: type,
    customField: data.custom  // Handle here
  });
}
```

3. Add UI component in `renderer.js`:
```javascript
function renderCustomAlert(alert) {
  // Render logic
}
```

---

## Troubleshooting

### Common Issues

**Issue: Email alerts not sending**
```bash
# Verify credentials
echo $EMAIL_USER
echo $EMAIL_PASSWORD

# Test SMTP connection
node -e "require('./shared/emailTemplate').testConnection()"
```

**Issue: File monitor not detecting changes**
```bash
# Check permissions
icacls "C:\path\to\monitored\folder"

# Verify chokidar
npm list chokidar
```

**Issue: Python service fails to start**
```bash
# Check dependencies
pip list | grep -E 'psutil|pymongo|sklearn'

# Run standalone
python hardware_monitoring/monitor.py
```

**Issue: High CPU usage**
- Reduce polling frequency in config
- Add exclusion patterns for temporary files
- Check for infinite loops in watchers

### Logs

Logs are stored in:
```
Windows: %APPDATA%\NeuroShield\logs\
macOS: ~/Library/Application Support/NeuroShield/logs/
Linux: ~/.config/NeuroShield/logs/
```

View real-time logs:
```bash
tail -f "%APPDATA%\NeuroShield\logs\main.log"
```

---

## Performance Metrics

Tested on: Windows 11, Intel i7-12700H, 16GB RAM

| Metric | Value |
|--------|-------|
| Memory Usage (Idle) | ~120 MB |
| Memory Usage (Active) | ~250 MB |
| CPU Usage (Avg) | 2-5% |
| Startup Time | <3 seconds |
| File Detection Latency | <100ms |
| USB Detection Latency | <500ms |

---

## Security Considerations

- **Data Storage**: All data stored locally; no cloud transmission
- **Email Security**: Use app-specific passwords, never account passwords
- **Permissions**: Requires admin privileges for system-level monitoring
- **Encryption**: Database encryption available via SQLCipher (optional)
- **Privacy**: Keyboard monitoring disabled by default (configurable)

**Recommended Deployment:**
1. Deploy on organization-managed devices only
2. Inform employees per privacy regulations (GDPR, CCPA)
3. Implement data retention policies
4. Regular security audits

---

## Roadmap

- [ ] **v1.1**: macOS and Linux support
- [ ] **v1.2**: Centralized management dashboard
- [ ] **v1.3**: Integration with SIEM tools (Splunk, ELK)
- [ ] **v1.4**: Advanced ML models (LSTM for sequence analysis)
- [ ] **v2.0**: Cloud-based threat intelligence
- [ ] **v2.1**: Automated incident response workflows

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Code Style:**
- JavaScript: Airbnb style guide
- Python: PEP 8
- Commit messages: Conventional Commits

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built for **Hackify 2.0** hackathon
- Inspired by enterprise DLP solutions (Forcepoint, McAfee)
- ML models based on research from:
  - Liu, F. et al. (2008). "Isolation Forest"
  - Manning, C. (1999). "Foundations of Statistical NLP"

---

## Contact

**Project Maintainer:** NeuroShield Team

For questions, issues, or enterprise licensing:
- Email: contact@neuroshield.dev
- GitHub Issues: [Create an issue](https://github.com/yourusername/neuroshield/issues)

---

<div align="center">
  
**⭐ Star this repo if you find it useful!**

Made with ❤️ for cybersecurity professionals

</div>

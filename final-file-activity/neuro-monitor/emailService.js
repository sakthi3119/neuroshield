const nodemailer = require("nodemailer");
require("dotenv").config();
const config = require("./config.json");
const { getDeviceInfo } = require("./deviceInfo");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendAlert(subject, message) {
  const deviceInfo = getDeviceInfo();
  
  const formattedMessage = `
🚨 SECURITY ALERT: Unauthorized Activity Detected 🚨

👤 Employee Information:
• Employee ID: ${deviceInfo.employeeId}
• Username: ${deviceInfo.username}

💻 Device Information:
• Device ID: ${deviceInfo.deviceId}
• Device Name: ${process.env.DEVICE_NAME || deviceInfo.deviceName}
• Platform: ${deviceInfo.platform}
• OS Version: ${deviceInfo.osVersion}

⚠️ Alert Details:
${message}

📝 Note: This threshold violation has triggered a count reset.
Further violations will be monitored from zero.

-------------------
This is an automated security alert from NeuroShield Security System.
Please take appropriate action immediately.
`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: config.adminEmail,
    subject: `🚨 [NeuroShield Alert] Security Violation - Employee ${deviceInfo.employeeId}`,
    text: formattedMessage
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Alert email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

module.exports = { sendAlert };

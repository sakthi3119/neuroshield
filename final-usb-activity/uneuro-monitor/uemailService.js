const nodemailer = require("nodemailer");
const config = require("./config");
const { getDeviceInfo } = require("./deviceInfo");

const transporter = nodemailer.createTransport(config.email);

async function sendAlert(subject, message) {
  const deviceInfo = getDeviceInfo();
  
  const formattedMessage = `
🚨 SECURITY ALERT: Unauthorized Activity Detected 🚨

👤 Employee Information:
• Employee ID: ${deviceInfo.employeeId}
• Username: ${deviceInfo.username}

💻 Device Information:
• Device ID: ${deviceInfo.deviceId}
• Device Name: ${deviceInfo.deviceName}
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
    from: config.email.auth.user,
    to: config.email.alertRecipient,
    subject: `🚨 [NeuroShield Alert] Security Violation - ${deviceInfo.username}`,
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

const nodemailer = require("nodemailer");
const config = require("./config");
const { getDeviceInfo } = require("./deviceInfo");

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
    },
    tls: {
        rejectUnauthorized: false
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

// Test the email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log("Email configuration error:", error);
    } else {
        console.log("Email server is ready to send messages");
    }
});

module.exports = { sendAlert };

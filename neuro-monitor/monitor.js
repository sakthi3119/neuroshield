const activeWin = require("active-win");
const config = require("./config.json");
const { sendAlert } = require("./emailService");
const aiAgent = require("./aiAgent");

let alertSent = false;

async function monitorApps() {
  const win = await activeWin();
  if (!win) return;

  const currentApp = win.owner.name;
  console.log("Current Active App:", currentApp);

  if (!config.allowedApps.includes(currentApp)) {
    const shouldAlert = await aiAgent.evaluateThreshold(currentApp);
    
    if (shouldAlert && !alertSent) {
      const alertMsg = `
APPLICATION VIOLATION REPORT:
• Unauthorized Application: ${currentApp}
• Window Title: ${win.title || 'N/A'}
• Detection Time: ${new Date().toLocaleString()}
• Violation Type: Multiple Access Attempts
• Status: THRESHOLD EXCEEDED (24-hour limit reached)
• Action Taken: Count Reset Initiated

This behavior indicates a pattern of unauthorized application usage
that requires immediate supervisory attention.`;

      await sendAlert("24-Hour Threshold Exceeded", alertMsg);
      alertSent = true;
    }
  } else {
    aiAgent.resetSession();
    alertSent = false;
  }
}

// Run the monitoring function every 5 seconds
setInterval(monitorApps, 5000);

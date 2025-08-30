const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  alertAdmin: (msg) => require("./emailService").sendAlert("Alert", msg)
});

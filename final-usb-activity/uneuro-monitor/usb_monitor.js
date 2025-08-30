const { exec } = require('child_process');
const { sendAlert } = require("./uemailService");

let connectedDevices = new Set();
let alertSent = false;

// Function to check for USB storage devices using PowerShell
function checkUSBDevices() {
    // Using PowerShell to get USB storage devices
    const command = 'powershell.exe -Command "Get-PnpDevice -Class USB -PresentOnly | Where-Object { $_.FriendlyName -like \'*Mass Storage*\' -or $_.FriendlyName -like \'*USB Drive*\' -or $_.FriendlyName -like \'*Flash*\' } | Select-Object FriendlyName | Format-List"';
    
    console.log('Checking for USB devices...');
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return;
        }

        if (stderr) {
            console.error(`Command stderr: ${stderr}`);
        }

        console.log('Raw command output:', stdout);

        const currentDevices = new Set();
        const devices = stdout.trim().split('\n')
            .filter(line => line.trim().startsWith('FriendlyName :'))
            .map(line => line.trim().replace('FriendlyName : ', ''));

        console.log('Detected devices:', devices);

        devices.forEach(device => {
            if (!device.toLowerCase().includes('mouse') && !device.toLowerCase().includes('keyboard')) {
                currentDevices.add(device);
                console.log('Found storage device:', device);
                
                // If this is a new device and we haven't sent an alert
                if (!connectedDevices.has(device) && !alertSent) {
                    console.log('New device detected, preparing to send alert...');
                    const alertMsg = `
USB STORAGE DEVICE DETECTION REPORT:
• Device Details: ${device}
• Detection Time: ${new Date().toLocaleString()}
• Status: New Storage Device Connected
• Action Required: Please verify if this device connection is authorized

This alert is generated when a new USB storage device (such as a pen drive 
or external hard drive) is connected to the system.`;

                    sendAlert("USB Storage Device Connected", alertMsg)
                        .then(() => {
                            console.log('Alert sent successfully');
                            alertSent = true;
                        })
                        .catch(err => console.error('Error sending alert:', err));
                }
            }
        });

        // Check for removed devices
        connectedDevices.forEach(device => {
            if (!currentDevices.has(device)) {
                console.log('Device removed:', device);
                alertSent = false; // Reset alert flag when a device is removed
            }
        });

        // Update the list of connected devices
        connectedDevices = currentDevices;
    });
}

// Check for USB devices every 2 seconds (reduced for faster detection)
setInterval(checkUSBDevices, 2000);

// Initial check
console.log('Starting USB monitoring...');
checkUSBDevices();

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('Stopping USB monitoring...');
    process.exit();
});

const generateEmailHTML = (eventType, details) => {
    const timeString = new Date().toLocaleString();
    const iconMap = {
        'hardware': '⌨️',
        'activity': '📊',
        'usb': '💾',
        'file': '📁',
        'added': '➕',
        'modified': '✏️',
        'deleted': '❌',
        'connected': '🔌',
        'disconnected': '🔋',
        'unauthorized': '⚠️'
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1a1a1a;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #7c3aed, #6d28d9);
                    color: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }
                .content {
                    background: #ffffff;
                    padding: 20px;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                .event-type {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #4c1d95;
                }
                .detail-row {
                    display: block;
                    margin: 10px 0;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 6px;
                }
                .detail-label {
                    font-weight: 600;
                    color: #4b5563;
                    margin-right: 10px;
                }
                .timestamp {
                    color: #6b7280;
                    font-size: 0.9em;
                    text-align: right;
                    margin-top: 15px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 0.9em;
                }
                .icon {
                    font-size: 24px;
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>NeuroShield Security Alert</h1>
            </div>
            <div class="content">
                <div class="event-type">
                    <span class="icon">${iconMap[eventType.toLowerCase()] || '🔔'}</span>
                    ${eventType} Alert
                </div>
                ${Object.entries(details)
                    .map(([key, value]) => `
                        <div class="detail-row">
                            <span class="detail-label">${key}:</span>
                            <span>${value}</span>
                        </div>
                    `).join('')}
                <div class="timestamp">
                    Alert Time: ${timeString}
                </div>
                <div class="footer">
                    This is an automated security alert from NeuroShield.
                    Please take appropriate action if this activity was not authorized.
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = { generateEmailHTML };

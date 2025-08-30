import os
import json
import time
import psutil
import pymongo
import smtplib
import numpy as np
from collections import defaultdict, deque
from pynput import keyboard, mouse
from sklearn.ensemble import IsolationForest
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["hackify"]
collection = db["employee_activities"]
alerts_collection = db["alerts"]

# Employee Information
EMPLOYEE_DETAILS = {
    "device_001": {"employee_id": "E123", "username": "Sakthii"},
    "device_002": {"employee_id": "E124", "username": "Vel"},
}
DEVICE_ID = "device_001"

# AI Model Storage
behavior_data = deque(maxlen=500)
anomaly_detector = IsolationForest(contamination=0.2, random_state=42)

# Suspicious Activity Counter
suspicious_count = defaultdict(int)
alert_cooldown = set()  # Prevent repeated alerts

# Collect Behavioral Data
def log_activity(activity_type, details):
    global suspicious_count
    employee = EMPLOYEE_DETAILS.get(DEVICE_ID, {"employee_id": "Unknown", "username": "Unknown"})

    log_entry = {
        "timestamp": time.time(),
        "employee_id": employee["employee_id"],
        "username": employee["username"],
        "type": activity_type,
        "details": details
    }
    collection.insert_one(log_entry)
    
    # Store Data for AI Training
    behavior_data.append([time.time(), activity_type, len(details)])
    
    suspicious_count[employee["employee_id"]] += 1
    analyze_and_alert()

# Keyboard & Mouse Monitoring
def on_press(key):
    try:
        log_activity("keyboard", str(key))
    except Exception as e:
        print(f"Keyboard monitoring error: {e}")

def on_click(x, y, button, pressed):
    try:
        action = "pressed" if pressed else "released"
        log_activity("mouse", f"{button} {action} at {x},{y}")
    except Exception as e:
        print(f" Mouse monitoring error: {e}")

# Process & USB Monitoring
def monitor_processes():
    try:
        process_list = [p.name() for p in psutil.process_iter()]
        log_activity("process", json.dumps(process_list))
    except Exception as e:
        print(f" Process monitoring error: {e}")

def monitor_usb():
    try:
        drives = [d for d in os.popen("wmic logicaldisk get caption").read().split() if ':' in d]
        log_activity("usb", json.dumps(drives))
    except Exception as e:
        print(f" USB monitoring error: {e}")

# AI-Based Anomaly Detection
def detect_anomalies():
    if len(behavior_data) < 10:
        return []
    
    feature_matrix = np.array([[data[0] % 3600, data[2]] for data in behavior_data])
    
    anomaly_detector.fit(feature_matrix)
    predictions = anomaly_detector.predict(feature_matrix)
    
    return [behavior_data[i] for i in range(len(predictions)) if predictions[i] == -1]

# Send Alert
def send_alert(employee_id, username, details):
    if employee_id in alert_cooldown:
        return  # Avoid repeated alerts for the same employee

    sender_email = "sakthiveldesktop@gmail.com"
    receiver_email = "sakthivelmanikandan2005@gmail.com"
    password = "jnsy qkpo ldoh weup"
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = f"ALERT: Suspicious Activity Detected for {username}"

    body = f"""
    <html>
    <body>
        <h2 style='color:red;'>Insider Threat Alert</h2>
        <p><strong>Employee ID:</strong> {employee_id}</p>
        <p><strong>Username:</strong> {username}</p>
        <div style='background-color:#ffcccc; padding:10px;'>
            <h3>Suspicious Activity Details</h3>
            {details}
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print(f"Email alert sent for {username} ({employee_id})")
        alert_cooldown.add(employee_id)  # Prevent spam alerts
    except Exception as e:
        print(f"Email sending failed: {e}")

# Anomaly Analysis & Alert
def analyze_and_alert():
    global suspicious_count
    
    anomalies = detect_anomalies()
    if not anomalies:
        return
    
    for employee_id, count in list(suspicious_count.items()):  # Iterate safely
        if count >= 2:  # Lowered threshold for faster detection
            employee = next((e for e in EMPLOYEE_DETAILS.values() if e["employee_id"] == employee_id), None)
            if employee:
                username = employee["username"]
                
                details_html = "".join([f"<p>{a[1]} at {time.ctime(a[0])}</p>" for a in anomalies])
                send_alert(employee_id, username, details_html)
                
                alerts_collection.insert_one({
                    "employee_id": employee_id,
                    "username": username,
                    "alert_time": time.time(),
                    "details": details_html
                })
    
    suspicious_count.clear()

# Start Monitoring
keyboard_listener = keyboard.Listener(on_press=on_press)
mouse_listener = mouse.Listener(on_click=on_click)
keyboard_listener.start()
mouse_listener.start()

print("Monitoring started...")

start_time = time.time()
while True:
    monitor_processes()
    monitor_usb()
    
    if time.time() - start_time >= 60:  # Faster anomaly detection
        analyze_and_alert()
        start_time = time.time()
    
    time.sleep(5)

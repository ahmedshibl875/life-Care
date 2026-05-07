const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add import for BleContext
content = content.replace("import { Heart, Activity", "import { useBle } from '../context/BleContext';\nimport { Heart, Activity");

// 2. We want to remove everything from `const deviceRef = useRef(null);` all the way down to `const connectSimulatedWatch = () => { ... };` 

// regex match starting at `const deviceRef` and ending after `connectSimulatedWatch`'s closing brace.
const startStr = "const deviceRef = useRef(null);";
const endStr = "    const connectSimulatedWatch = () => {\r\n        setSynced(true);\r\n        setBluetoothActive(false);\r\n        setShowScanner(false);\r\n        setVitals(prev => ({\r\n            hr: { ...prev.hr, value: 75 },\r\n            bp: { ...prev.bp, value: '120/80' },\r\n            bg: { ...prev.bg, value: 95 },\r\n            temp: { ...prev.temp, value: 36.8 },\r\n            spo2: { ...prev.spo2, value: 98 }\r\n        }));\r\n    };";

const endStr2 = "    const connectSimulatedWatch = () => {\n        setSynced(true);\n        setBluetoothActive(false);\n        setShowScanner(false);\n        setVitals(prev => ({\n            hr: { ...prev.hr, value: 75 },\n            bp: { ...prev.bp, value: '120/80' },\n            bg: { ...prev.bg, value: 95 },\n            temp: { ...prev.temp, value: 36.8 },\n            spo2: { ...prev.spo2, value: 98 }\n        }));\n    };";


let endIdx = content.indexOf(endStr);
if (endIdx === -1) endIdx = content.indexOf(endStr2);

if (endIdx !== -1) {
    const endMatchLength = endIdx === content.indexOf(endStr) ? endStr.length : endStr2.length;
    const startIdx = content.indexOf(startStr);
    
    const replacement = `
    const { 
        synced, setSynced, bluetoothActive, setBluetoothActive,
        showScanner, setShowScanner, scanningStep, setScanningStep,
        connMode, connecting, setConnecting, connStatus, setConnStatus, connError, setConnError,
        rssi, battery, isAlerting, setIsAlerting, alertMsg, vitals, setVitals,
        handleDisconnect, connectViaBridge, startScanner, connectNativeBluetooth, connectToDevice, connectSimulatedWatch, wsRef
    } = useBle();
    `;
    
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx + endMatchLength);
} else {
    console.log("Could not find the end string boundary");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Dashboard refactored successfully!");

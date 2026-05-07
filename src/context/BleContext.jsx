import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Heart, Activity, Droplet, Thermometer, Wind, Moon, AlertTriangle } from 'lucide-react';

const BleContext = createContext();

export function BleProvider({ children, lang }) {
    const isRtl = lang === 'ar';
    const deviceRef = useRef(null);
    const wsRef = useRef(null);
    const lastAlertTimeRef = useRef(0);

    const [synced, setSynced] = useState(false);
    const [bluetoothActive, setBluetoothActive] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanningStep, setScanningStep] = useState('searching');
    const [connMode, setConnMode] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [connStatus, setConnStatus] = useState('scanning');
    const [connError, setConnError] = useState('');
    const [rssi, setRssi] = useState(null);
    const [battery, setBattery] = useState(null);
    const [isAlerting, setIsAlerting] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');
    const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
    const [steps, setSteps] = useState(0);
    const [fatigue, setFatigue] = useState(lang === 'ar' ? 'مستقر' : 'Stable');
    const [fallDetection, setFallDetection] = useState(false);
    const pedometerRef = useRef({ lastMag: 0, lastStepTime: 0, activitySum: 0, counter: 0 });

    const [vitals, setVitals] = useState({
        hr: { value: '--', label: isRtl ? 'النبض' : 'Heart Rate', icon: Heart, color: 'var(--success)', status: 'normal', unit: 'bpm' },
        bp: { value: '--/--', label: isRtl ? 'الضغط' : 'Blood Pressure', icon: Activity, color: 'var(--success)', status: 'normal', unit: 'mmHg' },
        temp: { value: '--', label: isRtl ? 'الحرارة' : 'Body Temp', icon: Thermometer, color: 'var(--success)', status: 'normal', unit: '°C' },
        spo2: { value: '--', label: isRtl ? 'الأكسجين' : 'Blood Oxygen', icon: Wind, color: '#339af0', status: 'normal', unit: '%' },
        bg: { value: '--', label: isRtl ? 'السكر' : 'Glucose', icon: Droplet, color: 'var(--warning)', status: 'warning', unit: 'mg/dL' },
        hrv: { value: '--', label: isRtl ? 'تغير النبض' : 'HRV', icon: Activity, color: 'var(--primary)', status: 'normal', unit: 'ms' },
        stress: { value: '--', label: isRtl ? 'التوتر' : 'Stress Index', icon: AlertTriangle, color: 'var(--warning)', status: 'normal', unit: '/100' },
        sleep: { value: '--', label: isRtl ? 'جودة النوم' : 'Sleep Quality', icon: Moon, color: '#8b5cf6', status: 'normal', unit: '%' },
    });

    useEffect(() => {
        setVitals(prev => ({
            ...prev,
            hr: { ...prev.hr, label: isRtl ? 'النبض' : 'Heart Rate' },
            bp: { ...prev.bp, label: isRtl ? 'الضغط' : 'Blood Pressure' },
            bg: { ...prev.bg, label: isRtl ? 'السكر' : 'Glucose' },
            temp: { ...prev.temp, label: isRtl ? 'الحرارة' : 'Body Temp' },
            spo2: { ...prev.spo2, label: isRtl ? 'الأكسجين' : 'Blood Oxygen' },
            hrv: { ...prev.hrv, label: isRtl ? 'تغير النبض' : 'HRV' },
            stress: { ...prev.stress, label: isRtl ? 'التوتر' : 'Stress Index' },
            sleep: { ...prev.sleep, label: isRtl ? 'جودة النوم' : 'Sleep Quality' },
        }));
    }, [isRtl]);

    useEffect(() => {
        if (!synced) return;
        const hrVal = parseInt(vitals.hr.value);
        const spo2Val = parseInt(vitals.spo2.value);
        const stressVal = parseInt(vitals.stress?.value || 0);

        if (hrVal > 85 || (spo2Val < 90 && spo2Val > 0) || stressVal > 70) {
            const now = Date.now();
            if (!isAlerting && (now - lastAlertTimeRef.current >= 600000)) { // 10 minutes = 600,000 ms
                lastAlertTimeRef.current = now;
                setIsAlerting(true);
                
                let msg = isRtl ? 'حالة حرجة مكتشفة!' : 'Critical Condition Detected!';
                if (hrVal > 85) msg = isRtl ? 'ضربات قلب مرتفعة!' : 'High Heart Rate Detected!';
                else if (stressVal > 70) msg = isRtl ? 'مستوى إجهاد مرتفع جداً!' : 'High Stress Detected!';
                else if (spo2Val < 90) msg = isRtl ? 'انخفاض حاد في الأكسجين!' : 'Critical Low Oxygen!';
                
                setAlertMsg(msg);
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
        } else {
            setIsAlerting(false);
            if (lastAlertTimeRef.current !== 0) {
                lastAlertTimeRef.current = 0; // Reset cooldown when returning to normal
            }
        }
    }, [vitals, synced]);

    const handleDisconnect = () => {
        setSynced(false);
        setBluetoothActive(false);
        setConnMode(null);
        setRssi(null);
        setBattery(null);
        setIsAlerting(false);
        setGyro({ x: 0, y: 0, z: 0 });
        setSteps(0);
        setFatigue(isRtl ? 'مستقر' : 'Stable');
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        if (deviceRef.current && deviceRef.current.gatt.connected) {
            deviceRef.current.gatt.disconnect();
        }
        setVitals(prev => ({
            ...prev,
            hr: { ...prev.hr, value: '--' },
            bp: { ...prev.bp, value: '--/--' },
            bg: { ...prev.bg, value: '--' },
            temp: { ...prev.temp, value: '--' },
            spo2: { ...prev.spo2, value: '--' }
        }));
    };

    const WS_BRIDGE_URL = 'ws://localhost:8765';

    const connectViaBridge = () => {
        return new Promise((resolve, reject) => {
            setConnecting(true);
            setConnStatus('scanning');
            setConnError('');

            const ws = new WebSocket(WS_BRIDGE_URL);
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('timeout'));
            }, 3000);

            ws.onopen = () => {
                clearTimeout(timeout);
                wsRef.current = ws;

                ws.onmessage = (e) => {
                    try {
                        const msg = JSON.parse(e.data);
                        if (msg.type === 'scanning') setConnStatus('scanning');
                        if (msg.type === 'connecting') setConnStatus('connecting');

                        if (msg.type === 'status') {
                            if (msg.connected) {
                                setConnStatus('connected');
                                setSynced(true);
                                setBluetoothActive(true);
                                setConnMode('ws');
                                setTimeout(() => setConnecting(false), 1200);
                                resolve();
                            } else {
                                setSynced(false);
                                setConnMode(null);
                                setConnecting(false);
                                setVitals(prev => ({
                                    ...prev,
                                    hr: { ...prev.hr, value: '--' },
                                    temp: { ...prev.temp, value: '--' },
                                    spo2: { ...prev.spo2, value: '--' },
                                }));
                            }
                        }

                        if (msg.type === 'battery') setBattery(msg.value);
                        if (msg.type === 'rssi') setRssi(msg.value);

                        if (msg.type === 'vital') {
                            const { key: configKey, value: parsed } = msg;
                            if (configKey === 'steps') {
                                setSteps(parsed);
                            } else if (configKey === 'fall') {
                                setFallDetection(parsed);
                            } else {
                                setVitals(prev => ({
                                    ...prev,
                                    [configKey]: { ...prev[configKey], value: parsed, lastSync: Date.now() }
                                }));
                            }
                            if (connecting) setConnecting(false);
                        }
                        if (msg.type === 'gyro') {
                            setGyro({ ...msg.value });
                        }
                    } catch (_) { }
                };

                ws.onclose = () => {
                    setSynced(false);
                    setConnMode(null);
                    setConnecting(false);
                };
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('no_bridge'));
            };
        });
    };

    const startScanner = () => {
        if (synced) {
            handleDisconnect();
            return;
        }
        connectNativeBluetooth();
    };

    const SERVICE_UUID = '0000d000-0000-1000-8000-00805f9b34fb';
    const parseHeartRate = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0); return '--'; } catch (e) { return '--'; } };
    const parseTemperature = (dv) => { try { if (dv.byteLength >= 4) { const tf = dv.getFloat32(0, true); if (tf > 10 && tf < 60) return tf.toFixed(1); } return '--'; } catch (e) { return '--'; } };
    const parseSpO2 = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0); return '--'; } catch (e) { return '--'; } };
    const parseBloodPressure = (dv) => { try { const str = new TextDecoder().decode(dv.buffer).replace(/\0/g, '').trim(); if (str.includes('/')) return str; return '--/--'; } catch (e) { return '--/--'; } };
    const parseGyro = (dv) => { 
        try { 
            const str = new TextDecoder().decode(dv.buffer).trim(); 
            if (str.startsWith('G:')) {
                const parts = str.substring(2).split(',');
                if (parts.length === 3) return { x: parseFloat(parts[0]), y: parseFloat(parts[1]), z: parseFloat(parts[2]) };
            }
            return null;
        } catch (e) { return null; } 
    };
    const parseHRV = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0); return '--'; } catch (e) { return '--'; } };
    const parseStress = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0); return '--'; } catch (e) { return '--'; } };
    const parseSleep = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0); return '--'; } catch (e) { return '--'; } };
    const parseSteps = (dv) => { try { if (dv.byteLength >= 2) return dv.getUint16(0, true); return 0; } catch (e) { return 0; } };
    const parseFall = (dv) => { try { if (dv.byteLength >= 1) return dv.getUint8(0) === 1; return false; } catch (e) { return false; } };

    const connectNativeBluetooth = async () => {
        if (!navigator.bluetooth) {
            setConnStatus('error');
            setConnError(isRtl ? 'متصفحك لا يدعم البلوتوث. يرجى استخدام Chrome أو Edge.' : 'Your browser does not support Web Bluetooth. Please use Chrome or Edge.');
            setConnecting(true);
            return;
        }

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: 'life' }, { name: 'life care' }, { services: [SERVICE_UUID] }],
                optionalServices: [0x180F, '00002a2b-0000-1000-8000-00805f9b34fb']
            });
            setShowScanner(false);
            await connectToDevice(device);
        } catch (error) {
            console.error('[BLE] Request Error:', error);
            if (error.name !== 'NotFoundError') {
                setConnStatus('error');
                setConnError(isRtl ? 'تأكد من تشغيل البلوتوث وقرب الجهاز.' : 'Ensure Bluetooth is ON and device is nearby.');
                setConnecting(true);
            }
        }
    };

    const connectToDevice = async (device) => {
        let firstVitalUpdated = false;
        try {
            deviceRef.current = device;
            setConnecting(true);
            setConnStatus('connecting');
            setConnError('');

            device.addEventListener('gattserverdisconnected', onDisconnected);

            const server = await device.gatt.connect();
            await new Promise(r => setTimeout(r, 600));

            setConnStatus('connecting_services');
            const service = await server.getPrimaryService(SERVICE_UUID);

            try {
                const batService = await server.getPrimaryService(0x180F);
                const batChar = await batService.getCharacteristic(0x2A19);
                const batVal = await batChar.readValue();
                setBattery(batVal.getUint8(0));
                await batChar.startNotifications();
                batChar.addEventListener('characteristicvaluechanged', (e) => setBattery(e.target.value.getUint8(0)));
            } catch (e) { console.warn('[BLE] Battery service not found'); }

            setConnStatus('connected');
            setSynced(true);
            setBluetoothActive(true);
            setConnMode('ble');

            const charConfigs = [
                { uuid: '00002a37-0000-1000-8000-00805f9b34fb', key: 'hr', parser: parseHeartRate },
                { uuid: '00002a6e-0000-1000-8000-00805f9b34fb', key: 'temp', parser: parseTemperature },
                { uuid: '00002a5f-0000-1000-8000-00805f9b34fb', key: 'spo2', parser: parseSpO2 },
                { uuid: '00002a99-0000-1000-8000-00805f9b34fb', key: 'bp', parser: parseBloodPressure },
                { uuid: '00002a2b-0000-1000-8000-00805f9b34fb', key: 'gyro', parser: parseGyro },
                { uuid: '00002a38-0000-1000-8000-00805f9b34fb', key: 'hrv', parser: parseHRV },
                { uuid: '00002a39-0000-1000-8000-00805f9b34fb', key: 'stress', parser: parseStress },
                { uuid: '00002a40-0000-1000-8000-00805f9b34fb', key: 'sleep', parser: parseSleep },
                { uuid: '00002a41-0000-1000-8000-00805f9b34fb', key: 'steps', parser: parseSteps },
                { uuid: '00002a42-0000-1000-8000-00805f9b34fb', key: 'fall', parser: parseFall }
            ];

            await Promise.allSettled(charConfigs.map(async (item) => {
                try {
                    const char = await service.getCharacteristic(item.uuid);
                    try {
                        const raw = await char.readValue();
                        const val = item.parser(raw);
                        if (val !== undefined && val !== null) {
                            if (item.key === 'gyro') {
                                setGyro(val);
                            } else if (item.key === 'steps') {
                                setSteps(val);
                            } else if (item.key === 'fall') {
                                setFallDetection(val);
                            } else {
                                setVitals(curr => ({ ...curr, [item.key]: { ...curr[item.key], value: val, lastSync: Date.now() } }));
                            }
                        }
                    } catch (e) { }
                    await char.startNotifications();
                    char.addEventListener('characteristicvaluechanged', (e) => {
                        const val = item.parser(e.target.value);
                        console.log(`[BLE Data] Received ${item.key}:`, val);
                        if (val !== undefined && val !== null) {
                            if (item.key === 'gyro') {
                                setGyro(val);
                                
                                const mag = Math.sqrt(val.x * val.x + val.y * val.y + val.z * val.z);
                                const nowTime = Date.now();
                                
                                const delta = Math.abs(mag - pedometerRef.current.lastMag);
                                if (delta > 2.0 && nowTime - pedometerRef.current.lastStepTime > 300) {
                                    setSteps(s => s + 1);
                                    pedometerRef.current.lastStepTime = nowTime;
                                }
                                
                                pedometerRef.current.activitySum += delta;
                                pedometerRef.current.counter++;
                                if (pedometerRef.current.counter > 20) {
                                    const avgAct = pedometerRef.current.activitySum / 20;
                                    if (avgAct > 4.5) setFatigue(isRtl ? 'إرهاق مرتفع' : 'High Fatigue');
                                    else if (avgAct > 1.5) setFatigue(isRtl ? 'منتظم' : 'Active');
                                    else setFatigue(isRtl ? 'مستقر' : 'Stable');
                                    
                                    pedometerRef.current.activitySum = 0;
                                    pedometerRef.current.counter = 0;
                                }
                                pedometerRef.current.lastMag = mag;
                            } else if (item.key === 'steps') {
                                setSteps(val);
                            } else if (item.key === 'fall') {
                                setFallDetection(val);
                            } else {
                                setVitals(curr => ({ ...curr, [item.key]: { ...curr[item.key], value: val, lastSync: Date.now() } }));
                            }
                        }
                        if (!firstVitalUpdated) {
                            firstVitalUpdated = true;
                            setConnecting(false);
                        }
                    });
                } catch (e) { 
                    console.error('Failed to get characteristic:', item.key, e);
                    setConnStatus('error');
                    setConnError(`Cannot bind ${item.key}: ${e.message}`);
                }
            }));

            setTimeout(() => setConnecting(false), 800);

        } catch (err) {
            console.error('[BLE] Fatal Error:', err);
            setConnStatus('error');
            setConnError(err.message || 'Connection failed');
            setConnecting(true);
        }
    };

    const onDisconnected = () => {
        setSynced(false);
        setBluetoothActive(false);
        setConnMode(null);
        setVitals(current => ({
            ...current,
            hr: { ...current.hr, value: '--', lastSync: null },
            temp: { ...current.temp, value: '--', lastSync: null },
            spo2: { ...current.spo2, value: '--', lastSync: null },
        }));
    };

    const connectSimulatedWatch = () => {
        setSynced(true);
        setBluetoothActive(false);
        setShowScanner(false);
        setVitals(prev => ({
            hr: { ...prev.hr, value: 75 },
            bp: { ...prev.bp, value: '120/80' },
            bg: { ...prev.bg, value: 95 },
            temp: { ...prev.temp, value: 36.8 },
            spo2: { ...prev.spo2, value: 98 },
            hrv: { ...prev.hrv, value: 45 },
            stress: { ...prev.stress, value: 32 },
            sleep: { ...prev.sleep, value: 85 }
        }));
        setGyro({ x: 2.1, y: -0.5, z: 9.8 });
        setSteps(124);
        setFatigue(isRtl ? 'منتظم' : 'Active');
        setFallDetection(false);
    };

    return (
        <BleContext.Provider value={{
            synced, setSynced, bluetoothActive, setBluetoothActive,
            showScanner, setShowScanner, scanningStep, setScanningStep,
            connMode, connecting, setConnecting, connStatus, setConnStatus, connError, setConnError,
            rssi, battery, isAlerting, setIsAlerting, alertMsg, vitals, setVitals, 
            gyro, setGyro, steps, fatigue, fallDetection, setFallDetection,
            handleDisconnect, connectViaBridge, startScanner, connectNativeBluetooth, connectToDevice, connectSimulatedWatch, wsRef
        }}>
            {children}
        </BleContext.Provider>
    );
}

export function useBle() {
    return useContext(BleContext);
}

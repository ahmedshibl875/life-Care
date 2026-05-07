/**
 * LifeCare BLE → WebSocket Bridge (Optimized v3.0)
 * ──────────────────────────────────────────────────
 */

const noble = require('@abandonware/noble');
const { WebSocketServer } = require('ws');
const config = require('./config.json');

// Constants
const TARGET_ADDRESS = config.deviceAddress.toLowerCase().replace(/:/g, '');
const TARGET_NAME = config.deviceName || 'Life Care';
const SERVICE_VITAL = '180d';
const SERVICE_BATTERY = '180f';
const WS_PORT = config.wsPort || 8765;


// Colors for Terminal
const CLR = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

// State management
let isConnected = false;
let peripheral = null;
let reconnectDelay = config.reconnectDelay || 3000;
let rssiInterval = null;

// WS Server
const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    log('WS', `Client connected (${clients.size} total)`, CLR.cyan);
    broadcast({ type: 'status', connected: isConnected, device: TARGET_NAME, address: config.deviceAddress });
    ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
    const msg = JSON.stringify(data);
    clients.forEach(ws => { if (ws.readyState === ws.OPEN) ws.send(msg); });
}

function log(label, msg, color = CLR.reset) {
    const time = new Date().toLocaleTimeString();
    console.log(`${CLR.dim}[${time}]${CLR.reset} ${color}${CLR.bright}[${label}]${CLR.reset} ${msg}`);
}

// ── Data Parsers ──────────────────────────────────────────
function parseTemperature(buf) {
    const raw = buf.readInt16LE(0);
    const mantissa = raw & 0x0FFF;
    const exponent = raw >> 12;
    const signedMantissa = (mantissa & 0x800) ? mantissa - 0x1000 : mantissa;
    return parseFloat((signedMantissa * Math.pow(10, exponent)).toFixed(1));
}

function parseHeartRate(buf) {
    const flags = buf.readUInt8(0);
    return (flags & 0x1) ? buf.readUInt16LE(1) : buf.readUInt8(1);
}

// ── BLE Logic ─────────────────────────────────────────────
async function startScan() {
    log('BLE', `Scanning for ${CLR.bright}${TARGET_NAME}${CLR.reset} (${config.deviceAddress})...`, CLR.blue);
    broadcast({ type: 'scanning' });
    try {
        await noble.startScanningAsync([], false);
    } catch (e) {
        log('ERR', `Scan failed: ${e.message}`, CLR.red);
    }
}

noble.on('stateChange', async (state) => {
    log('SYS', `Bluetooth Adapter: ${state.toUpperCase()}`, state === 'poweredOn' ? CLR.green : CLR.yellow);
    if (state === 'poweredOn') {
        startScan();
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', async (p) => {
    const addr = p.address.toLowerCase().replace(/:/g, '');
    const name = p.advertisement.localName || 'Unknown';

    if (addr === TARGET_ADDRESS || name === TARGET_NAME) {
        noble.stopScanning();
        peripheral = p;
        log('BLE', `Found device: ${CLR.bright}${name}${CLR.reset} [${p.address}] RSSI: ${p.rssi}dBm`, CLR.green);
        await connectDevice(p);
    }
});

async function connectDevice(p) {
    try {
        broadcast({ type: 'connecting' });
        log('BLE', 'Connecting...', CLR.blue);

        await p.connectAsync();
        isConnected = true;
        reconnectDelay = config.reconnectDelay || 3000; // reset backoff

        log('BLE', '✓ Connected successfully!', CLR.green);
        broadcast({ type: 'status', connected: true, rssi: p.rssi });

        const { characteristics } = await p.discoverSomeServicesAndCharacteristicsAsync(
            [SERVICE_VITAL, SERVICE_BATTERY],
            []
        );

        for (const char of characteristics) {
            const uuid = char.uuid.toLowerCase();

            // Battery Level (180F -> 2A19)
            if (uuid === '2a19') {
                try {
                    await char.subscribeAsync();
                    const initialBat = await char.readAsync();
                    broadcast({ type: 'battery', value: initialBat.readUInt8(0) });

                    char.on('data', (data) => {
                        const val = data.readUInt8(0);
                        log('BAT', `${val}%`, CLR.green);
                        broadcast({ type: 'battery', value: val });
                    });
                } catch (e) { log('ERR', `Battery setup failed: ${e.message}`, CLR.red); }
            }

            // Heart Rate
            if (uuid === '2a37') {
                await char.subscribeAsync();
                char.on('data', (data) => {
                    const val = parseHeartRate(data);
                    log('HR', `${val} bpm`, CLR.red);
                    broadcast({ type: 'vital', key: 'hr', value: val });
                });
            }
            // Temp
            if (uuid === '2a6e') {
                await char.subscribeAsync();
                char.on('data', (data) => {
                    const val = parseTemperature(data);
                    log('TEMP', `${val} °C`, CLR.yellow);
                    broadcast({ type: 'vital', key: 'temp', value: val });
                });
            }
            // SpO2
            if (uuid === '2a5f') {
                await char.subscribeAsync();
                char.on('data', (data) => {
                    const val = data.readUInt8(0);
                    log('SPO2', `${val} %`, CLR.blue);
                    broadcast({ type: 'vital', key: 'spo2', value: val });
                });
            }
        }

        // Start RSSI Monitoring
        rssiInterval = setInterval(async () => {
            if (isConnected) {
                const rssi = await p.updateRssiAsync();
                broadcast({ type: 'rssi', value: rssi });
            }
        }, 5000);

        p.once('disconnect', () => {
            log('BLE', '✗ Disconnected', CLR.red);
            cleanupConnection();
            scheduleReconnect();
        });

    } catch (err) {
        log('ERR', `Connection failed: ${err.message}`, CLR.red);
        cleanupConnection();
        scheduleReconnect();
    }
}

function cleanupConnection() {
    isConnected = false;
    if (rssiInterval) clearInterval(rssiInterval);
    broadcast({ type: 'status', connected: false });
}

function scheduleReconnect() {
    log('SYS', `Reconnecting in ${reconnectDelay / 1000}s...`, CLR.dim);
    setTimeout(() => {
        // Exponential backoff
        reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
        if (noble.state === 'poweredOn') startScan();
    }, reconnectDelay);
}

// Graceful Shutdown
process.on('SIGINT', () => {
    log('SYS', 'Shutting down bridge...', CLR.yellow);
    noble.stopScanning();
    if (peripheral) peripheral.disconnect();
    process.exit();
});

console.log(`\n${CLR.cyan}${CLR.bright}LifeCare Backend Bridge v3.0 Online${CLR.reset}`);
console.log(`${CLR.dim}Target: ${TARGET_NAME} (${config.deviceAddress})${CLR.reset}\n`);


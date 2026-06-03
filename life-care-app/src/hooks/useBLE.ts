import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, BleError } from 'react-native-ble-plx';
import * as ExpoDevice from 'expo-device';
import { Buffer } from 'buffer';
import { useBLEStore } from '../store/bleStore';

const bleManager = new BleManager();

// Standard Health Service UUIDs (Adjust to match your ESP32 Code)
const HEALTH_SERVICE_UUID = '0000180D-0000-1000-8000-00805f9b34fb'; 
const BP_CHARACTERISTIC_UUID = '00002a99-0000-1000-8000-00805f9b34fb'; // Blood Pressure
const HR_CHARACTERISTIC_UUID = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate
const SPO2_CHARACTERISTIC_UUID = '00002a5e-0000-1000-8000-00805f9b34fb'; // SpO2
const TEMP_CHARACTERISTIC_UUID = '00002a1c-0000-1000-8000-00805f9b34fb'; // Temperature

export function useBLE() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [bloodPressure, setBloodPressure] = useState<string>('--/--');
  const [spO2, setSpO2] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Android strict permissions for BLE
  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      { title: 'Scan Permission', message: 'App needs Bluetooth scanning', buttonPositive: 'OK' }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      { title: 'Connect Permission', message: 'App needs Bluetooth connecting', buttonPositive: 'OK' }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      { title: 'Location Permission', message: 'App needs location for BLE', buttonPositive: 'OK' }
    );

    return (
      bluetoothScanPermission === 'granted' &&
      bluetoothConnectPermission === 'granted' &&
      fineLocationPermission === 'granted'
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: 'Location Permission', message: 'Bluetooth requires location', buttonPositive: 'OK' }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return await requestAndroid31Permissions();
      }
    } else {
      return true; // iOS handles automatically via Info.plist
    }
  };

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (!isPermissionsEnabled) {
      setConnectionError('Bluetooth permissions denied');
      return;
    }

    try {
      if (Platform.OS === 'android') {
        // This will prompt the user to turn on Bluetooth if it is off
        await bleManager.enable();
      }
    } catch (error: any) {
      setConnectionError('Please turn on Bluetooth to connect to the device.');
      return;
    }

    setIsScanning(true);
    setConnectionError(null);
    setScannedDevices([]); // Reset before scanning

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setConnectionError(error.message);
        setIsScanning(false);
        return;
      }

      // Add device to list if it has a name
      if (device && device.name) {
        setScannedDevices((prevState) => {
          if (!prevState.find((d) => d.id === device.id)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

    // Auto-stop scanning after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      bleManager.stopDeviceScan();
      setIsScanning(false);
      setConnectionError(null);
      const connected = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connected);
      useBLEStore.getState().setConnectionStatus(true, connected.name);
      await connected.discoverAllServicesAndCharacteristics();
      startStreamingData(connected);

      // Handle random disconnects
      bleManager.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
        setConnectedDevice(null);
        useBLEStore.getState().setConnectionStatus(false, null);
        setConnectionError('Device disconnected. Attempting to reconnect...');
        // Auto Reconnect Logic
        setTimeout(() => scanForDevices(), 3000);
      });
    } catch (e: any) {
      setConnectionError(e.message || 'Failed to connect');
    }
  };

  const startStreamingData = (device: Device) => {
    // Read Heart Rate (UINT8)
    device.monitorCharacteristicForService(HEALTH_SERVICE_UUID, HR_CHARACTERISTIC_UUID, (error, characteristic) => {
      if (characteristic?.value) {
        const rawData = Buffer.from(characteristic.value, 'base64');
        setHeartRate(rawData.readUInt8(0));
      }
    });

    // Read SpO2 (UINT8)
    device.monitorCharacteristicForService(HEALTH_SERVICE_UUID, SPO2_CHARACTERISTIC_UUID, (error, characteristic) => {
      if (characteristic?.value) {
        const rawData = Buffer.from(characteristic.value, 'base64');
        setSpO2(rawData.readUInt8(0));
      }
    });

    // Read Temperature (Float32)
    device.monitorCharacteristicForService(HEALTH_SERVICE_UUID, TEMP_CHARACTERISTIC_UUID, (error, characteristic) => {
      if (characteristic?.value) {
        const rawData = Buffer.from(characteristic.value, 'base64');
        setTemperature(parseFloat(rawData.readFloatLE(0).toFixed(1)));
      }
    });

    // Read Blood Pressure (UTF-8 String via 0x2A99)
    device.monitorCharacteristicForService(HEALTH_SERVICE_UUID, BP_CHARACTERISTIC_UUID, (error, characteristic) => {
      if (characteristic?.value) {
        const rawData = Buffer.from(characteristic.value, 'base64');
        setBloodPressure(rawData.toString('utf8'));
      }
    });

    // Mock reading Battery Level for demonstration (usually standard UUID 0x2A19 under 0x180F)
    // Here we'll just set a mock battery level of 85% to demonstrate the global UI
    useBLEStore.getState().setBatteryLevel(85);
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      useBLEStore.getState().setConnectionStatus(false, null);
    }
  };

  return {
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    scannedDevices,
    connectedDevice,
    isScanning,
    heartRate,
    bloodPressure,
    spO2,
    temperature,
    connectionError,
  };
}

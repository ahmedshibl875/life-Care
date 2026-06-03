import { create } from 'zustand';

interface BLEState {
  isConnected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  setConnectionStatus: (isConnected: boolean, deviceName?: string | null) => void;
  setBatteryLevel: (level: number | null) => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  isConnected: false,
  deviceName: null,
  batteryLevel: null,
  setConnectionStatus: (isConnected, deviceName = null) => set({ isConnected, deviceName }),
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
}));

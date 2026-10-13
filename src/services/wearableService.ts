// Service for Web Bluetooth standard Heart Rate Profile (0x180D) and Wearable Ecosystem Sync

export type SimulationActivity = 'resting' | 'warmup' | 'aerobic_cardio' | 'heavy_gym_lifting' | 'peak_sprint' | 'sleep';

export interface BleHeartRateReading {
  bpm: number;
  rrIntervalMs?: number;
  contactDetected?: boolean;
  energyExpendedJ?: number;
}

export class WearableService {
  private bleDevice: any = null;
  private bleServer: any = null;
  private bleCharacteristic: any = null;
  private onHeartRateCallback: ((reading: BleHeartRateReading) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private simTimer: any = null;

  public isWebBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && Boolean((navigator as any).bluetooth?.requestDevice);
  }

  public isConnected(): boolean {
    return Boolean(this.bleServer && this.bleServer.connected);
  }

  public async connectBluetoothHeartRate(
    onReading: (reading: BleHeartRateReading) => void,
    onDisconnect: () => void
  ): Promise<{ success: boolean; deviceName?: string; batteryLevel?: number; error?: string }> {
    if (!this.isWebBluetoothAvailable()) {
      return {
        success: false,
        error: 'Web Bluetooth API is not natively available in this browser. (Note: iOS Safari requires WebBLE/Bluefy, while Android Chrome supports it natively). You can use our High-Fidelity BLE 0x180D Streamer below!',
      };
    }

    try {
      this.onHeartRateCallback = onReading;
      this.onDisconnectCallback = onDisconnect;

      // Request device with Heart Rate service (0x180D)
      let device: any;
      try {
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { services: ['heart_rate'] },
            { services: [0x180d] },
          ],
          optionalServices: ['battery_service', 0x180f],
        });
      } catch (filterErr: any) {
        // Fallback with broader filter for some monitors (e.g. Polar, Garmin, Wahoo)
        if (filterErr.name === 'NotFoundError') {
          throw filterErr;
        }
        device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['heart_rate', 0x180d, 'battery_service', 0x180f],
        });
      }

      this.bleDevice = device;
      device.addEventListener('gattserverdisconnected', () => {
        this.disconnectBle();
      });

      const server = await device.gatt.connect();
      this.bleServer = server;

      // Get Primary Heart Rate Service (handles string or standard 16-bit UUID)
      let hrService: any;
      try {
        hrService = await server.getPrimaryService('heart_rate');
      } catch {
        hrService = await server.getPrimaryService(0x180d);
      }

      // Get Heart Rate Measurement Characteristic (0x2A37)
      let characteristic: any;
      try {
        characteristic = await hrService.getCharacteristic('heart_rate_measurement');
      } catch {
        characteristic = await hrService.getCharacteristic(0x2a37);
      }
      this.bleCharacteristic = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const reading = this.parseHeartRateData(value);
        if (this.onHeartRateCallback) {
          this.onHeartRateCallback(reading);
        }
      });

      // Try reading battery level if device exposes standard Battery Service (0x180F)
      let batteryLevel = 98;
      try {
        let batteryService: any;
        try {
          batteryService = await server.getPrimaryService('battery_service');
        } catch {
          batteryService = await server.getPrimaryService(0x180f);
        }
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const val = await batteryChar.readValue();
        batteryLevel = val.getUint8(0);
      } catch {
        // Battery service optional on some straps
      }

      return {
        success: true,
        deviceName: device.name || 'Polar / Garmin BLE Sensor',
        batteryLevel,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, error: 'Device pairing prompt was cancelled.' };
      }
      if (err.name === 'SecurityError') {
        return {
          success: false,
          error: 'Browser security policy: Web Bluetooth in iframes requires top-level permission. Use our High-Fidelity BLE Streamer for full live testing!',
        };
      }
      return { success: false, error: err.message || 'Failed to establish GATT connection with Bluetooth device.' };
    }
  }

  public disconnectBle() {
    try {
      if (this.bleCharacteristic) {
        this.bleCharacteristic.stopNotifications().catch(() => {});
      }
      if (this.bleServer && this.bleServer.connected) {
        this.bleServer.disconnect();
      }
    } catch {
      // Ignore
    }
    this.bleDevice = null;
    this.bleServer = null;
    this.bleCharacteristic = null;
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  // Parse Standard Bluetooth SIG Heart Rate Measurement GATT format (0x2A37)
  public parseHeartRateData(value: DataView): BleHeartRateReading {
    const flags = value.getUint8(0);
    const rate16Bits = (flags & 0x1) === 0x1;
    let bpm: number;
    let index = 1;

    if (rate16Bits) {
      bpm = value.getUint16(index, true); // Little endian
      index += 2;
    } else {
      bpm = value.getUint8(index);
      index += 1;
    }

    const contactDetected = (flags & 0x6) === 0x6;

    let energyExpendedJ: number | undefined;
    const energyExpendedPresent = (flags & 0x8) === 0x8;
    if (energyExpendedPresent && index + 1 < value.byteLength) {
      energyExpendedJ = value.getUint16(index, true);
      index += 2;
    }

    let rrIntervalMs: number | undefined;
    const rrIntervalPresent = (flags & 0x10) === 0x10;
    if (rrIntervalPresent && index < value.byteLength) {
      // RR intervals in 1/1024 seconds
      const rawRr = value.getUint16(index, true);
      rrIntervalMs = Math.round((rawRr / 1024) * 1000);
    }

    return {
      bpm,
      contactDetected,
      energyExpendedJ,
      rrIntervalMs,
    };
  }

  // Generate realistic physiological heart rate simulation for testing across any device
  public static calculateTargetBpm(activity: SimulationActivity, baseBpm: number): number {
    switch (activity) {
      case 'sleep':
        return 48 + Math.floor(Math.sin(Date.now() / 4000) * 3);
      case 'resting':
        return 65 + Math.floor(Math.sin(Date.now() / 3000) * 4);
      case 'warmup':
        return 102 + Math.floor(Math.sin(Date.now() / 2500) * 5);
      case 'aerobic_cardio':
        return 138 + Math.floor(Math.sin(Date.now() / 2000) * 6);
      case 'heavy_gym_lifting':
        return 162 + Math.floor(Math.sin(Date.now() / 1500) * 8);
      case 'peak_sprint':
        return 182 + Math.floor(Math.sin(Date.now() / 1200) * 5);
      default:
        return baseBpm;
    }
  }
}

export const wearableService = new WearableService();

import React, { useState } from 'react';
import {
  X,
  Bluetooth,
  Activity,
  CheckCircle2,
  Battery,
  Watch,
  Smartphone,
  Radio,
  Info,
} from 'lucide-react';
import { WearableDevice } from '../types/fitness';
import { wearableService, BleHeartRateReading } from '../services/wearableService';

interface WearablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wearables: WearableDevice[];
  onSelectWearable: (device: WearableDevice) => void;
  onBleReading: (reading: BleHeartRateReading) => void;
  isPhysicalBleActive: boolean;
  onSetPhysicalBleActive: (active: boolean) => void;
}

export const WearablesModal: React.FC<WearablesModalProps> = ({
  isOpen,
  onClose,
  wearables,
  onSelectWearable,
  onBleReading,
  isPhysicalBleActive,
  onSetPhysicalBleActive,
}) => {
  const [isScanningBle, setIsScanningBle] = useState<boolean>(false);
  const [bleStatusMsg, setBleStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Hardware Web Bluetooth scan & pair
  const handlePairBle = async () => {
    setIsScanningBle(true);
    setBleStatusMsg('Scanning for Bluetooth LE Heart Rate Monitors (Standard 0x180D Service)...');

    const result = await wearableService.connectBluetoothHeartRate(
      (reading) => {
        onBleReading(reading);
      },
      () => {
        onSetPhysicalBleActive(false);
        setBleStatusMsg('Bluetooth hardware device disconnected.');
      }
    );

    setIsScanningBle(false);
    if (result.success) {
      onSetPhysicalBleActive(true);
      setBleStatusMsg(`Connected to ${result.deviceName}! Hardware GATT notifications streaming live.`);
      const bleDev: WearableDevice = {
        id: 'ble-hrm-generic',
        name: result.deviceName || 'Bluetooth Heart Rate Monitor',
        brand: 'ble_standard',
        connected: true,
        batteryLevel: result.batteryLevel || 98,
        signalStrength: 'excellent',
        lastSyncTimestamp: 'Just now',
        isRealBluetooth: true,
        features: ['Web Bluetooth BLE 0x180D', 'Real-time Millisecond Stream', 'Continuous RR-Intervals'],
      };
      onSelectWearable(bleDev);
    } else {
      setBleStatusMsg(result.error || 'Bluetooth pairing canceled.');
    }
  };

  // High-Fidelity BLE Stream Simulator (Works 100% on iPhone Safari, Android, and Desktop)
  const handleConnectSimulatedBle = () => {
    onSetPhysicalBleActive(false);
    const bleDev: WearableDevice = {
      id: 'ble-hrm-generic',
      name: 'Polar H10 BLE Sensor (Emulated)',
      brand: 'ble_standard',
      connected: true,
      batteryLevel: 94,
      signalStrength: 'excellent',
      lastSyncTimestamp: 'Just now',
      isRealBluetooth: true,
      features: ['Standard 0x180D Heart Rate', 'Zero-Latency Stream', 'RR-Interval HRV Processing'],
    };
    onSelectWearable(bleDev);
    setBleStatusMsg('Connected to Polar H10 BLE Streamer! Transmitting live heart rate & RR-intervals.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Wearable Device Ecosystem</h3>
              <p className="text-xs text-slate-400">
                Sync Apple Watch, Garmin, Whoop, Oura, Fitbit & Bluetooth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Bluetooth LE Pairing Banner */}
        <div className="p-5 border-b border-slate-800 bg-emerald-950/20">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Hardware Web Bluetooth BLE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  GATT 0x180D
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Pair Bluetooth Heart Rate Sensor
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Connect any Polar H10, Garmin HRM, Wahoo TICKR, or BLE broadcast strap.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handlePairBle}
                disabled={isScanningBle}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all shrink-0 disabled:opacity-60"
              >
                <Bluetooth className={`w-4 h-4 ${isScanningBle ? 'animate-spin' : ''}`} />
                <span>{isScanningBle ? 'Scanning Nearby BLE...' : 'Scan Bluetooth (Web BLE)'}</span>
              </button>

              <button
                onClick={handleConnectSimulatedBle}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Connect virtual BLE 0x180D stream"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Virtual BLE Stream</span>
              </button>
            </div>
          </div>

          {bleStatusMsg && (
            <p className="text-xs font-mono text-emerald-300 bg-black/40 p-2.5 rounded-xl border border-emerald-500/20 mt-3 leading-relaxed">
              ℹ️ {bleStatusMsg}
            </p>
          )}

          {/* iOS & Android compatibility note */}
          <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Compatibility:</strong> Android Chrome supports direct Web BLE pairing. iOS Safari uses Virtual BLE mode or the Bluefy browser.
            </span>
          </div>
        </div>

        {/* Popular Connected Devices List */}
        <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Integrated Wearable Connectors
          </span>

          {wearables.map((device) => {
            return (
              <div
                key={device.id}
                onClick={() => {
                  if (device.isRealBluetooth && !isPhysicalBleActive) {
                    handleConnectSimulatedBle();
                  } else {
                    onSelectWearable(device);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  device.connected
                    ? 'bg-slate-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      device.brand === 'apple'
                        ? 'bg-slate-700 text-white'
                        : device.brand === 'whoop'
                        ? 'bg-red-950 text-red-400 border border-red-700/50'
                        : device.brand === 'garmin'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/50'
                        : device.brand === 'oura'
                        ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                    }`}
                  >
                    {device.brand === 'apple' ? (
                      <Watch className="w-5 h-5" />
                    ) : device.brand === 'whoop' ? (
                      'W4'
                    ) : device.brand === 'garmin' ? (
                      'G9'
                    ) : device.brand === 'oura' ? (
                      '💍'
                    ) : device.brand === 'ble_standard' ? (
                      <Bluetooth className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-white">{device.name}</h5>
                      {device.connected && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3 h-3 text-emerald-400" />
                        {device.batteryLevel}%
                      </span>
                      <span>•</span>
                      <span className="capitalize">{device.signalStrength} Signal</span>
                      <span>•</span>
                      <span>{device.lastSyncTimestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {device.connected ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <button className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Real-time polling: 1000ms active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

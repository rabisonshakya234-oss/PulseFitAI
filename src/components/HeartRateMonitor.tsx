import React from 'react';
import { Heart, Activity, Flame, ShieldCheck, Zap, RefreshCw, Bluetooth } from 'lucide-react';
import { HeartRateState, HeartRateZone, WearableDevice } from '../types/fitness';
import { HEART_RATE_ZONES } from '../data/mockFitnessData';
import { PulseWaveformCanvas } from './PulseWaveformCanvas';
import { SimulationActivity } from '../services/wearableService';

interface HeartRateMonitorProps {
  hrState: HeartRateState;
  activeZone: HeartRateZone;
  activeWearable: WearableDevice | undefined;
  simulationActivity: SimulationActivity;
  onSetSimulationActivity: (activity: SimulationActivity) => void;
  onOpenWearablesModal: () => void;
}

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({
  hrState,
  activeZone,
  activeWearable,
  simulationActivity,
  onSetSimulationActivity,
  onOpenWearablesModal,
}) => {
  // Calculate percentage toward max heart rate
  const pctMax = Math.min(100, Math.round((hrState.currentBpm / hrState.maxBpm) * 100));

  const simulationOptions: { id: SimulationActivity; label: string; icon: string; bpmRange: string }[] = [
    { id: 'resting', label: 'Rest / Relax', icon: '🧘', bpmRange: '55-68' },
    { id: 'warmup', label: 'Warmup Walk', icon: '🚶', bpmRange: '95-110' },
    { id: 'aerobic_cardio', label: 'Cardio Run', icon: '🏃', bpmRange: '130-148' },
    { id: 'heavy_gym_lifting', label: 'Heavy Lifting', icon: '🏋️', bpmRange: '155-172' },
    { id: 'peak_sprint', label: 'Peak HIIT', icon: '⚡', bpmRange: '175-188' },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Top Wearable Device Sync Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            {activeWearable?.isRealBluetooth ? <Bluetooth className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {activeWearable ? activeWearable.name : 'No Wearable Linked'}
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Live Stream • Battery {activeWearable?.batteryLevel || 90}% • Signal{' '}
              <span className="text-emerald-400 capitalize">{activeWearable?.signalStrength || 'Good'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenWearablesModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/80 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Switch Device</span>
        </button>
      </div>

      {/* Main Real-Time Cardiac Display Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-black/80 border border-slate-800/80 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                Cardiac Monitor
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                REAL-TIME
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Heart Rate Analytics</h2>
          </div>

          {/* Current Zone Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wide uppercase ${activeZone.badgeBg}`}
          >
            Zone {activeZone.zone} • {activeZone.name.split(':')[1] || activeZone.name}
          </div>
        </div>

        {/* Central Pulse Metric */}
        <div className="my-5 flex items-baseline justify-center gap-3">
          <div className="relative flex items-center justify-center">
            <Heart
              className="w-12 h-12 text-rose-500 fill-rose-500 transition-transform duration-300"
              style={{
                transform: `scale(${1 + (hrState.currentBpm / 200) * 0.25})`,
                filter: `drop-shadow(0 0 ${hrState.currentZone >= 4 ? '16px' : '8px'} rgba(244, 63, 94, 0.7))`,
              }}
            />
          </div>
          <span className="text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono-numbers">
            {hrState.currentBpm}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">BPM</span>
            <span className="text-xs font-mono text-slate-500">{pctMax}% of Max</span>
          </div>
        </div>

        {/* Real-time ECG Pulse Waveform Canvas */}
        <div className="mb-4">
          <PulseWaveformCanvas
            bpm={hrState.currentBpm}
            zone={hrState.currentZone}
            accentColor={activeZone.accentColor}
            height={85}
          />
        </div>

        {/* Zone 1-5 Segmented Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Training Heart Rate Zones</span>
            <span className="font-mono text-slate-300">
              {activeZone.minBpm} - {activeZone.maxBpm} BPM
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-3">
            {HEART_RATE_ZONES.map((z) => {
              const isCurrent = z.zone === activeZone.zone;
              return (
                <div
                  key={z.zone}
                  className={`relative rounded-md transition-all duration-300 ${
                    isCurrent
                      ? 'scale-y-125 shadow-md'
                      : 'opacity-40 hover:opacity-75'
                  }`}
                  style={{
                    backgroundColor: z.accentColor,
                    boxShadow: isCurrent ? `0 0 12px ${z.accentColor}` : undefined,
                  }}
                  title={`${z.name}: ${z.minBpm}-${z.maxBpm} BPM`}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            <span className="text-slate-200 font-semibold">{activeZone.name}:</span> {activeZone.description}
          </p>
        </div>
      </div>

      {/* Physiological Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Resting Heart Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Resting HR</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono-numbers">{hrState.restingBpm}</span>
            <span className="text-xs text-slate-400 font-mono">bpm</span>
          </div>
          <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
            Top 10% Athletic RHR
          </span>
        </div>

        {/* HRV (Heart Rate Variability) */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>HRV (rMSSD)</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono-numbers">{hrState.hrv}</span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <span className="inline-block mt-1 text-[11px] text-cyan-400 font-medium">
            Optimal Parasympathetic
          </span>
        </div>

        {/* Recovery Score */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Recovery Score</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono-numbers">{hrState.recoveryScore}%</span>
          </div>
          <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
            Green • Primed to Lift
          </span>
        </div>

        {/* Max Cardiac Peak */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Max Recorded HR</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono-numbers">{hrState.maxBpm}</span>
            <span className="text-xs text-slate-400 font-mono">bpm</span>
          </div>
          <span className="inline-block mt-1 text-[11px] text-slate-400 font-medium">
            Peak threshold 195
          </span>
        </div>
      </div>

      {/* Interactive Activity & Intensity Simulator */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Biometric Simulator
            </span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              Test Real-time Responses
            </span>
          </div>
          <span className="text-xs text-slate-400">Simulate body strain:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {simulationOptions.map((opt) => {
            const isSelected = simulationActivity === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSetSimulationActivity(opt.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/80 text-white shadow-lg ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-lg mb-1">{opt.icon}</span>
                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">{opt.bpmRange} BPM</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Intraday & 7-Day Trend Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Intraday Heart Rate Rhythm</h3>
            <p className="text-xs text-slate-400">Continuous 24-hour optical sensor tracking</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-emerald-400">Day Average: 74 BPM</span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="flex items-end justify-between gap-1 h-32 pt-4 px-1 border-b border-slate-800">
          {hrState.intradayHistory.map((point, idx) => {
            const heightPct = Math.max(15, Math.min(100, Math.round(((point.bpm - 40) / 140) * 100)));
            const zoneColor =
              point.bpm >= 155 ? '#f43f5e' : point.bpm >= 135 ? '#f59e0b' : point.bpm >= 115 ? '#10b981' : '#06b6d4';

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: zoneColor,
                    opacity: 0.85,
                  }}
                  title={`${point.time}: ${point.bpm} BPM`}
                />
                <span className="text-[9px] text-slate-500 font-mono rotate-0 group-hover:text-slate-300">
                  {point.time.split(':')[0]}h
                </span>
              </div>
            );
          })}
        </div>

        {/* Weekly Comparison */}
        <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Resting HR (avg 54 bpm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Max Workout HR (avg 172 bpm)</span>
            </div>
          </div>
          <span className="text-slate-500 font-mono">7-Day Trend: -2 bpm RHR (Optimal)</span>
        </div>
      </div>
    </div>
  );
};

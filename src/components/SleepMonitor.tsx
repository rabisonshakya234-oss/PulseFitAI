import React from 'react';
import { Moon, Sparkles, Clock, BedDouble, Shield, Heart, Zap, ArrowUpRight } from 'lucide-react';
import { SleepState } from '../types/fitness';

interface SleepMonitorProps {
  sleepState: SleepState;
  onAskCoachAboutSleep: () => void;
}

export const SleepMonitor: React.FC<SleepMonitorProps> = ({ sleepState, onAskCoachAboutSleep }) => {
  const formatMinutes = (totalMin: number) => {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hours}h ${mins}m`;
  };

  const totalMin = sleepState.totalDurationMinutes;
  const deepPct = Math.round((sleepState.deepSleepMinutes / totalMin) * 100);
  const remPct = Math.round((sleepState.remSleepMinutes / totalMin) * 100);
  const lightPct = Math.round((sleepState.lightSleepMinutes / totalMin) * 100);
  const awakePct = Math.round((sleepState.awakeMinutes / totalMin) * 100);

  return (
    <div className="space-y-5 pb-6">
      {/* Sleep Score Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-black/90 border border-indigo-900/40 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-indigo-400 uppercase">
                Circadian Sleep Analysis
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LAST NIGHT
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Sleep Architecture & Recovery</h2>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/40 border border-indigo-700/40 text-xs font-semibold text-indigo-200">
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            <span>Optimal Rest</span>
          </div>
        </div>

        {/* Big Score and Summary */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900/60 to-slate-900/80 border border-indigo-500/30 shadow-inner">
              <span className="text-4xl font-extrabold text-white font-mono-numbers">
                {sleepState.overallScore}
              </span>
              <span className="text-[10px] absolute bottom-2 font-mono text-indigo-300">/ 100</span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Sleep Quality</p>
              <h3 className="text-lg font-bold text-white">Prime Restoration</h3>
              <p className="text-xs text-slate-400">Efficiency: {sleepState.efficiencyPct}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Sleep Time</span>
              <p className="text-base font-bold text-white font-mono-numbers">
                {formatMinutes(sleepState.totalDurationMinutes)}
              </p>
              <p className="text-[11px] text-slate-500">
                {sleepState.bedtime} - {sleepState.wakeTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
            <BedDouble className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Sleep Debt</span>
              <p className="text-base font-bold text-emerald-400 font-mono-numbers">
                +{sleepState.sleepDebtMinutes} mins
              </p>
              <p className="text-[11px] text-slate-500">Well within 30m target</p>
            </div>
          </div>
        </div>

        {/* Sleep Stage Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Stage Composition</span>
            <span className="text-slate-400 font-mono">4 Sleep Cycles Logged</span>
          </div>

          <div className="flex h-3.5 w-full rounded-xl overflow-hidden bg-slate-950 gap-0.5 p-0.5 border border-white/5">
            <div
              className="bg-indigo-600 rounded-l-md transition-all duration-300"
              style={{ width: `${deepPct}%` }}
              title={`Deep Sleep: ${deepPct}%`}
            />
            <div
              className="bg-cyan-500 transition-all duration-300"
              style={{ width: `${remPct}%` }}
              title={`REM Sleep: ${remPct}%`}
            />
            <div
              className="bg-slate-500 transition-all duration-300"
              style={{ width: `${lightPct}%` }}
              title={`Light Sleep: ${lightPct}%`}
            />
            <div
              className="bg-rose-500 rounded-r-md transition-all duration-300"
              style={{ width: `${awakePct}%` }}
              title={`Awake: ${awakePct}%`}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-slate-300 font-medium">Deep:</span>
              <span className="text-indigo-400 font-mono">
                {formatMinutes(sleepState.deepSleepMinutes)} ({deepPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-slate-300 font-medium">REM:</span>
              <span className="text-cyan-400 font-mono">
                {formatMinutes(sleepState.remSleepMinutes)} ({remPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-300 font-medium">Light:</span>
              <span className="text-slate-400 font-mono">
                {formatMinutes(sleepState.lightSleepMinutes)} ({lightPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300 font-medium">Awake:</span>
              <span className="text-rose-400 font-mono">
                {sleepState.awakeMinutes}m ({awakePct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hypnogram Sleep Stage Timeline */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Full Night Hypnogram Timeline</h3>
            <p className="text-xs text-slate-400">Sleep architecture progression across the night</p>
          </div>
          <span className="text-[11px] font-mono text-indigo-400">Sampling Rate: 30s</span>
        </div>

        {/* Hypnogram graph */}
        <div className="relative pt-4 pb-2 border-b border-slate-800">
          <div className="grid grid-cols-12 gap-1 h-28 items-end">
            {sleepState.stagesTimeline.map((block, i) => {
              // Height corresponds to depth of sleep
              const stageConfig: Record<string, { height: string; color: string; label: string }> = {
                awake: { height: '15%', color: 'bg-rose-500/80', label: 'Awake' },
                light: { height: '45%', color: 'bg-slate-500/80', label: 'Light' },
                rem: { height: '70%', color: 'bg-cyan-500/80', label: 'REM' },
                deep: { height: '95%', color: 'bg-indigo-600', label: 'Deep' },
              };

              const conf = stageConfig[block.stage] || stageConfig.light;

              return (
                <div key={i} className="flex flex-col items-center justify-end h-full group relative">
                  <div
                    className={`w-full rounded-t-md ${conf.color} transition-all duration-200 group-hover:brightness-125`}
                    style={{ height: conf.height }}
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 border border-slate-700 text-[10px] text-white px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {block.time}: {conf.label} ({block.durationMin}m)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
            <span>{sleepState.bedtime} (Sleep Onset)</span>
            <span>03:00 AM (Deep Peak)</span>
            <span>{sleepState.wakeTime} (Wake Time)</span>
          </div>
        </div>

        {/* Biomarkers During Sleep */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Heart className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Night Resting HR Dip</span>
              <p className="text-sm font-bold text-white font-mono-numbers">48 bpm</p>
              <p className="text-[10px] text-emerald-400">12% dip (Cardioprotective)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sleep HRV Baseline</span>
              <p className="text-sm font-bold text-white font-mono-numbers">{sleepState.hrvDuringSleep} ms</p>
              <p className="text-[10px] text-cyan-400">+8ms above weekly avg</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3 col-span-2 md:col-span-1">
            <Shield className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Respiratory Stability</span>
              <p className="text-sm font-bold text-white font-mono-numbers">
                {sleepState.respiratoryRate} rpm
              </p>
              <p className="text-[10px] text-emerald-400">Zero airway disturbance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep Recovery Insight & Coach Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Biometric Gym Readiness
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {sleepState.recoveryInsight}
            </p>
          </div>
        </div>

        <button
          onClick={onAskCoachAboutSleep}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <span>Ask AI Coach</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

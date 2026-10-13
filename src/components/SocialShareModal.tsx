import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Flame,
  Heart,
  Moon,
  Trophy,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import { HeartRateState, SleepState, GymSession, Badge } from '../types/fitness';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hrState: HeartRateState;
  sleepState: SleepState;
  gymSession: GymSession;
  featuredBadge?: Badge | null;
  onPostToCommunity: (postText: string) => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  hrState,
  sleepState,
  gymSession,
  featuredBadge,
  onPostToCommunity,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const durationMin = Math.max(1, Math.round(gymSession.elapsedSeconds / 60));
  const calories = Math.round(gymSession.activeCaloriesBurnt) || 540;
  const avgHr = gymSession.avgBpmSession || hrState.currentBpm;
  const strain = gymSession.strainScore > 0 ? gymSession.strainScore.toFixed(1) : '9.4';

  const shareSummaryText = `🔥 PulseFit AI Workout Completed!
🏋️ Session: ${gymSession.title}
⏱️ Duration: ${durationMin} mins | ⚡ Strain: ${strain}/21
❤️ Avg HR: ${avgHr} BPM | Max HR: ${gymSession.maxBpmReached || hrState.maxBpm} BPM
🔥 Calories Burnt: ${calories} kcal
🌙 Sleep Score: ${sleepState.overallScore}% (${Math.floor(sleepState.totalDurationMinutes / 60)}h ${sleepState.totalDurationMinutes % 60}m)
${featuredBadge ? `🏆 Badge Earned: ${featuredBadge.title} - ${featuredBadge.description}` : ''}
#PulseFitAI #FitnessTracker #GymLife #Biohacking`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `PulseFit AI Workout - ${gymSession.title}`,
          text: shareSummaryText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadCard = () => {
    // Generate raster image of the card using SVG canvas rendering
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const canvas = document.createElement('canvas');
    const width = format === 'story' ? 540 : 600;
    const height = format === 'story' ? 960 : 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw dark athletic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Accent glow circle
    const glow = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, 280);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Header Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('PULSEFIT AI • LIVE BIOMETRICS', 40, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(gymSession.title, 40, 105);

    // Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), 40, 135);

    // Big Metrics Block
    const drawMetric = (label: string, value: string, sub: string, x: number, y: number, color: string) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label.toUpperCase(), x, y);

      ctx.fillStyle = color;
      ctx.font = '900 38px monospace';
      ctx.fillText(value, x, y + 40);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(sub, x, y + 60);
    };

    drawMetric('Workout Duration', `${durationMin}m`, 'Active Session', 40, 200, '#ffffff');
    drawMetric('Active Energy', `${calories}`, 'kcal burned', 280, 200, '#f97316');
    drawMetric('Heart Rate (Avg)', `${avgHr} bpm`, `Max: ${gymSession.maxBpmReached || hrState.maxBpm} bpm`, 40, 310, '#f43f5e');
    drawMetric('Sleep Recovery', `${sleepState.overallScore}%`, 'Prime Readiness', 280, 310, '#06b6d4');
    drawMetric('Whoop-Style Strain', `${strain}`, 'Scale 0 to 21', 40, 420, '#a855f7');

    if (featuredBadge) {
      // Badge block
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.roundRect ? ctx.roundRect(40, 520, width - 80, 100, 16) : ctx.rect(40, 520, width - 80, 100);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🏆 Badge: ${featuredBadge.title}`, 60, 560);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(featuredBadge.description, 60, 590);
    }

    // Footer Watermark
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText('Syncs with Apple Watch, Garmin, Whoop, Oura & Bluetooth BLE', 40, height - 40);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pulsefit-workout-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Share Workout & Badges</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Format Selector */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Card Layout:</span>
          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setFormat('story')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                format === 'story' ? 'bg-emerald-500 text-black' : 'text-slate-400'
              }`}
            >
              Story (9:16)
            </button>
            <button
              onClick={() => setFormat('square')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                format === 'square' ? 'bg-emerald-500 text-black' : 'text-slate-400'
              }`}
            >
              Square (1:1)
            </button>
          </div>
        </div>

        {/* The Visual Social Share Card Preview */}
        <div className="p-5">
          <div
            ref={cardRef}
            className={`relative mx-auto rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border-2 border-emerald-500/40 p-5 shadow-2xl overflow-hidden transition-all ${
              format === 'story' ? 'aspect-[9/14]' : 'aspect-square'
            } flex flex-col justify-between`}
          >
            {/* Background neon blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-bold text-emerald-400 tracking-wider">
                  PULSEFIT AI
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h4 className="text-lg font-black text-white leading-tight">
                {gymSession.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full-Session Biometric Telemetry
              </p>

              {/* Vitals Grid inside Card */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                    <Flame className="w-3 h-3 text-orange-400" /> Calories
                  </span>
                  <span className="text-lg font-black font-mono text-orange-400">
                    {calories} kcal
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                    <Heart className="w-3 h-3 text-rose-500" /> Avg Heart Rate
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400">
                    {avgHr} bpm
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                    <Moon className="w-3 h-3 text-cyan-400" /> Sleep Score
                  </span>
                  <span className="text-lg font-black font-mono text-cyan-300">
                    {sleepState.overallScore}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Day Strain
                  </span>
                  <span className="text-lg font-black font-mono text-purple-300">
                    {strain} / 21
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Badge Spotlight */}
            {featuredBadge && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 my-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-amber-400 uppercase font-bold">
                    NEW BADGE UNLOCKED
                  </span>
                  <h5 className="text-xs font-bold text-white">{featuredBadge.title}</h5>
                </div>
              </div>
            )}

            {/* Card Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>SYNCED VIA WEARABLE</span>
              <span className="text-emerald-400">iOS & Android App</span>
            </div>
          </div>
        </div>

        {/* Share Buttons Toolbar */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share (Instagram/WhatsApp)</span>
            </button>

            <button
              onClick={handleDownloadCard}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Save Image (PNG)</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Summary Copied!' : 'Copy Text Summary'}</span>
            </button>

            <button
              onClick={() => {
                onPostToCommunity(shareSummaryText);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Post to Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

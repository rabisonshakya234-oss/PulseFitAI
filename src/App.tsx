import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Moon,
  Dumbbell,
  Sparkles,
  Trophy,
  Activity,
  Share2,
  Smartphone,
  Maximize2,
  Watch,
  Bluetooth,
} from 'lucide-react';
import {
  HeartRateState,
  SleepState,
  WearableDevice,
  GymSession,
  Badge,
  CommunityPost,
  GeneratedRoutine,
} from './types/fitness';
import {
  INITIAL_HEART_RATE_STATE,
  INITIAL_SLEEP_STATE,
  AVAILABLE_WEARABLES,
  INITIAL_GYM_SESSION,
  INITIAL_BADGES,
  INITIAL_COMMUNITY_POSTS,
  HEART_RATE_ZONES,
} from './data/mockFitnessData';
import { HeartRateMonitor } from './components/HeartRateMonitor';
import { SleepMonitor } from './components/SleepMonitor';
import { GymTracker } from './components/GymTracker';
import { AICoachView } from './components/AICoachView';
import { BadgesView } from './components/BadgesView';
import { CommunityFeedView } from './components/CommunityFeedView';
import { SocialShareModal } from './components/SocialShareModal';
import { WearablesModal } from './components/WearablesModal';
import { SimulationActivity, WearableService, BleHeartRateReading } from './services/wearableService';
import { triggerHaptic, playZoneAlertTone } from './utils/audioAlerts';

type TabType = 'heart' | 'sleep' | 'gym' | 'coach' | 'badges' | 'community';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('heart');

  // Device simulation and preview mode
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [deviceModel, setDeviceModel] = useState<'ios' | 'android'>('ios');

  // Core App States
  const [hrState, setHrState] = useState<HeartRateState>(() => {
    const saved = localStorage.getItem('pulsefit_hr_state');
    return saved ? JSON.parse(saved) : INITIAL_HEART_RATE_STATE;
  });

  const [sleepState, setSleepState] = useState<SleepState>(() => {
    const saved = localStorage.getItem('pulsefit_sleep_state');
    return saved ? JSON.parse(saved) : INITIAL_SLEEP_STATE;
  });

  const [wearables, setWearables] = useState<WearableDevice[]>(() => {
    const saved = localStorage.getItem('pulsefit_wearables');
    return saved ? JSON.parse(saved) : AVAILABLE_WEARABLES;
  });

  const [gymSession, setGymSession] = useState<GymSession>(() => {
    const saved = localStorage.getItem('pulsefit_gym_session');
    return saved ? JSON.parse(saved) : INITIAL_GYM_SESSION;
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('pulsefit_badges');
    return saved ? JSON.parse(saved) : INITIAL_BADGES;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('pulsefit_community');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  // Simulator controls
  const [simulationActivity, setSimulationActivity] = useState<SimulationActivity>('resting');

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isWearablesModalOpen, setIsWearablesModalOpen] = useState<boolean>(false);
  const [featuredShareBadge, setFeaturedShareBadge] = useState<Badge | null>(null);
  const [isPhysicalBleActive, setIsPhysicalBleActive] = useState<boolean>(false);

  // Active connected wearable
  const activeWearable = useMemo(() => {
    return wearables.find((w) => w.connected) || wearables[0];
  }, [wearables]);

  // Determine active Heart Rate Zone (1-5)
  const activeZone = useMemo(() => {
    const bpm = hrState.currentBpm;
    if (bpm >= 173) return HEART_RATE_ZONES[4]; // Zone 5
    if (bpm >= 155) return HEART_RATE_ZONES[3]; // Zone 4
    if (bpm >= 136) return HEART_RATE_ZONES[2]; // Zone 3
    if (bpm >= 115) return HEART_RATE_ZONES[1]; // Zone 2
    return HEART_RATE_ZONES[0]; // Zone 1
  }, [hrState.currentBpm]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pulsefit_hr_state', JSON.stringify(hrState));
      localStorage.setItem('pulsefit_sleep_state', JSON.stringify(sleepState));
      localStorage.setItem('pulsefit_wearables', JSON.stringify(wearables));
      localStorage.setItem('pulsefit_gym_session', JSON.stringify(gymSession));
      localStorage.setItem('pulsefit_badges', JSON.stringify(badges));
      localStorage.setItem('pulsefit_community', JSON.stringify(communityPosts));
    } catch {
      // Storage full or private mode
    }
  }, [hrState, sleepState, wearables, gymSession, badges, communityPosts]);

  // Periodic heartbeat & physiological simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // If a physical hardware Bluetooth sensor is actively streaming data via GATT callbacks, do not overwrite
      if (isPhysicalBleActive) {
        return;
      }

      const target = WearableService.calculateTargetBpm(simulationActivity, hrState.restingBpm);
      setHrState((prev) => {
        // Move smoothly toward target
        const diff = target - prev.currentBpm;
        const step = diff > 0 ? Math.min(2, diff) : Math.max(-2, diff);
        const nextBpm = Math.max(45, Math.min(205, prev.currentBpm + step));

        let currentZone: 1 | 2 | 3 | 4 | 5 = 1;
        if (nextBpm >= 173) currentZone = 5;
        else if (nextBpm >= 155) currentZone = 4;
        else if (nextBpm >= 136) currentZone = 3;
        else if (nextBpm >= 115) currentZone = 2;
        else currentZone = 1;

        // Check if zone changed to trigger audio tone
        if (currentZone !== prev.currentZone && currentZone >= 3) {
          playZoneAlertTone();
        }

        // Live ECG waveform buffer
        const nextWave = [...prev.liveWaveform.slice(1), nextBpm];

        return {
          ...prev,
          currentBpm: nextBpm,
          currentZone,
          maxBpm: Math.max(prev.maxBpm, nextBpm),
          liveWaveform: nextWave,
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [simulationActivity, activeWearable?.isRealBluetooth, hrState.restingBpm]);

  // Handle hardware BLE reading
  const handleBleReading = (reading: BleHeartRateReading) => {
    setHrState((prev) => {
      let currentZone: 1 | 2 | 3 | 4 | 5 = 1;
      if (reading.bpm >= 173) currentZone = 5;
      else if (reading.bpm >= 155) currentZone = 4;
      else if (reading.bpm >= 136) currentZone = 3;
      else if (reading.bpm >= 115) currentZone = 2;
      else currentZone = 1;

      return {
        ...prev,
        currentBpm: reading.bpm,
        currentZone,
        hrv: reading.rrIntervalMs ? Math.round(reading.rrIntervalMs / 10) : prev.hrv,
        maxBpm: Math.max(prev.maxBpm, reading.bpm),
        liveWaveform: [...prev.liveWaveform.slice(1), reading.bpm],
      };
    });
  };

  // Switch active wearable
  const handleSelectWearable = (targetDevice: WearableDevice) => {
    triggerHaptic();
    setWearables((prev) =>
      prev.map((w) => ({
        ...w,
        connected: w.id === targetDevice.id,
        lastSyncTimestamp: w.id === targetDevice.id ? 'Just now' : w.lastSyncTimestamp,
      }))
    );
  };

  // Load an AI Coach routine directly into the Live Gym Mode
  const handleApplyRoutineToGym = (routine: GeneratedRoutine) => {
    triggerHaptic();
    setGymSession((prev) => ({
      ...prev,
      title: routine.routineTitle,
      isActive: true,
      startTime: Date.now(),
      elapsedSeconds: 0,
      activeCaloriesBurnt: 0,
      strainScore: 0,
      exercises: routine.exercises.map((ex) => ({
        id: ex.id || `ex-${Date.now()}-${Math.random()}`,
        name: ex.name,
        targetSets: ex.targetSets,
        restSeconds: ex.restSeconds || 60,
        formCue: ex.formCue,
        targetZone: ex.targetZone,
        sets: Array.from({ length: ex.targetSets }).map((_, i) => ({
          setNumber: i + 1,
          reps: parseInt(ex.repsRange) || 10,
          weightKg: ex.recommendedWeightKg || 25,
          completed: false,
          rpe: ex.targetRpe || 8,
        })),
      })),
    }));

    setActiveTab('gym');
  };

  // Finish workout session and check for unlocked badges
  const handleFinishWorkout = () => {
    triggerHaptic();
    setGymSession((prev) => ({
      ...prev,
      isActive: false,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    // Check if Centurion or 700 kcal badge unlocks
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === 'badge-calorie-crusher' && gymSession.activeCaloriesBurnt >= 700) {
          return { ...b, unlocked: true, progress: 700, unlockedAt: 'Just now' };
        }
        if (b.id === 'badge-gym-volume-master') {
          return { ...b, progress: Math.min(b.maxProgress, b.progress + 2500) };
        }
        return b;
      })
    );

    // Open Social Sharing Modal immediately
    setIsShareModalOpen(true);
  };

  // Like community post
  const handleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.hasLiked ? p.likes - 1 : p.likes + 1,
            hasLiked: !p.hasLiked,
          };
        }
        return p;
      })
    );
  };

  // Add post to community
  const handleAddPost = (text: string) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      userName: 'You (Athlete)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      deviceUsed: activeWearable.name,
      timeAgo: 'Just now',
      workoutTitle: gymSession.title,
      durationMin: Math.max(1, Math.round(gymSession.elapsedSeconds / 60)),
      calories: Math.round(gymSession.activeCaloriesBurnt) || 480,
      avgHr: hrState.currentBpm,
      sleepScore: sleepState.overallScore,
      likes: 1,
      hasLiked: true,
      commentCount: 0,
    };
    setCommunityPosts([newPost, ...communityPosts]);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col items-center">
      {/* Top Universal Navbar */}
      <header className="w-full bg-[#0d0f17]/90 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white">PulseFit AI</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  v3.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Wearable Heart Rate • Sleep • Gym Coach
              </p>
            </div>
          </div>

          {/* Quick HUD: Heart Rate & Connected Wearable */}
          <div className="flex items-center gap-2">
            {/* Live HR Pill */}
            <div
              onClick={() => setActiveTab('heart')}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <Heart
                className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse"
              />
              <span className="text-xs font-mono font-bold text-white">
                {hrState.currentBpm} <span className="text-[10px] text-slate-400">BPM</span>
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeZone.accentColor }}
                title={`Zone ${activeZone.zone}`}
              />
            </div>

            {/* Wearables Quick Trigger */}
            <button
              onClick={() => setIsWearablesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-slate-200 transition-all"
              title="Wearable Device Hub"
            >
              {activeWearable.isRealBluetooth ? (
                <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Watch className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden md:inline text-[11px] truncate max-w-[100px]">
                {activeWearable.name}
              </span>
            </button>

            {/* Social Share Trigger */}
            <button
              onClick={() => {
                setFeaturedShareBadge(null);
                setIsShareModalOpen(true);
              }}
              className="p-2 rounded-full bg-slate-900 border border-slate-700 hover:text-emerald-400 text-slate-300 transition-colors"
              title="Share Workout"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Frame Toggle (Preview as iPhone/Android or Full Desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-full p-0.5">
              <button
                onClick={() => setIsPhoneFrame(false)}
                className={`p-1.5 rounded-full text-xs ${
                  !isPhoneFrame ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Expanded Responsive View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsPhoneFrame(true);
                  setDeviceModel('ios');
                }}
                className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold ${
                  isPhoneFrame && deviceModel === 'ios'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="iPhone Mobile Shell"
              >
                iPhone
              </button>
              <button
                onClick={() => {
                  setIsPhoneFrame(true);
                  setDeviceModel('android');
                }}
                className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold ${
                  isPhoneFrame && deviceModel === 'android'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Android Mobile Shell"
              >
                Pixel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container (Supports both direct responsive mobile & optional Phone Frame on desktop) */}
      <main
        className={`w-full transition-all duration-300 flex-1 flex flex-col ${
          isPhoneFrame
            ? 'max-w-[420px] my-6 rounded-[46px] border-[10px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-[#090a0f] overflow-hidden'
            : 'max-w-4xl px-4 py-5'
        }`}
      >
        {/* Mobile Device Status Bar simulation if phone frame active */}
        {isPhoneFrame && (
          <div className="w-full bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-slate-900">
            <span>9:41</span>
            {deviceModel === 'ios' ? (
              <div className="w-24 h-4 bg-black rounded-full border border-slate-800 mx-auto" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-black border border-slate-800 mx-auto" />
            )}
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* View Switcher Content */}
        <div className={`flex-1 ${isPhoneFrame ? 'px-4 py-4 overflow-y-auto max-h-[720px]' : ''}`}>
          {activeTab === 'heart' && (
            <HeartRateMonitor
              hrState={hrState}
              activeZone={activeZone}
              activeWearable={activeWearable}
              simulationActivity={simulationActivity}
              onSetSimulationActivity={(act) => setSimulationActivity(act)}
              onOpenWearablesModal={() => setIsWearablesModalOpen(true)}
            />
          )}

          {activeTab === 'sleep' && (
            <SleepMonitor
              sleepState={sleepState}
              onAskCoachAboutSleep={() => setActiveTab('coach')}
            />
          )}

          {activeTab === 'gym' && (
            <GymTracker
              currentBpm={hrState.currentBpm}
              activeZone={activeZone}
              gymSession={gymSession}
              onUpdateGymSession={setGymSession}
              onFinishWorkout={handleFinishWorkout}
              onOpenAiRoutineGenerator={() => setActiveTab('coach')}
            />
          )}

          {activeTab === 'coach' && (
            <AICoachView
              hrState={hrState}
              sleepState={sleepState}
              gymSession={gymSession}
              onApplyRoutineToGym={handleApplyRoutineToGym}
            />
          )}

          {activeTab === 'badges' && (
            <BadgesView
              badges={badges}
              onShareBadge={(badge) => {
                setFeaturedShareBadge(badge);
                setIsShareModalOpen(true);
              }}
            />
          )}

          {activeTab === 'community' && (
            <CommunityFeedView
              posts={communityPosts}
              onLikePost={handleLikePost}
              onAddPost={handleAddPost}
              onOpenShareModal={() => {
                setFeaturedShareBadge(null);
                setIsShareModalOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Dock Navigation (Works consistently across Android & iPhone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090b10]/95 border-t border-slate-800/80 backdrop-blur-2xl pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-6 px-1 py-1.5">
          {/* 1. Heart Rate */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('heart');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'heart'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'heart' ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">Heart</span>
          </button>

          {/* 2. Sleep */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('sleep');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'sleep'
                ? 'text-indigo-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className={`w-5 h-5 ${activeTab === 'sleep' ? 'fill-indigo-500 text-indigo-500' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">Sleep</span>
          </button>

          {/* 3. Gym Mode */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('gym');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              activeTab === 'gym'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {gymSession.isActive && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Gym</span>
          </button>

          {/* 4. AI Coach */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('coach');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'coach'
                ? 'text-purple-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Coach</span>
          </button>

          {/* 5. Badges */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('badges');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'badges'
                ? 'text-amber-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Badges</span>
          </button>

          {/* 6. Social Feed */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('community');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'community'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Social</span>
          </button>
        </div>
      </nav>

      {/* Floating padding element so content never gets occluded by bottom dock */}
      <div className="h-16 w-full" />

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        hrState={hrState}
        sleepState={sleepState}
        gymSession={gymSession}
        featuredBadge={featuredShareBadge}
        onPostToCommunity={handleAddPost}
      />

      {/* Wearable Hub Modal */}
      <WearablesModal
        isOpen={isWearablesModalOpen}
        onClose={() => setIsWearablesModalOpen(false)}
        wearables={wearables}
        onSelectWearable={handleSelectWearable}
        onBleReading={handleBleReading}
        isPhysicalBleActive={isPhysicalBleActive}
        onSetPhysicalBleActive={setIsPhysicalBleActive}
      />
    </div>
  );
}

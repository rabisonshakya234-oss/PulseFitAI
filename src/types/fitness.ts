export interface HeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  minBpm: number;
  maxBpm: number;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  description: string;
}

export interface HeartRateState {
  currentBpm: number;
  restingBpm: number;
  maxBpm: number;
  hrv: number; // ms
  recoveryScore: number; // 0-100
  currentZone: 1 | 2 | 3 | 4 | 5;
  liveWaveform: number[]; // real-time points for canvas pulse/ECG
  intradayHistory: { time: string; bpm: number; zone: number }[];
  weeklyTrend: { day: string; avgHr: number; restingHr: number; maxHr: number }[];
}

export interface SleepStageBlock {
  time: string;
  stage: 'deep' | 'rem' | 'light' | 'awake';
  durationMin: number;
}

export interface SleepState {
  overallScore: number; // 0-100
  totalDurationMinutes: number; // e.g. 462
  deepSleepMinutes: number;
  remSleepMinutes: number;
  lightSleepMinutes: number;
  awakeMinutes: number;
  efficiencyPct: number;
  sleepDebtMinutes: number;
  bedtime: string;
  wakeTime: string;
  respiratoryRate: number; // breaths/min
  hrvDuringSleep: number; // ms
  stagesTimeline: SleepStageBlock[];
  recoveryInsight: string;
}

export type WearableBrand = 'apple' | 'garmin' | 'whoop' | 'fitbit' | 'oura' | 'ble_standard';

export interface WearableDevice {
  id: string;
  name: string;
  brand: WearableBrand;
  connected: boolean;
  batteryLevel: number;
  signalStrength: 'excellent' | 'good' | 'fair';
  lastSyncTimestamp: string;
  isRealBluetooth: boolean;
  features: string[];
}

export interface GymExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  rpe?: number;
}

export interface GymExercise {
  id: string;
  name: string;
  targetSets: number;
  sets: GymExerciseSet[];
  restSeconds: number;
  formCue?: string;
  targetZone?: string;
}

export interface GymSession {
  id: string;
  title: string;
  isActive: boolean;
  startTime?: number;
  elapsedSeconds: number;
  currentExerciseIndex: number;
  exercises: GymExercise[];
  activeRestTimer: {
    isRunning: boolean;
    remainingSeconds: number;
    totalSeconds: number;
  };
  activeCaloriesBurnt: number;
  maxBpmReached: number;
  avgBpmSession: number;
  strainScore: number; // 0 - 21
  completedAt?: string;
}

export interface RoutineExerciseGen {
  id: string;
  name: string;
  targetSets: number;
  repsRange: string;
  recommendedWeightKg?: number;
  targetRpe?: number;
  restSeconds: number;
  targetZone?: string;
  formCue: string;
}

export interface GeneratedRoutine {
  routineTitle: string;
  readinessAssessment: string;
  estimatedDurationMin: number;
  targetHeartRateZone: string;
  warmup: { name: string; durationOrReps: string; instructions?: string }[];
  exercises: RoutineExerciseGen[];
  cooldown: { name: string; durationOrReps: string }[];
  coachTip: string;
}

export interface GeneratedNutrition {
  planTitle: string;
  biometricSummary: string;
  dailyTargets: {
    caloriesKcal: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    waterLiters: number;
  };
  meals: {
    mealType: string;
    timing: string;
    name: string;
    macrosSnippet: string;
    ingredients: string[];
    benefits: string;
  }[];
  hydrationAndElectrolytes: string;
  sleepNutritionTip: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'heart' | 'sleep' | 'gym' | 'streak';
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  perk: string;
}

export interface CommunityPost {
  id: string;
  userName: string;
  userAvatar: string;
  deviceUsed: string;
  timeAgo: string;
  workoutTitle: string;
  durationMin: number;
  calories: number;
  avgHr: number;
  sleepScore: number;
  badgeUnlocked?: string;
  likes: number;
  hasLiked: boolean;
  commentCount: number;
}

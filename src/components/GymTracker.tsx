import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Check,
  Flame,
  Heart,
  Timer,
  Dumbbell,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { GymSession, HeartRateZone } from '../types/fitness';
import { playRestTimerBeep, triggerHaptic } from '../utils/audioAlerts';

interface GymTrackerProps {
  currentBpm: number;
  activeZone: HeartRateZone;
  gymSession: GymSession;
  onUpdateGymSession: (session: GymSession | ((prev: GymSession) => GymSession)) => void;
  onFinishWorkout: () => void;
  onOpenAiRoutineGenerator: () => void;
}

export const GymTracker: React.FC<GymTrackerProps> = ({
  currentBpm,
  activeZone,
  gymSession,
  onUpdateGymSession,
  onFinishWorkout,
  onOpenAiRoutineGenerator,
}) => {
  const [usePounds, setUsePounds] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Active rest timer tick effect
  useEffect(() => {
    let timerInterval: any = null;
    if (gymSession.activeRestTimer.isRunning && gymSession.activeRestTimer.remainingSeconds > 0) {
      timerInterval = setInterval(() => {
        onUpdateGymSession((prev) => {
          const nextRemaining = prev.activeRestTimer.remainingSeconds - 1;

          // Sound alerts on 3, 2, 1 and final finish
          if (nextRemaining === 3 || nextRemaining === 2 || nextRemaining === 1) {
            playRestTimerBeep(false);
          } else if (nextRemaining === 0) {
            playRestTimerBeep(true);
          }

          return {
            ...prev,
            activeRestTimer: {
              ...prev.activeRestTimer,
              remainingSeconds: Math.max(0, nextRemaining),
              isRunning: nextRemaining > 0,
            },
          };
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [gymSession.activeRestTimer.isRunning, gymSession.activeRestTimer.remainingSeconds, onUpdateGymSession]);

  // Session elapsed timer effect when workout is active
  useEffect(() => {
    let sessionInterval: any = null;
    if (gymSession.isActive) {
      sessionInterval = setInterval(() => {
        onUpdateGymSession((prev) => {
          const nextElapsed = prev.elapsedSeconds + 1;
          // Dynamically accrue calories based on current heart rate intensity
          const burnRatePerMin = currentBpm > 155 ? 14 : currentBpm > 135 ? 11 : currentBpm > 115 ? 8 : 5;
          const addedCal = burnRatePerMin / 60;
          const newCalories = Math.round((prev.activeCaloriesBurnt + addedCal) * 10) / 10;

          // Accrue Whoop-style strain (0 to 21) based on HR and time
          const strainInc = (currentBpm / 190) * 0.0018;
          const newStrain = Math.min(20.8, Math.round((prev.strainScore + strainInc) * 100) / 100);

          return {
            ...prev,
            elapsedSeconds: nextElapsed,
            activeCaloriesBurnt: newCalories,
            maxBpmReached: Math.max(prev.maxBpmReached, currentBpm),
            strainScore: newStrain,
          };
        });
      }, 1000);
    }

    return () => {
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, [gymSession.isActive, currentBpm, onUpdateGymSession]);

  const toggleWorkoutActive = () => {
    triggerHaptic();
    onUpdateGymSession((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      startTime: prev.isActive ? prev.startTime : Date.now(),
    }));
  };

  const startRestTimer = (seconds: number) => {
    triggerHaptic();
    onUpdateGymSession((prev) => ({
      ...prev,
      activeRestTimer: {
        isRunning: true,
        remainingSeconds: seconds,
        totalSeconds: seconds,
      },
    }));
  };

  const stopRestTimer = () => {
    triggerHaptic();
    onUpdateGymSession((prev) => ({
      ...prev,
      activeRestTimer: {
        ...prev.activeRestTimer,
        isRunning: false,
        remainingSeconds: 0,
      },
    }));
  };

  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    triggerHaptic();
    const currentEx = gymSession.exercises[exerciseIdx];
    const willBeComplete = !currentEx.sets[setIdx].completed;

    onUpdateGymSession((prev) => {
      const updatedExercises = [...prev.exercises];
      const targetEx = { ...updatedExercises[exerciseIdx] };
      const updatedSets = [...targetEx.sets];

      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        completed: willBeComplete,
      };
      targetEx.sets = updatedSets;
      updatedExercises[exerciseIdx] = targetEx;

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });

    // If set just completed, auto trigger rest timer!
    if (willBeComplete) {
      startRestTimer(currentEx.restSeconds || 60);
    }
  };

  const updateSetWeight = (exerciseIdx: number, setIdx: number, delta: number) => {
    triggerHaptic();
    onUpdateGymSession((prev) => {
      const updatedExercises = [...prev.exercises];
      const targetEx = { ...updatedExercises[exerciseIdx] };
      const updatedSets = [...targetEx.sets];
      const currentWeight = updatedSets[setIdx].weightKg;
      const nextWeight = Math.max(0, Math.round((currentWeight + delta) * 10) / 10);

      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        weightKg: nextWeight,
      };
      targetEx.sets = updatedSets;
      updatedExercises[exerciseIdx] = targetEx;

      return { ...prev, exercises: updatedExercises };
    });
  };

  const updateSetReps = (exerciseIdx: number, setIdx: number, delta: number) => {
    triggerHaptic();
    onUpdateGymSession((prev) => {
      const updatedExercises = [...prev.exercises];
      const targetEx = { ...updatedExercises[exerciseIdx] };
      const updatedSets = [...targetEx.sets];
      const currentReps = updatedSets[setIdx].reps;
      const nextReps = Math.max(1, currentReps + delta);

      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        reps: nextReps,
      };
      targetEx.sets = updatedSets;
      updatedExercises[exerciseIdx] = targetEx;

      return { ...prev, exercises: updatedExercises };
    });
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    onUpdateGymSession((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: `ex-${Date.now()}`,
          name: newExerciseName.trim(),
          targetSets: 3,
          restSeconds: 60,
          formCue: 'Maintain tight core and full range of motion.',
          targetZone: 'Zone 3',
          sets: [
            { setNumber: 1, reps: 10, weightKg: 20, completed: false, rpe: 8 },
            { setNumber: 2, reps: 10, weightKg: 20, completed: false, rpe: 8 },
            { setNumber: 3, reps: 10, weightKg: 20, completed: false, rpe: 8 },
          ],
        },
      ],
    }));

    setNewExerciseName('');
    setShowAddModal(false);
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayWeight = (kg: number) => {
    if (usePounds) {
      return `${Math.round(kg * 2.20462)} lbs`;
    }
    return `${kg} kg`;
  };

  // Calculate total volume moved in session
  const totalVolumeKg = gymSession.exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.reps * s.weightKg, 0)
    );
  }, 0);

  const completedSetsCount = gymSession.exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSetsCount = gymSession.exercises.reduce((total, ex) => total + ex.sets.length, 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Gym Live Status & Control Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-black border-2 border-emerald-500/40 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              {gymSession.isActive ? 'LIVE GYM MODE ACTIVE' : 'GYM MODE STANDBY'}
            </span>
          </div>

          <button
            onClick={() => setUsePounds(!usePounds)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700 hover:bg-slate-700"
          >
            Unit: {usePounds ? 'LBS' : 'KG'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{gymSession.title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sets completed:{' '}
              <span className="text-emerald-400 font-bold font-mono">
                {completedSetsCount} / {totalSetsCount}
              </span>{' '}
              • Total Volume:{' '}
              <span className="text-white font-mono font-semibold">
                {usePounds ? `${Math.round(totalVolumeKg * 2.20462)} lbs` : `${totalVolumeKg} kg`}
              </span>
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleWorkoutActive}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all ${
                gymSession.isActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'
              }`}
            >
              {gymSession.isActive ? (
                <>
                  <Square className="w-4 h-4 fill-black" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>{gymSession.elapsedSeconds > 0 ? 'Resume Workout' : 'Start Gym Session'}</span>
                </>
              )}
            </button>

            {completedSetsCount > 0 && (
              <button
                onClick={onFinishWorkout}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span>Finish & Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Gym HUD Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800">
          {/* Elapsed Time */}
          <div className="p-3 rounded-xl bg-black/50 border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-semibold uppercase">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Elapsed Time</span>
            </div>
            <span className="text-2xl font-mono font-black text-white">
              {formatElapsed(gymSession.elapsedSeconds)}
            </span>
          </div>

          {/* Live Heart Rate & Zone */}
          <div className="p-3 rounded-xl bg-black/50 border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-semibold uppercase">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Cardiac Zone</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-black text-white">{currentBpm}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: `${activeZone.accentColor}25`, color: activeZone.accentColor }}
              >
                Z{activeZone.zone}
              </span>
            </div>
          </div>

          {/* Active Calories */}
          <div className="p-3 rounded-xl bg-black/50 border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-semibold uppercase">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Calories Burnt</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-black text-orange-400">
                {Math.round(gymSession.activeCaloriesBurnt)}
              </span>
              <span className="text-xs text-slate-400 font-mono">kcal</span>
            </div>
          </div>

          {/* Whoop-style Strain */}
          <div className="p-3 rounded-xl bg-black/50 border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Day Strain</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-black text-purple-300">
                {gymSession.strainScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 21.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Rest Countdown Timer Widget */}
      {gymSession.activeRestTimer.isRunning && (
        <div className="sticky top-4 z-30 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-black border-2 border-emerald-500 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Timer className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  REST INTERVAL COUNTDOWN
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-white">
                    {gymSession.activeRestTimer.remainingSeconds}s
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    of {gymSession.activeRestTimer.totalSeconds}s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startRestTimer(gymSession.activeRestTimer.remainingSeconds + 15)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700"
              >
                +15s
              </button>
              <button
                onClick={stopRestTimer}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-xs font-semibold text-rose-200"
              >
                Skip Rest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick AI Routine Loader Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Need a customized gym routine?</p>
            <p className="text-[11px] text-slate-400">
              AI generates sets, reps, and cues tailored to your sleep and heart rate.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAiRoutineGenerator}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors"
        >
          <span>Generate Routine</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Exercises Execution Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Exercises ({gymSession.exercises.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Exercise</span>
          </button>
        </div>

        {gymSession.exercises.map((exercise, exIdx) => {
          const exCompletedCount = exercise.sets.filter((s) => s.completed).length;

          return (
            <div
              key={exercise.id}
              className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden shadow-lg"
            >
              {/* Exercise Card Header */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Dumbbell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{exercise.name}</h4>
                    {exercise.formCue && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed italic">
                        💡 {exercise.formCue}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {exCompletedCount}/{exercise.sets.length} Sets
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    <button
                      onClick={() => startRestTimer(exercise.restSeconds)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      {exercise.restSeconds}s Rest
                    </button>
                  </div>
                </div>
              </div>

              {/* Set-by-Set Interactive Table */}
              <div className="p-3 divide-y divide-slate-800/60">
                <div className="grid grid-cols-12 gap-2 pb-2 text-[10px] font-mono font-bold uppercase text-slate-500 px-2">
                  <span className="col-span-2">SET</span>
                  <span className="col-span-4 text-center">WEIGHT</span>
                  <span className="col-span-4 text-center">REPS</span>
                  <span className="col-span-2 text-right">DONE</span>
                </div>

                {exercise.sets.map((set, setIdx) => {
                  return (
                    <div
                      key={set.setNumber}
                      className={`grid grid-cols-12 gap-2 py-2.5 px-2 items-center rounded-xl transition-all ${
                        set.completed ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Set Number */}
                      <span className="col-span-2 font-mono font-bold text-xs text-slate-300">
                        #{set.setNumber}
                      </span>

                      {/* Weight Stepper */}
                      <div className="col-span-4 flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, -2.5)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-white min-w-[50px] text-center">
                          {displayWeight(set.weightKg)}
                        </span>
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, 2.5)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Stepper */}
                      <div className="col-span-4 flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, -1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-white min-w-[36px] text-center">
                          {set.reps} reps
                        </span>
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Complete Checkbox */}
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            set.completed
                              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/40'
                              : 'bg-slate-800 border border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Add Custom Gym Exercise</h3>
            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Romanian Deadlift, Lat Pulldown"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newExerciseName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-50"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

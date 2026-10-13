import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Utensils,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Flame,
  Clock,
  ArrowRight,
  Shield,
  Apple,
} from 'lucide-react';
import {
  HeartRateState,
  SleepState,
  GeneratedRoutine,
  GeneratedNutrition,
  GymSession,
} from '../types/fitness';

interface AICoachViewProps {
  hrState: HeartRateState;
  sleepState: SleepState;
  gymSession: GymSession;
  onApplyRoutineToGym: (routine: GeneratedRoutine) => void;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  hrState,
  sleepState,
  gymSession,
  onApplyRoutineToGym,
}) => {
  const [activeTab, setActiveTab] = useState<'routines' | 'nutrition' | 'chat'>('routines');

  // Routine generator form state
  const [targetMuscle, setTargetMuscle] = useState<string>('Chest & Triceps Hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Commercial Gym');
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState<boolean>(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<GeneratedRoutine | null>(null);

  // Nutrition generator form state
  const [userGoal, setUserGoal] = useState<string>('Lean Muscle Hypertrophy');
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState<boolean>(false);
  const [generatedNutrition, setGeneratedNutrition] = useState<GeneratedNutrition | null>(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'coach' | 'user'; text: string; time: string }[]>([
    {
      role: 'coach',
      text: `Hey athlete! PulseFit AI Coach here. Your biometric status looks strong today: Sleep is ${sleepState.overallScore}% and resting HR is ${hrState.restingBpm} bpm (Recovery readiness: ${hrState.recoveryScore}%). What are we crushing in the gym today?`,
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Quick preset questions
  const quickQuestions = [
    'How should I adjust gym weights based on my 89% sleep score?',
    'What should I eat 45 mins before my heavy lift?',
    'My heart rate hit Zone 4 during bench press - should I lengthen rest?',
    'How can I lower my resting heart rate below 50 bpm?',
  ];

  const handleGenerateRoutine = async () => {
    setIsGeneratingRoutine(true);
    try {
      const res = await fetch('/api/coach/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMuscle,
          experienceLevel,
          durationMinutes,
          equipment,
          biometrics: {
            currentHr: hrState.currentBpm,
            restingHr: hrState.restingBpm,
            sleepScore: sleepState.overallScore,
            recoveryScore: hrState.recoveryScore,
            recentStrain: gymSession.strainScore,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedRoutine(data.data);
      }
    } catch (err) {
      console.error('Failed to generate routine:', err);
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  const handleGenerateNutrition = async () => {
    setIsGeneratingNutrition(true);
    try {
      const res = await fetch('/api/coach/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoal,
          caloriesBurnt: Math.round(gymSession.activeCaloriesBurnt) || 540,
          weightKg: 75,
          sleepScore: sleepState.overallScore,
          avgHr: hrState.currentBpm > 90 ? hrState.currentBpm : 138,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedNutrition(data.data);
      }
    } catch (err) {
      console.error('Failed to generate nutrition:', err);
    } finally {
      setIsGeneratingNutrition(false);
    }
  };

  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim() || isSendingMessage) return;

    const userEntry = { role: 'user' as const, text, time: 'Just now' };
    setChatMessages((prev) => [...prev, userEntry]);
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          biometrics: {
            currentHr: hrState.currentBpm,
            zone: hrState.currentZone,
            restingHr: hrState.restingBpm,
            hrv: hrState.hrv,
            sleepScore: sleepState.overallScore,
            deepSleepPct: Math.round((sleepState.deepSleepMinutes / sleepState.totalDurationMinutes) * 100),
            strain: gymSession.strainScore,
            recoveryScore: hrState.recoveryScore,
          },
          activeWorkout: {
            active: gymSession.isActive,
            exerciseName: gymSession.exercises[gymSession.currentExerciseIndex]?.name || '',
            completedSets: gymSession.exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0),
            totalSets: gymSession.exercises.reduce((t, e) => t + e.sets.length, 0),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'coach', text: data.reply, time: 'Just now' },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* AI Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-black border border-purple-800/40 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Gemini 3.8 Intelligence
                </span>
                <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white">PulseFit AI Personal Coach</h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span>Recovery: {hrState.recoveryScore}%</span>
            <span>•</span>
            <span>Sleep: {sleepState.overallScore}%</span>
          </div>
        </div>

        {/* Coach Navigation Tabs */}
        <div className="flex gap-2 mt-5 p-1 bg-black/50 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('routines')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'routines'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Workout Routines</span>
          </button>

          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'nutrition'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Nutrition & Macros</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Coach</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKOUT ROUTINES */}
      {activeTab === 'routines' && (
        <div className="space-y-5">
          {/* Customizer Inputs */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-purple-400" />
              <span>Configure Target Gym Session</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Target Muscle Split
                </label>
                <select
                  value={targetMuscle}
                  onChange={(e) => setTargetMuscle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Chest & Triceps Hypertrophy">Chest & Triceps Hypertrophy</option>
                  <option value="Back & Biceps Pull Day">Back & Biceps Pull Day</option>
                  <option value="Legs & Glutes Power Day">Legs & Glutes Power Day</option>
                  <option value="Shoulders & Arms Volume">Shoulders & Arms Volume</option>
                  <option value="Full Body Athletic Strength">Full Body Athletic Strength</option>
                  <option value="HIIT Cardio & Core Burn">HIIT Cardio & Core Burn</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Beginner">Beginner (Form & Foundation)</option>
                  <option value="Intermediate">Intermediate (Progressive Overload)</option>
                  <option value="Advanced">Advanced (High Volume & Intensity)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Duration (Minutes)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value={30}>30 mins (Express)</option>
                  <option value={45}>45 mins (Optimal)</option>
                  <option value={60}>60 mins (High Volume)</option>
                  <option value={75}>75 mins (Elite Power)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Equipment Available
                </label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Commercial Gym">Full Commercial Gym (Barbells/Cables/Machines)</option>
                  <option value="Dumbbells Only">Dumbbells & Adjustable Bench</option>
                  <option value="Bodyweight / Calisthenics">Bodyweight & Pull-up Bar</option>
                  <option value="Kettlebell & Bands">Kettlebells & Resistance Bands</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateRoutine}
              disabled={isGeneratingRoutine}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-60"
            >
              {isGeneratingRoutine ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Synthesizing Biometric Routine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Customized Workout Routine</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Routine Display */}
          {generatedRoutine ? (
            <div className="space-y-4 rounded-3xl bg-slate-900/80 border border-purple-500/30 p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                    Custom AI Routine
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {generatedRoutine.routineTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {generatedRoutine.readinessAssessment}
                  </p>
                </div>

                <button
                  onClick={() => onApplyRoutineToGym(generatedRoutine)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Load Into Live Gym Mode</span>
                </button>
              </div>

              {/* Target HR Zone Note */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-xs text-purple-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Target Zone:</strong> {generatedRoutine.targetHeartRateZone}
                </span>
              </div>

              {/* Warmup */}
              {generatedRoutine.warmup && generatedRoutine.warmup.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Dynamic Warmup
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {generatedRoutine.warmup.map((w, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                        <span className="font-bold text-white block">{w.name}</span>
                        <span className="text-[11px] text-purple-400 font-mono">{w.durationOrReps}</span>
                        {w.instructions && (
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{w.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Main Working Exercises
                </h4>
                <div className="space-y-2">
                  {generatedRoutine.exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="text-sm font-bold text-white">{ex.name}</h5>
                          <p className="text-xs text-slate-400 italic mt-0.5">
                            Form Cue: {ex.formCue}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold border border-slate-700">
                          {ex.targetSets} sets × {ex.repsRange}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ⏱️ {ex.restSeconds}s rest
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Tip Callout */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
                <strong className="text-white">Coach Rationale:</strong> {generatedRoutine.coachTip}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 text-xs">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
              <p>Click "Generate Customized Workout Routine" above to create an AI routine tailored to your heart rate and sleep patterns.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NUTRITION SUGGESTIONS */}
      {activeTab === 'nutrition' && (
        <div className="space-y-5">
          {/* Nutrition Config */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-400" />
              <span>Tailor Nutrition & Recovery Fuel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Nutritional Objective
                </label>
                <select
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Lean Muscle Hypertrophy">Lean Muscle Hypertrophy (Anabolic Surplus)</option>
                  <option value="Fat Loss & Definition">Fat Loss & Definition (Cardio Deficit)</option>
                  <option value="Strength & Power Output">Maximum Strength & Neuromuscular Power</option>
                  <option value="Cardiovascular Endurance">Endurance & Cardiac Health</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateNutrition}
                  disabled={isGeneratingNutrition}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
                >
                  {isGeneratingNutrition ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculating Biological Macros...</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      <span>Calculate Custom Nutrition Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Nutrition Output */}
          {generatedNutrition ? (
            <div className="space-y-5 rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-5 shadow-2xl">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Biometric Nutrition Plan
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {generatedNutrition.planTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {generatedNutrition.biometricSummary}
                </p>
              </div>

              {/* Macro Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-black/50 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Calories</span>
                  <p className="text-2xl font-black font-mono text-white mt-1">
                    {generatedNutrition.dailyTargets.caloriesKcal}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">kcal / day</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Protein</span>
                  <p className="text-2xl font-black font-mono text-emerald-300 mt-1">
                    {generatedNutrition.dailyTargets.proteinGrams}g
                  </p>
                  <span className="text-[10px] text-emerald-500/80 font-mono">2.0g per kg bodyweight</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Carbohydrates</span>
                  <p className="text-2xl font-black font-mono text-amber-300 mt-1">
                    {generatedNutrition.dailyTargets.carbsGrams}g
                  </p>
                  <span className="text-[10px] text-amber-500/80 font-mono">Glycogen Replenishment</span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Fats</span>
                  <p className="text-2xl font-black font-mono text-purple-300 mt-1">
                    {generatedNutrition.dailyTargets.fatsGrams}g
                  </p>
                  <span className="text-[10px] text-purple-500/80 font-mono">Hormonal Balance</span>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Hydration</span>
                  <p className="text-2xl font-black font-mono text-cyan-300 mt-1">
                    {generatedNutrition.dailyTargets.waterLiters}L
                  </p>
                  <span className="text-[10px] text-cyan-500/80 font-mono">+ Electrolytes</span>
                </div>
              </div>

              {/* Meal Timing Suggestions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Targeted Meal Timing Protocol
                </h4>
                <div className="space-y-3">
                  {generatedNutrition.meals.map((meal, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {meal.mealType} • {meal.timing}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-1.5">{meal.name}</h5>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          {meal.macrosSnippet}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <strong className="text-slate-400">Key Ingredients:</strong>{' '}
                        {meal.ingredients.join(', ')}
                      </div>

                      <p className="text-xs text-slate-400 italic">
                        {meal.benefits}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hydration and Sleep Nutrition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 text-xs">
                  <strong className="text-cyan-300 block mb-1">Intra-Workout Hydration:</strong>
                  <p className="text-slate-300">{generatedNutrition.hydrationAndElectrolytes}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 text-xs">
                  <strong className="text-indigo-300 block mb-1">Night Recovery & Sleep Nutrition:</strong>
                  <p className="text-slate-300">{generatedNutrition.sleepNutritionTip}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 text-xs">
              <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p>Click "Calculate Custom Nutrition Plan" to generate pre-workout, post-workout, and recovery macros tailored to your active heart rate and sleep debt.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE COACH CHAT */}
      {activeTab === 'chat' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">
              Quick Coach Prompts
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700/80 text-left transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="min-h-[280px] max-h-[380px] overflow-y-auto space-y-3 p-2 rounded-2xl bg-black/40 border border-white/5">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'coach' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-md shadow-purple-600/30">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[9px] text-slate-400 block mt-1 text-right font-mono">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div className="flex items-center gap-2 text-xs text-purple-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Coach is analyzing your biometrics and typing...</span>
              </div>
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything: gym form, heart rate pacing, creatine, sleep..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSendingMessage}
              className="w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-purple-600/30 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Generate customized gym routine
app.post('/api/coach/generate-routine', async (req, res) => {
  const { targetMuscle, experienceLevel, durationMinutes, equipment, biometrics } = req.body;

  const prompt = `You are an elite exercise physiologist and personal gym coach.
Create a highly customized, effective gym workout routine for an athlete with the following profile:
- Target Muscle / Focus: ${targetMuscle || 'Full Body Hypertrophy'}
- Experience Level: ${experienceLevel || 'Intermediate'}
- Time Available: ${durationMinutes || 45} minutes
- Equipment: ${equipment || 'Commercial Gym'}
- Current Biometric State:
  * Resting Heart Rate: ${biometrics?.restingHr || 58} bpm
  * Current Heart Rate: ${biometrics?.currentHr || 72} bpm
  * Sleep Quality Score: ${biometrics?.sleepScore || 85}/100
  * Biometric Recovery Readiness: ${biometrics?.recoveryScore || 82}%
  * Today's Strain so far: ${biometrics?.recentStrain || 4.2}/21

Adjust the training volume, RPE (Rate of Perceived Exertion 1-10), and rest periods specifically based on their biometric recovery readiness. If recovery is high, push progressive overload; if recovery is lower, focus on controlled hypertrophy and joint-friendly tempo.`;

  try {
    if (apiKey) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are PulseFit AI Coach, a world-class certified strength & conditioning coach and sports scientist. Output your response strictly as valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routineTitle: { type: Type.STRING },
              readinessAssessment: { type: Type.STRING },
              estimatedDurationMin: { type: Type.INTEGER },
              targetHeartRateZone: { type: Type.STRING },
              warmup: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    durationOrReps: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                  },
                  required: ['name', 'durationOrReps'],
                },
              },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    targetSets: { type: Type.INTEGER },
                    repsRange: { type: Type.STRING },
                    recommendedWeightKg: { type: Type.NUMBER },
                    targetRpe: { type: Type.INTEGER },
                    restSeconds: { type: Type.INTEGER },
                    targetZone: { type: Type.STRING },
                    formCue: { type: Type.STRING },
                  },
                  required: ['id', 'name', 'targetSets', 'repsRange', 'restSeconds', 'formCue'],
                },
              },
              cooldown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    durationOrReps: { type: Type.STRING },
                  },
                  required: ['name', 'durationOrReps'],
                },
              },
              coachTip: { type: Type.STRING },
            },
            required: ['routineTitle', 'readinessAssessment', 'warmup', 'exercises', 'coachTip'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      }
    }
  } catch (err: any) {
    console.error('Gemini routine generation error:', err);
  }

  // Sports-science fallback routine if Gemini API key is absent or temporarily throttled
  const isHighRecovery = (biometrics?.recoveryScore || 80) >= 70;
  return res.json({
    success: true,
    data: {
      routineTitle: `${targetMuscle || 'Hypertrophy'} Power Split`,
      readinessAssessment: isHighRecovery
        ? `Recovery is optimal (${biometrics?.recoveryScore || 85}%). HRV and deep sleep support high intensity progressive overload.`
        : `Moderate recovery (${biometrics?.recoveryScore || 62}%). Focus on pristine execution and submaximal RPE (6-7).`,
      estimatedDurationMin: durationMinutes || 45,
      targetHeartRateZone: 'Zone 3 (Aerobic Tempo: 135-155 BPM) during active sets',
      warmup: [
        { name: 'Dynamic Joint Mobility & Arm Swings', durationOrReps: '3 mins', instructions: 'Open thoracic spine, rotate shoulders and hips.' },
        { name: 'Banded Pull-Aparts / Light Activation', durationOrReps: '2 sets x 15 reps', instructions: 'Squeeze rear delts, activate upper back.' },
        { name: 'Specific Warmup Ramp Sets', durationOrReps: '2 progressive sets', instructions: '50% and 70% of working weight for first compound.' },
      ],
      exercises: [
        {
          id: 'ex-1',
          name: targetMuscle?.includes('Leg') ? 'Barbell Back Squat' : 'Incline Dumbbell Bench Press',
          targetSets: isHighRecovery ? 4 : 3,
          repsRange: '8 - 10 reps',
          recommendedWeightKg: targetMuscle?.includes('Leg') ? 80 : 28,
          targetRpe: isHighRecovery ? 8 : 7,
          restSeconds: 90,
          targetZone: 'Zone 3 - Zone 4',
          formCue: 'Lower with 3-second eccentric control, explode upward, maintain packed shoulders.',
        },
        {
          id: 'ex-2',
          name: targetMuscle?.includes('Leg') ? 'Romanian Deadlift (Dumbbell or Barbell)' : 'Chest-Supported Row',
          targetSets: 3,
          repsRange: '10 - 12 reps',
          recommendedWeightKg: targetMuscle?.includes('Leg') ? 60 : 32,
          targetRpe: 8,
          restSeconds: 75,
          targetZone: 'Zone 3',
          formCue: 'Hinge deeply at the hips, feel the hamstring stretch, engage lats fully.',
        },
        {
          id: 'ex-3',
          name: targetMuscle?.includes('Leg') ? 'Bulgarian Split Squats' : 'Cable Fly / Lateral Raise Superset',
          targetSets: 3,
          repsRange: '12 - 15 reps each side',
          recommendedWeightKg: 14,
          targetRpe: 8,
          restSeconds: 60,
          targetZone: 'Zone 3 - Zone 4',
          formCue: 'Keep torso upright, drive through mid-foot, do not lock out at peak.',
        },
        {
          id: 'ex-4',
          name: targetMuscle?.includes('Leg') ? 'Standing Calf Raises & Hanging Knee Raises' : 'Overhead Rope Tricep Extensions',
          targetSets: 3,
          repsRange: '15 reps',
          recommendedWeightKg: 20,
          targetRpe: 9,
          restSeconds: 45,
          targetZone: 'Zone 2 - Zone 3',
          formCue: 'Full stretch at bottom, 1-second isometric pause at contraction.',
        },
      ],
      cooldown: [
        { name: 'Diaphragmatic Parasympathetic Breathing', durationOrReps: '3 mins' },
        { name: 'Target Muscle Static Stretching', durationOrReps: '2 mins' },
      ],
      coachTip: 'Keep your rest periods strict using the Gym Mode timer to keep heart rate in the target metabolic zone.',
    },
  });
});

// Endpoint: Generate customized nutrition suggestions
app.post('/api/coach/nutrition', async (req, res) => {
  const { userGoal, caloriesBurnt, weightKg, sleepScore, avgHr } = req.body;

  const prompt = `You are a certified sports nutritionist and dietary coach.
Provide customized daily nutrition and post-workout suggestions for an active individual:
- Primary Goal: ${userGoal || 'Lean Muscle & Performance'}
- Estimated Active Calories Burned Today: ${caloriesBurnt || 540} kcal
- Body Weight: ${weightKg || 75} kg
- Last Night's Sleep Quality: ${sleepScore || 85}/100
- Average Workout Heart Rate: ${avgHr || 142} bpm

Detail macro targets (Calories, Protein in g, Carbs in g, Fats in g, Hydration in L), specific meal plans (pre-workout energizer, post-workout anabolic recovery meal, dinner recovery meal), and recovery supplement/electrolyte advice based on cardiac exertion and sleep repair needs.`;

  try {
    if (apiKey) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are PulseFit AI Nutrition Specialist. Output strictly as valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              planTitle: { type: Type.STRING },
              biometricSummary: { type: Type.STRING },
              dailyTargets: {
                type: Type.OBJECT,
                properties: {
                  caloriesKcal: { type: Type.INTEGER },
                  proteinGrams: { type: Type.INTEGER },
                  carbsGrams: { type: Type.INTEGER },
                  fatsGrams: { type: Type.INTEGER },
                  waterLiters: { type: Type.NUMBER },
                },
                required: ['caloriesKcal', 'proteinGrams', 'carbsGrams', 'fatsGrams', 'waterLiters'],
              },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mealType: { type: Type.STRING },
                    timing: { type: Type.STRING },
                    name: { type: Type.STRING },
                    macrosSnippet: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    benefits: { type: Type.STRING },
                  },
                  required: ['mealType', 'timing', 'name', 'macrosSnippet', 'ingredients', 'benefits'],
                },
              },
              hydrationAndElectrolytes: { type: Type.STRING },
              sleepNutritionTip: { type: Type.STRING },
            },
            required: ['planTitle', 'dailyTargets', 'meals', 'hydrationAndElectrolytes', 'sleepNutritionTip'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      }
    }
  } catch (err: any) {
    console.error('Gemini nutrition generation error:', err);
  }

  // High quality science-based fallback nutrition plan
  const weight = weightKg || 75;
  const burned = caloriesBurnt || 550;
  const targetCalories = Math.round(weight * 32 + burned * 0.7);
  const targetProtein = Math.round(weight * 2.0); // 2g/kg
  const targetFat = Math.round(weight * 0.9);
  const targetCarbs = Math.round((targetCalories - (targetProtein * 4 + targetFat * 9)) / 4);

  return res.json({
    success: true,
    data: {
      planTitle: `${userGoal || 'Athletic Performance'} Optimal Nutrition Plan`,
      biometricSummary: `Tailored for a ${burned} kcal active output, avg HR of ${avgHr || 142} bpm, and sleep recovery score of ${sleepScore || 85}%.`,
      dailyTargets: {
        caloriesKcal: targetCalories,
        proteinGrams: targetProtein,
        carbsGrams: targetCarbs,
        fatsGrams: targetFat,
        waterLiters: 3.2,
      },
      meals: [
        {
          mealType: 'Pre-Workout Fuel',
          timing: '60-90 mins before training',
          name: 'Complex Carb Energy Bowl with Whey/Plant Protein',
          macrosSnippet: '38g Carbs | 28g Protein | 6g Fat',
          ingredients: ['Oats (50g)', 'Whey Isolate (1 scoop)', 'Banana slices', 'Pinch of Himalayan pink salt', 'Cinnamon'],
          benefits: 'Sustains steady blood glucose and prevents heart rate tachycardia during heavy sets.',
        },
        {
          mealType: 'Post-Workout Anabolic Window',
          timing: 'Within 45 mins post gym',
          name: 'Fast Recovery Protein Shake & High-GI Fruit',
          macrosSnippet: '45g Carbs | 35g Protein | 2g Fat',
          ingredients: ['Whey or Pea Protein (35g)', 'Dextrose or Tart Cherry Juice (250ml)', 'Blueberries', '5g Creatine Monohydrate'],
          benefits: 'Replenishes depleted muscle glycogen, reduces cortisol, and kickstarts muscle protein synthesis.',
        },
        {
          mealType: 'Recovery Dinner',
          timing: '2-3 hours before sleep',
          name: 'Flame-Grilled Wild Salmon with Quinoa & Steamed Greens',
          macrosSnippet: '48g Carbs | 42g Protein | 22g Fat',
          ingredients: ['Wild Salmon (180g)', 'Cooked Quinoa (1 cup)', 'Asparagus & Broccoli with olive oil', 'Avocado (1/4)'],
          benefits: 'Rich in Omega-3 EPA/DHA to reduce heart inflammation, plus magnesium for deeper sleep REM cycles.',
        },
      ],
      hydrationAndElectrolytes: 'Consume 500ml water with 400mg sodium and 200mg potassium intra-workout to maintain cardiac output and prevent cramping.',
      sleepNutritionTip: 'Tart cherry juice or magnesium glycinate (300mg) 45 minutes before bed enhances melatonin synthesis and lowers nighttime resting HR.',
    },
  });
});

// Endpoint: AI Coach conversational chat
app.post('/api/coach/chat', async (req, res) => {
  const { message, biometrics, activeWorkout } = req.body;

  const prompt = `User message: "${message}"

Current Athlete Biometrics:
- Real-time Heart Rate: ${biometrics?.currentHr || 75} bpm (Zone ${biometrics?.zone || 1})
- Resting Heart Rate: ${biometrics?.restingHr || 58} bpm
- Heart Rate Variability (HRV): ${biometrics?.hrv || 65} ms
- Sleep Quality Score: ${biometrics?.sleepScore || 86}/100 (Deep sleep: ${biometrics?.deepSleepPct || 22}%)
- Today's Gym Strain: ${biometrics?.strain || 5.4}/21
- Active Gym Session: ${activeWorkout?.active ? `In progress (${activeWorkout?.exerciseName}, ${activeWorkout?.completedSets}/${activeWorkout?.totalSets} sets completed)` : 'Not currently lifting'}

Provide a direct, motivating, expert, scientifically accurate response under 150 words. Focus on practical gym cues, heart rate pacing, or nutrition adjustments based on their current numbers.`;

  try {
    if (apiKey) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are PulseFit AI Coach, a supportive, high-energy certified strength & conditioning coach and sports scientist. Give concise, powerful, actionable advice.',
        },
      });

      const text = response.text;
      if (text) {
        return res.json({ success: true, reply: text });
      }
    }
  } catch (err: any) {
    console.error('Gemini chat error:', err);
  }

  // Fallback intelligent coaching response
  const hr = biometrics?.currentHr || 75;
  let fallbackReply = `Great focus! At ${hr} BPM, `;
  if (hr > 150) {
    fallbackReply += `you are deep in Zone 4 threshold territory. If you're doing heavy compound lifts, allow your heart rate to settle below 120 BPM before initiating your next heavy set for maximum motor unit recruitment.`;
  } else if (hr > 115) {
    fallbackReply += `you're in Zone 2-3 aerobic pacing. Keep resting intervals between 60 to 90 seconds to maximize hypertrophy without burning out your central nervous system.`;
  } else {
    fallbackReply += `your body is well-recovered. With a resting HR of ${biometrics?.restingHr || 58} bpm and recovery readiness of ${biometrics?.recoveryScore || 84}%, you have the physiological green light to push progressive overload today!`;
  }

  return res.json({ success: true, reply: fallbackReply });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PulseFit AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

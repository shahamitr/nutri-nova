'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ComprehensiveDietPlan from '@/components/diet/ComprehensiveDietPlan';
import { DietPlan, HealthProfile } from '@/types/diet';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

export default function DietPlanPage() {
  const { token } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dietResponse, profileResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/plan`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/profile`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (dietResponse.ok) { const d = await dietResponse.json(); setDietPlan(d.data); }
      if (profileResponse.ok) { const p = await profileResponse.json(); setHealthProfile(p.data); }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNarrate = async () => {
    if (!dietPlan) return;
    try {
      const narrationText = `Your personalized diet plan provides ${dietPlan.daily_calories} calories per day.
        Macronutrient distribution: ${dietPlan.protein_percentage}% protein, ${dietPlan.carbs_percentage}% carbohydrates, and ${dietPlan.fats_percentage}% fats.
        Your daily meal plan includes six meals:
        For breakfast at ${dietPlan.breakfast.time}: ${dietPlan.breakfast.items.map(f => f.name).join(', ')}.
        ${dietPlan.meal_explanations.breakfast}
        Mid-morning snack at ${dietPlan.mid_morning_snack.time}: ${dietPlan.mid_morning_snack.items.map(f => f.name).join(', ')}.
        For lunch at ${dietPlan.lunch.time}: ${dietPlan.lunch.items.map(f => f.name).join(', ')}.
        Evening snack at ${dietPlan.evening_snack.time}: ${dietPlan.evening_snack.items.map(f => f.name).join(', ')}.
        For dinner at ${dietPlan.dinner.time}: ${dietPlan.dinner.items.map(f => f.name).join(', ')}.
        Remember to drink ${dietPlan.water_intake.total_liters} liters of water throughout the day.
        Your 12-week journey starts with the adaptation phase, followed by energy boost, momentum building, and finally goal achievement.`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: narrationText }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data.audioUrl) {
          const audio = new Audio(data.data.audioUrl);
          await audio.play();
        }
      }
    } catch (error) {
      console.error('Failed to narrate diet plan:', error);
    }
  };

  const handleLogMeal = async (mealType: string) => {
    if (!token) return;
    const result = await logActivityWithToast(token, ACTIVITY_TYPES.MEAL_LOGGED, {
      meal_type: mealType, timestamp: new Date().toISOString(),
    });
    if (result.level_up && result.new_level) { setNewLevel(result.new_level); setShowLevelUp(true); }
    setLoggedMeals(prev => new Set(prev).add(mealType));
  };

  const handleLogWater = async () => {
    if (!token) return;
    const result = await logActivityWithToast(token, ACTIVITY_TYPES.WATER_LOGGED);
    if (result.level_up && result.new_level) { setNewLevel(result.new_level); setShowLevelUp(true); }
  };

  const getMealLabel = (mealType: string) => {
    const labels: Record<string, string> = {
      breakfast: '🍳 Breakfast', mid_morning_snack: '🍎 Mid-Morning',
      lunch: '🥗 Lunch', evening_snack: '🥤 Evening Snack',
      dinner: '🍽️ Dinner', water: '💧 Water',
    };
    return labels[mealType] || mealType;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader title="My Diet Plan" description="Your personalized meal schedule" icon="🍽️" />
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading your diet plan...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!dietPlan) {
    return (
      <PageTransition>
      <div className="space-y-6">
        <PageHeader title="My Diet Plan" description="Your personalized meal schedule" icon="🍽️" />
        <FadeIn delay={0.1}>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Diet Plan Yet</h2>
          <p className="text-slate-500 mb-6">Complete the diet planning conversation to generate your personalized diet plan.</p>
          <a
            href="/dashboard/diet-planning"
            className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-emerald-700 transition-all shadow-sm"
          >
            Start Diet Planning
          </a>
        </div>
        </FadeIn>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader title="My Diet Plan" description="Your personalized meal schedule" icon="🍽️" />
      <LevelUpModal show={showLevelUp} newLevel={newLevel} onClose={() => setShowLevelUp(false)} />

      {/* Meal Logging Section */}
      <FadeIn delay={0.1}>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xl">📝</div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Log Your Meals</h3>
            <p className="text-slate-500 text-sm">Track your meals to earn points and maintain your streak!</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner', 'water'].map((mealType) => (
            <button
              key={mealType}
              onClick={() => mealType === 'water' ? handleLogWater() : handleLogMeal(mealType)}
              disabled={loggedMeals.has(mealType)}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                loggedMeals.has(mealType)
                  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                  : 'bg-slate-50 text-slate-700 hover:bg-teal-50 border border-slate-200/60 hover:border-teal-300'
              }`}
            >
              {loggedMeals.has(mealType) ? '✓ ' : ''}{getMealLabel(mealType)}
              <span className="text-xs ml-1 opacity-70">{mealType === 'water' ? '+5' : '+10'} pts</span>
            </button>
          ))}
        </div>
      </div>
      </FadeIn>

      <FadeIn delay={0.2}>
      <ComprehensiveDietPlan
        dietPlan={dietPlan}
        healthProfile={healthProfile || undefined}
        onNarrate={handleNarrate}
      />
      </FadeIn>
    </div>
    </PageTransition>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ComprehensiveDietPlan from '@/components/diet/ComprehensiveDietPlan';
import { DietPlan, HealthProfile } from '@/types/diet';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';

export default function DietPlanPage() {
  const { token } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch diet plan
      const dietResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/plan`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (dietResponse.ok) {
        const dietData = await dietResponse.json();
        setDietPlan(dietData.data);
      }

      // Fetch health profile
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setHealthProfile(profileData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNarrate = async () => {
    if (!dietPlan) return;

    try {
      // Build comprehensive narration text
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

      // Call TTS API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/generate-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: narrationText }),
      });

      if (response.ok) {
        const data = await response.json();
        // Play audio if URL provided
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
      meal_type: mealType,
      timestamp: new Date().toISOString(),
    });

    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }

    // Mark meal as logged
    setLoggedMeals(prev => new Set(prev).add(mealType));
  };

  const handleLogWater = async () => {
    if (!token) return;

    const result = await logActivityWithToast(token, ACTIVITY_TYPES.WATER_LOGGED);

    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your diet plan...</p>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 bg-white rounded-lg shadow p-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold mb-2">No Diet Plan Yet</h2>
          <p className="text-gray-600 mb-6">
            Complete the diet planning conversation to generate your personalized diet plan.
          </p>
          <a
            href="/dashboard/diet-planning"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start Diet Planning
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <LevelUpModal
        show={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />

      {/* Meal Logging Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4">📝 Log Your Meals</h3>
        <p className="text-gray-600 mb-4">Track your meals to earn points and maintain your streak!</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner', 'water'].map((mealType) => (
            <button
              key={mealType}
              onClick={() => mealType === 'water' ? handleLogWater() : handleLogMeal(mealType)}
              disabled={loggedMeals.has(mealType)}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                loggedMeals.has(mealType)
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200'
              }`}
            >
              {loggedMeals.has(mealType) ? '✓ ' : ''}
              {mealType === 'water' ? '💧 Water' :
               mealType === 'mid_morning_snack' ? '🍎 Mid-Morning' :
               mealType === 'evening_snack' ? '🥤 Evening Snack' :
               mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              {mealType === 'water' ? ' (+5 pts)' : ' (+10 pts)'}
            </button>
          ))}
        </div>
      </div>

      <ComprehensiveDietPlan
        dietPlan={dietPlan}
        healthProfile={healthProfile || undefined}
        onNarrate={handleNarrate}
      />
    </div>
  );
}

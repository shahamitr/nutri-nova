'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import DietPlanDisplay from '@/components/diet/DietPlanDisplay';

interface Meal {
  name: string;
  foods: Array<{ name: string; portion: string; calories: number }>;
}

interface DietPlan {
  daily_calories: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
}

export default function DietPlanPage() {
  const { token } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDietPlan();
  }, []);

  const fetchDietPlan = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/plan`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDietPlan(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch diet plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNarrate = async () => {
    if (!dietPlan) return;

    try {
      // Build narration text
      const narrationText = `Your personalized diet plan provides ${dietPlan.daily_calories} calories per day.
        Macronutrient distribution: ${dietPlan.protein_percentage}% protein, ${dietPlan.carbs_percentage}% carbohydrates, and ${dietPlan.fats_percentage}% fats.

        For breakfast: ${dietPlan.breakfast.foods.map(f => `${f.name}, ${f.portion}`).join(', ')}.

        For lunch: ${dietPlan.lunch.foods.map(f => `${f.name}, ${f.portion}`).join(', ')}.

        For snack: ${dietPlan.snack.foods.map(f => `${f.name}, ${f.portion}`).join(', ')}.

        For dinner: ${dietPlan.dinner.foods.map(f => `${f.name}, ${f.portion}`).join(', ')}.`;

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
    <div className="max-w-6xl mx-auto">
      <DietPlanDisplay dietPlan={dietPlan} onNarrate={handleNarrate} />
    </div>
  );
}

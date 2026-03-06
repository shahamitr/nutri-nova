'use client';

import { useState } from 'react';
import MacronutrientChart from './MacronutrientChart';
import MealCard from './MealCard';

interface Meal {
  name: string;
  foods: Array<{
    name: string;
    portion: string;
    calories: number;
  }>;
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

interface DietPlanDisplayProps {
  dietPlan: DietPlan;
  onNarrate?: () => void;
}

export default function DietPlanDisplay({ dietPlan, onNarrate }: DietPlanDisplayProps) {
  const [isNarrating, setIsNarrating] = useState(false);

  const handleNarrate = async () => {
    if (onNarrate) {
      setIsNarrating(true);
      await onNarrate();
      setIsNarrating(false);
    }
  };

  const meals = [
    { key: 'breakfast', data: dietPlan.breakfast },
    { key: 'lunch', data: dietPlan.lunch },
    { key: 'snack', data: dietPlan.snack },
    { key: 'dinner', data: dietPlan.dinner },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Calorie Target */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-2">Your Personalized Diet Plan</h2>
        <div className="flex items-baseline space-x-2">
          <span className="text-5xl font-bold">{dietPlan.daily_calories}</span>
          <span className="text-xl">calories/day</span>
        </div>
        <button
          onClick={handleNarrate}
          disabled={isNarrating}
          className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 font-medium"
        >
          {isNarrating ? '🔊 Narrating...' : '🔊 Listen to Plan'}
        </button>
      </div>

      {/* Macronutrient Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Macronutrient Distribution</h3>
        <MacronutrientChart
          protein={dietPlan.protein_percentage}
          carbs={dietPlan.carbs_percentage}
          fats={dietPlan.fats_percentage}
        />
      </div>

      {/* Meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meals.map((meal) => (
          <MealCard key={meal.key} meal={meal.data} />
        ))}
      </div>
    </div>
  );
}

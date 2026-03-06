'use client';

interface Food {
  name: string;
  portion: string;
  calories: number;
}

interface Meal {
  name: string;
  foods: Food[];
}

interface MealCardProps {
  meal: Meal;
}

export default function MealCard({ meal }: MealCardProps) {
  const totalCalories = meal.foods.reduce((sum, food) => sum + food.calories, 0);

  // Meal icon mapping
  const mealIcons: Record<string, string> = {
    Breakfast: '🍳',
    Lunch: '🍱',
    Snack: '🍎',
    Dinner: '🍽️',
  };

  const icon = mealIcons[meal.name] || '🍴';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* Meal Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-gray-800">{meal.name}</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-blue-600">{totalCalories}</div>
          <div className="text-xs text-gray-500">calories</div>
        </div>
      </div>

      {/* Food Items */}
      <div className="space-y-3">
        {meal.foods.map((food, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-800">{food.name}</div>
              <div className="text-sm text-gray-500">{food.portion}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700">{food.calories}</div>
              <div className="text-xs text-gray-500">cal</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

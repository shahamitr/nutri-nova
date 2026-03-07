'use client';

import { DietPlan, HealthProfile } from '@/types/diet';

interface Props {
  dietPlan: DietPlan;
  healthProfile?: HealthProfile;
  onNarrate?: () => void;
}

export default function ComprehensiveDietPlan({ dietPlan, healthProfile, onNarrate }: Props) {
  const mealIcons: Record<string, string> = {
    breakfast: '🌅',
    mid_morning_snack: '☕',
    lunch: '☀️',
    evening_snack: '🍎',
    dinner: '🌙',
    before_bed: '🌜',
  };

  const recommendationIcons: Record<string, string> = {
    exercise: '🏃',
    sleep: '😴',
    stress_management: '🧘',
    tracking: '📊',
    foods_to_limit: '🚫',
    meal_timing: '⏰',
  };

  const renderMeal = (mealKey: keyof typeof dietPlan, explanation: string) => {
    const meal = dietPlan[mealKey];
    if (!meal || typeof meal !== 'object' || !('items' in meal)) return null;

    return (
      <div className="meal-card bg-white border-2 border-gray-200 rounded-xl p-6 mb-4 hover:border-green-500 transition-all">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{mealIcons[mealKey]}</span>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900">{meal.name}</h4>
            <p className="text-sm text-green-600 font-semibold">
              {meal.total_calories} calories | Protein: {meal.protein_grams}g | Carbs: {meal.carbs_grams}g | Fats: {meal.fats_grams}g
            </p>
          </div>
        </div>

        <ul className="space-y-2 mb-4">
          {meal.items.map((item, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-green-500 font-bold mr-2">✓</span>
              <span className="text-gray-700">{item.name}</span>
            </li>
          ))}
        </ul>

        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-semibold">💡 Why:</span> {explanation}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">🎉 Your Personalized Nutrition Plan</h1>
        <p className="text-green-100">Powered by Amazon Nova AI</p>
      </div>

      {/* Health Profile Summary */}
      {healthProfile && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Health Profile Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="text-lg font-bold text-gray-900">{healthProfile.age} years</p>
            </div>
            {healthProfile.bmi && (
              <div>
                <p className="text-sm text-gray-600">Current BMI</p>
                <p className="text-lg font-bold text-gray-900">
                  {healthProfile.bmi.toFixed(1)} ({healthProfile.bmi_category})
                </p>
              </div>
            )}
            {healthProfile.target_weight && (
              <div>
                <p className="text-sm text-gray-600">Target Weight</p>
                <p className="text-lg font-bold text-gray-900">{healthProfile.target_weight} kg</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Activity Level</p>
              <p className="text-lg font-bold text-gray-900">{healthProfile.activity_level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Calories</p>
              <p className="text-lg font-bold text-gray-900">{dietPlan.daily_calories} kcal</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Meal Plan */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Your Daily Meal Plan</h2>
        {renderMeal('breakfast', dietPlan.meal_explanations.breakfast)}
        {renderMeal('mid_morning_snack', dietPlan.meal_explanations.mid_morning_snack)}
        {renderMeal('lunch', dietPlan.meal_explanations.lunch)}
        {renderMeal('evening_snack', dietPlan.meal_explanations.evening_snack)}
        {renderMeal('dinner', dietPlan.meal_explanations.dinner)}
        {renderMeal('before_bed', dietPlan.meal_explanations.before_bed)}
      </div>

      {/* Water Intake Schedule */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">💧 Daily Water Intake Plan</h2>
        <div className="space-y-3 mb-4">
          {dietPlan.water_intake.schedule.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg">
              <span className="text-gray-700 font-medium">{item.time}</span>
              <span className="text-blue-700 font-bold">{item.description} ({item.amount_ml}ml)</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg text-center mb-3">
          <p className="text-lg font-bold text-blue-900">
            Total Daily Water: {dietPlan.water_intake.total_liters}L ({dietPlan.water_intake.schedule.reduce((sum, item) => sum + item.amount_ml, 0) / 250} glasses)
          </p>
        </div>
        <p className="text-sm text-blue-800 text-center italic">💡 {dietPlan.water_intake.note}</p>
      </div>

      {/* Additional Recommendations */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Additional Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(dietPlan.additional_recommendations).map(([key, items]) => (
            <div key={key} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-orange-400 transition-all">
              <div className="text-4xl mb-3">{recommendationIcons[key]}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 capitalize">
                {key.replace(/_/g, ' ')}
              </h3>
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <span className="text-orange-500 font-bold mr-2 text-base">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Week Timeline */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Your 12-Week Journey</h2>
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600"></div>

          {dietPlan.timeline.map((phase, idx) => (
            <div key={idx} className="relative mb-8 last:mb-0">
              {/* Timeline marker */}
              <div className="absolute left-[-1.4rem] w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {idx + 1}
              </div>

              {/* Timeline content */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5 ml-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-green-600">{phase.weeks}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{phase.phase}</h3>
                <p className="text-gray-700">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nova Attribution */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center">
        <p className="text-sm">
          ✨ This personalized plan was created by <strong>Amazon Nova Lite</strong> analyzing your age, BMI, activity level, and dietary preferences through natural conversation with <strong>Amazon Nova Sonic</strong>
        </p>
      </div>

      {/* Narrate Button */}
      {onNarrate && (
        <div className="text-center">
          <button
            onClick={onNarrate}
            className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            🎤 Narrate My Diet Plan
          </button>
        </div>
      )}
    </div>
  );
}

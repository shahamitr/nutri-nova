// Diet Plan Types - Matching Backend Structure

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
}

export interface Meal {
  name: string;
  time: string;
  items: FoodItem[];
  total_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
}

export interface MealExplanations {
  breakfast: string;
  mid_morning_snack: string;
  lunch: string;
  evening_snack: string;
  dinner: string;
  before_bed: string;
}

export interface WaterScheduleItem {
  time: string;
  amount_ml: number;
  description: string;
}

export interface WaterIntake {
  total_liters: number;
  schedule: WaterScheduleItem[];
  note: string;
}

export interface TimelinePhase {
  weeks: string;
  phase: string;
  description: string;
}

export interface AdditionalRecommendations {
  exercise: string[];
  sleep: string[];
  stress_management: string[];
  tracking: string[];
  foods_to_limit: string[];
  meal_timing: string[];
}

export interface DietPlan {
  user_id: number;
  daily_calories: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  breakfast: Meal;
  mid_morning_snack: Meal;
  lunch: Meal;
  evening_snack: Meal;
  dinner: Meal;
  before_bed: Meal;
  meal_explanations: MealExplanations;
  water_intake: WaterIntake;
  additional_recommendations: AdditionalRecommendations;
  timeline: TimelinePhase[];
}

export interface HealthProfile {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  bmi?: number;
  bmi_category?: string;
  target_weight?: number;
  activity_level: string;
  diet_preference: string;
}

import { query } from '../db/connection';
import { NovaLiteService } from './NovaLiteService';

interface HealthProfile {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  diet_preference: string;
  activity_level: string;
  sleep_hours: number;
  stress_level: string;
  medical_conditions?: string;
}

interface DietPlan {
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
  water_intake: WaterIntake;
  additional_recommendations: AdditionalRecommendations;
  timeline: TimelinePhase[];
  meal_explanations: MealExplanations;
}

interface Meal {
  name: string;
  time: string;
  items: FoodItem[];
  total_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
}

interface MealExplanations {
  breakfast: string;
  mid_morning_snack: string;
  lunch: string;
  evening_snack: string;
  dinner: string;
  before_bed: string;
}

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
}

interface WaterIntake {
  total_liters: number;
  schedule: WaterScheduleItem[];
  note: string;
}

interface WaterScheduleItem {
  time: string;
  amount_ml: number;
  description: string;
}

interface AdditionalRecommendations {
  exercise: string[];
  sleep: string[];
  stress_management: string[];
  tracking: string[];
  foods_to_limit: string[];
  meal_timing: string[];
  timeline: TimelinePhase[];
}

interface TimelinePhase {
  weeks: string;
  phase: string;
  description: string;
}

export class DietService {
  private novaLiteService: NovaLiteService;

  constructor() {
    this.novaLiteService = new NovaLiteService();
  }

  /**
   * Calculate daily calorie target using Harris-Benedict equation
   */
  calculateDailyCalories(profile: HealthProfile): number {
    // Harris-Benedict BMR calculation
    let bmr: number;

    if (profile.gender === 'MALE') {
      // Men: BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
      bmr = 88.362 + 13.397 * profile.weight_kg + 4.799 * profile.height_cm - 5.677 * profile.age;
    } else {
      // Women: BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
      bmr = 447.593 + 9.247 * profile.weight_kg + 3.098 * profile.height_cm - 4.33 * profile.age;
    }

    // Apply activity level multiplier
    const activityMultipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };

    const multiplier = activityMultipliers[profile.activity_level] || 1.2;
    const dailyCalories = Math.round(bmr * multiplier);

    return dailyCalories;
  }

  /**
   * Build comprehensive AI prompt for diet plan generation
   */
  buildDietPlanPrompt(profile: HealthProfile, dailyCalories: number): string {
    const dietConstraints = {
      VEGETARIAN: 'no meat, poultry, or fish',
      EGGETARIAN: 'no meat, poultry, or fish, but eggs are allowed',
      NON_VEGETARIAN: 'all food types allowed including meat, poultry, and fish',
    };

    const constraint = dietConstraints[profile.diet_preference as keyof typeof dietConstraints] || dietConstraints.VEGETARIAN;

    // Calculate BMI
    const heightM = profile.height_cm / 100;
    const bmi = profile.weight_kg / (heightM * heightM);
    const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';

    // Calculate target weight if overweight/obese
    const targetWeight = bmi > 25 ? Math.round(25 * heightM * heightM) : profile.weight_kg;
    const weightToLose = profile.weight_kg - targetWeight;

    const prompt = `You are a professional nutritionist and health coach. Create a comprehensive personalized daily nutrition plan with the following specifications:

**User Profile:**
- Age: ${profile.age} years
- Gender: ${profile.gender}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
${weightToLose > 0 ? `- Target Weight: ${targetWeight} kg (${weightToLose.toFixed(1)} kg to lose)` : ''}
- Diet Preference: ${profile.diet_preference} (${constraint})
- Activity Level: ${profile.activity_level}
- Sleep Hours: ${profile.sleep_hours} hours
- Stress Level: ${profile.stress_level}
${profile.medical_conditions ? `- Medical Conditions: ${profile.medical_conditions}` : ''}

**Requirements:**
- Daily Calorie Target: ${dailyCalories} kcal
- Macronutrient Distribution: 30% protein, 40% carbohydrates, 30% fats
- Six meals: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner, Before Bed (optional)
- All food items must respect the diet preference (${constraint})
- Include specific meal times with time windows
- Include detailed water intake schedule (2.5-3 liters daily with 7 specific times)
- Include comprehensive recommendations across 6 categories
- Include 12-week timeline with 4 phases
- Include educational explanations for why each meal helps

**Output Format (JSON):**
{
  "daily_calories": ${dailyCalories},
  "protein_percentage": 30,
  "carbs_percentage": 40,
  "fats_percentage": 30,
  "breakfast": {
    "name": "Breakfast",
    "time": "7:00 AM - 8:00 AM",
    "items": [
      {"name": "2 scrambled eggs with spinach and tomatoes", "portion": "2 eggs", "calories": 180},
      {"name": "1 cup Greek yogurt with mixed berries", "portion": "1 cup", "calories": 150},
      {"name": "1 slice whole grain toast with avocado", "portion": "1 slice", "calories": 120}
    ],
    "total_calories": 450,
    "protein_grams": 35,
    "carbs_grams": 45,
    "fats_grams": 15
  },
  "mid_morning_snack": {
    "name": "Mid-Morning Snack",
    "time": "10:30 AM",
    "items": [
      {"name": "1 medium apple with 1 tbsp almond butter", "portion": "1 apple + 1 tbsp", "calories": 150}
    ],
    "total_calories": 150,
    "protein_grams": 8,
    "carbs_grams": 18,
    "fats_grams": 6
  },
  "lunch": {
    "name": "Lunch",
    "time": "12:30 PM - 1:30 PM",
    "items": [
      {"name": "Grilled chicken breast or baked salmon", "portion": "6 oz", "calories": 280},
      {"name": "Quinoa bowl", "portion": "1 cup cooked", "calories": 220},
      {"name": "Mixed green salad with olive oil dressing", "portion": "2 cups", "calories": 50}
    ],
    "total_calories": 550,
    "protein_grams": 40,
    "carbs_grams": 50,
    "fats_grams": 20
  },
  "evening_snack": {
    "name": "Evening Snack",
    "time": "4:00 PM - 5:00 PM",
    "items": [
      {"name": "Protein smoothie with banana and almond milk", "portion": "1 smoothie", "calories": 200}
    ],
    "total_calories": 200,
    "protein_grams": 15,
    "carbs_grams": 20,
    "fats_grams": 8
  },
  "dinner": {
    "name": "Dinner",
    "time": "7:00 PM - 8:00 PM",
    "items": [
      {"name": "Baked salmon or grilled turkey breast", "portion": "6 oz", "calories": 300},
      {"name": "Sweet potato", "portion": "1 medium", "calories": 100},
      {"name": "Steamed asparagus and Brussels sprouts", "portion": "2 cups", "calories": 100}
    ],
    "total_calories": 500,
    "protein_grams": 42,
    "carbs_grams": 40,
    "fats_grams": 22
  },
  "before_bed": {
    "name": "Before Bed (Optional)",
    "time": "9:00 PM",
    "items": [
      {"name": "Small bowl of cottage cheese with berries", "portion": "1/2 cup", "calories": 100}
    ],
    "total_calories": 100,
    "protein_grams": 10,
    "carbs_grams": 8,
    "fats_grams": 3
  },
  "meal_explanations": {
    "breakfast": "High protein breakfast kickstarts metabolism and provides sustained energy throughout the morning",
    "mid_morning_snack": "Prevents energy dips and controls hunger before lunch",
    "lunch": "Balanced macros provide energy for afternoon activities without red meat",
    "evening_snack": "Boosts energy levels and prevents overeating at dinner",
    "dinner": "Lighter dinner aids digestion and better sleep quality",
    "before_bed": "Casein protein supports overnight muscle recovery"
  },
  "water_intake": {
    "total_liters": 2.5,
    "schedule": [
      {"time": "Upon Waking (6:30 AM)", "amount_ml": 500, "description": "2 glasses"},
      {"time": "Before Breakfast", "amount_ml": 250, "description": "1 glass"},
      {"time": "Mid-Morning", "amount_ml": 500, "description": "2 glasses"},
      {"time": "Before Lunch", "amount_ml": 250, "description": "1 glass"},
      {"time": "Afternoon", "amount_ml": 500, "description": "2 glasses"},
      {"time": "Before Dinner", "amount_ml": 250, "description": "1 glass"},
      {"time": "Evening", "amount_ml": 250, "description": "1 glass"}
    ],
    "note": "Drink more during/after your 30-minute walks"
  },
  "additional_recommendations": {
    "exercise": [
      "Continue 30-min walks daily",
      "Add 2-3 strength training sessions per week",
      "Try yoga or stretching for flexibility"
    ],
    "sleep": [
      "Aim for 7-8 hours nightly",
      "Maintain consistent sleep schedule",
      "Avoid screens 1 hour before bed"
    ],
    "stress_management": [
      "Practice 10-min daily meditation",
      "Deep breathing exercises",
      "Take short breaks during work"
    ],
    "tracking": [
      "Weigh yourself weekly (same time)",
      "Track energy levels daily",
      "Monitor portion sizes"
    ],
    "foods_to_limit": [
      "Processed foods and sugary snacks",
      "Fried foods and trans fats",
      "Alcohol (max 1-2 drinks/week)"
    ],
    "meal_timing": [
      "Eat every 3-4 hours",
      "Don't skip breakfast",
      "Finish dinner 3 hours before bed"
    ]
  },
  "timeline": [
    {
      "weeks": "Week 1-2",
      "phase": "Adaptation Phase",
      "description": "Body adjusts to new eating pattern. You may feel slight hunger initially."
    },
    {
      "weeks": "Week 3-4",
      "phase": "Energy Boost",
      "description": "Notice increased energy levels and better sleep quality. Weight loss: 2-3 lbs."
    },
    {
      "weeks": "Week 5-8",
      "phase": "Momentum Building",
      "description": "Consistent energy, clothes fit better. Weight loss: 5-6 lbs total."
    },
    {
      "weeks": "Week 9-12",
      "phase": "Goal Achievement",
      "description": "Reach target weight of ${targetWeight} kg. New healthy habits established!"
    }
  ]
}

Generate a balanced, nutritious, and comprehensive diet plan following these specifications exactly. Ensure all meals are culturally appropriate and practical to prepare. Include specific food items with portions and calories for each meal.`;

    return prompt;
  }

  /**
   * Generate personalized diet plan
   */
  async generateDietPlan(userId: number): Promise<DietPlan> {
    // Get health profile
    const profiles = await query<HealthProfile[]>(
      'SELECT * FROM health_profile WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      throw new Error('Health profile not found. Please complete your health profile first.');
    }

    const profile = profiles[0];

    // Calculate daily calories
    const dailyCalories = this.calculateDailyCalories(profile);

    // Build AI prompt
    const prompt = this.buildDietPlanPrompt(profile, dailyCalories);

    // Call Nova Lite with retry logic
    let aiResponse: string;
    let retries = 3;

    while (retries > 0) {
      try {
        aiResponse = await this.novaLiteService.generateResponse(prompt);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Failed to generate diet plan after multiple attempts');
        }
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }

    // Parse AI response
    let dietPlan: any;
    try {
      // Extract JSON from response (AI might include extra text)
      const jsonMatch = aiResponse!.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dietPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (error) {
      throw new Error('Failed to parse AI response into diet plan');
    }

    // Validate plan completeness
    if (
      !dietPlan.breakfast ||
      !dietPlan.mid_morning_snack ||
      !dietPlan.lunch ||
      !dietPlan.evening_snack ||
      !dietPlan.dinner ||
      !dietPlan.before_bed ||
      !dietPlan.water_intake ||
      !dietPlan.additional_recommendations ||
      !dietPlan.timeline ||
      !dietPlan.meal_explanations ||
      !dietPlan.daily_calories
    ) {
      throw new Error('Incomplete diet plan generated - missing required fields');
    }

    // Filter food items based on diet preference (additional validation)
    const filteredPlan = this.filterFoodItems(dietPlan, profile.diet_preference);

    // Store diet plan in database
    await query(
      `INSERT INTO diet_plans
       (user_id, daily_calories, protein_percentage, carbs_percentage, fats_percentage,
        breakfast, lunch, snack, dinner, water_intake, recommendations, timeline, meal_explanations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        filteredPlan.daily_calories,
        filteredPlan.protein_percentage,
        filteredPlan.carbs_percentage,
        filteredPlan.fats_percentage,
        JSON.stringify(filteredPlan.breakfast),
        JSON.stringify(filteredPlan.lunch),
        JSON.stringify({
          mid_morning: filteredPlan.mid_morning_snack,
          evening: filteredPlan.evening_snack,
          before_bed: filteredPlan.before_bed
        }),
        JSON.stringify(filteredPlan.dinner),
        JSON.stringify(filteredPlan.water_intake),
        JSON.stringify(filteredPlan.additional_recommendations),
        JSON.stringify(filteredPlan.timeline),
        JSON.stringify(filteredPlan.meal_explanations),
      ]
    );

    // Update user progress
    await query(
      'UPDATE user_progress SET diet_generated = TRUE, points = points + 50 WHERE user_id = ? AND diet_generated = FALSE',
      [userId]
    );

    // Add badge
    await this.addBadgeIfNotExists(userId, 'Personalized Diet Ready');

    return {
      user_id: userId,
      ...filteredPlan,
    };
  }

  /**
   * Filter food items based on diet preference
   */
  private filterFoodItems(plan: any, dietPreference: string): any {
    // Keywords to filter out based on diet preference
    const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'turkey'];
    const eggKeywords = ['egg'];

    const filterMeal = (meal: Meal): Meal => {
      const filteredItems = meal.items.filter((item) => {
        const itemNameLower = item.name.toLowerCase();

        if (dietPreference === 'VEGETARIAN') {
          // No meat or eggs
          const hasMeat = meatKeywords.some((keyword) => itemNameLower.includes(keyword));
          const hasEgg = eggKeywords.some((keyword) => itemNameLower.includes(keyword));
          return !hasMeat && !hasEgg;
        } else if (dietPreference === 'EGGETARIAN') {
          // No meat, but eggs allowed
          const hasMeat = meatKeywords.some((keyword) => itemNameLower.includes(keyword));
          return !hasMeat;
        } else {
          // NON_VEGETARIAN - all allowed
          return true;
        }
      });

      return {
        ...meal,
        items: filteredItems,
        total_calories: filteredItems.reduce((sum, item) => sum + item.calories, 0),
      };
    };

    return {
      ...plan,
      breakfast: filterMeal(plan.breakfast),
      mid_morning_snack: filterMeal(plan.mid_morning_snack),
      lunch: filterMeal(plan.lunch),
      evening_snack: filterMeal(plan.evening_snack),
      dinner: filterMeal(plan.dinner),
      before_bed: filterMeal(plan.before_bed),
    };
  }

  /**
   * Get most recent diet plan
   */
  async getDietPlan(userId: number): Promise<DietPlan | null> {
    const plans = await query<any[]>(
      'SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (plans.length === 0) {
      return null;
    }

    const plan = plans[0];
    const snacks = JSON.parse(plan.snack || '{}');

    return {
      user_id: plan.user_id,
      daily_calories: plan.daily_calories,
      protein_percentage: plan.protein_percentage,
      carbs_percentage: plan.carbs_percentage,
      fats_percentage: plan.fats_percentage,
      breakfast: JSON.parse(plan.breakfast),
      mid_morning_snack: snacks.mid_morning || {},
      lunch: JSON.parse(plan.lunch),
      evening_snack: snacks.evening || {},
      dinner: JSON.parse(plan.dinner),
      before_bed: snacks.before_bed || {},
      water_intake: JSON.parse(plan.water_intake || '{}'),
      additional_recommendations: JSON.parse(plan.recommendations || '{}'),
      timeline: JSON.parse(plan.timeline || '[]'),
      meal_explanations: JSON.parse(plan.meal_explanations || '{}'),
    };
  }

  /**
   * Add badge if not already exists
   */
  private async addBadgeIfNotExists(userId: number, badge: string): Promise<void> {
    const progress = await query<any[]>('SELECT badges FROM user_progress WHERE user_id = ?', [userId]);

    if (progress.length > 0) {
      const badges = JSON.parse(progress[0].badges || '[]');

      if (!badges.includes(badge)) {
        badges.push(badge);
        await query('UPDATE user_progress SET badges = ? WHERE user_id = ?', [JSON.stringify(badges), userId]);
      }
    }
  }
}

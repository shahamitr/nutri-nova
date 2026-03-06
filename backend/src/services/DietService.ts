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
  breakfast: any;
  lunch: any;
  snack: any;
  dinner: any;
}

interface Meal {
  name: string;
  items: FoodItem[];
  total_calories: number;
}

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
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
   * Build AI prompt for diet plan generation
   */
  buildDietPlanPrompt(profile: HealthProfile, dailyCalories: number): string {
    const dietConstraints = {
      VEGETARIAN: 'no meat, poultry, or fish',
      EGGETARIAN: 'no meat, poultry, or fish, but eggs are allowed',
      NON_VEGETARIAN: 'all food types allowed including meat, poultry, and fish',
    };

    const constraint = dietConstraints[profile.diet_preference as keyof typeof dietConstraints] || dietConstraints.VEGETARIAN;

    const prompt = `You are a professional nutritionist. Create a personalized daily diet plan with the following specifications:

**User Profile:**
- Age: ${profile.age} years
- Gender: ${profile.gender}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Diet Preference: ${profile.diet_preference} (${constraint})
- Activity Level: ${profile.activity_level}
- Sleep Hours: ${profile.sleep_hours} hours
- Stress Level: ${profile.stress_level}
${profile.medical_conditions ? `- Medical Conditions: ${profile.medical_conditions}` : ''}

**Requirements:**
- Daily Calorie Target: ${dailyCalories} kcal
- Macronutrient Distribution: 30% protein, 40% carbohydrates, 30% fats
- Four meals: Breakfast, Lunch, Snack, Dinner
- All food items must respect the diet preference (${constraint})

**Output Format (JSON):**
{
  "daily_calories": ${dailyCalories},
  "protein_percentage": 30,
  "carbs_percentage": 40,
  "fats_percentage": 30,
  "breakfast": {
    "name": "Breakfast",
    "items": [
      {"name": "Food item", "portion": "Amount", "calories": number}
    ],
    "total_calories": number
  },
  "lunch": { ... },
  "snack": { ... },
  "dinner": { ... }
}

Generate a balanced, nutritious diet plan following these specifications.`;

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
      !dietPlan.lunch ||
      !dietPlan.snack ||
      !dietPlan.dinner ||
      !dietPlan.daily_calories
    ) {
      throw new Error('Incomplete diet plan generated');
    }

    // Filter food items based on diet preference (additional validation)
    const filteredPlan = this.filterFoodItems(dietPlan, profile.diet_preference);

    // Store diet plan in database
    await query(
      `INSERT INTO diet_plans
       (user_id, daily_calories, protein_percentage, carbs_percentage, fats_percentage, breakfast, lunch, snack, dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        filteredPlan.daily_calories,
        filteredPlan.protein_percentage,
        filteredPlan.carbs_percentage,
        filteredPlan.fats_percentage,
        JSON.stringify(filteredPlan.breakfast),
        JSON.stringify(filteredPlan.lunch),
        JSON.stringify(filteredPlan.snack),
        JSON.stringify(filteredPlan.dinner),
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
      lunch: filterMeal(plan.lunch),
      snack: filterMeal(plan.snack),
      dinner: filterMeal(plan.dinner),
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

    return {
      user_id: plan.user_id,
      daily_calories: plan.daily_calories,
      protein_percentage: plan.protein_percentage,
      carbs_percentage: plan.carbs_percentage,
      fats_percentage: plan.fats_percentage,
      breakfast: JSON.parse(plan.breakfast),
      lunch: JSON.parse(plan.lunch),
      snack: JSON.parse(plan.snack),
      dinner: JSON.parse(plan.dinner),
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

import { query } from '../db/connection';

interface HealthProfile {
  user_id: number;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  diet_preference: string;
  activity_level: string;
  sleep_hours: number;
  sleep_quality?: string;
  stress_level: string;
  energy_levels?: string;
  medical_conditions?: string;

  // Comprehensive health fields
  allergies?: string;
  smoking_status?: string;
  alcohol_consumption?: string;
  water_intake_daily?: number;
  joint_pain?: boolean;
  back_pain?: boolean;
  neck_pain?: boolean;
  pain_details?: string;
  chronic_conditions?: string;
  medications?: string;
  injuries?: string;
  dietary_restrictions?: string;
  food_dislikes?: string;
  meal_frequency?: number;
  exercise_limitations?: string;
  health_goals?: string;
  family_history?: string;
  digestive_issues?: string;
}

interface BMIResult {
  bmi_value: number;
  category: string;
  interpretation: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export class HealthService {
  /**
   * Validate health profile data
   */
  validateHealthProfile(profile: Partial<HealthProfile>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!profile.age) {
      errors.push({ field: 'age', message: 'Age is required' });
    }
    if (!profile.gender) {
      errors.push({ field: 'gender', message: 'Gender is required' });
    }
    if (!profile.height_cm) {
      errors.push({ field: 'height_cm', message: 'Height is required' });
    }
    if (!profile.weight_kg) {
      errors.push({ field: 'weight_kg', message: 'Weight is required' });
    }
    if (!profile.diet_preference) {
      errors.push({ field: 'diet_preference', message: 'Diet preference is required' });
    }

    // Validate numeric ranges
    if (profile.age !== undefined) {
      if (profile.age < 1 || profile.age > 120) {
        errors.push({ field: 'age', message: 'Age must be between 1 and 120' });
      }
    }

    if (profile.height_cm !== undefined) {
      if (profile.height_cm < 50 || profile.height_cm > 250) {
        errors.push({ field: 'height_cm', message: 'Height must be between 50 and 250 cm' });
      }
    }

    if (profile.weight_kg !== undefined) {
      if (profile.weight_kg < 20 || profile.weight_kg > 300) {
        errors.push({ field: 'weight_kg', message: 'Weight must be between 20 and 300 kg' });
      }
    }

    if (profile.sleep_hours !== undefined) {
      if (profile.sleep_hours < 0 || profile.sleep_hours > 24) {
        errors.push({ field: 'sleep_hours', message: 'Sleep hours must be between 0 and 24' });
      }
    }

    // Validate enums
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    if (profile.gender && !validGenders.includes(profile.gender)) {
      errors.push({ field: 'gender', message: 'Invalid gender value' });
    }

    const validDietPreferences = ['VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'];
    if (profile.diet_preference && !validDietPreferences.includes(profile.diet_preference)) {
      errors.push({ field: 'diet_preference', message: 'Invalid diet preference' });
    }

    const validActivityLevels = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'];
    if (profile.activity_level && !validActivityLevels.includes(profile.activity_level)) {
      errors.push({ field: 'activity_level', message: 'Invalid activity level' });
    }

    const validStressLevels = ['LOW', 'MODERATE', 'HIGH'];
    if (profile.stress_level && !validStressLevels.includes(profile.stress_level)) {
      errors.push({ field: 'stress_level', message: 'Invalid stress level' });
    }

    return errors;
  }

  /**
   * Save health profile
   */
  async saveHealthProfile(profile: HealthProfile): Promise<HealthProfile> {
    // Validate profile
    const errors = this.validateHealthProfile(profile);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Check if profile exists
    const existing = await query<any[]>(
      'SELECT user_id FROM health_profile WHERE user_id = ?',
      [profile.user_id]
    );

    if (existing.length === 0) {
      // Insert new profile
      await query(
        `INSERT INTO health_profile
         (user_id, age, gender, height_cm, weight_kg, diet_preference, activity_level, sleep_hours, sleep_quality,
          stress_level, energy_levels, medical_conditions, allergies, smoking_status, alcohol_consumption,
          water_intake_daily, joint_pain, back_pain, neck_pain, pain_details, chronic_conditions, medications,
          injuries, dietary_restrictions, food_dislikes, meal_frequency, exercise_limitations, health_goals,
          family_history, digestive_issues)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.user_id,
          profile.age,
          profile.gender,
          profile.height_cm,
          profile.weight_kg,
          profile.diet_preference,
          profile.activity_level || 'SEDENTARY',
          profile.sleep_hours || 7.0,
          profile.sleep_quality || 'FAIR',
          profile.stress_level || 'MODERATE',
          profile.energy_levels || 'MODERATE',
          profile.medical_conditions || null,
          profile.allergies || null,
          profile.smoking_status || 'NON_SMOKER',
          profile.alcohol_consumption || 'NONE',
          profile.water_intake_daily || null,
          profile.joint_pain || false,
          profile.back_pain || false,
          profile.neck_pain || false,
          profile.pain_details || null,
          profile.chronic_conditions || null,
          profile.medications || null,
          profile.injuries || null,
          profile.dietary_restrictions || null,
          profile.food_dislikes || null,
          profile.meal_frequency || 3,
          profile.exercise_limitations || null,
          profile.health_goals || null,
          profile.family_history || null,
          profile.digestive_issues || null,
        ]
      );
    } else {
      // Update existing profile
      await query(
        `UPDATE health_profile
         SET age = ?, gender = ?, height_cm = ?, weight_kg = ?, diet_preference = ?,
             activity_level = ?, sleep_hours = ?, sleep_quality = ?, stress_level = ?, energy_levels = ?,
             medical_conditions = ?, allergies = ?, smoking_status = ?, alcohol_consumption = ?,
             water_intake_daily = ?, joint_pain = ?, back_pain = ?, neck_pain = ?, pain_details = ?,
             chronic_conditions = ?, medications = ?, injuries = ?, dietary_restrictions = ?,
             food_dislikes = ?, meal_frequency = ?, exercise_limitations = ?, health_goals = ?,
             family_history = ?, digestive_issues = ?
         WHERE user_id = ?`,
        [
          profile.age,
          profile.gender,
          profile.height_cm,
          profile.weight_kg,
          profile.diet_preference,
          profile.activity_level || 'SEDENTARY',
          profile.sleep_hours || 7.0,
          profile.sleep_quality || 'FAIR',
          profile.stress_level || 'MODERATE',
          profile.energy_levels || 'MODERATE',
          profile.medical_conditions || null,
          profile.allergies || null,
          profile.smoking_status || 'NON_SMOKER',
          profile.alcohol_consumption || 'NONE',
          profile.water_intake_daily || null,
          profile.joint_pain || false,
          profile.back_pain || false,
          profile.neck_pain || false,
          profile.pain_details || null,
          profile.chronic_conditions || null,
          profile.medications || null,
          profile.injuries || null,
          profile.dietary_restrictions || null,
          profile.food_dislikes || null,
          profile.meal_frequency || 3,
          profile.exercise_limitations || null,
          profile.health_goals || null,
          profile.family_history || null,
          profile.digestive_issues || null,
          profile.user_id,
        ]
      );
    }

    // Update user progress
    await query(
      'UPDATE user_progress SET profile_completed = TRUE, points = points + 20 WHERE user_id = ? AND profile_completed = FALSE',
      [profile.user_id]
    );

    // Add badge if not already awarded
    await this.addBadgeIfNotExists(profile.user_id, 'Health Profile Created');

    return profile;
  }

  /**
   * Get health profile
   */
  async getHealthProfile(userId: number): Promise<HealthProfile | null> {
    const profiles = await query<HealthProfile[]>(
      'SELECT * FROM health_profile WHERE user_id = ?',
      [userId]
    );

    return profiles.length > 0 ? profiles[0] : null;
  }

  /**
   * Calculate BMI
   */
  async calculateBMI(userId: number): Promise<BMIResult> {
    // Get health profile
    const profile = await this.getHealthProfile(userId);

    if (!profile) {
      throw new Error('Health profile not found');
    }

    // Calculate BMI: weight(kg) / (height(m))^2
    const heightInMeters = profile.height_cm / 100;
    const bmiValue = profile.weight_kg / (heightInMeters * heightInMeters);
    const bmiRounded = Math.round(bmiValue * 100) / 100;

    // Classify BMI
    let category: string;
    let interpretation: string;

    if (bmiRounded < 18.5) {
      category = 'UNDERWEIGHT';
      interpretation = 'Your BMI indicates you are underweight. Consider consulting with a nutritionist to develop a healthy weight gain plan.';
    } else if (bmiRounded < 25) {
      category = 'NORMAL';
      interpretation = 'Your BMI is in the normal range. Maintain your healthy lifestyle with balanced nutrition and regular exercise.';
    } else if (bmiRounded < 30) {
      category = 'OVERWEIGHT';
      interpretation = 'Your BMI indicates you are overweight. A balanced diet and increased physical activity can help you reach a healthier weight.';
    } else {
      category = 'OBESE';
      interpretation = 'Your BMI indicates obesity. We recommend consulting with a healthcare professional for a comprehensive weight management plan.';
    }

    // Store BMI record
    await query(
      'INSERT INTO bmi_records (user_id, bmi_value, category) VALUES (?, ?, ?)',
      [userId, bmiRounded, category]
    );

    // Update user progress
    await query(
      'UPDATE user_progress SET bmi_calculated = TRUE, points = points + 30 WHERE user_id = ? AND bmi_calculated = FALSE',
      [userId]
    );

    // Add badge if not already awarded
    await this.addBadgeIfNotExists(userId, 'Health Baseline Ready');

    return {
      bmi_value: bmiRounded,
      category,
      interpretation,
    };
  }

  /**
   * Get BMI history
   */
  async getBMIHistory(userId: number): Promise<any[]> {
    const records = await query<any[]>(
      'SELECT bmi_value, category, calculated_at FROM bmi_records WHERE user_id = ? ORDER BY calculated_at DESC',
      [userId]
    );

    return records;
  }

  /**
   * Add badge if not already exists
   */
  private async addBadgeIfNotExists(userId: number, badge: string): Promise<void> {
    const progress = await query<any[]>(
      'SELECT badges FROM user_progress WHERE user_id = ?',
      [userId]
    );

    if (progress.length > 0) {
      const badges = JSON.parse(progress[0].badges || '[]');

      if (!badges.includes(badge)) {
        badges.push(badge);
        await query(
          'UPDATE user_progress SET badges = ? WHERE user_id = ?',
          [JSON.stringify(badges), userId]
        );
      }
    }
  }
}

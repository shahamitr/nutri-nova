import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { HealthService } from '../services/HealthService';
import { query } from '../db/connection';

describe('HealthService - Property-Based Tests', () => {
  const healthService = new HealthService();
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const result = await query<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      ['Test User', `test-health-${Date.now()}@example.com`, 'hash', 'secret']
    );
    testUserId = result.insertId;

    // Initialize user progress
    await query(
      'INSERT INTO user_progress (user_id) VALUES (?)',
      [testUserId]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM bmi_records WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM health_profile WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM user_progress WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  /**
   * Property 8: Health Profile Required Fields Validation
   * Validates: Requirements 4.1
   */
  it('Property 8: should reject profiles missing mandatory fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          age: fc.option(fc.integer({ min: 1, max: 120 }), { nil: undefined }),
          gender: fc.option(fc.constantFrom('MALE', 'FEMALE', 'OTHER'), { nil: undefined }),
          height_cm: fc.option(fc.integer({ min: 50, max: 250 }), { nil: undefined }),
          weight_kg: fc.option(fc.integer({ min: 20, max: 300 }), { nil: undefined }),
          diet_preference: fc.option(
            fc.constantFrom('VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'),
            { nil: undefined }
          ),
        }),
        (profile) => {
          const errors = healthService.validateHealthProfile(profile);

          // If any required field is missing, there should be validation errors
          const hasAllRequired =
            profile.age !== undefined &&
            profile.gender !== undefined &&
            profile.height_cm !== undefined &&
            profile.weight_kg !== undefined &&
            profile.diet_preference !== undefined;

          if (!hasAllRequired) {
            expect(errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Diet Preference Enumeration Validation
   * Validates: Requirements 4.3
   */
  it('Property 9: should only accept valid diet preference enum values', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (dietPreference) => {
          const validValues = ['VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'];
          const profile = {
            age: 30,
            gender: 'MALE',
            height_cm: 175,
            weight_kg: 70,
            diet_preference: dietPreference,
          };

          const errors = healthService.validateHealthProfile(profile);

          if (validValues.includes(dietPreference)) {
            // Valid diet preference should not produce diet_preference error
            const dietErrors = errors.filter((e) => e.field === 'diet_preference');
            expect(dietErrors.length).toBe(0);
          } else {
            // Invalid diet preference should produce error
            const dietErrors = errors.filter((e) => e.field === 'diet_preference');
            expect(dietErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Numeric Input Range Validation
   * Validates: Requirements 4.7
   */
  it('Property 10: should reject out-of-range numeric values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 500 }),
        fc.integer({ min: -100, max: 500 }),
        fc.integer({ min: -100, max: 500 }),
        (age, height, weight) => {
          const profile = {
            age,
            gender: 'MALE',
            height_cm: height,
            weight_kg: weight,
            diet_preference: 'VEGETARIAN',
          };

          const errors = healthService.validateHealthProfile(profile);

          // Age must be 1-120
          if (age < 1 || age > 120) {
            const ageErrors = errors.filter((e) => e.field === 'age');
            expect(ageErrors.length).toBeGreaterThan(0);
          }

          // Height must be 50-250
          if (height < 50 || height > 250) {
            const heightErrors = errors.filter((e) => e.field === 'height_cm');
            expect(heightErrors.length).toBeGreaterThan(0);
          }

          // Weight must be 20-300
          if (weight < 20 || weight > 300) {
            const weightErrors = errors.filter((e) => e.field === 'weight_kg');
            expect(weightErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Health Profile Data Persistence Round-Trip
   * Validates: Requirements 4.8
   */
  it('Property 11: should persist and retrieve equivalent health profile data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          age: fc.integer({ min: 1, max: 120 }),
          gender: fc.constantFrom('MALE', 'FEMALE', 'OTHER'),
          height_cm: fc.integer({ min: 50, max: 250 }),
          weight_kg: fc.integer({ min: 20, max: 300 }),
          diet_preference: fc.constantFrom('VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'),
          activity_level: fc.constantFrom('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'),
          sleep_hours: fc.float({ min: 0, max: 24, noNaN: true }),
          stress_level: fc.constantFrom('LOW', 'MODERATE', 'HIGH'),
        }),
        async (profileData) => {
          const profile = {
            user_id: testUserId,
            ...profileData,
          };

          // Save profile
          await healthService.saveHealthProfile(profile);

          // Retrieve profile
          const retrieved = await healthService.getHealthProfile(testUserId);

          // Verify equivalence
          expect(retrieved).not.toBeNull();
          expect(retrieved!.age).toBe(profile.age);
          expect(retrieved!.gender).toBe(profile.gender);
          expect(Number(retrieved!.height_cm)).toBe(profile.height_cm);
          expect(Number(retrieved!.weight_kg)).toBe(profile.weight_kg);
          expect(retrieved!.diet_preference).toBe(profile.diet_preference);
          expect(retrieved!.activity_level).toBe(profile.activity_level);

          // Sleep hours: if input was 0, service uses default 7.0
          const expectedSleepHours = profile.sleep_hours || 7.0;
          expect(Math.abs(Number(retrieved!.sleep_hours) - expectedSleepHours)).toBeLessThan(0.1);

          expect(retrieved!.stress_level).toBe(profile.stress_level);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 12: BMI Calculation Correctness
   * Validates: Requirements 5.1
   */
  it('Property 12: should calculate BMI = weight / (height²) within 0.01 precision', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 250 }),
        fc.integer({ min: 20, max: 300 }),
        async (height_cm, weight_kg) => {
          // Save profile first
          const profile = {
            user_id: testUserId,
            age: 30,
            gender: 'MALE',
            height_cm,
            weight_kg,
            diet_preference: 'VEGETARIAN',
            activity_level: 'MODERATE',
            sleep_hours: 7,
            stress_level: 'MODERATE',
          };

          await healthService.saveHealthProfile(profile);

          // Calculate BMI
          const result = await healthService.calculateBMI(testUserId);

          // Expected BMI
          const heightInMeters = height_cm / 100;
          const expectedBMI = weight_kg / (heightInMeters * heightInMeters);

          // Verify within 0.01 precision
          expect(Math.abs(result.bmi_value - expectedBMI)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 13: BMI Category Classification
   * Validates: Requirements 5.2
   */
  it('Property 13: should correctly classify BMI into categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 10, max: 50, noNaN: true }),
        async (bmiValue) => {
          // Calculate height and weight that produce this BMI
          const height_cm = 170;
          const heightInMeters = height_cm / 100;
          const weight_kg = Math.round(bmiValue * heightInMeters * heightInMeters);

          // Skip if weight is out of valid range
          if (weight_kg < 20 || weight_kg > 300) {
            return;
          }

          // Save profile
          const profile = {
            user_id: testUserId,
            age: 30,
            gender: 'MALE',
            height_cm,
            weight_kg,
            diet_preference: 'VEGETARIAN',
            activity_level: 'MODERATE',
            sleep_hours: 7,
            stress_level: 'MODERATE',
          };

          await healthService.saveHealthProfile(profile);

          // Calculate BMI
          const result = await healthService.calculateBMI(testUserId);

          // Verify category
          if (result.bmi_value < 18.5) {
            expect(result.category).toBe('UNDERWEIGHT');
          } else if (result.bmi_value < 25) {
            expect(result.category).toBe('NORMAL');
          } else if (result.bmi_value < 30) {
            expect(result.category).toBe('OVERWEIGHT');
          } else {
            expect(result.category).toBe('OBESE');
          }

          // Verify interpretation exists
          expect(result.interpretation).toBeTruthy();
          expect(result.interpretation.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14: BMI Record Persistence with Timestamp
   * Validates: Requirements 5.5
   */
  it('Property 14: should store BMI record with valid timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 250 }),
        fc.integer({ min: 20, max: 300 }),
        async (height_cm, weight_kg) => {
          // Save profile
          const profile = {
            user_id: testUserId,
            age: 30,
            gender: 'MALE',
            height_cm,
            weight_kg,
            diet_preference: 'VEGETARIAN',
            activity_level: 'MODERATE',
            sleep_hours: 7,
            stress_level: 'MODERATE',
          };

          await healthService.saveHealthProfile(profile);

          // Record time before calculation (with timezone buffer)
          const beforeTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours before

          // Calculate BMI
          await healthService.calculateBMI(testUserId);

          // Record time after calculation (with timezone buffer)
          const afterTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours after

          // Get BMI history
          const history = await healthService.getBMIHistory(testUserId);

          // Verify record exists
          expect(history.length).toBeGreaterThan(0);

          // Get most recent record
          const latestRecord = history[0];

          // Verify timestamp exists and is a valid date
          expect(latestRecord.calculated_at).toBeDefined();
          const recordTime = new Date(latestRecord.calculated_at);
          expect(recordTime.toString()).not.toBe('Invalid Date');

          // Verify timestamp is within reasonable range (accounting for timezone differences)
          expect(recordTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          expect(recordTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        }
      ),
      { numRuns: 10 }
    );
  });
});

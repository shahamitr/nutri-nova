import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { HealthService } from '../../services/HealthService';
import { query } from '../../db/connection';

describe('HealthService - Property-Based Tests', () => {
  const healthService = new HealthService();
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user
    const result = await query<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      ['Test User', 'test.health.properties@example.com', 'hash', 'secret']
    );
    testUserId = result.insertId;
  });

  afterEach(async () => {
    // Clean up test data
    await query('DELETE FROM bmi_records WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM health_profile WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM user_progress WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  /**
   * Property 8: Health Profile Required Fields Validation
   * Validates: Requirements 4.1
   * Verify rejection when mandatory fields missing
   */
  describe('Property 8: Health Profile Required Fields Validation', () => {
    it('should reject profiles missing required fields', async () => {
      const requiredFields = ['age', 'gender', 'height_cm', 'weight_kg', 'diet_preference'];

      for (const missingField of requiredFields) {
        const profile: any = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: 70,
          diet_preference: 'VEGETARIAN',
        };

        delete profile[missingField];

        await expect(
          healthService.saveHealthProfile(profile)
        ).rejects.toThrow();
      }
    });

    it('should accept profiles with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 120 }),
          fc.constantFrom('MALE', 'FEMALE', 'OTHER'),
          fc.integer({ min: 50, max: 250 }),
          fc.integer({ min: 20, max: 300 }),
          fc.constantFrom('VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'),
          async (age, gender, height, weight, dietPref) => {
            const profile = {
              user_id: testUserId,
              age,
              gender,
              height_cm: height,
              weight_kg: weight,
              diet_preference: dietPref,
            };

            const saved = await healthService.saveHealthProfile(profile);
            expect(saved).toBeDefined();
            expect(saved.age).toBe(age);
            expect(saved.gender).toBe(gender);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 9: Diet Preference Enumeration Validation
   * Validates: Requirements 4.3
   * Verify only valid enum values accepted
   */
  describe('Property 9: Diet Preference Enumeration Validation', () => {
    it('should reject invalid diet preferences', async () => {
      const invalidPreferences = ['VEGAN', 'PESCATARIAN', 'KETO', 'PALEO', 'INVALID', ''];

      for (const pref of invalidPreferences) {
        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: 70,
          diet_preference: pref,
        };

        await expect(
          healthService.saveHealthProfile(profile)
        ).rejects.toThrow();
      }
    });

    it('should accept all valid diet preferences', async () => {
      const validPreferences = ['VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'];

      for (const pref of validPreferences) {
        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: 70,
          diet_preference: pref,
        };

        const saved = await healthService.saveHealthProfile(profile);
        expect(saved.diet_preference).toBe(pref);
      }
    });
  });

  /**
   * Property 10: Numeric Input Range Validation
   * Validates: Requirements 4.7
   * Verify rejection of out-of-range values
   */
  describe('Property 10: Numeric Input Range Validation', () => {
    it('should reject age outside valid range', async () => {
      const invalidAges = [0, -1, 121, 150, 1000];

      for (const age of invalidAges) {
        const profile = {
          user_id: testUserId,
          age,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: 70,
          diet_preference: 'VEGETARIAN',
        };

        await expect(
          healthService.saveHealthProfile(profile)
        ).rejects.toThrow(/age|range|1-120/i);
      }
    });

    it('should reject height outside valid range', async () => {
      const invalidHeights = [0, 49, 251, 300, 1000];

      for (const height of invalidHeights) {
        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: height,
          weight_kg: 70,
          diet_preference: 'VEGETARIAN',
        };

        await expect(
          healthService.saveHealthProfile(profile)
        ).rejects.toThrow(/height|range|50-250/i);
      }
    });

    it('should reject weight outside valid range', async () => {
      const invalidWeights = [0, 19, 301, 500, 1000];

      for (const weight of invalidWeights) {
        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: weight,
          diet_preference: 'VEGETARIAN',
        };

        await expect(
          healthService.saveHealthProfile(profile)
        ).rejects.toThrow(/weight|range|20-300/i);
      }
    });

    it('should accept all values within valid ranges', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 120 }),
          fc.integer({ min: 50, max: 250 }),
          fc.integer({ min: 20, max: 300 }),
          async (age, height, weight) => {
            const profile = {
              user_id: testUserId,
              age,
              gender: 'MALE',
              height_cm: height,
              weight_kg: weight,
              diet_preference: 'VEGETARIAN',
            };

            const saved = await healthService.saveHealthProfile(profile);
            expect(saved.age).toBe(age);
            expect(saved.height_cm).toBe(height);
            expect(saved.weight_kg).toBe(weight);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 11: Health Profile Data Persistence Round-Trip
   * Validates: Requirements 4.8
   * Verify save and retrieve produce equivalent data
   */
  describe('Property 11: Health Profile Data Persistence Round-Trip', () => {
    it('should persist and retrieve health profiles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 120 }),
          fc.constantFrom('MALE', 'FEMALE', 'OTHER'),
          fc.integer({ min: 50, max: 250 }),
          fc.integer({ min: 20, max: 300 }),
          fc.constantFrom('VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'),
          fc.option(fc.constantFrom('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE')),
          fc.option(fc.integer({ min: 4, max: 12 })),
          fc.option(fc.constantFrom('LOW', 'MODERATE', 'HIGH')),
          async (age, gender, height, weight, dietPref, activity, sleep, stress) => {
            const profile: any = {
              user_id: testUserId,
              age,
              gender,
              height_cm: height,
              weight_kg: weight,
              diet_preference: dietPref,
            };

            if (activity) profile.activity_level = activity;
            if (sleep) profile.sleep_hours = sleep;
            if (stress) profile.stress_level = stress;

            // Save profile
            const saved = await healthService.saveHealthProfile(profile);

            // Retrieve profile
            const retrieved = await healthService.getHealthProfile(testUserId);

            // Verify round-trip equivalence
            expect(retrieved).toBeDefined();
            expect(retrieved!.age).toBe(age);
            expect(retrieved!.gender).toBe(gender);
            expect(retrieved!.height_cm).toBe(height);
            expect(retrieved!.weight_kg).toBe(weight);
            expect(retrieved!.diet_preference).toBe(dietPref);

            if (activity) expect(retrieved!.activity_level).toBe(activity);
            if (sleep) expect(retrieved!.sleep_hours).toBe(sleep);
            if (stress) expect(retrieved!.stress_level).toBe(stress);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 12: BMI Calculation Correctness
   * Validates: Requirements 5.1
   * Verify BMI = weight / (height²) within 0.01 precision
   */
  describe('Property 12: BMI Calculation Correctness', () => {
    it('should calculate BMI correctly for all valid inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 250 }),
          fc.integer({ min: 20, max: 300 }),
          async (height, weight) => {
            // Create health profile first
            const profile = {
              user_id: testUserId,
              age: 25,
              gender: 'MALE',
              height_cm: height,
              weight_kg: weight,
              diet_preference: 'VEGETARIAN',
            };

            await healthService.saveHealthProfile(profile);

            // Calculate BMI
            const result = await healthService.calculateBMI(testUserId);

            // Calculate expected BMI
            const heightInMeters = height / 100;
            const expectedBMI = weight / (heightInMeters * heightInMeters);

            // Verify BMI calculation (within 0.01 precision)
            expect(Math.abs(result.bmi - expectedBMI)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: BMI Category Classification
   * Validates: Requirements 5.2
   * Verify correct category for all BMI values
   */
  describe('Property 13: BMI Category Classification', () => {
    it('should classify BMI into correct categories', async () => {
      const testCases = [
        { height: 175, weight: 50, expectedCategory: 'Underweight' },  // BMI ~16.3
        { height: 175, weight: 60, expectedCategory: 'Normal' },       // BMI ~19.6
        { height: 175, weight: 80, expectedCategory: 'Overweight' },   // BMI ~26.1
        { height: 175, weight: 100, expectedCategory: 'Obese' },       // BMI ~32.7
      ];

      for (const testCase of testCases) {
        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: testCase.height,
          weight_kg: testCase.weight,
          diet_preference: 'VEGETARIAN',
        };

        await healthService.saveHealthProfile(profile);
        const result = await healthService.calculateBMI(testUserId);

        expect(result.category).toBe(testCase.expectedCategory);
      }
    });

    it('should classify boundary BMI values correctly', async () => {
      // Test boundary values
      const boundaries = [
        { bmi: 18.4, category: 'Underweight' },
        { bmi: 18.5, category: 'Normal' },
        { bmi: 24.9, category: 'Normal' },
        { bmi: 25.0, category: 'Overweight' },
        { bmi: 29.9, category: 'Overweight' },
        { bmi: 30.0, category: 'Obese' },
      ];

      for (const boundary of boundaries) {
        // Calculate height/weight combination that gives desired BMI
        const height = 175; // cm
        const heightInMeters = height / 100;
        const weight = Math.round(boundary.bmi * heightInMeters * heightInMeters);

        const profile = {
          user_id: testUserId,
          age: 25,
          gender: 'MALE',
          height_cm: height,
          weight_kg: weight,
          diet_preference: 'VEGETARIAN',
        };

        await healthService.saveHealthProfile(profile);
        const result = await healthService.calculateBMI(testUserId);

        expect(result.category).toBe(boundary.category);
      }
    });
  });

  /**
   * Property 14: BMI Record Persistence with Timestamp
   * Validates: Requirements 5.5
   * Verify record stored with valid timestamp
   */
  describe('Property 14: BMI Record Persistence with Timestamp', () => {
    it('should store BMI records with valid timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 250 }),
          fc.integer({ min: 20, max: 300 }),
          async (height, weight) => {
            const profile = {
              user_id: testUserId,
              age: 25,
              gender: 'MALE',
              height_cm: height,
              weight_kg: weight,
              diet_preference: 'VEGETARIAN',
            };

            await healthService.saveHealthProfile(profile);

            const beforeCalculation = new Date();
            const result = await healthService.calculateBMI(testUserId);
            const afterCalculation = new Date();

            // Verify timestamp is within reasonable range
            const calculatedAt = new Date(result.calculated_at);
            expect(calculatedAt.getTime()).toBeGreaterThanOrEqual(beforeCalculation.getTime() - 1000);
            expect(calculatedAt.getTime()).toBeLessThanOrEqual(afterCalculation.getTime() + 1000);

            // Verify record is in database
            const history = await healthService.getBMIHistory(testUserId);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].bmi_value).toBe(result.bmi);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

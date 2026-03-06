import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GamificationService } from '../../services/GamificationService';
import { query } from '../../db/connection';

describe('GamificationService - Property-Based Tests', () => {
  const gamificationService = new GamificationService();
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user
    const result = await query<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      ['Test User', 'test.gamification.properties@example.com', 'hash', 'secret']
    );
    testUserId = result.insertId;

    // Initialize progress
    await gamificationService.initializeProgress(testUserId);
  });

  afterEach(async () => {
    // Clean up test data
    await query('DELETE FROM user_progress WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  /**
   * Property 18: Progress Stage Tracking Completeness
   * Validates: Requirements 7.1
   * Verify all four stages tracked
   */
  describe('Property 18: Progress Stage Tracking Completeness', () => {
    it('should track all four progress stages', async () => {
      const progress = await gamificationService.getProgress(testUserId);

      // Verify all four stages exist
      expect(progress).toHaveProperty('profile_completed');
      expect(progress).toHaveProperty('bmi_calculated');
      expect(progress).toHaveProperty('routine_completed');
      expect(progress).toHaveProperty('diet_generated');

      // Verify initial state (all false)
      expect(progress.profile_completed).toBe(false);
      expect(progress.bmi_calculated).toBe(false);
      expect(progress.routine_completed).toBe(false);
      expect(progress.diet_generated).toBe(false);

      // Verify points and badges initialized
      expect(progress.points).toBe(0);
      expect(Array.isArray(progress.badges)).toBe(true);
      expect(progress.badges.length).toBe(0);
    });

    it('should update each stage independently', async () => {
      const stages = ['profile', 'bmi', 'routine', 'diet'];

      for (const stage of stages) {
        await gamificationService.updateProgress(testUserId, stage);

        const progress = await gamificationService.getProgress(testUserId);

        // Verify the specific stage is completed
        switch (stage) {
          case 'profile':
            expect(progress.profile_completed).toBe(true);
            break;
          case 'bmi':
            expect(progress.bmi_calculated).toBe(true);
            break;
          case 'routine':
            expect(progress.routine_completed).toBe(true);
            break;
          case 'diet':
            expect(progress.diet_generated).toBe(true);
            break;
        }
      }
    });
  });

  /**
   * Property 19: Progress Completion Percentage Calculation
   * Validates: Requirements 7.6
   * Verify percentage = (completed stages / 4) × 100
   */
  describe('Property 19: Progress Completion Percentage Calculation', () => {
    it('should calculate completion percentage correctly', async () => {
      const stages = ['profile', 'bmi', 'routine', 'diet'];

      for (let i = 0; i < stages.length; i++) {
        await gamificationService.updateProgress(testUserId, stages[i]);

        const progress = await gamificationService.getProgress(testUserId);
        const expectedPercentage = ((i + 1) / 4) * 100;

        expect(progress.completion_percentage).toBe(expectedPercentage);
      }
    });

    it('should calculate 0% for no completed stages', async () => {
      const progress = await gamificationService.getProgress(testUserId);
      expect(progress.completion_percentage).toBe(0);
    });

    it('should calculate 100% for all completed stages', async () => {
      const stages = ['profile', 'bmi', 'routine', 'diet'];

      for (const stage of stages) {
        await gamificationService.updateProgress(testUserId, stage);
      }

      const progress = await gamificationService.getProgress(testUserId);
      expect(progress.completion_percentage).toBe(100);
    });

    it('should handle partial completion correctly', async () => {
      // Test all possible combinations
      const testCases = [
        { stages: ['profile'], expected: 25 },
        { stages: ['profile', 'bmi'], expected: 50 },
        { stages: ['profile', 'bmi', 'routine'], expected: 75 },
        { stages: ['bmi', 'diet'], expected: 50 },
        { stages: ['profile', 'routine', 'diet'], expected: 75 },
      ];

      for (const testCase of testCases) {
        // Reset progress
        await query('DELETE FROM user_progress WHERE user_id = ?', [testUserId]);
        await gamificationService.initializeProgress(testUserId);

        // Update specified stages
        for (const stage of testCase.stages) {
          await gamificationService.updateProgress(testUserId, stage);
        }

        const progress = await gamificationService.getProgress(testUserId);
        expect(progress.completion_percentage).toBe(testCase.expected);
      }
    });
  });

  /**
   * Property 20: Progress Data Persistence Round-Trip
   * Validates: Requirements 7.7
   * Verify save and retrieve produce equivalent progress
   */
  describe('Property 20: Progress Data Persistence Round-Trip', () => {
    it('should persist and retrieve progress correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom('profile', 'bmi', 'routine', 'diet'), { minLength: 0, maxLength: 4 }).map(arr => [...new Set(arr)]),
          async (stagesToComplete) => {
            // Reset progress
            await query('DELETE FROM user_progress WHERE user_id = ?', [testUserId]);
            await gamificationService.initializeProgress(testUserId);

            // Complete specified stages
            for (const stage of stagesToComplete) {
              await gamificationService.updateProgress(testUserId, stage);
            }

            // Retrieve progress
            const progress = await gamificationService.getProgress(testUserId);

            // Verify stage completion matches
            expect(progress.profile_completed).toBe(stagesToComplete.includes('profile'));
            expect(progress.bmi_calculated).toBe(stagesToComplete.includes('bmi'));
            expect(progress.routine_completed).toBe(stagesToComplete.includes('routine'));
            expect(progress.diet_generated).toBe(stagesToComplete.includes('diet'));

            // Verify points and badges
            expect(progress.points).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(progress.badges)).toBe(true);
            expect(progress.badges.length).toBe(stagesToComplete.length);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional Property: Points Award Consistency
   * Verify correct points awarded for each stage
   */
  describe('Additional Property: Points Award Consistency', () => {
    it('should award correct points for each stage', async () => {
      const stagePoints = {
        profile: 20,
        bmi: 30,
        routine: 30,
        diet: 50,
      };

      let totalPoints = 0;

      for (const [stage, points] of Object.entries(stagePoints)) {
        await gamificationService.updateProgress(testUserId, stage);
        totalPoints += points;

        const progress = await gamificationService.getProgress(testUserId);
        expect(progress.points).toBe(totalPoints);
      }
    });

    it('should not award duplicate points for same stage', async () => {
      await gamificationService.updateProgress(testUserId, 'profile');
      const progress1 = await gamificationService.getProgress(testUserId);
      const points1 = progress1.points;

      // Update same stage again
      await gamificationService.updateProgress(testUserId, 'profile');
      const progress2 = await gamificationService.getProgress(testUserId);

      // Points should not increase
      expect(progress2.points).toBe(points1);
    });
  });

  /**
   * Additional Property: Badge Award Consistency
   * Verify correct badges awarded for each stage
   */
  describe('Additional Property: Badge Award Consistency', () => {
    it('should award correct badges for each stage', async () => {
      const stageBadges = {
        profile: 'Health Profile Created',
        bmi: 'Health Baseline Ready',
        routine: 'Routine Established',
        diet: 'Personalized Diet Ready',
      };

      for (const [stage, badge] of Object.entries(stageBadges)) {
        await gamificationService.updateProgress(testUserId, stage);

        const progress = await gamificationService.getProgress(testUserId);
        expect(progress.badges).toContain(badge);
      }
    });

    it('should not award duplicate badges for same stage', async () => {
      await gamificationService.updateProgress(testUserId, 'profile');
      const progress1 = await gamificationService.getProgress(testUserId);
      const badgeCount1 = progress1.badges.length;

      // Update same stage again
      await gamificationService.updateProgress(testUserId, 'profile');
      const progress2 = await gamificationService.getProgress(testUserId);

      // Badge count should not increase
      expect(progress2.badges.length).toBe(badgeCount1);
    });
  });
});

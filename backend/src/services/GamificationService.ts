import { query } from '../db/connection';

interface UserProgress {
  user_id: number;
  profile_completed: boolean;
  bmi_calculated: boolean;
  routine_completed: boolean;
  diet_generated: boolean;
  points: number;
  badges: string[];
  completion_percentage: number;
}

type ProgressStage = 'profile' | 'bmi' | 'routine' | 'diet';

export class GamificationService {
  /**
   * Initialize progress for a new user
   */
  async initializeProgress(userId: number): Promise<void> {
    await query(
      `INSERT INTO user_progress
       (user_id, profile_completed, bmi_calculated, routine_completed, diet_generated, points, badges)
       VALUES (?, FALSE, FALSE, FALSE, FALSE, 0, '[]')`,
      [userId]
    );
  }

  /**
   * Update progress for a specific stage
   */
  async updateProgress(userId: number, stage: ProgressStage): Promise<void> {
    const stagePoints: Record<ProgressStage, number> = {
      profile: 20,
      bmi: 30,
      routine: 30,
      diet: 50,
    };

    const stageBadges: Record<ProgressStage, string> = {
      profile: 'Health Profile Created',
      bmi: 'Health Baseline Ready',
      routine: 'Routine Established',
      diet: 'Personalized Diet Ready',
    };

    const points = stagePoints[stage];
    const badge = stageBadges[stage];

    // Update stage completion and points
    const stageColumn = `${stage}_${stage === 'profile' ? 'completed' : stage === 'bmi' ? 'calculated' : stage === 'routine' ? 'completed' : 'generated'}`;

    // Map stage to column name
    let columnName: string;
    if (stage === 'profile') {
      columnName = 'profile_completed';
    } else if (stage === 'bmi') {
      columnName = 'bmi_calculated';
    } else if (stage === 'routine') {
      columnName = 'routine_completed';
    } else {
      columnName = 'diet_generated';
    }

    // Update progress only if not already completed
    await query(
      `UPDATE user_progress
       SET ${columnName} = TRUE, points = points + ?
       WHERE user_id = ? AND ${columnName} = FALSE`,
      [points, userId]
    );

    // Add badge if not already exists
    await this.addBadgeIfNotExists(userId, badge);
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(progress: UserProgress): number {
    let completedStages = 0;
    const totalStages = 4;

    if (progress.profile_completed) completedStages++;
    if (progress.bmi_calculated) completedStages++;
    if (progress.routine_completed) completedStages++;
    if (progress.diet_generated) completedStages++;

    return Math.round((completedStages / totalStages) * 100);
  }

  /**
   * Get user progress
   */
  async getProgress(userId: number): Promise<UserProgress> {
    const results = await query<any[]>(
      'SELECT * FROM user_progress WHERE user_id = ?',
      [userId]
    );

    if (results.length === 0) {
      throw new Error('Progress not found');
    }

    const progress = results[0];
    const badges = JSON.parse(progress.badges || '[]');

    const userProgress: UserProgress = {
      user_id: progress.user_id,
      profile_completed: Boolean(progress.profile_completed),
      bmi_calculated: Boolean(progress.bmi_calculated),
      routine_completed: Boolean(progress.routine_completed),
      diet_generated: Boolean(progress.diet_generated),
      points: progress.points,
      badges,
      completion_percentage: 0,
    };

    // Calculate completion percentage
    userProgress.completion_percentage = this.calculateCompletionPercentage(userProgress);

    return userProgress;
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

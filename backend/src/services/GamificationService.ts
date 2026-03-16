import { db } from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: Date;
  achievement?: Achievement;
}

interface Activity {
  id: number;
  user_id: number;
  activity_type: string;
  points_earned: number;
  activity_date: Date;
  metadata?: any;
}

interface UserStats {
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  achievements_count: number;
  next_level_points: number;
  progress_to_next_level: number;
}

interface LeaderboardEntry {
  user_id: number;
  name: string;
  points: number;
  level: number;
  rank: number;
}

export class GamificationService {
  // Points for different activities
  private readonly ACTIVITY_POINTS = {
    meal_logged: 10,
    workout_completed: 20,
    water_logged: 5,
    video_watched: 5,
    diet_plan_created: 50,
    health_assessment: 50,
    report_generated: 30,
    goal_updated: 15,
  };

  // Level thresholds (points needed for each level)
  private readonly LEVEL_THRESHOLDS = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    2000,   // Level 6
    3500,   // Level 7
    5500,   // Level 8
    8000,   // Level 9
    11000,  // Level 10
    15000,  // Level 11
    20000,  // Level 12
    26000,  // Level 13
    33000,  // Level 14
    41000,  // Level 15
    50000,  // Level 16+
  ];

  /**
   * Log an activity and award points
   */
  async logActivity(
    userId: number,
    activityType: string,
    metadata?: any
  ): Promise<{ points_earned: number; level_up: boolean; new_level?: number }> {
    const points = this.ACTIVITY_POINTS[activityType as keyof typeof this.ACTIVITY_POINTS] || 0;
    const today = new Date().toISOString().split('T')[0];

    // Insert activity
    await db.execute(
      `INSERT INTO daily_activities (user_id, activity_type, points_earned, activity_date, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, activityType, points, today, JSON.stringify(metadata || {})]
    );

    // Update user points and check for level up
    const [userRows] = await db.execute<RowDataPacket[]>(
      `SELECT points, level FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error('User not found');
    }

    const currentPoints = userRows[0].points;
    const currentLevel = userRows[0].level;
    const newPoints = currentPoints + points;
    const newLevel = this.calculateLevel(newPoints);
    const levelUp = newLevel > currentLevel;

    // Update user
    await db.execute(
      `UPDATE users
       SET points = ?,
           level = ?,
           total_activities = total_activities + 1,
           last_activity_date = CURDATE()
       WHERE id = ?`,
      [newPoints, newLevel, userId]
    );

    // Update streak
    await this.updateStreak(userId);

    // Check for new achievements
    await this.checkAchievements(userId);

    return {
      points_earned: points,
      level_up: levelUp,
      new_level: levelUp ? newLevel : undefined,
    };
  }

  /**
   * Calculate level based on points
   */
  private calculateLevel(points: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get points needed for next level
   */
  private getNextLevelPoints(currentLevel: number): number {
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1] +
             (currentLevel - this.LEVEL_THRESHOLDS.length + 1) * 10000;
    }
    return this.LEVEL_THRESHOLDS[currentLevel];
  }

  /**
   * Update user's streak
   */
  private async updateStreak(userId: number): Promise<void> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT last_activity_date, current_streak, longest_streak FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) return;

    const lastActivityDate = rows[0].last_activity_date;
    const currentStreak = rows[0].current_streak;
    const longestStreak = rows[0].longest_streak;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = currentStreak;

    if (!lastActivityDate) {
      // First activity
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActivityDate);
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        return;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(newStreak, longestStreak);

    await db.execute(
      `UPDATE users
       SET current_streak = ?,
           longest_streak = ?
       WHERE id = ?`,
      [newStreak, newLongestStreak, userId]
    );
  }

  /**
   * Check and award achievements
   */
  private async checkAchievements(userId: number): Promise<void> {
    // Get all achievements
    const [achievements] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM achievements`
    );

    // Get user's current achievements
    const [userAchievements] = await db.execute<RowDataPacket[]>(
      `SELECT achievement_id FROM user_achievements WHERE user_id = ?`,
      [userId]
    );

    const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    // Get user stats
    const [userRows] = await db.execute<RowDataPacket[]>(
      `SELECT current_streak FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) return;

    const currentStreak = userRows[0].current_streak;

    // Check each achievement
    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let earned = false;

      switch (achievement.requirement_type) {
        case 'streak_days':
          earned = currentStreak >= achievement.requirement_value;
          break;

        case 'meals_logged':
          const [mealRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM daily_activities
             WHERE user_id = ? AND activity_type = 'meal_logged'`,
            [userId]
          );
          earned = mealRows[0].count >= achievement.requirement_value;
          break;

        case 'workouts_completed':
          const [workoutRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM daily_activities
             WHERE user_id = ? AND activity_type = 'workout_completed'`,
            [userId]
          );
          earned = workoutRows[0].count >= achievement.requirement_value;
          break;

        case 'videos_watched':
          const [videoRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM daily_activities
             WHERE user_id = ? AND activity_type = 'video_watched'`,
            [userId]
          );
          earned = videoRows[0].count >= achievement.requirement_value;
          break;

        case 'assessment_completed':
          const [assessmentRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM health_profile WHERE user_id = ?`,
            [userId]
          );
          earned = assessmentRows[0].count >= achievement.requirement_value;
          break;
      }

      if (earned) {
        await this.awardAchievement(userId, achievement.id, achievement.points);
      }
    }
  }

  /**
   * Award an achievement to a user
   */
  private async awardAchievement(
    userId: number,
    achievementId: number,
    points: number
  ): Promise<void> {
    try {
      // Insert achievement
      await db.execute(
        `INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
        [userId, achievementId]
      );

      // Award points
      await db.execute(
        `UPDATE users SET points = points + ? WHERE id = ?`,
        [points, userId]
      );
    } catch (error) {
      // Ignore duplicate key errors (achievement already earned)
      if ((error as any).code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<UserStats> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT points, level, current_streak, longest_streak, total_activities
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const [achievementRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?`,
      [userId]
    );

    const user = rows[0];
    const nextLevelPoints = this.getNextLevelPoints(user.level);
    const currentLevelPoints = user.level > 1 ? this.LEVEL_THRESHOLDS[user.level - 1] : 0;
    const pointsInLevel = user.points - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    const progress = Math.min(100, Math.floor((pointsInLevel / pointsNeeded) * 100));

    return {
      points: user.points,
      level: user.level,
      current_streak: user.current_streak,
      longest_streak: user.longest_streak,
      total_activities: user.total_activities,
      achievements_count: achievementRows[0].count,
      next_level_points: nextLevelPoints,
      progress_to_next_level: progress,
    };
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT ua.*, a.name, a.description, a.icon, a.points, a.category
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY ua.earned_at DESC`,
      [userId]
    );

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      achievement_id: row.achievement_id,
      earned_at: row.earned_at,
      achievement: {
        id: row.achievement_id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        points: row.points,
        category: row.category,
        requirement_type: '',
        requirement_value: 0,
      },
    }));
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM achievements ORDER BY category, points`
    );

    return rows as Achievement[];
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(userId: number, limit: number = 20): Promise<Activity[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM daily_activities
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    })) as Activity[];
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id as user_id, name, points, level
       FROM users
       ORDER BY points DESC, level DESC
       LIMIT ?`,
      [limit]
    );

    return rows.map((row, index) => ({
      user_id: row.user_id,
      name: row.name,
      points: row.points,
      level: row.level,
      rank: index + 1,
    }));
  }

  /**
   * Get activity summary for a date range
   */
  async getActivitySummary(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT activity_type, COUNT(*) as count
       FROM daily_activities
       WHERE user_id = ? AND activity_date BETWEEN ? AND ?
       GROUP BY activity_type`,
      [userId, startDate, endDate]
    );

    const summary: Record<string, number> = {};
    rows.forEach(row => {
      summary[row.activity_type] = row.count;
    });

    return summary;
  }

  /**
   * Get user onboarding progress from user_progress table
   */
  async getProgress(userId: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT profile_completed, bmi_calculated, routine_completed, diet_generated, points, badges
       FROM user_progress WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return {
        profile_completed: false,
        bmi_calculated: false,
        routine_completed: false,
        diet_generated: false,
        points: 0,
        badges: [],
        completion_percentage: 0,
      };
    }

    const row = rows[0];
    const stages = [row.profile_completed, row.bmi_calculated, row.routine_completed, row.diet_generated];
    const completed = stages.filter(Boolean).length;
    const badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []);

    return {
      profile_completed: !!row.profile_completed,
      bmi_calculated: !!row.bmi_calculated,
      routine_completed: !!row.routine_completed,
      diet_generated: !!row.diet_generated,
      points: row.points || 0,
      badges,
      completion_percentage: (completed / 4) * 100,
    };
  }

  /**
   * Update a specific onboarding progress stage
   */
  async updateProgress(userId: number, stage: string) {
    const stageMap: Record<string, string> = {
      profile: 'profile_completed',
      bmi: 'bmi_calculated',
      routine: 'routine_completed',
      diet: 'diet_generated',
    };

    const column = stageMap[stage];
    if (!column) throw new Error(`Invalid stage: ${stage}`);

    const badgeMap: Record<string, string> = {
      profile: 'Profile Pioneer',
      bmi: 'BMI Tracker',
      routine: 'Routine Builder',
      diet: 'Diet Planner',
    };

    const pointsMap: Record<string, number> = {
      profile: 10,
      bmi: 15,
      routine: 20,
      diet: 25,
    };

    // Check if already completed to avoid duplicate points
    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT ${column} as done, badges FROM user_progress WHERE user_id = ?`,
      [userId]
    );

    if (existing.length === 0) {
      // Create row if missing
      await db.execute(
        `INSERT INTO user_progress (user_id) VALUES (?)`,
        [userId]
      );
    }

    const alreadyDone = existing.length > 0 && existing[0].done;
    if (alreadyDone) return;

    const currentBadges = existing.length > 0
      ? (typeof existing[0].badges === 'string' ? JSON.parse(existing[0].badges) : (existing[0].badges || []))
      : [];

    const newBadges = [...currentBadges, badgeMap[stage]];

    await db.execute(
      `UPDATE user_progress SET ${column} = TRUE, points = points + ?, badges = ? WHERE user_id = ?`,
      [pointsMap[stage], JSON.stringify(newBadges), userId]
    );
  }
}

export default new GamificationService();

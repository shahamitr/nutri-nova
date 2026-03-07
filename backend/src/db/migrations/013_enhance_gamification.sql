-- Migration: Enhanced gamification system
-- Adds points, levels, streaks, achievements, and activity tracking

-- Add gamification fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS total_activities INT DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id INT PRI TABLE IF NOT EXISTS user_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user_earned (user_id, earned_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create daily activities table
CREATE TABLE IF NOT EXISTS daily_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL COMMENT 'meal_logged, workout_completed, water_logged, video_watched',
  points_earned INT DEFAULT 0,
  activity_date DATE NOT NULL,
  metadata JSON COMMENT 'Additional activity details',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, activity_date DESC),
  INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points, category, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first health assessment', '🎯', 50, 'milestone', 'assessment_completed', 1),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 100, 'streak', 'streak_days', 7),
('Month Master', 'Maintain a 30-day streak', '⭐', 500, 'streak', 'streak_days', 30),
('Century Club', 'Maintain a 100-day streak', '💯', 2000, 'streak', 'streak_days', 100),
('Meal Logger', 'Log 10 meals', '🍽️', 50, 'activity', 'meals_logged', 10),
('Meal Master', 'Log 100 meals', '👨‍🍳', 300, 'activity', 'meals_logged', 100),
('Hydration Hero', 'Complete water intake for 7 days', '💧', 100, 'health', 'water_days', 7),
('Fitness Fan', 'Complete 10 workouts', '💪', 200, 'activity', 'workouts_completed', 10),
('Video Viewer', 'Watch 20 educational videos', '📺', 100, 'activity', 'videos_watched', 20),
('Weight Warrior', 'Lose 5kg', '⚖️', 500, 'health', 'weight_lost_kg', 5),
('Goal Getter', 'Reach your target weight', '🎉', 1000, 'milestone', 'goal_reached', 1),
('Social Butterfly', 'Share 5 achievements', '🦋', 150, 'social', 'shares_count', 5)
ON DUPLICATE KEY UPDATE description=VALUES(description);

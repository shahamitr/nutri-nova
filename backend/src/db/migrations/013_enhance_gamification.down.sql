-- Rollback: Remove gamification enhancements
DROP TABLE IF EXISTS daily_activities;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;

ALTER TABLE users
  DROP COLUMN IF EXISTS points,
  DROP COLUMN IF EXISTS level,
  DROP COLUMN IF EXISTS current_streak,
  DROP COLUMN IF EXISTS longest_streak,
  DROP COLUMN IF EXISTS last_activity_date,
  DROP COLUMN IF EXISTS total_activities;

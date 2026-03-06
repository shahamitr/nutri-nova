-- Additional performance indexes for frequently queried columns

-- Users table - already has idx_email from creation

-- Voice settings - add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_user ON voice_settings(user_id);

-- Health profile - add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_health_user ON health_profile(user_id);

-- BMI records - composite index already exists (idx_user_calculated)
-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_bmi_category ON bmi_records(category);

-- Diet plans - composite index already exists (idx_user_created)
-- Add index for calorie range queries
CREATE INDEX IF NOT EXISTS idx_diet_calories ON diet_plans(daily_calories);

-- User progress - add index for points leaderboard queries
CREATE INDEX IF NOT EXISTS idx_progress_points ON user_progress(points DESC);
CREATE INDEX IF NOT EXISTS idx_progress_completion ON user_progress(profile_completed, bmi_calculated, routine_completed, diet_generated);

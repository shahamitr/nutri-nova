-- Drop performance indexes

DROP INDEX IF EXISTS idx_voice_user ON voice_settings;
DROP INDEX IF EXISTS idx_health_user ON health_profile;
DROP INDEX IF EXISTS idx_bmi_category ON bmi_records;
DROP INDEX IF EXISTS idx_diet_calories ON diet_plans;
DROP INDEX IF EXISTS idx_progress_points ON user_progress;
DROP INDEX IF EXISTS idx_progress_completion ON user_progress;

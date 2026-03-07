-- Rollback: Remove comprehensive diet plan fields
ALTER TABLE diet_plans
  DROP COLUMN water_intake,
  DROP COLUMN recommendations,
  DROP COLUMN timeline,
  DROP COLUMN meal_explanations;

-- Remove index
DROP INDEX idx_user_latest ON diet_plans;

-- Add comprehensive diet plan fields to match demo functionality
ALTER TABLE diet_plans
  ADD COLUMN water_intake JSON DEFAULT NULL COMMENT 'Daily water intake schedule with times and amounts',
  ADD COLUMN recommendations JSON DEFAULT NULL COMMENT 'Detailed recommendations (exercise, sleep, stress, tracking, foods_to_limit, meal_timing)',
  ADD COLUMN timeline JSON DEFAULT NULL COMMENT '12-week timeline with phases and milestones',
  ADD COLUMN meal_explanations JSON DEFAULT NULL COMMENT 'Educational explanations for why each meal helps';

-- Add index for faster retrieval
CREATE INDEX idx_user_latest ON diet_plans(user_id, created_at DESC);

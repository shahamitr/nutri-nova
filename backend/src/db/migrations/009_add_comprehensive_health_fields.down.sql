-- Rollback: Remove comprehensive health fields
ALTER TABLE health_profile
  DROP COLUMN allergies,
  DROP COLUMN smoking_status,
  DROP COLUMN alcohol_consumption,
  DROP COLUMN water_intake_daily,
  DROP COLUMN joint_pain,
  DROP COLUMN back_pain,
  DROP COLUMN neck_pain,
  DROP COLUMN pain_details,
  DROP COLUMN chronic_conditions,
  DROP COLUMN medications,
  DROP COLUMN injuries,
  DROP COLUMN dietary_restrictions,
  DROP COLUMN food_dislikes,
  DROP COLUMN meal_frequency,
  DROP COLUMN exercise_limitations,
  DROP COLUMN health_goals,
  DROP COLUMN family_history,
  DROP COLUMN digestive_issues,
  DROP COLUMN energy_levels,
  DROP COLUMN sleep_quality;

-- Remove index
DROP INDEX idx_health_conditions ON health_profile;

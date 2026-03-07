-- Add comprehensive health fields for better diet and exercise planning
ALTER TABLE health_profile
  ADD COLUMN allergies TEXT DEFAULT NULL COMMENT 'Food allergies and intolerances',
  ADD COLUMN smoking_status ENUM('NON_SMOKER', 'OCCASIONAL', 'REGULAR', 'HEAVY') DEFAULT 'NON_SMOKER',
  ADD COLUMN alcohol_consumption ENUM('NONE', 'OCCASIONAL', 'MODERATE', 'HEAVY') DEFAULT 'NONE',
  ADD COLUMN water_intake_daily DECIMAL(3,1) DEFAULT NULL COMMENT 'Daily water intake in liters',
  ADD COLUMN joint_pain BOOLEAN DEFAULT FALSE,
  ADD COLUMN back_pain BOOLEAN DEFAULT FALSE,
  ADD COLUMN neck_pain BOOLEAN DEFAULT FALSE,
  ADD COLUMN pain_details TEXT DEFAULT NULL COMMENT 'Details about pain locations and severity',
  ADD COLUMN chronic_conditions TEXT DEFAULT NULL COMMENT 'Diabetes, hypertension, thyroid, etc.',
  ADD COLUMN medications TEXT DEFAULT NULL COMMENT 'Current medications',
  ADD COLUMN injuries TEXT DEFAULT NULL COMMENT 'Past or current injuries',
  ADD COLUMN dietary_restrictions TEXT DEFAULT NULL COMMENT 'Religious, ethical, or personal restrictions',
  ADD COLUMN food_dislikes TEXT DEFAULT NULL COMMENT 'Foods user dislikes',
  ADD COLUMN meal_frequency INT DEFAULT 3 COMMENT 'Preferred number of meals per day',
  ADD COLUMN exercise_limitations TEXT DEFAULT NULL COMMENT 'Physical limitations for exercise',
  ADD COLUMN health_goals TEXT DEFAULT NULL COMMENT 'Specific health goals beyond weight',
  ADD COLUMN family_history TEXT DEFAULT NULL COMMENT 'Relevant family medical history',
  ADD COLUMN digestive_issues TEXT DEFAULT NULL COMMENT 'IBS, acid reflux, etc.',
  ADD COLUMN energy_levels ENUM('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH') DEFAULT 'MODERATE',
  ADD COLUMN sleep_quality ENUM('POOR', 'FAIR', 'GOOD', 'EXCELLENT') DEFAULT 'FAIR';

-- Add index for faster queries
CREATE INDEX idx_health_conditions ON health_profile(chronic_conditions(100));

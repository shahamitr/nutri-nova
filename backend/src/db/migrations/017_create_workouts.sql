-- Migration: Create workout planning and tracking system

CREATE TABLE IF NOT EXISTS workout_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  duration_weeks INT DEFAULT 4,
  goals JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workout_exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workout_plan_id INT NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_type ENUM('cardio', 'strength', 'flexibility', 'balance', 'hiit') NOT NULL,
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  sets_target INT,
  reps_target INT,
  duration_minutes INT DEFAULT 60,
  video_url VARCHAR(500),
  instructions TEXT,
  equipment VARCHAR(255),
  target_muscles VARCHAR(255),
  calories_burned_estimate INT,
  order_index INT DEFAULT 0,
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  INDEX idx_plan_day (workout_plan_id, day_of_week),
  INDEX idx_exercise_type (exercise_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workout_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  workout_exercise_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  workout_date DATE NOT NULL,
  sets_completed INT,
  reps_completed INT,
  duration_minutes INT,
  calories_burned INT,
  difficulty_rating INT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, workout_date DESC),
  INDEX idx_completed_at (completed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workout_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  stat_date DATE NOT NULL,
  total_workouts INT DEFAULT 0,
  total_duration_minutes INT DEFAULT 0,
  total_calories_burned INT DEFAULT 0,
  exercises_completed INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, stat_date),
  INDEX idx_stat_date (stat_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

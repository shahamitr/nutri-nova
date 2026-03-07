-- Migration: Create meal logging system
-- Tracks user meals with nutritional information

CREATE TABLE IF NOT EXISTS meal_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  meal_type ENUM('breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner', 'before_bed', 'other') NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  calories INT,
  protein DECIMAL(6,2) COMMENT 'grams',
  carbs DECIMAL(6,2) COMMENT 'grams',
  fats DECIMAL(6,2) COMMENT 'grams',
  fiber DECIMAL(5,2) COMMENT 'grams',
  portion_size VARCHAR(100),
  serving_unit VARCHAR(50) COMMENT 'cup, tbsp, piece, etc',
  image_url VARCHAR(500),
  barcode VARCHAR(100),
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  meal_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, meal_date DESC),
  INDEX idx_meal_type (meal_type),
  INDEX idx_logged_at (logged_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create daily nutrition summary table for quick access
CREATE TABLE IF NOT EXISTS daily_nutrition_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  summary_date DATE NOT NULL,
  total_calories INT DEFAULT 0,
  total_protein DECIMAL(6,2) DEFAULT 0,
  total_carbs DECIMAL(6,2) DEFAULT 0,
  total_fats DECIMAL(6,2) DEFAULT 0,
  total_fiber DECIMAL(5,2) DEFAULT 0,
  meals_logged INT DEFAULT 0,
  target_calories INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, summary_date),
  INDEX idx_summary_date (summary_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

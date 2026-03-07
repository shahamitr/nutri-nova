-- Migration: Create habit tracking system
-- Tracks daily habits and correlates with health outcomes

CREATE TABLE IF NOT EXISTS habits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  habit_name VARCHAR(100) NOT NULL,
  category ENUM('sleep', 'water', 'exercise', 'stress', 'mood', 'energy', 'custom') NOT NULL,
  target_value DECIMAL(6,2),
  unit VARCHAR(20) COMMENT 'hours, glasses, minutes, scale 1-10, etc',
  frequency ENUM('daily', 'weekly') DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS habit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  habit_id INT NOT NULL,
  value DECIMAL(6,2) NOT NULL,
  notes TEXT,
  logged_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  INDEX idx_habit_date (habit_id, logged_date DESC),
  INDEX idx_logged_date (logged_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create habit insights table for correlations
CREATE TABLE IF NOT EXISTS habit_insights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  insight_type VARCHAR(50) COMMENT 'correlation, trend, recommendation',
  title VARCHAR(255),
  description TEXT,
  data JSON COMMENT 'Supporting data for the insight',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_generated (user_id, generated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

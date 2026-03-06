CREATE TABLE diet_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  daily_calories INT NOT NULL,
  protein_percentage DECIMAL(5, 2) NOT NULL,
  carbs_percentage DECIMAL(5, 2) NOT NULL,
  fats_percentage DECIMAL(5, 2) NOT NULL,
  breakfast JSON NOT NULL,
  lunch JSON NOT NULL,
  snack JSON NOT NULL,
  dinner JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

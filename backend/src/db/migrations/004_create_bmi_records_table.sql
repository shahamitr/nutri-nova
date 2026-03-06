CREATE TABLE bmi_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bmi_value DECIMAL(4, 2) NOT NULL,
  category ENUM('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE') NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_calculated (user_id, calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

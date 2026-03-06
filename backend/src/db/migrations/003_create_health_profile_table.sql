CREATE TABLE health_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT NOT NULL CHECK (age >= 1 AND age <= 120),
  gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
  height_cm DECIMAL(5, 2) NOT NULL CHECK (height_cm >= 50 AND height_cm <= 250),
  weight_kg DECIMAL(5, 2) NOT NULL CHECK (weight_kg >= 20 AND weight_kg <= 300),
  diet_preference ENUM('VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN') NOT NULL,
  activity_level ENUM('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE') NOT NULL DEFAULT 'SEDENTARY',
  sleep_hours DECIMAL(3, 1) NOT NULL DEFAULT 7.0 CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  stress_level ENUM('LOW', 'MODERATE', 'HIGH') NOT NULL DEFAULT 'MODERATE',
  medical_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

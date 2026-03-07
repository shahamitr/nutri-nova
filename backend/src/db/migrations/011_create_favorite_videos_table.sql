-- Create table for storing user's favorite videos
CREATE TABLE user_favorite_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(500),
  url VARCHAR(500) NOT NULL,
  category ENUM('exercise', 'recipe', 'wellness') NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, video_id),
  INDEX idx_user_category (user_id, category),
  INDEX idx_saved_at (saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

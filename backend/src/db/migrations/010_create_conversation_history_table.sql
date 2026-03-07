-- Create table for storing complete conversation history for PDF reports
CREATE TABLE conversation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'ai') NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for storing generated reports
CREATE TABLE health_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_type ENUM('DIET_PLAN', 'CONVERSATION', 'COMPREHENSIVE') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_reports (user_id, generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Create smart notifications system
-- Managesscheduled and triggered notifications

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('water', 'meal', 'workout', 'motivation', 'achievement', 'reminder', 'tip', 'check_in') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  scheduled_time TIME COMMENT 'For recurring notifications',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_days VARCHAR(20) COMMENT 'Comma-separated: 0=Sun,1=Mon,...,6=Sat',
  is_enabled BOOLEAN DEFAULT true,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  last_sent TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_enabled (user_id, is_enabled),
  INDEX idx_type (type),
  INDEX idx_scheduled_time (scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  was_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,
  action_taken VARCHAR(50) COMMENT 'clicked, dismissed, snoozed',
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sent (user_id, sent_at DESC),
  INDEX idx_was_read (was_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification templates
INSERT INTO notifications (user_id, type, title, message, scheduled_time, is_recurring, recurrence_days, priority)
SELECT
  id as user_id,
  'water' as type,
  'Time to Hydrate! 💧' as title,
  'Remember to drink a glass of water to stay hydrated.' as message,
  '09:00:00' as scheduled_time,
  true as is_recurring,
  '1,2,3,4,5,6,0' as recurrence_days,
  'medium' as priority
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM notifications WHERE user_id = users.id AND type = 'water' AND scheduled_time = '09:00:00'
);

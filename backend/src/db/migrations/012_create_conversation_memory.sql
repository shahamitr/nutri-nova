-- Migration: Create conversation memory system
-- Stores user preferences, facts, goals, and concerns for context-aware conversations

CREATE TABLE IF NOT EXISTS conversation_memory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  memory_type ENUM('preference', 'fact', 'goal', 'concern', 'restriction') NOT NULL,
  content TEXT NOT NULL,
  context JSON,
  importance INT DEFAULT 5 COMMENT 'Scale 1-10, higher = more important',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_referenced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, memory_type),
  INDEX idx_importance (importance DESC),
  INDEX idx_last_referenced (last_referenced DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some example memory types for reference
-- preference: "Prefers vegetarian meals", "Dislikes spicy food"
-- fact: "Has diabetes", "Allergic to peanuts", "Works night shifts"
-- goal: "Wants to lose 10kg in 3 months", "Training for marathon"
-- concern: "Worried about cholesterol", "Struggles with late-night snacking"
-- restriction: "Cannot eat gluten", "Lactose intolerant"

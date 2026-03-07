import { db } from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Memory {
  id: number;
  user_id: number;
  memory_type: 'preference' | 'fact' | 'goal' | 'concern' | 'restriction';
  content: string;
  context?: any;
  importance: number;
  created_at: Date;
  last_referenced: Date;
  reference_count: number;
  is_active: boolean;
}

interface MemoryInput {
  user_id: number;
  memory_type: Memory['memory_type'];
  content: string;
  context?: any;
  importance?: number;
}

class ConversationMemoryService {
  /**
   * Store a new memory for the user
   */
  async storeMemory(input: MemoryInput): Promise<number> {
    const { user_id, memory_type, content, context, importance = 5 } = input;

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO conversation_memory
       (user_id, memory_type, content, context, importance)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, memory_type, content, JSON.stringify(context || {}), importance]
    );

    return result.insertId;
  }

  /**
   * Get all active memories for a user, ordered by importance and recency
   */
  async getUserMemories(userId: number, limit: number = 50): Promise<Memory[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM conversation_memory
       WHERE user_id = ? AND is_active = true
       ORDER BY importance DESC, last_referenced DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => ({
      ...row,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
    })) as Memory[];
  }

  /**
   * Get memories by type
   */
  async getMemoriesByType(
    userId: number,
    type: Memory['memory_type'],
    limit: number = 20
  ): Promise<Memory[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM conversation_memory
       WHERE user_id = ? AND memory_type = ? AND is_active = true
       ORDER BY importance DESC, last_referenced DESC
       LIMIT ?`,
      [userId, type, limit]
    );

    return rows.map(row => ({
      ...row,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
    })) as Memory[];
  }

  /**
   * Update memory reference (called when memory is used in conversation)
   */
  async referenceMemory(memoryId: number): Promise<void> {
    await db.execute(
      `UPDATE conversation_memory
       SET last_referenced = CURRENT_TIMESTAMP,
           reference_count = reference_count + 1
       WHERE id = ?`,
      [memoryId]
    );
  }

  /**
   * Search memories by content
   */
  async searchMemories(userId: number, searchTerm: string, limit: number = 10): Promise<Memory[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM conversation_memory
       WHERE user_id = ? AND is_active = true
       AND content LIKE ?
       ORDER BY importance DESC, last_referenced DESC
       LIMIT ?`,
      [userId, `%${searchTerm}%`, limit]
    );

    return rows.map(row => ({
      ...row,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
    })) as Memory[];
  }

  /**
   * Deactivate a memory (soft delete)
   */
  async deactivateMemory(memoryId: number): Promise<void> {
    await db.execute(
      `UPDATE conversation_memory SET is_active = false WHERE id = ?`,
      [memoryId]
    );
  }

  /**
   * Update memory importance
   */
  async updateImportance(memoryId: number, importance: number): Promise<void> {
    await db.execute(
      `UPDATE conversation_memory SET importance = ? WHERE id = ?`,
      [importance, memoryId]
    );
  }

  /**
   * Get context string for AI prompt injection
   * Returns formatted string of user's memories for context
   */
  async getContextForPrompt(userId: number): Promise<string> {
    const memories = await this.getUserMemories(userId, 30);

    if (memories.length === 0) {
      return '';
    }

    const sections: string[] = [];

    // Group by type
    const preferences = memories.filter(m => m.memory_type === 'preference');
    const facts = memories.filter(m => m.memory_type === 'fact');
    const goals = memories.filter(m => m.memory_type === 'goal');
    const concerns = memories.filter(m => m.memory_type === 'concern');
    const restrictions = memories.filter(m => m.memory_type === 'restriction');

    if (preferences.length > 0) {
      sections.push(`User Preferences:\n${preferences.map(m => `- ${m.content}`).join('\n')}`);
    }

    if (facts.length > 0) {
      sections.push(`Important Facts:\n${facts.map(m => `- ${m.content}`).join('\n')}`);
    }

    if (restrictions.length > 0) {
      sections.push(`Dietary Restrictions:\n${restrictions.map(m => `- ${m.content}`).join('\n')}`);
    }

    if (goals.length > 0) {
      sections.push(`User Goals:\n${goals.map(m => `- ${m.content}`).join('\n')}`);
    }

    if (concerns.length > 0) {
      sections.push(`User Concerns:\n${concerns.map(m => `- ${m.content}`).join('\n')}`);
    }

    return `\n\n=== USER CONTEXT (Remember from previous conversations) ===\n${sections.join('\n\n')}\n=== END USER CONTEXT ===\n\n`;
  }

  /**
   * Extract and store memories from conversation
   * This can be called after each conversation to extract key information
   */
  async extractMemoriesFromConversation(
    userId: number,
    conversationText: string
  ): Promise<number> {
    // This is a simple keyword-based extraction
    // In production, you'd use Amazon Nova or another LLM to extract memories intelligently

    let memoriesStored = 0;

    // Extract preferences
    const preferenceKeywords = ['prefer', 'like', 'love', 'enjoy', 'favorite'];
    const dislikeKeywords = ['dislike', 'hate', 'avoid', 'don\'t like'];

    // Extract goals
    const goalKeywords = ['want to', 'goal is', 'trying to', 'hoping to', 'plan to'];

    // Extract concerns
    const concernKeywords = ['worried about', 'concerned about', 'struggle with', 'problem with'];

    // Extract restrictions
    const restrictionKeywords = ['allergic to', 'can\'t eat', 'cannot eat', 'intolerant to'];

    // Simple extraction logic (in production, use LLM)
    const sentences = conversationText.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase().trim();

      if (lowerSentence.length < 10) continue;

      // Check for preferences
      if (preferenceKeywords.some(kw => lowerSentence.includes(kw))) {
        await this.storeMemory({
          user_id: userId,
          memory_type: 'preference',
          content: sentence.trim(),
          importance: 6
        });
        memoriesStored++;
      }

      // Check for goals
      if (goalKeywords.some(kw => lowerSentence.includes(kw))) {
        await this.storeMemory({
          user_id: userId,
          memory_type: 'goal',
          content: sentence.trim(),
          importance: 8
        });
        memoriesStored++;
      }

      // Check for concerns
      if (concernKeywords.some(kw => lowerSentence.includes(kw))) {
        await this.storeMemory({
          user_id: userId,
          memory_type: 'concern',
          content: sentence.trim(),
          importance: 7
        });
        memoriesStored++;
      }

      // Check for restrictions
      if (restrictionKeywords.some(kw => lowerSentence.includes(kw))) {
        await this.storeMemory({
          user_id: userId,
          memory_type: 'restriction',
          content: sentence.trim(),
          importance: 9
        });
        memoriesStored++;
      }
    }

    return memoriesStored;
  }

  /**
   * Get memory statistics for a user
   */
  async getMemoryStats(userId: number): Promise<{
    total: number;
    by_type: Record<string, number>;
    most_referenced: Memory[];
  }> {
    const [totalRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM conversation_memory WHERE user_id = ? AND is_active = true`,
      [userId]
    );

    const [typeRows] = await db.execute<RowDataPacket[]>(
      `SELECT memory_type, COUNT(*) as count
       FROM conversation_memory
       WHERE user_id = ? AND is_active = true
       GROUP BY memory_type`,
      [userId]
    );

    const [mostReferenced] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM conversation_memory
       WHERE user_id = ? AND is_active = true
       ORDER BY reference_count DESC
       LIMIT 5`,
      [userId]
    );

    const byType: Record<string, number> = {};
    typeRows.forEach(row => {
      byType[row.memory_type] = row.count;
    });

    return {
      total: totalRows[0].total,
      by_type: byType,
      most_referenced: mostReferenced.map(row => ({
        ...row,
        context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
      })) as Memory[]
    };
  }
}

export default new ConversationMemoryService();

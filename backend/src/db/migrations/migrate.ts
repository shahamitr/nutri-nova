import { getPool, closePool } from '../connection';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_TABLE = 'migrations';

async function ensureMigrationsTable(): Promise<void> {
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const pool = getPool();
  const [rows] = await pool.execute<any[]>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
  );
  return rows.map((row) => row.name);
}

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir);
  return files
    .filter((file) => file.endsWith('.sql') && file.startsWith('0') && !file.includes('.down.'))
    .sort();
}

async function executeMigration(filename: string): Promise<void> {
  const pool = getPool();
  const filepath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filepath, 'utf-8')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Remove full-line comments before splitting to avoid filtering out entire statements
  const cleanedSql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await pool.execute(statement);
  }

  // Record migration
  await pool.execute(
    `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
    [filename]
  );

  console.log(`✅ Executed migration: ${filename}`);
}

async function rollbackMigration(filename: string): Promise<void> {
  const pool = getPool();
  const filepath = path.join(__dirname, filename.replace('.sql', '.down.sql'));

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Rollback file not found: ${filepath}`);
    return;
  }

  const sql = fs.readFileSync(filepath, 'utf-8')
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--')); // Skip comments

  for (const statement of statements) {
    await pool.execute(statement);
  }

  // Remove migration record
  await pool.execute(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`, [
    filename,
  ]);

  console.log(`⏪ Rolled back migration: ${filename}`);
}

async function migrateUp(): Promise<void> {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const available = await getMigrationFiles();

  const pending = available.filter((file) => !executed.includes(file));

  if (pending.length === 0) {
    console.log('✨ No pending migrations');
    return;
  }

  console.log(`📦 Running ${pending.length} migration(s)...`);

  for (const file of pending) {
    await executeMigration(file);
  }

  console.log('✅ All migrations completed');
}

async function migrateDown(): Promise<void> {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    console.log('✨ No migrations to rollback');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  console.log(`⏪ Rolling back: ${lastMigration}`);

  await rollbackMigration(lastMigration);

  console.log('✅ Rollback completed');
}

// CLI execution
const command = process.argv[2];

(async () => {
  try {
    if (command === 'up') {
      await migrateUp();
    } else if (command === 'down') {
      await migrateDown();
    } else {
      console.log('Usage: bun run migrate.ts [up|down]');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
})();

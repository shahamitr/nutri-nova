import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nutrivoice',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_MAX || '20'), // Max connections
      queueLimit: 0, // Unlimited queue
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      idleTimeout: 600000, // 10 minutes idle timeout
      connectTimeout: 5000, // 5 seconds connection timeout
      maxIdle: 10, // Max idle connections
    });

    // Log pool events
    pool.on('connection', () => {
      logger.debug('New database connection established');
    });

    pool.on('release', () => {
      logger.debug('Database connection released back to pool');
    });
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows as T;
  } finally {
    connection.release();
  }
};

export const db = getPool();

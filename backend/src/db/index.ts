import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'chaffanjutt',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'codexi_db',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

export default {
  query: (text: string, params: any[]) => pool.query(text, params),
};

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
    try {
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSQL);
        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initializeDatabase(); 
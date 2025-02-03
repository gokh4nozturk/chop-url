require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Successfully connected to the database!');

        console.log('\nRunning initial migration...');
        const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/0000_initial.sql'), 'utf8');
        await client.query(migrationSQL);
        console.log('✅ Successfully ran initial migration!');

        const { rows } = await client.query('SELECT COUNT(*) FROM urls');
        console.log('\nCurrent number of URLs in database:', rows[0].count);

        client.release();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await pool.end();
    }
}

testConnection(); 
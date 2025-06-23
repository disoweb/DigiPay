
import { pool } from './server/db.js';

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migration...');
    
    // Add bank details columns
    await client.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number TEXT,
      ADD COLUMN IF NOT EXISTS account_name TEXT
    `);
    
    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('bank_name', 'account_number', 'account_name')
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('Added columns:', result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();

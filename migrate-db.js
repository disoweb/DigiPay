
const { db } = require('./server/db.js');

async function migrate() {
  try {
    // Add bank details columns to transactions table
    await db.execute(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number TEXT,
      ADD COLUMN IF NOT EXISTS account_name TEXT
    `);
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();

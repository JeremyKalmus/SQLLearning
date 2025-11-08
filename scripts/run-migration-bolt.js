import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250110000000_create_flashcards_table.sql');

if (!existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const sql = readFileSync(migrationPath, 'utf-8');

console.log('='.repeat(80));
console.log('BOLT.NEW AI INSTRUCTIONS (Copy this entire message):');
console.log('='.repeat(80));
console.log('\nRun this SQL in Supabase. Since Bolt.new Supabase has no SQL editor,');
console.log('you need to execute it via a database function or ask Bolt.new AI to run it.');
console.log('\nSQL to execute:');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\nALTERNATIVE: Ask Bolt.new AI:');
console.log('"Please run the SQL migration from supabase/migrations/20250110000000_create_flashcards_table.sql');
console.log('in the Supabase database. This creates the flashcards table."');
console.log('='.repeat(80));


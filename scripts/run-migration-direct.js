import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL must be set');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Error: Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// Build connection string
// Format: postgresql://[user]:[password]@[host]:[port]/[database]
const dbHost = `${projectRef}.supabase.co`;
const dbPort = 5432;
const dbName = 'postgres';

if (!dbPassword) {
  console.error('Error: SUPABASE_DB_PASSWORD must be set in .env');
  console.error('Get it from: Bolt.new → Supabase → Settings → Database → Connection string');
  console.error('Or from Supabase dashboard: Project Settings → Database → Connection string');
  process.exit(1);
}

const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

async function runMigration() {
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250110000000_create_flashcards_table.sql');
  
  if (!existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf-8');
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Running migration...');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('\nCheck your SUPABASE_DB_PASSWORD in .env');
      console.error('Get it from Bolt.new → Supabase → Settings → Database');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();


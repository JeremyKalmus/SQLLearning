import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL must be set');
  process.exit(1);
}

// Extract database connection details from Supabase URL
// Supabase URL format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';

async function runMigration() {
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250110000000_create_flashcards_table.sql');
  
  if (!existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf-8');

  // Try using psql if available and connection details provided
  if (projectRef && dbPassword) {
    const dbHost = `${projectRef}.supabase.co`;
    const dbPort = 5432;
    const dbName = 'postgres';
    const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    
    try {
      console.log('Attempting to run migration via psql...');
      execSync(`psql "${connectionString}" -c "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('Migration completed successfully!');
      return;
    } catch (error) {
      console.log('psql method failed, showing SQL to run manually...\n');
    }
  }

  // Fallback: Show SQL to copy-paste
  console.log('='.repeat(80));
  console.log('Copy the SQL below and run it in Supabase Dashboard → SQL Editor:');
  console.log('='.repeat(80));
  console.log('\n' + sql + '\n');
  console.log('='.repeat(80));
  console.log('\nOr run via psql:');
  console.log(`psql "postgresql://postgres:[PASSWORD]@${projectRef || '[PROJECT]'}.supabase.co:5432/postgres" -f "${migrationPath}"`);
}

runMigration();

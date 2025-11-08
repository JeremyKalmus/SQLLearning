# Run Flashcard Migration

**Option 1 (Easiest):** Run `node scripts/run-migration.js` - it will show SQL to copy-paste into Supabase Dashboard → SQL Editor

**Option 2:** Copy contents of `supabase/migrations/20250110000000_create_flashcards_table.sql` and paste into Supabase Dashboard → SQL Editor, then execute

**Option 3:** If you have psql and SUPABASE_DB_PASSWORD in .env: `node scripts/run-migration.js` (will auto-run)

After migration, run: `node scripts/migrate-flashcards-to-db.js`

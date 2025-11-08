# Run Flashcard Migration

**For Bolt.new Supabase (no SQL editor, no DB password):**

**Option 1:** Ask Bolt.new AI (when you have tokens):
```
"Please run the SQL migration from supabase/migrations/20250110000000_create_flashcards_table.sql in the Supabase database to create the flashcards table."
```

**Option 2:** Run `node scripts/run-migration-bolt.js` - it will show instructions and SQL

**Option 3:** If you can get database password: Add `SUPABASE_DB_PASSWORD` to `.env`, install `pg` (`npm install`), then run `node scripts/run-migration-direct.js`

After migration, run: `node scripts/migrate-flashcards-to-db.js`

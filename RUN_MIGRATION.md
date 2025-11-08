# Run Flashcard Migration

**For Bolt.new Supabase (no SQL editor):**

1. Get database password from Bolt.new → Supabase → Settings → Database → Connection string
2. Add to `.env`: `SUPABASE_DB_PASSWORD=your_password_here`
3. Install pg: `npm install`
4. Run: `node scripts/run-migration-direct.js`

Then populate data: `node scripts/migrate-flashcards-to-db.js`

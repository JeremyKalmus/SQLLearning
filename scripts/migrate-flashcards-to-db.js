import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateFlashcards() {
  try {
    // Read flashcards.json
    const flashcardsPath = join(__dirname, '../src/data/flashcards.json');
    const flashcardsData = JSON.parse(readFileSync(flashcardsPath, 'utf-8'));

    console.log('Starting flashcard migration...');

    // Check if flashcards already exist
    const { data: existingCards, error: checkError } = await supabase
      .from('flashcards')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing flashcards:', checkError);
      throw checkError;
    }

    if (existingCards && existingCards.length > 0) {
      console.log('Flashcards already exist in database. Skipping migration.');
      return;
    }

    // Migrate flashcards from JSON
    const allFlashcards = [];
    for (const [level, cards] of Object.entries(flashcardsData)) {
      for (const card of cards) {
        if (!card.id) {
          console.warn(`Skipping card without ID: ${card.question}`);
          continue;
        }
        allFlashcards.push({
          id: card.id, // Use the existing ID from JSON (e.g., "basic_1", "inter_1")
          level: card.level || level,
          topic: card.topic,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation || null,
          example: card.example || null,
          is_ai_generated: false,
        });
      }
    }

    console.log(`Migrating ${allFlashcards.length} flashcards...`);

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < allFlashcards.length; i += batchSize) {
      const batch = allFlashcards.slice(i, i + batchSize);
      const { error } = await supabase
        .from('flashcards')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} cards)`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateFlashcards();


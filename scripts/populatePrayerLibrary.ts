// Script to populate prayer_points table in Supabase
// This migrates prayer library data from TypeScript files to the database

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import prayer data - we'll dynamically import since we need to read the files
async function populatePrayerLibrary() {
  try {
    console.log('🙏 Starting Prayer Library Migration to Supabase...\n');

    // Import the prayer data
    const { kingdomFocusPrayers } = await import('../src/data/kingdomFocusPrayers.js');
    const initModule = await import('../src/data/initializePrayerLibrary.js');

    console.log(`📖 Found ${kingdomFocusPrayers.length} Kingdom Focused prayers\n`);

    // Check if prayer_points table already has data
    const { data: existingPoints, error: checkError } = await supabase
      .from('prayer_points')
      .select('id', { count: 'exact', head: true });

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      throw checkError;
    }

    // Transform and insert prayers
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const prayer of kingdomFocusPrayers) {
      try {
        // Check if this prayer already exists
        const { data: existing } = await supabase
          .from('prayer_points')
          .select('id')
          .eq('id', prayer.id)
          .maybeSingle();

        if (existing) {
          console.log(`⏭️  Skipping ${prayer.id} - already exists`);
          skippedCount++;
          continue;
        }

        // Transform the prayer data to match prayer_points table schema
        // Each intercession point becomes a separate prayer_point entry
        for (let i = 0; i < prayer.intercession_points.length; i++) {
          const point = prayer.intercession_points[i];
          const pointId = `${prayer.id}-point-${i + 1}`;

          const prayerPoint = {
            id: pointId,
            title: `${prayer.title} - Point ${i + 1}`,
            content: point,
            category: prayer.category,
            created_at: prayer.created_at || new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from('prayer_points')
            .insert([prayerPoint]);

          if (insertError) {
            console.error(`❌ Error inserting ${pointId}:`, insertError);
            errorCount++;
          } else {
            insertedCount++;
            console.log(`✅ Inserted: ${pointId}`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing prayer ${prayer.id}:`, err);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully inserted: ${insertedCount} prayer points`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} prayers`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n🎉 Prayer Library migration completed successfully!');
    } else {
      console.log('\n⚠️  Prayer Library migration completed with some errors.');
    }

  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
populatePrayerLibrary()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

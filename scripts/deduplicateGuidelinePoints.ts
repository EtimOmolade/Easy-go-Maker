/**
 * Script to deduplicate prayer points in existing guidelines
 * Run this once to clean up old data that has duplicate points
 *
 * Usage: npm run tsx scripts/deduplicateGuidelinePoints.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deduplicateGuidelines() {
  console.log('Fetching all guidelines...');

  const { data: guidelines, error } = await supabase
    .from('guidelines')
    .select('*');

  if (error) {
    console.error('Error fetching guidelines:', error);
    return;
  }

  if (!guidelines || guidelines.length === 0) {
    console.log('No guidelines found.');
    return;
  }

  console.log(`Found ${guidelines.length} guidelines. Processing...`);

  let updatedCount = 0;
  let unchangedCount = 0;

  for (const guideline of guidelines) {
    if (!Array.isArray(guideline.steps)) {
      console.log(`Guideline ${guideline.id}: No steps array, skipping.`);
      continue;
    }

    let hasChanges = false;
    const deduplicatedSteps = guideline.steps.map((step: any) => {
      if (step.points && Array.isArray(step.points)) {
        const originalLength = step.points.length;

        // Remove duplicate points based on ID
        const uniquePoints = step.points.filter((point: any, index: number, self: any[]) =>
          index === self.findIndex((p: any) => p.id === point.id)
        );

        if (uniquePoints.length < originalLength) {
          hasChanges = true;
          console.log(`  Step ${step.type}: Reduced from ${originalLength} to ${uniquePoints.length} points`);
          return { ...step, points: uniquePoints };
        }
      }
      return step;
    });

    if (hasChanges) {
      console.log(`Updating guideline: ${guideline.title} (${guideline.id})`);

      const { error: updateError } = await supabase
        .from('guidelines')
        .update({ steps: deduplicatedSteps })
        .eq('id', guideline.id);

      if (updateError) {
        console.error(`  Error updating guideline ${guideline.id}:`, updateError);
      } else {
        console.log(`  ✓ Successfully updated`);
        updatedCount++;
      }
    } else {
      unchangedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total guidelines: ${guidelines.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Unchanged: ${unchangedCount}`);
  console.log('Done!');
}

deduplicateGuidelines().catch(console.error);

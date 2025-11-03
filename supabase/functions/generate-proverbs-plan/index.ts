import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Proverbs has 31 chapters with varying verse counts
const proverbsStructure = [
  { chapter: 1, verses: 33 }, { chapter: 2, verses: 22 }, { chapter: 3, verses: 35 },
  { chapter: 4, verses: 27 }, { chapter: 5, verses: 23 }, { chapter: 6, verses: 35 },
  { chapter: 7, verses: 27 }, { chapter: 8, verses: 36 }, { chapter: 9, verses: 18 },
  { chapter: 10, verses: 32 }, { chapter: 11, verses: 31 }, { chapter: 12, verses: 28 },
  { chapter: 13, verses: 25 }, { chapter: 14, verses: 35 }, { chapter: 15, verses: 33 },
  { chapter: 16, verses: 33 }, { chapter: 17, verses: 28 }, { chapter: 18, verses: 24 },
  { chapter: 19, verses: 29 }, { chapter: 20, verses: 30 }, { chapter: 21, verses: 31 },
  { chapter: 22, verses: 29 }, { chapter: 23, verses: 35 }, { chapter: 24, verses: 34 },
  { chapter: 25, verses: 28 }, { chapter: 26, verses: 28 }, { chapter: 27, verses: 27 },
  { chapter: 28, verses: 28 }, { chapter: 29, verses: 27 }, { chapter: 30, verses: 33 },
  { chapter: 31, verses: 31 }
];

const TOTAL_VERSES = 915;
const DAYS_IN_CYCLE = 91;
const VERSES_PER_DAY = Math.ceil(TOTAL_VERSES / DAYS_IN_CYCLE); // ~10 verses per day

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cycleNumber = 1, userId } = await req.json();

    // Generate 91-day reading plan
    const readingPlan: any[] = [];
    let currentVerse = 1;
    let chapterIndex = 0;
    let verseInChapter = 1;

    for (let day = 1; day <= DAYS_IN_CYCLE; day++) {
      const startChapter = proverbsStructure[chapterIndex].chapter;
      const startVerse = verseInChapter;
      let versesRead = 0;
      let endChapter = startChapter;
      let endVerse = startVerse;

      // Read approximately 10 verses
      while (versesRead < VERSES_PER_DAY && chapterIndex < proverbsStructure.length) {
        const currentChapter = proverbsStructure[chapterIndex];
        const versesLeftInChapter = currentChapter.verses - verseInChapter + 1;
        const versesToRead = Math.min(VERSES_PER_DAY - versesRead, versesLeftInChapter);

        endChapter = currentChapter.chapter;
        endVerse = verseInChapter + versesToRead - 1;

        versesRead += versesToRead;
        verseInChapter += versesToRead;

        // Move to next chapter if needed
        if (verseInChapter > currentChapter.verses) {
          chapterIndex++;
          verseInChapter = 1;
        }

        currentVerse += versesToRead;
      }

      // Format reference text placeholder (will be replaced with actual verses later)
      const referenceText = `Proverbs ${startChapter}:${startVerse}${endChapter !== startChapter || endVerse !== startVerse ? `-${endChapter}:${endVerse}` : ''}`;

      readingPlan.push({
        cycle_number: cycleNumber,
        day_number: day,
        chapter: startChapter,
        start_verse: startVerse,
        end_verse: endVerse,
        reference_text: referenceText,
        category: 'Listening Prayer',
        title: `Day ${day} - ${referenceText}`,
        content: `Today's Listening Prayer: ${referenceText}. Meditate on God's wisdom as you listen to this passage.`,
        created_by: userId,
      });
    }

    // Clear existing entries for this cycle
    await supabase
      .from('prayer_library')
      .delete()
      .eq('cycle_number', cycleNumber)
      .eq('category', 'Listening Prayer');

    // Insert new plan
    const { data, error } = await supabase
      .from('prayer_library')
      .insert(readingPlan)
      .select();

    if (error) throw error;

    console.log(`Successfully generated ${data.length} days of Proverbs reading plan`);

    return new Response(
      JSON.stringify({ success: true, count: data.length, plan: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Proverbs plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

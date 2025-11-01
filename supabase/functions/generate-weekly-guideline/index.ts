import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { weekNumber, title, userId, dayOfWeek } = await req.json();

    if (!weekNumber || !title || !userId || !dayOfWeek) {
      throw new Error('Missing required fields: weekNumber, title, userId, dayOfWeek');
    }

    // Fetch Kingdom Focus prayers for this day
    const { data: kingdomPrayers, error: kingdomError } = await supabase
      .from('prayer_library')
      .select('*')
      .eq('category', 'Kingdom Focus')
      .eq('week_number', weekNumber)
      .eq('day_of_week', dayOfWeek)
      .limit(4);

    if (kingdomError) throw kingdomError;

    // Fetch Listening Prayer for the corresponding day in the cycle
    // Calculate cycle day based on week number and day of week
    const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
    const cycleDay = ((weekNumber - 1) * 7) + dayIndex + 1;
    const adjustedCycleDay = ((cycleDay - 1) % 91) + 1; // Loop within 91-day cycle

    const { data: listeningPrayer, error: listeningError } = await supabase
      .from('prayer_library')
      .select('*')
      .eq('category', 'Listening Prayer')
      .eq('day_number', adjustedCycleDay)
      .single();

    if (listeningError) {
      console.warn('No listening prayer found for day:', adjustedCycleDay);
    }

    // Build guideline structure
    const steps = [];

    // Step 1: Kingdom Focused Prayers (4 points, read twice each)
    if (kingdomPrayers && kingdomPrayers.length > 0) {
      steps.push({
        type: 'kingdom',
        title: 'Kingdom Focused Prayers',
        points: kingdomPrayers.map((prayer: any) => ({
          title: prayer.title,
          content: prayer.content,
          audioUrl: prayer.audio_url,
          readTwice: true,
        })),
        duration: 3 * kingdomPrayers.length, // 3 minutes per point
      });
    }

    // Step 2: Personal Supplication
    steps.push({
      type: 'personal',
      title: 'Personal Supplication',
      content: 'Take time to bring your personal requests before God. Pray for your needs, your family, and your personal concerns.',
      duration: 5,
    });

    // Step 3: Listening Section (Proverbs)
    if (listeningPrayer) {
      steps.push({
        type: 'listening',
        title: 'Listening Prayer',
        content: listeningPrayer.content,
        reference: listeningPrayer.reference_text,
        chapter: listeningPrayer.chapter,
        startVerse: listeningPrayer.start_verse,
        endVerse: listeningPrayer.end_verse,
        audioUrl: listeningPrayer.audio_url,
        readOnce: true,
      });
    }

    // Step 4: Reflection & Journaling (Automatic)
    steps.push({
      type: 'reflection',
      title: 'Reflection & Journaling',
      content: 'Take time to reflect on what you have prayed and what God has spoken to you. Write down your thoughts, insights, and what you sense God is saying.',
    });

    // Create the guideline
    const { data: guideline, error: guidelineError } = await supabase
      .from('guidelines')
      .insert({
        week_number: weekNumber,
        title: title,
        content: `Daily prayer guideline for ${dayOfWeek}, Week ${weekNumber}`,
        steps: steps,
        created_by: userId,
        is_auto_generated: true,
        is_current_week: false, // Will be updated based on date logic
      })
      .select()
      .single();

    if (guidelineError) throw guidelineError;

    console.log(`Successfully generated guideline for week ${weekNumber}, ${dayOfWeek}`);

    return new Response(
      JSON.stringify({ success: true, guideline }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating guideline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

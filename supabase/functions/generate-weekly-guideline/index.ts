import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { month, day, title, userId } = await req.json();

    if (!month || !day || !title || !userId) {
      throw new Error('Missing required fields: month, day, title, userId');
    }

    // Fetch Kingdom Focus prayers for this day (first 4 intercessions)
    const { data: kingdomPrayers, error: kingdomError } = await supabase
      .from('prayer_library')
      .select('*')
      .eq('category', 'Kingdom Focus')
      .eq('month', month)
      .eq('day', day)
      .gte('intercession_number', 1)
      .lte('intercession_number', 4)
      .order('intercession_number', { ascending: true });

    if (kingdomError) throw kingdomError;

    // Calculate cycle day for Listening Prayer (based on calendar date)
    // Start from June 30 (Day 1) and count forward
    const monthDays: Record<string, number> = {
      'June': 30, 'July': 31, 'August': 31, 'September': 30,
      'October': 31, 'November': 30, 'December': 31
    };
    
    let cycleDay = 0;
    const months = Object.keys(monthDays);
    const monthIndex = months.indexOf(month);
    
    if (monthIndex >= 0) {
      // Add days from previous months (starting from June 30)
      if (month === 'June') {
        cycleDay = day - 29; // June 30 = Day 1
      } else {
        cycleDay = 2; // June 30-31 = 2 days
        for (let i = 1; i < monthIndex; i++) {
          cycleDay += monthDays[months[i]];
        }
        cycleDay += day;
      }
    }
    
    const adjustedCycleDay = ((cycleDay - 1) % 91) + 1; // Loop within 91-day cycle

    const { data: listeningPrayer, error: listeningError } = await supabase
      .from('prayer_library')
      .select('*')
      .eq('category', 'Listening Prayer')
      .eq('day_number', adjustedCycleDay)
      .maybeSingle();

    if (listeningError) {
      console.warn('No listening prayer found for day:', adjustedCycleDay);
    }

    // Get day of week from first kingdom prayer
    const dayOfWeek = kingdomPrayers && kingdomPrayers.length > 0 
      ? kingdomPrayers[0].day_of_week 
      : '';

    // Calculate week number (simple calculation: week of the year)
    const currentDate = new Date(2025, months.indexOf(month), day);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

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
        month: month,
        day: day,
        day_of_week: dayOfWeek,
        title: title,
        content: `Daily prayer guideline for ${month} ${day} (${dayOfWeek})`,
        steps: steps,
        created_by: userId,
        is_auto_generated: true,
        is_current_week: false,
      })
      .select()
      .single();

    if (guidelineError) throw guidelineError;

    console.log(`Successfully generated guideline for ${month} ${day}`);

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

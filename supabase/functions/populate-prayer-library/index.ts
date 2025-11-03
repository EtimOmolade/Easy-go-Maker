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

    const { prayers, isPlaceholder = false } = await req.json();

    if (!prayers || !Array.isArray(prayers)) {
      throw new Error('Invalid prayers data');
    }

    // Insert prayers into the library
    const { data, error } = await supabase
      .from('prayer_library')
      .insert(prayers.map((prayer: any) => ({
        title: prayer.title,
        content: prayer.content,
        category: prayer.category || 'Kingdom Focus',
        month: prayer.month,
        day: prayer.day,
        year: prayer.year || 2025,
        day_of_week: prayer.day_of_week,
        intercession_number: prayer.intercession_number,
        is_placeholder: isPlaceholder,
        created_by: prayer.created_by,
        audio_url: prayer.audio_url || null,
      })))
      .select();

    if (error) throw error;

    console.log(`Successfully populated ${data.length} prayers`);

    return new Response(
      JSON.stringify({ success: true, count: data.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

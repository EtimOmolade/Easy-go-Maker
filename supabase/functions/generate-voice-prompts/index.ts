import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice prompts that need to be pre-generated
const VOICE_PROMPTS = {
  'kingdom-start': "Now pray for kingdom purposes. Let's intercede for God's work in the world.",
  'kingdom-next': "Continue praying for the next kingdom-focused point.",
  'personal-start': "Now bring your personal requests to God. You have five minutes to share what's on your heart.",
  'listening-start': "Take a moment to listen and meditate on these scriptures. Let God speak to you.",
  'journaling-start': "Open your journal and write down what you sense or learned during prayer.",
  'session-complete': "Well done! You've completed today's prayer session. May God bless you."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const SPEECHMATICS_API_BASE = 'https://preview.tts.speechmatics.com/generate';
    const VOICE_ID = 'theo'; // English Male (UK) - deeper, father-like voice
    const API_KEY = Deno.env.get('SPEECHMATICS_API_KEY');

    if (!API_KEY) {
      throw new Error('SPEECHMATICS_API_KEY not configured');
    }

    console.log('🎙️ Generating voice prompts with Speechmatics...');

    const results: Record<string, string> = {};

    for (const [key, text] of Object.entries(VOICE_PROMPTS)) {
      try {
        console.log(`  Generating ${key}: "${text.substring(0, 50)}..."`);
        
        const response = await fetch(`${SPEECHMATICS_API_BASE}/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`  ❌ Speechmatics API error for ${key}: ${response.status} - ${errorText}`);
          continue;
        }

        // Response is WAV audio data directly
        const audioBuffer = new Uint8Array(await response.arrayBuffer());
        const fileName = `voice-prompts/${key}.wav`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('prayer-audio')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/wav',
            upsert: true
          });

        if (uploadError) {
          console.error(`  ❌ Storage upload error for ${key}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('prayer-audio')
          .getPublicUrl(fileName);

        results[key] = urlData.publicUrl;
        console.log(`  ✅ ${key} uploaded successfully`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`  ❌ Error generating audio for ${key}:`, error);
      }
    }

    console.log(`✅ Voice prompt generation complete: ${Object.keys(results).length} files created`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating voice prompts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

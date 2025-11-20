import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to improve TTS pronunciation of scripture references
function formatScriptureForTTS(text: string): string {
  let formatted = text.replace(/(\d+):(\d+)-(\d+)/g, '$1, verses $2 to $3.')
                      .replace(/(\d+):(\d+)(?!-)/g, '$1, verse $2.');
  formatted = formatted.replace(/\(([A-Z]{2,5})\)/g, '($1). ')
                       .replace(/([A-Z]{2,5})(?=\s+[A-Z])/g, '$1. ');
  formatted = formatted.replace(/\.\s+/g, '. , ');
  return formatted;
}

// Generate audio for ALL 3 voices (sarah, theo, megan)
async function generateAudioForGuideline(guideline: any, supabase: any): Promise<Record<string, Record<string, string>>> {
  const audioUrlsByVoice: Record<string, Record<string, string>> = {
    'sarah': {},
    'theo': {},
    'megan': {}
  };
  
  const VOICES = ['sarah', 'theo', 'megan'];
  const SPEECHMATICS_API_BASE = 'https://preview.tts.speechmatics.com/generate';
  const API_KEY = Deno.env.get('SPEECHMATICS_API_KEY');

  if (!API_KEY) {
    console.error('❌ SPEECHMATICS_API_KEY not set - audio generation skipped');
    return audioUrlsByVoice;
  }

  console.log(`🎙️ Generating audio for guideline ${guideline.id} in 3 voices...`);

  for (const voiceId of VOICES) {
    console.log(`\n🎤 Voice: ${voiceId}`);
    
    for (let stepIndex = 0; stepIndex < guideline.steps.length; stepIndex++) {
      const step = guideline.steps[stepIndex];

      if (step.type === 'kingdom' && step.points?.length > 0) {
        // Generate audio for each kingdom intercession point
        for (let pointIndex = 0; pointIndex < step.points.length; pointIndex++) {
          const point = step.points[pointIndex];
          const audioKey = `step${stepIndex}-p${pointIndex}`;
          
          try {
            console.log(`  Generating ${audioKey}: "${point.content.substring(0, 50)}..."`);
            
            const response = await fetch(`${SPEECHMATICS_API_BASE}/${voiceId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ text: point.content })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`  ❌ Speechmatics API error for ${audioKey}: ${response.status} - ${errorText}`);
              continue;
            }

            // Response is WAV audio data directly
            const audioBuffer = new Uint8Array(await response.arrayBuffer());
            const fileName = `${guideline.id}/${voiceId}/${audioKey}.wav`;
            
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('prayer-audio')
              .upload(fileName, audioBuffer, {
                contentType: 'audio/wav',
                upsert: true
              });

            if (uploadError) {
              console.error(`  ❌ Storage upload error for ${audioKey}:`, uploadError);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('prayer-audio')
              .getPublicUrl(fileName);

            audioUrlsByVoice[voiceId][audioKey] = urlData.publicUrl;
            console.log(`  ✅ ${audioKey} uploaded`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`  ❌ Error generating audio for ${audioKey}:`, error);
          }
        }
      } else if (step.type === 'listening' && step.content) {
        // Generate audio for listening prayer (Proverbs)
        const audioKey = `step${stepIndex}-listening`;

        try {
          const formattedContent = formatScriptureForTTS(step.content);
          console.log(`  Generating ${audioKey}: "${formattedContent.substring(0, 50)}..."`);

          const response = await fetch(`${SPEECHMATICS_API_BASE}/${voiceId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: formattedContent })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`  ❌ Speechmatics API error for ${audioKey}: ${response.status} - ${errorText}`);
            continue;
          }

          const audioBuffer = new Uint8Array(await response.arrayBuffer());
          const fileName = `${guideline.id}/${voiceId}/${audioKey}.wav`;
          
          const { error: uploadError } = await supabase.storage
            .from('prayer-audio')
            .upload(fileName, audioBuffer, {
              contentType: 'audio/wav',
              upsert: true
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('prayer-audio')
              .getPublicUrl(fileName);
            audioUrlsByVoice[voiceId][audioKey] = urlData.publicUrl;
            console.log(`  ✅ ${audioKey} uploaded`);
          } else {
            console.error(`  ❌ Storage upload error for ${audioKey}:`, uploadError);
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`  ❌ Error generating audio for ${audioKey}:`, error);
        }
      }
    }
    
    // Delay between voices to avoid rate limiting
    if (voiceId !== VOICES[VOICES.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalAudioFiles = Object.values(audioUrlsByVoice).reduce((sum, voice) => sum + Object.keys(voice).length, 0);
  console.log(`✅ Audio generation complete: ${totalAudioFiles} files created across 3 voices`);
  return audioUrlsByVoice;
}

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

    console.log(`📢 Generating guideline for ${month} ${day}`);

    // Fetch Kingdom Focus prayers for this day (all 4 intercessions)
    const { data: kingdomPrayers, error: kingdomError } = await supabase
      .from('prayer_library')
      .select('*')
      .eq('category', 'Kingdom Focus')
      .eq('month', month)
      .eq('day', day)
      .in('intercession_number', [1, 2, 3, 4])
      .order('intercession_number', { ascending: true });

    if (kingdomError) throw kingdomError;
    
    console.log(`Found ${kingdomPrayers?.length || 0} Kingdom Focus prayers for ${month} ${day}`);

    // Calculate cycle day for Listening Prayer
    const monthDays: Record<string, number> = {
      'June': 30, 'July': 31, 'August': 31, 'September': 30,
      'October': 31, 'November': 30, 'December': 31
    };
    
    let cycleDay = 0;
    const months = Object.keys(monthDays);
    const monthIndex = months.indexOf(month);
    
    if (monthIndex >= 0) {
      if (month === 'June') {
        cycleDay = day - 29;
      } else {
        cycleDay = 2;
        for (let i = 1; i < monthIndex; i++) {
          cycleDay += monthDays[months[i]];
        }
        cycleDay += day;
      }
    }
    
    const adjustedCycleDay = ((cycleDay - 1) % 91) + 1;

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

    // Calculate week number
    const currentDate = new Date(2025, months.indexOf(month), day);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // Build guideline structure
    const steps = [];

    // Step 1-4: Kingdom Focused Prayers
    if (kingdomPrayers && kingdomPrayers.length > 0) {
      kingdomPrayers.forEach((prayer: any, index: number) => {
        steps.push({
          id: `step-kingdom-${index + 1}-${Date.now()}`,
          type: 'kingdom',
          title: `Kingdom Focused Prayer ${index + 1}`,
          prayer_point_ids: [prayer.id],
          points: [{
            id: prayer.id,
            title: prayer.title,
            content: prayer.content,
            audio_url: prayer.audio_url,
          }],
          duration: 180,
        });
      });
    }

    // Step 5: Personal Supplication
    steps.push({
      id: `step-personal-${Date.now()}`,
      type: 'personal',
      title: 'Personal Supplication',
      prayer_point_ids: [],
      content: 'Take time to bring your personal requests before God. Pray for your needs, your family, and your personal concerns.',
      duration: 300,
    });

    // Step 6: Listening Section (Proverbs)
    if (listeningPrayer) {
      steps.push({
        id: `step-listening-${Date.now()}`,
        type: 'listening',
        title: 'Listening Prayer',
        prayer_point_ids: [listeningPrayer.id],
        points: [{
          id: listeningPrayer.id,
          title: listeningPrayer.title,
          content: listeningPrayer.content,
        }],
        content: listeningPrayer.content,
        reference: listeningPrayer.reference_text,
        chapter: listeningPrayer.chapter,
        startVerse: listeningPrayer.start_verse,
        endVerse: listeningPrayer.end_verse,
        audio_url: listeningPrayer.audio_url,
        duration: 240,
      });
    }

    // Step 7: Reflection & Journaling
    steps.push({
      id: `step-reflection-${Date.now()}`,
      type: 'reflection',
      title: 'Reflection & Journaling',
      prayer_point_ids: [],
      points: [],
      content: 'Take time to reflect on what you have prayed and what God has spoken to you. Write down your thoughts, insights, and what you sense God is saying.',
      duration: 0,
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

    console.log(`✅ Successfully created guideline for ${month} ${day}`);

    // Generate audio for ALL 3 voices (non-blocking)
    try {
      console.log(`🎙️ Starting multi-voice audio generation for ${month} ${day}...`);
      const audioUrlsByVoice = await generateAudioForGuideline(guideline, supabase);
      
      if (Object.keys(audioUrlsByVoice.sarah).length > 0 || 
          Object.keys(audioUrlsByVoice.theo).length > 0 || 
          Object.keys(audioUrlsByVoice.megan).length > 0) {
        
        // Update guideline steps with multi-voice audio URLs
        const updatedSteps = guideline.steps.map((step: any, stepIndex: number) => {
          if (step.type === 'kingdom' && step.points) {
            return {
              ...step,
              points: step.points.map((point: any, pointIndex: number) => ({
                ...point,
                audio_url: audioUrlsByVoice.sarah[`step${stepIndex}-p${pointIndex}`] || null, // Keep backward compatibility
                audio_urls: {
                  sarah: audioUrlsByVoice.sarah[`step${stepIndex}-p${pointIndex}`] || null,
                  theo: audioUrlsByVoice.theo[`step${stepIndex}-p${pointIndex}`] || null,
                  megan: audioUrlsByVoice.megan[`step${stepIndex}-p${pointIndex}`] || null,
                }
              }))
            };
          } else if (step.type === 'listening') {
            return {
              ...step,
              audio_url: audioUrlsByVoice.sarah[`step${stepIndex}-listening`] || null, // Keep backward compatibility
              audio_urls: {
                sarah: audioUrlsByVoice.sarah[`step${stepIndex}-listening`] || null,
                theo: audioUrlsByVoice.theo[`step${stepIndex}-listening`] || null,
                megan: audioUrlsByVoice.megan[`step${stepIndex}-listening`] || null,
              }
            };
          }
          return step;
        });

        const { error: updateError } = await supabase
          .from('guidelines')
          .update({ steps: updatedSteps })
          .eq('id', guideline.id);

        if (updateError) {
          console.error(`⚠️ Failed to update guideline with audio URLs:`, updateError);
        } else {
          const totalFiles = Object.values(audioUrlsByVoice).reduce((sum, v) => sum + Object.keys(v).length, 0);
          console.log(`✅ Guideline ${guideline.id} updated with ${totalFiles} audio files (3 voices)`);
        }
      } else {
        console.warn(`⚠️ No audio generated for ${month} ${day} - will use browser TTS fallback`);
      }
    } catch (audioError) {
      console.error(`⚠️ Audio generation failed for ${month} ${day}:`, audioError);
      console.log(`   Guideline created successfully - users will get browser TTS fallback`);
    }

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
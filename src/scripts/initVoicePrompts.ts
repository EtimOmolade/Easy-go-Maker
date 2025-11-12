// One-time script to generate voice prompts
// Run this in browser console: import('./scripts/initVoicePrompts').then(m => m.initVoicePrompts())

import { supabase } from "@/integrations/supabase/client";

export const initVoicePrompts = async () => {
  console.log('🎙️ Starting voice prompt generation...');
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-voice-prompts', {
      body: {}
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Voice prompts generated successfully!');
    console.log('Results:', data);
  } catch (error) {
    console.error('❌ Failed:', error);
  }
};

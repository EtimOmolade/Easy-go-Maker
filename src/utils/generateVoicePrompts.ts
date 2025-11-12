// Utility to generate voice prompts using Speechmatics
import { supabase } from "@/integrations/supabase/client";

export const generateVoicePrompts = async () => {
  try {
    console.log('🎙️ Generating voice prompts...');
    
    const { data, error } = await supabase.functions.invoke('generate-voice-prompts', {
      body: {}
    });

    if (error) {
      console.error('❌ Error generating voice prompts:', error);
      throw error;
    }

    console.log('✅ Voice prompts generated:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to generate voice prompts:', error);
    throw error;
  }
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all users with reminders enabled
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name, email, streak_count, reminders_enabled")
      .eq("reminders_enabled", true);

    if (profilesError) throw profilesError;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const profile of profiles || []) {
      // Get user's prayer count this week
      const { data: weeklyPrayers, error: prayersError } = await supabaseClient
        .from("daily_prayers")
        .select("id")
        .eq("user_id", profile.id)
        .gte("completed_at", weekAgo.toISOString());

      if (prayersError) continue;

      const prayerCount = weeklyPrayers?.length || 0;

      // Log summary (email functionality requires RESEND_API_KEY secret to be configured)
      console.log(`Would send weekly summary to ${profile.email}: ${prayerCount} prayers, ${profile.streak_count} day streak`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-weekly-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

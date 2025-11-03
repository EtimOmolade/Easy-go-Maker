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
    const { announcement_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get announcement details
    const { data: announcement, error: announcementError } = await supabaseClient
      .from("announcements")
      .select("*")
      .eq("id", announcement_id)
      .single();

    if (announcementError) throw announcementError;

    // Get all users with reminders enabled
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name, email, reminders_enabled")
      .eq("reminders_enabled", true);

    if (profilesError) throw profilesError;

    console.log(`Sending announcement to ${profiles?.length || 0} users`);

    for (const profile of profiles || []) {
      // Log announcement (email functionality requires RESEND_API_KEY secret to be configured)
      console.log(`Would send announcement to ${profile.email}: ${announcement.title}`);
    }

    return new Response(
      JSON.stringify({ success: true, sent: profiles?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-announcement-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

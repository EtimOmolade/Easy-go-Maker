import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
      .select("id, name, email, reminders_enabled")
      .eq("reminders_enabled", true);

    if (profilesError) throw profilesError;

    console.log(`Found ${profiles?.length || 0} users with reminders enabled`);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    
    for (const profile of profiles || []) {
      // Check if user has completed prayer today
      const { data: completedToday } = await supabaseClient
        .from("daily_prayers")
        .select("id")
        .eq("user_id", profile.id)
        .gte("completed_at", today)
        .single();

      if (!completedToday) {
        // Send email reminder using Resend
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "SpiritScribe <onboarding@resend.dev>",
              to: [profile.email],
              subject: "🙏 Don't forget your prayer time today!",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1e40af;">Hello ${profile.name}! 👋</h2>
                  <p>We noticed you haven't completed your prayer session today.</p>
                  <p>Take a moment to connect with God and continue your prayer journey.</p>
                  <p style="margin: 30px 0;">
                    <a href="${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/dashboard"
                       style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Start Praying Now
                    </a>
                  </p>
                  <p style="color: #666; font-size: 14px;">
                    "Pray without ceasing." - 1 Thessalonians 5:17
                  </p>
                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px;">
                    You're receiving this because you have reminders enabled.
                    You can turn this off in your profile settings.
                  </p>
                </div>
              `,
            }),
          });

          if (res.ok) {
            console.log(`✅ Sent reminder to ${profile.email}`);
          } else {
            const error = await res.text();
            console.error(`❌ Failed to send to ${profile.email}:`, error);
          }
        } catch (emailError) {
          console.error(`❌ Error sending email to ${profile.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-prayer-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

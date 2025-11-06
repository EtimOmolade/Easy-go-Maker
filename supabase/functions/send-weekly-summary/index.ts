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

      // Send weekly summary email using Resend
      try {
        const streakEmoji = profile.streak_count >= 7 ? "🔥" : "⭐";
        const encouragement = prayerCount >= 5 ? "Amazing dedication!" : prayerCount >= 3 ? "Great progress!" : "Keep going!";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "SpiritScribe <onboarding@resend.dev>",
            to: [profile.email],
            subject: "📊 Your Weekly Prayer Summary",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Hey ${profile.name}! 👋</h2>
                <p>Here's your prayer journey summary for this week:</p>

                <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 20px 0;">
                  <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                      <h3 style="margin: 0; color: #1e40af; font-size: 32px;">${prayerCount}</h3>
                      <p style="margin: 8px 0 0 0; color: #666;">Prayer Sessions</p>
                    </div>
                    <div>
                      <h3 style="margin: 0; color: #d97706; font-size: 32px;">${streakEmoji} ${profile.streak_count}</h3>
                      <p style="margin: 8px 0 0 0; color: #666;">Day Streak</p>
                    </div>
                  </div>
                </div>

                <p style="background-color: #fef3c7; padding: 16px; border-left: 4px solid #d97706; border-radius: 4px;">
                  <strong>${encouragement}</strong> ${prayerCount < 7 ? "Try to pray every day this week!" : "You're building a strong prayer habit!"}
                </p>

                <p style="margin: 30px 0;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/dashboard"
                     style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Continue Your Journey
                  </a>
                </p>

                <p style="color: #666; font-size: 14px;">
                  "Devote yourselves to prayer, being watchful and thankful." - Colossians 4:2
                </p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  Weekly summaries are sent every Sunday.
                  You can turn this off in your profile settings.
                </p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          console.log(`✅ Sent weekly summary to ${profile.email}`);
        } else {
          const error = await res.text();
          console.error(`❌ Failed to send to ${profile.email}:`, error);
        }
      } catch (emailError) {
        console.error(`❌ Error sending email to ${profile.email}:`, emailError);
      }
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

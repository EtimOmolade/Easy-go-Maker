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
            from: "SpiritConnect <noreply@spiritconnects.org>",
            to: [profile.email],
            subject: "📊 Your Weekly Prayer Summary",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 40px 0;">
                      <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Header with Logo -->
                        <tr>
                          <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%); border-radius: 8px 8px 0 0;">
                            <img src="https://dev.spiritconnects.org/logo-192.png" alt="SpiritConnect" style="height: 64px; width: 64px; margin-bottom: 16px;" />
                            <h1 style="margin: 0; color: #FFFEE9; font-size: 28px; font-weight: 600;">SpiritConnect</h1>
                            <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Weekly Prayer Summary</p>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hey ${profile.name}! 👋</h2>
                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                              Here's your prayer journey summary for this week:
                            </p>
                            
                            <!-- Stats -->
                            <table role="presentation" style="width: 100%; margin: 0 0 24px; background-color: #FFFEE9; border-radius: 8px; padding: 24px;">
                              <tr>
                                <td style="text-align: center; padding: 16px;">
                                  <p style="margin: 0; color: #700608; font-size: 36px; font-weight: bold;">${prayerCount}</p>
                                  <p style="margin: 8px 0 0; color: #666666; font-size: 14px;">Prayer Sessions</p>
                                </td>
                                <td style="text-align: center; padding: 16px;">
                                  <p style="margin: 0; color: #700608; font-size: 36px; font-weight: bold;">${streakEmoji} ${profile.streak_count}</p>
                                  <p style="margin: 8px 0 0; color: #666666; font-size: 14px;">Day Streak</p>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Encouragement -->
                            <table role="presentation" style="width: 100%; margin: 0 0 24px; padding: 16px; background-color: #FFFEE9; border-radius: 6px; border-left: 4px solid #F4E180;">
                              <tr>
                                <td>
                                  <p style="margin: 0; color: #700608; font-size: 16px; font-weight: 600;">${encouragement}</p>
                                  <p style="margin: 8px 0 0; color: #666666; font-size: 14px;">
                                    ${prayerCount < 7 ? "Try to pray every day this week!" : "You're building a strong prayer habit!"}
                                  </p>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 0 24px; width: 100%;">
                              <tr>
                                <td align="center">
                                  <table role="presentation">
                                    <tr>
                                      <td style="border-radius: 6px; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%);">
                                        <a href="https://dev.spiritconnects.org/dashboard" 
                                           style="display: inline-block; padding: 14px 32px; color: #FFFEE9; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                          Continue Your Journey
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Scripture -->
                            <p style="margin: 0; color: #666666; font-size: 14px; font-style: italic; text-align: center;">
                              "Devote yourselves to prayer, being watchful and thankful." - Colossians 4:2
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #999999; font-size: 12px;">
                              Weekly summaries are sent every Sunday.
                            </p>
                            <p style="margin: 0 0 16px; color: #999999; font-size: 12px;">
                              <a href="https://dev.spiritconnects.org/profile?unsubscribe=true" style="color: #700608; text-decoration: underline;">Unsubscribe from weekly summaries</a>
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                              © ${new Date().getFullYear()} SpiritConnect. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
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

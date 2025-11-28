// Prayer Reminder Email Service
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
              from: "SpiritConnect <noreply@spiritconnects.org>",
              to: [profile.email],
              subject: "🙏 Don't forget your prayer time today!",
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
                              <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Prayer Reminder</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hello ${profile.name}! 👋</h2>
                              <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.5;">
                                We noticed you haven't completed your prayer session today.
                              </p>
                              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                Take a moment to connect with God and continue your prayer journey.
                              </p>
                              
                              <!-- CTA Button -->
                              <table role="presentation" style="margin: 0 0 24px; width: 100%;">
                                <tr>
                                  <td align="center">
                                    <table role="presentation">
                                      <tr>
                                        <td style="border-radius: 6px; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%);">
                                          <a href="https://dev.spiritconnects.org/dashboard" 
                                             style="display: inline-block; padding: 14px 32px; color: #FFFEE9; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                            Start Praying Now
                                          </a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Scripture -->
                              <table role="presentation" style="width: 100%; margin: 24px 0 0; padding: 20px; background-color: #FFFEE9; border-radius: 6px; border-left: 4px solid #F4E180;">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #700608; font-size: 14px; font-style: italic;">
                                      "Pray without ceasing." - 1 Thessalonians 5:17
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                              <p style="margin: 0 0 8px; color: #999999; font-size: 12px;">
                                You're receiving this because you have reminders enabled.
                              </p>
                              <p style="margin: 0 0 16px; color: #999999; font-size: 12px;">
                                <a href="https://dev.spiritconnects.org/profile?unsubscribe=true" style="color: #700608; text-decoration: underline;">Unsubscribe from reminders</a>
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

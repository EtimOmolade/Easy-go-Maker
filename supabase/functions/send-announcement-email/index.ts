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
    const { message_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get encouragement message details
    const { data: message, error: messageError } = await supabaseClient
      .from("encouragement_messages")
      .select("*")
      .eq("id", message_id)
      .single();

    if (messageError) throw messageError;

    // Get all users with reminders enabled
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name, email, reminders_enabled")
      .eq("reminders_enabled", true);

    if (profilesError) throw profilesError;

    console.log(`Sending encouragement message to ${profiles?.length || 0} users`);

    // Helper function to validate email format
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Helper function to delay between emails (rate limiting)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let sentCount = 0;
    let failedCount = 0;

    for (const profile of profiles || []) {
      // Validate email format
      if (!isValidEmail(profile.email)) {
        console.error(`❌ Invalid email format: ${profile.email}`);
        failedCount++;
        continue;
      }

      // Send encouragement email using Resend
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "SpiritConnect <noreply@spiritconnects.org>",
            to: [profile.email],
            subject: "📢 New Community Announcement",
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
                            <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Community Announcement</p>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hello ${profile.name}! 👋</h2>
                            
                            <!-- Message Content -->
                            <div style="background-color: #FFFEE9; padding: 24px; border-left: 4px solid #F4E180; border-radius: 4px; margin: 20px 0;">
                              <p style="margin: 0; white-space: pre-wrap; color: #333333; font-size: 16px; line-height: 1.6;">${message.content}</p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 24px 0; width: 100%;">
                              <tr>
                                <td align="center">
                                  <table role="presentation">
                                    <tr>
                                      <td style="border-radius: 6px; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%);">
                                        <a href="https://dev.spiritconnects.org/dashboard" 
                                           style="display: inline-block; padding: 14px 32px; color: #FFFEE9; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                          View on Dashboard
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #999999; font-size: 12px;">
                              This is a community announcement from SpiritConnect.
                            </p>
                            <p style="margin: 0 0 16px; color: #999999; font-size: 12px;">
                              <a href="https://dev.spiritconnects.org/profile?unsubscribe=true" style="color: #700608; text-decoration: underline;">Unsubscribe from notifications</a>
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
          console.log(`✅ Sent announcement to ${profile.email}`);
          sentCount++;
        } else {
          const error = await res.text();
          console.error(`❌ Failed to send to ${profile.email}:`, error);
          failedCount++;
        }

        // Rate limiting: Wait 600ms between emails (allows ~1.6 emails/sec, safely under 2/sec limit)
        await delay(600);
      } catch (emailError) {
        console.error(`❌ Error sending email to ${profile.email}:`, emailError);
        failedCount++;
      }
    }

    console.log(`📊 Email sending complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-announcement-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

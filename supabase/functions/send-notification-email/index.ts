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

  console.log('🔔 send-notification-email function invoked');

  try {
    const { notification_id, user_id, title, message, type } = await req.json();
    console.log('📋 Notification details:', { notification_id, user_id, title, type });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get user details
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name, email, reminders_enabled")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      throw profileError;
    }

    // Check if user has reminders enabled
    if (!profile.reminders_enabled) {
      console.log('⏭️ User has reminders disabled, skipping email');
      return new Response(
        JSON.stringify({ message: "User has reminders disabled" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      console.error('❌ Invalid email format:', profile.email);
      throw new Error("Invalid email format");
    }

    // Determine email subject and content based on notification type
    let subject = "🔔 SpiritConnect Notification";
    let emailContent = message;
    let ctaUrl = "https://dev.spiritconnects.org/dashboard";
    let ctaText = "View Details";
    let showUnsubscribe = true;

    switch (type) {
      case "testimony_rejected":
        subject = "📝 Update on Your Testimony";
        ctaUrl = "https://dev.spiritconnects.org/profile";
        ctaText = "View in Profile";
        break;
      case "testimony_approved":
        subject = "✨ Your Testimony Has Been Approved!";
        ctaUrl = "https://dev.spiritconnects.org/testimonies";
        ctaText = "View Testimonies";
        break;
      case "guideline_new":
        subject = "🕊️ New Prayer Guideline Available";
        ctaUrl = "https://dev.spiritconnects.org/guidelines";
        ctaText = "Start Praying";
        break;
      case "streak_milestone":
        subject = "🔥 Congratulations on Your Prayer Streak!";
        ctaUrl = "https://dev.spiritconnects.org/profile";
        ctaText = "View Achievement";
        break;
      case "admin_testimony_pending":
        subject = "👀 New Testimony Awaiting Review";
        ctaUrl = "https://dev.spiritconnects.org/admin";
        ctaText = "Review Now";
        break;
      case "prayer_reminder":
        subject = "🙏 Time for Your Daily Prayer";
        ctaUrl = "https://dev.spiritconnects.org/guidelines";
        ctaText = "Start Praying";
        break;
    }

    console.log('📧 Sending email to:', profile.email);

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SpiritConnect <noreply@spiritconnects.org>",
        to: [profile.email],
        subject: subject,
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
                        <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Notification</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hello ${profile.name}! 👋</h2>
                        
                        <!-- Message Content -->
                        <div style="background-color: #FFFEE9; padding: 24px; border-left: 4px solid #700608; border-radius: 4px; margin: 20px 0;">
                          <h3 style="margin: 0 0 12px; color: #700608; font-size: 18px;">${title}</h3>
                          <p style="margin: 0; white-space: pre-wrap; color: #333333; font-size: 16px; line-height: 1.6;">${emailContent}</p>
                        </div>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 24px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <table role="presentation">
                                <tr>
                                  <td style="border-radius: 6px; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%);">
                                    <a href="${ctaUrl}" 
                                       style="display: inline-block; padding: 14px 32px; color: #FFFEE9; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                      ${ctaText}
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
                          You're receiving this notification because you have notifications enabled in SpiritConnect.
                        </p>
                        ${showUnsubscribe ? `
                        <p style="margin: 0 0 16px; color: #999999; font-size: 12px;">
                          <a href="https://dev.spiritconnects.org/profile?unsubscribe=true" style="color: #700608; text-decoration: underline;">Unsubscribe from notifications</a>
                        </p>
                        ` : ''}
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
      console.log('✅ Email sent successfully to:', profile.email);
      return new Response(
        JSON.stringify({ success: true, email: profile.email }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      const errorText = await res.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }
  } catch (error: any) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

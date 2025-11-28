import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const userName = name || "Friend";

    // Send welcome email via Resend
    const htmlBody = `
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
                    <h1 style="margin: 0; color: #FFFEE9; font-size: 32px; font-weight: 600;">Welcome to SpiritConnect</h1>
                    <p style="margin: 12px 0 0; color: #F4E180; font-size: 16px;">Your journey of daily prayer begins today</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hello ${userName}! 👋</h2>
                    <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.6;">
                      We're thrilled to have you join our community of believers committed to growing in their prayer life.
                    </p>
                    <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.6;">
                      SpiritConnect provides daily prayer guidelines to help you connect with God through structured intercession, 
                      kingdom prayers, and reflective listening.
                    </p>
                    
                    <!-- Features -->
                    <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                      <tr>
                        <td style="padding: 16px; background-color: #FFFEE9; border-radius: 6px; margin-bottom: 12px;">
                          <p style="margin: 0; color: #700608; font-size: 16px; font-weight: 600;">📖 Daily Guidelines</p>
                          <p style="margin: 8px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                            Receive fresh prayer guidance every day to deepen your spiritual practice
                          </p>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background-color: #FFFEE9; border-radius: 6px; margin-bottom: 12px;">
                          <p style="margin: 0; color: #700608; font-size: 16px; font-weight: 600;">✍️ Prayer Journal</p>
                          <p style="margin: 8px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                            Document your prayers, reflections, and answered prayers
                          </p>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background-color: #FFFEE9; border-radius: 6px;">
                          <p style="margin: 0; color: #700608; font-size: 16px; font-weight: 600;">🔥 Build Your Streak</p>
                          <p style="margin: 8px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                            Stay consistent and watch your prayer streak grow day by day
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
                                  Start Your Prayer Journey
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Tips -->
                    <table role="presentation" style="width: 100%; margin: 24px 0 0; padding: 20px; background-color: #FFFEE9; border-radius: 6px; border-left: 4px solid #F4E180;">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #700608; font-size: 14px; font-weight: 600;">💡 Quick Tip</p>
                          <p style="margin: 8px 0 0; color: #666666; font-size: 13px; line-height: 1.5;">
                            Set aside 15-20 minutes each day for your prayer time. Morning hours often work best, 
                            but choose what fits your schedule. Enable reminders in your profile to stay consistent!
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6; font-style: italic; text-align: center;">
                      "Pray without ceasing." - 1 Thessalonians 5:17
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #999999; font-size: 12px;">
                      Need help? Visit our dashboard or contact support
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
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SpiritConnect <noreply@spiritconnects.org>',
        to: [email],
        subject: 'Welcome to SpiritConnect! 🕊️',
        html: htmlBody
      })
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    console.log(`Welcome email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

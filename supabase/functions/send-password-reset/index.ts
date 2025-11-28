import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const { email, redirectTo } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate password reset link using admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || 'https://dev.spiritconnects.org/update-password'
      }
    });

    if (linkError || !linkData) {
      console.error("Error generating reset link:", linkError);
      throw linkError || new Error("Failed to generate reset link");
    }

    // Send custom branded email via Resend
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
                    <h1 style="margin: 0; color: #FFFEE9; font-size: 28px; font-weight: 600;">SpiritConnect</h1>
                    <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Your Daily Prayer Companion</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                    <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.5;">Hello,</p>
                    <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="margin: 0 0 24px;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #700608 0%, #8B0A0C 100%);">
                          <a href="${linkData.properties.action_link}" 
                             style="display: inline-block; padding: 14px 32px; color: #FFFEE9; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 16px; color: #666666; font-size: 14px; line-height: 1.5;">
                      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                    
                    <!-- Security Info -->
                    <table role="presentation" style="width: 100%; margin: 24px 0 0; padding: 16px; background-color: #FFFEE9; border-radius: 6px; border-left: 4px solid #700608;">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #700608; font-size: 14px; font-weight: 600;">🔒 Security Note</p>
                          <p style="margin: 8px 0 0; color: #666666; font-size: 13px; line-height: 1.5;">
                            This link will expire in <strong>1 hour</strong> for your security.
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
                      This email was sent by SpiritConnect
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
        subject: 'Reset Your SpiritConnect Password',
        html: htmlBody
      })
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    console.log(`Password reset email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset link sent to your email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get userId from request body first
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      requestBody = {};
    }
    
    const { userId } = requestBody;
    
    let user;
    let userEmail;
    
    if (userId) {
      // Use provided userId (when called from login flow after sign out)
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.error("Error getting user by ID:", userError);
        throw new Error("Invalid user ID");
      }
      
      user = userData.user;
      userEmail = user.email;
    } else {
      // Fall back to auth header (when called from authenticated session)
      const authHeader = req.headers.get("Authorization");
      
      if (!authHeader) {
        throw new Error("No authorization header or userId provided");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !authUser) {
        console.error("Error getting user from token:", userError);
        throw new Error("Invalid token");
      }
      
      user = authUser;
      userEmail = user.email;
    }
    
    if (!userEmail) {
      throw new Error("User email not found");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Hash OTP using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedOtp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store hashed OTP in database
    const { error: insertError } = await supabase
      .from("user_2fa")
      .upsert({
        user_id: user.id,
        otp_code: hashedOtp,
        otp_expires_at: expiresAt.toISOString(),
        is_verified: false,
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw insertError;
    }

    // Send OTP via email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SpiritConnect <noreply@spiritconnects.org>",
        to: [userEmail],
        subject: "Your SpiritConnect Verification Code",
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
                        <p style="margin: 8px 0 0; color: #F4E180; font-size: 14px;">Two-Factor Authentication</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Verification Code</h2>
                        <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                          Enter this code to complete your sign-in:
                        </p>
                        
                        <!-- OTP Code -->
                        <div style="background-color: #FFFEE9; padding: 24px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border: 2px solid #F4E180; border-radius: 8px; color: #700608;">
                          ${otp}
                        </div>
                        
                        <!-- Security Info -->
                        <table role="presentation" style="width: 100%; margin: 24px 0 0; padding: 16px; background-color: #FFFEE9; border-radius: 6px; border-left: 4px solid #700608;">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #700608; font-size: 14px; font-weight: 600;">⏱️ This code expires in 5 minutes</p>
                              <p style="margin: 8px 0 0; color: #666666; font-size: 13px; line-height: 1.5;">
                                If you didn't request this code, please ignore this email.
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
                          SpiritConnect - Your Daily Prayer Companion
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

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Error sending email:", errorData);
      throw new Error("Failed to send verification code");
    }

    console.log(`OTP generated for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent to your email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in generate-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

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
        from: "SpiritConnect <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Your SpiritConnect Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7E69AB;">SpiritConnect Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">SpiritConnect - Your Daily Prayer Companion</p>
          </div>
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

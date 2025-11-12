import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    const { otp } = await req.json();

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    if (!otp) {
      throw new Error("OTP is required");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    // Hash the provided OTP
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedOtp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Get stored OTP
    const { data: otpData, error: otpError } = await supabase
      .from("user_2fa")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (otpError || !otpData) {
      throw new Error("No verification code found");
    }

    // Check if OTP has expired
    if (new Date(otpData.otp_expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from("user_2fa").delete().eq("user_id", user.id);
      throw new Error("Verification code has expired");
    }

    // Verify OTP
    if (otpData.otp_code !== hashedOtp) {
      throw new Error("Invalid verification code");
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from("user_2fa")
      .update({ is_verified: true })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating OTP:", updateError);
      throw updateError;
    }

    console.log(`OTP verified for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification successful" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

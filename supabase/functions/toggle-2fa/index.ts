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
    const { enabled } = await req.json();

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    if (typeof enabled !== "boolean") {
      throw new Error("enabled field is required and must be boolean");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    // Update 2FA status in profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ two_factor_enabled: enabled })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating 2FA status:", updateError);
      throw updateError;
    }

    // If disabling 2FA, clean up any OTP records
    if (!enabled) {
      await supabase.from("user_2fa").delete().eq("user_id", user.id);
    }

    console.log(`2FA ${enabled ? 'enabled' : 'disabled'} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
        two_factor_enabled: enabled
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in toggle-2fa:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Hello ${profile.name}! 👋</h2>
                <div style="background-color: #f3f4f6; padding: 20px; border-left: 4px solid #d97706; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${message.content}</p>
                </div>
                <p style="margin: 30px 0;">
                  <a href="https://dev.spiritconnects.org/dashboard"
                     style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View on Dashboard
                  </a>
                </p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This is a community announcement from SpiritConnect.
                  You're receiving this because you have notifications enabled.
                </p>
              </div>
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

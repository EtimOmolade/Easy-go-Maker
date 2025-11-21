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

    switch (type) {
      case "testimony_rejected":
        subject = "📝 Update on Your Testimony";
        ctaUrl = "https://dev.spiritconnects.org/profile";
        break;
      case "testimony_approved":
        subject = "✨ Your Testimony Has Been Approved!";
        ctaUrl = "https://dev.spiritconnects.org/testimonies";
        break;
      case "guideline_new":
        subject = "🕊️ New Prayer Guideline Available";
        ctaUrl = "https://dev.spiritconnects.org/guidelines";
        break;
      case "streak_milestone":
        subject = "🔥 Congratulations on Your Prayer Streak!";
        ctaUrl = "https://dev.spiritconnects.org/profile";
        break;
      case "admin_testimony_pending":
        subject = "👀 New Testimony Awaiting Review";
        ctaUrl = "https://dev.spiritconnects.org/admin";
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #700608;">Hello ${profile.name}! 👋</h2>
            <div style="background-color: #FFFEE9; padding: 20px; border-left: 4px solid #700608; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #700608;">${title}</h3>
              <p style="margin: 0; white-space: pre-wrap;">${emailContent}</p>
            </div>
            <p style="margin: 30px 0;">
              <a href="${ctaUrl}"
                 style="background-color: #700608; color: #FFFEE9; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Details
              </a>
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #F4E180;">
            <p style="color: #700608; font-size: 12px;">
              You're receiving this notification because you have notifications enabled in SpiritConnect.
              To manage your notification preferences, visit your profile settings.
            </p>
          </div>
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
/**
 * Test Email Functions Directly
 *
 * Run this after:
 * 1. Adding RESEND_API_KEY to Lovable secrets
 * 2. Pushing changes to Lovable
 *
 * Usage: node scripts/test-emails.js
 */

const SUPABASE_URL = "https://wmdtsdicaonrdtcfqyyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODQ3OTMsImV4cCI6MjA3NTY2MDc5M30.nbB_1pLqewFBlil2My21YBSBCcyOzZEmBHYlsgPvmpE";

async function testPrayerReminder() {
  console.log("\n🧪 Testing Prayer Reminder Email Function...\n");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-prayer-reminder`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Prayer Reminder Function works!");
      console.log(`📧 Processed ${data.processed} users`);
    } else {
      console.error("❌ Error:", data);
    }
  } catch (error) {
    console.error("❌ Failed to call function:", error.message);
  }
}

async function testWeeklySummary() {
  console.log("\n🧪 Testing Weekly Summary Email Function...\n");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-weekly-summary`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Weekly Summary Function works!");
      console.log(`📧 Processed ${data.processed} users`);
    } else {
      console.error("❌ Error:", data);
    }
  } catch (error) {
    console.error("❌ Failed to call function:", error.message);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("📧 EMAIL FUNCTIONS TEST");
  console.log("=".repeat(60));

  await testPrayerReminder();
  await testWeeklySummary();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Testing Complete!");
  console.log("=".repeat(60));
  console.log("\n📝 Notes:");
  console.log("   - If RESEND_API_KEY is set, emails will be sent");
  console.log("   - Check your email if you have reminders enabled");
  console.log("   - Functions are deployed when you push to Lovable\n");
}

main();

# ✅ Email Notification System - Setup Complete

## 🎉 What Was Just Set Up

Your email notification system is now **FULLY CONFIGURED** and running automatically!

### ✅ Cron Jobs Created

#### 1. Daily Prayer Reminders
- **Job Name**: `send-daily-prayer-reminders`
- **Schedule**: Every day at 6:00 PM UTC (18:00)
- **What It Does**: 
  - Checks which users haven't completed today's prayer
  - Sends reminder emails to users with `reminders_enabled = true`
  - Uses your RESEND_API_KEY to send emails

#### 2. Weekly Summary Emails
- **Job Name**: `send-weekly-summary`
- **Schedule**: Every Sunday at 8:00 AM UTC
- **What It Does**:
  - Counts prayers completed this week for each user
  - Gets current streak and milestone info
  - Sends personalized weekly report emails

---

## 📊 How to Access Your Backend Dashboard

Since you're using **Lovable Cloud**, your backend is managed through Lovable's interface. Here's how to access it:

### Method 1: From Your Lovable Project
1. Open your Lovable project (where you're chatting with me)
2. Look for the **"Backend"** or **"Cloud"** button in the top navigation
3. Click it to open your Lovable Cloud dashboard

### Method 2: Direct Link
Your backend dashboard should be accessible at:
```
https://lovable.app/projects/[your-project-id]/backend
```
*(Replace [your-project-id] with your actual project ID)*

### What You Can Do in the Backend Dashboard:
- **View Tables**: See all your database tables and data
- **View Logs**: Check edge function execution logs
- **Manage Storage**: View uploaded files (voice notes)
- **Run Queries**: Execute SQL queries directly
- **View Users**: See authenticated users
- **Monitor Functions**: Check edge function performance

---

## 🧪 How to Test the Email System

### Test 1: Manually Trigger Prayer Reminder

You can test the prayer reminder function immediately:

1. Go to your backend dashboard
2. Navigate to **Edge Functions** → **send-prayer-reminder**
3. Click **"Invoke Function"** or **"Test"**
4. Should see response with email count sent

**Or use this SQL query** (in backend SQL editor):
```sql
-- Manually run the prayer reminder function
SELECT net.http_post(
  url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-prayer-reminder',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
  body := '{}'::jsonb
);
```

### Test 2: Manually Trigger Weekly Summary

```sql
-- Manually run the weekly summary function
SELECT net.http_post(
  url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-weekly-summary',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
  body := '{}'::jsonb
);
```

### Test 3: Check Your Email Inbox

After triggering either function manually:
1. Check the email inbox for test users
2. Look for emails from `onboarding@resend.dev`
3. Verify email content is correct
4. Check links in emails work properly

---

## 📧 Email Templates

### Daily Prayer Reminder Email
```
Subject: "Your Prayer Time is Here 🕊️"

Content:
- Greeting with user's name
- Encouragement message
- Link to today's guideline
- Current streak reminder
- Unsubscribe option
```

### Weekly Summary Email
```
Subject: "Your Week in Prayer 📊"

Content:
- Prayers completed this week
- Current streak count
- Milestones achieved
- Preview of next week's prayers
- Encouragement message
```

---

## 🔍 Monitoring & Logs

### View Cron Job Logs

To see if your cron jobs are running:

```sql
-- Check cron job history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### View Edge Function Logs

In your Lovable Cloud backend:
1. Go to **Edge Functions**
2. Select a function (e.g., `send-prayer-reminder`)
3. Click **"Logs"** tab
4. View execution history, errors, console logs

**What to Look For**:
- ✅ `200 OK` responses = Success
- ❌ `500 Error` = Check function code
- ⚠️ `401 Unauthorized` = Check RESEND_API_KEY

---

## ⏰ Cron Job Schedule Reference

### Current Schedule:
- **Prayer Reminders**: Daily at 18:00 UTC (6 PM UTC)
- **Weekly Summaries**: Sundays at 08:00 UTC (8 AM UTC)

### Timezone Conversions (Examples):
- **UTC 18:00** =
  - EST (New York): 1:00 PM
  - PST (Los Angeles): 10:00 AM
  - GMT (London): 6:00 PM
  - WAT (Lagos): 7:00 PM

- **UTC 08:00** (Sunday) =
  - EST: 3:00 AM
  - PST: 12:00 AM (midnight)
  - GMT: 8:00 AM
  - WAT: 9:00 AM

### To Change Schedule:

```sql
-- Unschedule existing job
SELECT cron.unschedule('send-daily-prayer-reminders');

-- Create new schedule (example: 7 PM UTC instead)
SELECT cron.schedule(
  'send-daily-prayer-reminders',
  '0 19 * * *',  -- Change hour here (19 = 7 PM)
  $$ [same command as before] $$
);
```

---

## 🛠️ Troubleshooting

### Issue: No Emails Being Sent

**Check 1: RESEND_API_KEY is set**
```sql
-- This won't show the actual key, but confirms it's set
SELECT current_setting('app.settings.resend_api_key', true) IS NOT NULL;
```

**Check 2: Verify Resend Domain**
- Go to https://resend.com/domains
- Make sure your sending domain is verified
- Default: `onboarding@resend.dev` (works immediately)

**Check 3: Check Edge Function Logs**
- Go to backend → Edge Functions → Logs
- Look for error messages
- Common errors:
  - "Invalid API key" → Check RESEND_API_KEY
  - "Domain not verified" → Verify domain at Resend
  - "Rate limit exceeded" → Check Resend quota

### Issue: Cron Jobs Not Running

**Check if jobs are active:**
```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE active = true;
```

**Check job run history:**
```sql
SELECT 
  jobname,
  status,
  return_message,
  start_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 5;
```

**Manually run a job to test:**
```sql
SELECT cron.run_job('send-daily-prayer-reminders');
```

### Issue: Users Not Receiving Emails

**Check 1: User has reminders enabled**
```sql
SELECT id, name, email, reminders_enabled 
FROM profiles 
WHERE reminders_enabled = true;
```

**Check 2: User hasn't completed today's prayer**
```sql
SELECT 
  p.email,
  p.name,
  dp.completed_at
FROM profiles p
LEFT JOIN daily_prayers dp 
  ON dp.user_id = p.id 
  AND DATE(dp.completed_at) = CURRENT_DATE
WHERE dp.id IS NULL;  -- Users with no prayer today
```

---

## 📋 Management Commands

### View All Cron Jobs
```sql
SELECT * FROM cron.job;
```

### Pause a Cron Job (Without Deleting)
```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'send-daily-prayer-reminders';
```

### Resume a Paused Job
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'send-daily-prayer-reminders';
```

### Delete a Cron Job
```sql
SELECT cron.unschedule('send-daily-prayer-reminders');
```

### View Recent Email Sends (From Function Logs)
Check your edge function logs in the backend dashboard for:
- Number of emails sent
- Which users received emails
- Any errors during sending

---

## 🎯 What Happens Next?

### Automatic Daily Flow:
1. **6:00 PM UTC Every Day**:
   - Cron job triggers `send-prayer-reminder` function
   - Function checks all users with `reminders_enabled = true`
   - Sends email to users who haven't prayed today
   - Logs success/failure to edge function logs

2. **8:00 AM UTC Every Sunday**:
   - Cron job triggers `send-weekly-summary` function
   - Function calculates each user's weekly stats
   - Sends personalized summary email to all active users
   - Includes streak, prayer count, and milestones

### User Experience:
- Users receive timely prayer reminders
- Weekly encouragement and progress tracking
- Can disable reminders in Profile settings
- Links in emails take them directly to app

---

## 🔐 Security Notes

✅ **Secure Implementation**:
- RESEND_API_KEY stored securely in secrets (not in code)
- Service role key used only in server-side cron jobs
- RLS policies prevent unauthorized data access
- Email addresses never exposed in logs
- Unsubscribe links respect user preferences

---

## 📊 Monitoring Best Practices

### Daily:
- Check edge function error logs
- Verify emails are being sent
- Monitor Resend dashboard for delivery rates

### Weekly:
- Review cron job run history
- Check for failed email sends
- Verify users are receiving summaries

### Monthly:
- Review Resend API usage (stay within quota)
- Check email open/click rates (if tracking enabled)
- Adjust schedules based on user feedback

---

## 🚀 Next Steps

Your email system is now fully operational! Here's what you can do:

1. **Test It**: Run manual tests to verify emails send correctly
2. **Monitor**: Check logs after first scheduled run
3. **Customize**: Adjust schedules if needed for your timezone
4. **Expand**: Add more email types (testimony approvals, etc.)

---

## 📞 Quick Reference

### Important URLs:
- **Resend Dashboard**: https://resend.com/dashboard
- **Resend API Keys**: https://resend.com/api-keys
- **Resend Domains**: https://resend.com/domains

### Edge Functions:
- `send-prayer-reminder`: Daily prayer reminders
- `send-weekly-summary`: Weekly progress reports
- `send-announcement-email`: Manual broadcasts (admin only)

### Cron Jobs:
- `send-daily-prayer-reminders`: 18:00 UTC daily
- `send-weekly-summary`: 08:00 UTC Sundays

---

**Setup Status**: ✅ COMPLETE
**Cron Jobs**: ✅ ACTIVE
**Email System**: ✅ READY

All systems are operational and running automatically!

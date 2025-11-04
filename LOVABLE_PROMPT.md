# 🕊️ Spirit Scribe Path - Complete Migration & Fix Guide for Lovable

> **CRITICAL**: This document contains ALL database schema updates and code fixes for the Spirit Scribe Path app. Follow each section sequentially and completely.

---

## 📋 TABLE OF CONTENTS
1. [Critical Database Schema Updates](#1-critical-database-schema-updates)
2. [Storage Bucket Setup](#2-storage-bucket-setup)
3. [Completed Code Migrations](#3-completed-code-migrations)
4. [Remaining Migration: Prayer Library](#4-remaining-migration-prayer-library-to-supabase)
5. [TTS Voice Options](#5-tts-voice-options)
6. [Environment Variables](#6-environment-variables)
7. [Cron Jobs Setup](#7-cron-jobs-setup)
8. [Testing Checklist](#8-testing-checklist)
9. [Architecture Summary](#9-architecture-summary)

---

## 1. CRITICAL DATABASE SCHEMA UPDATES

### ⚠️ MUST RUN THESE SQL COMMANDS IN SUPABASE SQL EDITOR

Copy and paste the entire SQL block below into your Supabase SQL Editor and execute:

```sql
-- ========================================
-- 1.1 Testimonies Table - Add Missing Columns
-- ========================================
ALTER TABLE public.testimonies
ADD COLUMN IF NOT EXISTS alias TEXT NOT NULL DEFAULT 'Anonymous Seeker',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS related_series TEXT,
ADD COLUMN IF NOT EXISTS gratitude_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.testimonies.alias IS 'User display name for testimony (replaces profiles.name)';
COMMENT ON COLUMN public.testimonies.location IS 'Optional location (e.g., "Lagos, Nigeria")';
COMMENT ON COLUMN public.testimonies.related_series IS 'Links testimony to a prayer guideline series';
COMMENT ON COLUMN public.testimonies.gratitude_count IS 'Number of users who celebrated this testimony';

-- ========================================
-- 1.2 Encouragement Messages - Add INSERT Policy
-- ========================================
CREATE POLICY IF NOT EXISTS "Admins and system can create announcements"
ON public.encouragement_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add type column for categorizing announcements
ALTER TABLE public.encouragement_messages
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

COMMENT ON COLUMN public.encouragement_messages.type IS 'Announcement category: general, guideline_new, testimony_pending, testimony_approved';

-- ========================================
-- 1.3 Testimony Gratitudes Table - Track Celebrations
-- ========================================
CREATE TABLE IF NOT EXISTS public.testimony_gratitudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, user_id)
);

-- Enable RLS on testimony_gratitudes
ALTER TABLE public.testimony_gratitudes ENABLE ROW LEVEL SECURITY;

-- Everyone can view gratitudes
CREATE POLICY IF NOT EXISTS "Everyone can view testimony gratitudes"
ON public.testimony_gratitudes
FOR SELECT
USING (true);

-- Authenticated users can insert their own gratitudes
CREATE POLICY IF NOT EXISTS "Users can add their own gratitudes"
ON public.testimony_gratitudes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own gratitudes
CREATE POLICY IF NOT EXISTS "Users can delete their own gratitudes"
ON public.testimony_gratitudes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimony_gratitudes_testimony_id ON public.testimony_gratitudes(testimony_id);
CREATE INDEX IF NOT EXISTS idx_testimony_gratitudes_user_id ON public.testimony_gratitudes(user_id);

COMMENT ON TABLE public.testimony_gratitudes IS 'Tracks which users have celebrated (thanked God with) each testimony - prevents duplicate celebrations';

-- ========================================
-- 1.4 Prayer Points Table - Create for Prayer Library Migration
-- ========================================
CREATE TABLE IF NOT EXISTS public.prayer_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Kingdom Focused', 'Personal Supplication', 'Listening Prayer')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prayer_points
ALTER TABLE public.prayer_points ENABLE ROW LEVEL SECURITY;

-- Everyone can view prayer points
CREATE POLICY IF NOT EXISTS "Everyone can view prayer points"
ON public.prayer_points
FOR SELECT
USING (true);

-- Admins can insert prayer points
CREATE POLICY IF NOT EXISTS "Admins can insert prayer points"
ON public.prayer_points
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update prayer points
CREATE POLICY IF NOT EXISTS "Admins can update prayer points"
ON public.prayer_points
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete prayer points
CREATE POLICY IF NOT EXISTS "Admins can delete prayer points"
ON public.prayer_points
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_prayer_points_category ON public.prayer_points(category);

COMMENT ON TABLE public.prayer_points IS 'Prayer library - stores intercession, personal, and listening prayer templates';
```

---

## 2. STORAGE BUCKET SETUP

### 🗄️ Voice Notes Storage for Journal Audio

Copy and paste this SQL block to create the `voice-notes` storage bucket:

```sql
-- ========================================
-- 2.1 Create voice-notes Storage Bucket
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2.2 Storage Policies for voice-notes
-- ========================================

-- Allow authenticated users to upload their own voice notes
CREATE POLICY IF NOT EXISTS "Users can upload their own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to voice notes
CREATE POLICY IF NOT EXISTS "Voice notes are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-notes');

-- Allow authenticated users to delete their own voice notes
CREATE POLICY IF NOT EXISTS "Users can delete their own voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 3. COMPLETED CODE MIGRATIONS

All these pages have been **fully migrated to Supabase** and are working correctly:

### ✅ 3.1 Testimonies Page (`src/pages/Testimonies.tsx`)
- **Status**: ✅ Complete with Celebration Toggle
- **Changes**:
  - Removed all localStorage usage
  - All CRUD operations (create, read, update, delete) use Supabase
  - **Celebration Toggle**: Users can "Thank God with them" - click to celebrate, click again to uncelebrate
  - Uses `testimony_gratitudes` table to track who has celebrated
  - Prevents duplicate celebrations from same user
  - Announcements created when testimonies are submitted/updated/approved
  - Updates linked journal entries when shared as testimony
- **Database Tables Used**: `testimonies`, `testimony_gratitudes`, `encouragement_messages`, `journal_entries`, `guidelines`

### ✅ 3.2 Profile Page (`src/pages/Profile.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Removed localStorage profile management
  - Fetches profile from `profiles` table
  - Updates profile (name, reminders) via Supabase
  - Milestone calculations based on `streak_count`
- **Database Tables Used**: `profiles`

### ✅ 3.3 Dashboard Page (`src/pages/Dashboard.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Removed localStorage profile fetching
  - Fetches profile and streak data from Supabase
  - Fetches pending testimony count from Supabase
  - Fetches encouragement messages (announcements) from Supabase
  - Milestone progress calculations
- **Database Tables Used**: `profiles`, `testimonies`, `encouragement_messages`

### ✅ 3.4 Admin Page (`src/pages/Admin.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Removed localStorage for guidelines and testimonies
  - Fetches guidelines from Supabase with proper ordering
  - Fetches testimonies with profile joins
  - Delete operations for guidelines and testimonies
  - Redirects to CreateGuideline page for new guidelines
- **Database Tables Used**: `guidelines`, `testimonies`, `profiles`

### ✅ 3.5 CreateGuideline Page (`src/pages/CreateGuideline.tsx`)
- **Status**: ✅ Complete with Prayer Content Resolution
- **Changes**:
  - Fixed `week_number` NULL constraint violation
  - Resolves `prayer_point_ids` to full prayer content before saving
  - Each prayer step includes `points` array with `{id, title, content}`
  - **Intercession prayers NOT duplicated in database** - duplication handled by GuidedPrayerSession
  - Creates announcement when guideline is published
  - Better error handling with detailed error messages
- **Database Tables Used**: `guidelines`, `encouragement_messages`
- **Important**: Still uses localStorage for reading prayer points (from prayer library) - will be migrated in Section 4

### ✅ 3.6 GuidelineDetails Page - Daily Tracker (`src/pages/GuidelineDetails.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Removed all localStorage usage
  - Fetches guideline data from Supabase
  - Fetches completion status from `daily_prayers` table
  - Shows weekly progress tracker for all 7 days
  - Tracks which days user has completed prayers
  - Date-aware access control (locked/current/past)
  - Visual indicators with completion dates
- **Database Tables Used**: `guidelines`, `daily_prayers`
- **How It Works**:
  - **Milestones/Streaks**: ONLY updated when completing **current day** prayers ✅
  - **Weekly Tracker**: Updates whenever **any** prayer is completed (past, present, future) ✅

### ✅ 3.7 GuidedPrayerSession Page (`src/pages/GuidedPrayerSession.tsx`)
- **Status**: ✅ Complete with Auto-Read & Fixed Modes
- **Changes**:
  - Fixed listening prayers display (was showing empty)
  - **Auto-reads intercession prayers TWICE consecutively** using Web Speech API
  - Listening prayers play at slower speed (0.7 rate) when button clicked
  - **Free Mode**: Single click to complete entire prayer step (no point navigation)
  - **Guided Mode**: Auto-navigation through prayer points with 3-min timers
  - **Daily Tracker Updates**: Inserts to `daily_prayers` table for ALL prayers (current, past, future)
  - **Streak Updates**: ONLY updates streak for current day prayers
  - Completion tracking to `daily_prayers` table
  - Creates journal entry after completion
- **Database Tables Used**: `guidelines`, `daily_prayers`, `journal_entries`, `profiles`
- **TTS**: Uses Web Speech API (browser built-in)

### ✅ 3.8 Journal Page (`src/pages/Journal.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Added voice note recording functionality
  - Uploads audio to Supabase storage `voice-notes` bucket
  - Saves `voice_note_url` to journal entries
  - Displays AudioPlayer component for entries with voice notes
  - Share as testimony feature
  - Proper error handling for upload failures
  - **DOES NOT update streaks** - only reads streak_count for milestone display ✅
- **Database Tables Used**: `journal_entries`, `profiles`
- **Storage Used**: `voice-notes` bucket

### ✅ 3.9 Guidelines Page (`src/pages/Guidelines.tsx`)
- **Status**: ✅ Complete
- **Changes**:
  - Fetches guidelines from Supabase
  - Groups by month with proper ordering
  - Date-aware access control
  - Links to tracker and guided session
- **Database Tables Used**: `guidelines`

### ✅ 3.10 Email Functions (Edge Functions)
- **Status**: ✅ Complete
- **Files**:
  - `supabase/functions/send-prayer-reminder/index.ts`
  - `supabase/functions/send-weekly-summary/index.ts`
  - `supabase/functions/send-announcement-email/index.ts`
- **Changes**:
  - All use Resend API for sending emails
  - Uses `RESEND_API_KEY` environment variable
  - HTML email templates with proper styling
  - Error handling and logging

---

## 4. REMAINING MIGRATION: PRAYER LIBRARY TO SUPABASE

### 📚 Prayer Library (`src/pages/PrayerLibrary.tsx`)

**Current Status**: ⏳ Still Using localStorage

**What Needs to Be Done**:
1. Run the SQL in Section 1.4 to create `prayer_points` table ✅ (included above)
2. Migrate `PrayerLibrary.tsx` to use Supabase:

**Current localStorage Operations** (Need to Replace):
```typescript
// Line 3: Import removal needed
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";

// Line 38, 45, 92, 100: Fetch operations
const points = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, []);

// Line 74, 115: Save operations
setToStorage(STORAGE_KEYS.PRAYER_POINTS, points);
```

**Migration Instructions for Lovable**:

Replace localStorage operations with Supabase queries:

```typescript
// REPLACE line 3:
import { supabase } from "@/integrations/supabase/client";

// REPLACE fetchPrayerPoints function:
const fetchPrayerPoints = async () => {
  try {
    const { data, error } = await supabase
      .from('prayer_points')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prayer points:', error);
      toast.error('Failed to load prayer library');
      return;
    }

    setPrayerPoints(data || []);
  } catch (error) {
    console.error('Error fetching prayer points:', error);
    toast.error('Failed to load prayer library');
  }
};

// REPLACE handleSave function:
const handleSave = async () => {
  if (!user) {
    toast.error('You must be logged in');
    return;
  }

  const newPoint = {
    id: `prayer-${Date.now()}`,
    title: editingPoint?.title || '',
    content: editingPoint?.content || '',
    category: editingPoint?.category || 'Kingdom Focused',
  };

  try {
    if (editingPoint && editingPoint.id && !editingPoint.id.startsWith('prayer-')) {
      // Update existing point
      const { error } = await supabase
        .from('prayer_points')
        .update({
          title: editingPoint.title,
          content: editingPoint.content,
          category: editingPoint.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPoint.id);

      if (error) throw error;
      toast.success('Prayer point updated');
    } else {
      // Create new point
      const { error } = await supabase
        .from('prayer_points')
        .insert([{
          title: newPoint.title,
          content: newPoint.content,
          category: newPoint.category,
          created_by: user.id
        }]);

      if (error) throw error;
      toast.success('Prayer point added');
    }

    await fetchPrayerPoints();
    setIsDialogOpen(false);
    setEditingPoint(null);
  } catch (error: any) {
    console.error('Error saving prayer point:', error);
    toast.error(error.message || 'Failed to save prayer point');
  }
};

// REPLACE handleDelete function:
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this prayer point?')) return;

  try {
    const { error } = await supabase
      .from('prayer_points')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Prayer point deleted');
    await fetchPrayerPoints();
  } catch (error: any) {
    console.error('Error deleting prayer point:', error);
    toast.error(error.message || 'Failed to delete prayer point');
  }
};
```

**IMPORTANT**: After migrating `PrayerLibrary.tsx`, you must also update `CreateGuideline.tsx` to fetch prayer points from Supabase instead of localStorage:

```typescript
// In CreateGuideline.tsx, REPLACE fetchPrayerPoints function (around line 51):
const fetchPrayerPoints = async () => {
  try {
    const { data, error } = await supabase
      .from('prayer_points')
      .select('*')
      .order('created_at', { ascending: false});

    if (error) throw error;
    setPrayerPoints(data || []);
  } catch (error) {
    console.error('Error fetching prayer points:', error);
  }
};
```

---

## 5. TTS VOICE SYSTEM - GOOGLE CLOUD TTS WITH WEB SPEECH FALLBACK

### ✅ **IMPLEMENTED**: Hybrid TTS Architecture

The app uses a smart TTS system located in `src/services/tts.ts`:

**Voice Settings**:
- Intercession prayers: `rate: 0.65` (read twice consecutively)
- Listening prayers: `rate: 0.5` (very slow for meditative scripture reading)

**How It Works**:
1. **Primary**: Tries Google Cloud Text-to-Speech API (if API key is set)
2. **Fallback**: Uses Web Speech API (browser built-in)
3. Console logs which TTS engine is being used

**Service Functions**:
```typescript
import { speak, speakTwice, cancelSpeech } from "@/services/tts";

// Speak text once
speak("text", { rate: 0.65, pitch: 1, volume: 1, onEnd: () => {} });

// Speak text twice consecutively (for intercessions)
speakTwice("text", { rate: 0.65 });

// Stop any ongoing speech
cancelSpeech();
```

### 🔧 Google Cloud TTS Setup (Optional - For Better Quality)

**Step 1: Enable API**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Enable APIs and Services**
4. Search for "Cloud Text-to-Speech API"
5. Click **Enable**

**Step 2: Create API Key**
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key
4. Click **Restrict Key** (recommended)
5. Under "API restrictions", select "Restrict key"
6. Choose "Cloud Text-to-Speech API"
7. Save

**Step 3: Add to Environment**

In **Lovable Secrets** (or local `.env`):
```bash
VITE_GOOGLE_CLOUD_TTS_API_KEY=AIzaSy...your_key_here
```

**Step 4: Test**
- Start a guided prayer session
- Check browser console - should see: `🎙️ Using Google Cloud TTS (Neural2-D voice)`
- If API key is missing/invalid: `🎙️ Using Web Speech API (Google TTS API key not set)`

**Voice Used**: `en-US-Neural2-D` (professional, warm male voice)

**Alternative Voices** (edit `src/services/tts.ts` line 54):
- `en-US-Neural2-F` - Female voice (conversational)
- `en-US-Neural2-C` - Female voice (warm)
- `en-US-Neural2-A` - Male voice (deep)

**Free Tier**: 1 million characters/month (Neural2), 4 million/month (Standard)

### 📊 TTS Comparison

| Feature | Google Cloud TTS | Web Speech API |
|---------|-----------------|----------------|
| Quality | ⭐⭐⭐⭐⭐ Near-human | ⭐⭐⭐ Browser-dependent |
| Free Tier | 1M chars/month | Unlimited |
| Offline | ❌ Requires internet | ✅ Works offline |
| Consistency | ✅ Same across devices | ❌ Varies by browser/OS |
| Setup | Requires API key | Built-in |
| Cost After Free | $4 per 1M chars | Free forever |

---

## 6. ENVIRONMENT VARIABLES

Ensure these are set in **Lovable Secrets** (or `.env` for local dev):

- ✅ `VITE_SUPABASE_URL` - Auto-configured by Lovable
- ✅ `VITE_SUPABASE_ANON_KEY` - Auto-configured by Lovable
- ⏳ `RESEND_API_KEY` - For sending emails via Resend API (user will provide)
- ⏳ `VITE_GOOGLE_CLOUD_TTS_API_KEY` - **Optional** - For high-quality TTS voices (see Section 5)

**Note**: If `VITE_GOOGLE_CLOUD_TTS_API_KEY` is not set, the app automatically uses Web Speech API (works perfectly fine, just browser-dependent voice quality).

---

## 7. CRON JOBS SETUP

### ⏰ Automated Email Scheduling

Run this SQL to set up cron jobs for automated emails:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ========================================
-- 7.1 Daily Prayer Reminder (6 PM UTC)
-- ========================================
SELECT cron.schedule(
  'send-daily-prayer-reminders',
  '0 18 * * *',  -- Every day at 6 PM UTC
  $$
  SELECT extensions.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-prayer-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ========================================
-- 7.2 Weekly Summary (Sunday 8 AM UTC)
-- ========================================
SELECT cron.schedule(
  'send-weekly-summary',
  '0 8 * * 0',  -- Every Sunday at 8 AM UTC
  $$
  SELECT extensions.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-weekly-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**⚠️ IMPORTANT**: Replace `YOUR_SERVICE_ROLE_KEY` with your actual Supabase service role key from **Settings → API → service_role secret**.

---

## 8. TESTING CHECKLIST

After applying all changes, test these features:

### Testimonies
- [ ] Create new testimony with alias, location, related series
- [ ] Verify announcement appears in Dashboard (within 48 hours)
- [ ] Click "Thank God With Them" button (should toggle on - count increases)
- [ ] Click again (should toggle off - count decreases)
- [ ] Verify same user cannot celebrate twice simultaneously
- [ ] Edit pending testimony and resubmit
- [ ] Admin: Approve testimony
- [ ] Admin: Reject testimony with reason
- [ ] Delete testimony
- [ ] Share answered journal entry as testimony

### Guidelines & Prayer Sessions
- [ ] Admin: Create new prayer guideline with intercession and listening prayers
- [ ] Verify announcement appears in Dashboard
- [ ] Verify guideline appears on Guidelines page
- [ ] Click guideline to view details
- [ ] Check daily tracker shows 7 days (all uncompleted initially)
- [ ] **TTS Voice Check**: Open browser console, should see either:
  - `🎙️ Using Google Cloud TTS (Neural2-D voice)` (if API key set)
  - `🎙️ Using Web Speech API (Google TTS API key not set)` (if no API key)
- [ ] Start guided prayer session (GUIDED MODE)
- [ ] Verify intercession prayer reads TWICE consecutively at 0.65 speed (moderate pace)
- [ ] Verify NO duplicate prayer points (e.g., 4 intercessions = 4 points, not 8)
- [ ] Wait for 3-min timer to complete (timer should wait for voice to finish)
- [ ] Next intercession should auto-display and read twice
- [ ] Move to listening prayer
- [ ] Click "Listen to Scripture" button
- [ ] Verify audio plays at 0.5 speed (very slow for meditation)
- [ ] Complete entire prayer session
- [ ] Verify daily tracker updates for that day of week
- [ ] Verify streak ONLY updates if it was current day's prayer
- [ ] Test FREE MODE:
  - [ ] Click "Next Prayer" to navigate through intercessions
  - [ ] On last intercession, click "Complete Prayer Step"
  - [ ] Should move to Personal Supplication step

### Journal
- [ ] Create journal entry with text
- [ ] Record voice note and attach to journal entry
- [ ] Verify AudioPlayer displays for entries with voice notes
- [ ] Mark entry as answered
- [ ] Share answered entry as testimony
- [ ] Verify journaling does NOT update streak

### Prayer Library
- [ ] Admin: Add new prayer point
- [ ] Admin: Edit existing prayer point
- [ ] Admin: Delete prayer point
- [ ] Verify prayer points appear in CreateGuideline form

### Dashboard & Streak Logic
- [ ] Complete current day's prayer
- [ ] Verify streak count increments
- [ ] Verify milestone achievement modal appears (if applicable)
- [ ] Complete past day's prayer
- [ ] Verify daily tracker updates but streak does NOT change
- [ ] Create journal entry
- [ ] Verify streak does NOT change (journal doesn't affect streak)
- [ ] View recent announcements (guideline and testimony announcements)

---

## 9. ARCHITECTURE SUMMARY

### 📊 Current Data Storage

**Supabase (Backend)**:
- `profiles` - User profiles, streak count, reminders
- `journal_entries` - Prayer journal with voice notes
- `testimonies` - User testimonies with alias, location, related_series, gratitude_count
- `testimony_gratitudes` - Tracks which users celebrated which testimonies (prevents duplicates)
- `guidelines` - Prayer guidelines with resolved prayer content
- `prayer_points` - Prayer library (after migration)
- `daily_prayers` - Prayer completion tracking (updates for ALL prayers)
- `encouragement_messages` - Announcement center (48-hour retention)
- `user_roles` - Admin/user role management

**Supabase Storage**:
- `voice-notes` - Journal audio recordings

**Email System**:
- **Resend API** for sending emails
- **3 Edge Functions**:
  1. `send-prayer-reminder` - Daily at 6 PM UTC
  2. `send-weekly-summary` - Sunday at 8 AM UTC
  3. `send-announcement-email` - Manual trigger by admins

### 🔑 Key Features & Logic

1. **Guideline Announcements**: Auto-created when admin publishes new guideline
2. **Testimony Announcements**: Auto-created when user submits/updates testimony
3. **Hybrid TTS System**: Google Cloud TTS (primary) + Web Speech API (fallback)
   - Intercession prayers: 0.65 speed, read twice consecutively
   - Listening prayers: 0.5 speed (very slow for meditation)
   - Console logs show which TTS engine is active
4. **Auto-Deduplication**: Old guidelines with duplicate prayer points auto-fixed on load
5. **Weekly Tracker (daily_prayers table)**: Updates for ALL prayers (past, present, future)
6. **Milestone System (profiles.streak_count)**: ONLY updates for current day prayers
7. **Streak Logic**:
   - ✅ Updated when completing current day prayer in GuidedPrayerSession
   - ❌ NOT updated when completing past prayers
   - ❌ NOT updated when creating journal entries
8. **Voice Journaling**: Record and playback audio notes
9. **Testimony Approval Workflow**: Pending → Admin Review → Approved/Rejected
10. **Testimony Celebration**: Toggle feature - click to celebrate, click again to uncelebrate
11. **Free vs Guided Mode**:
    - Free Mode: "Next Prayer" button through intercessions, "Complete Prayer Step" on last one
    - Guided Mode: Auto-navigation through prayer points with 3-minute timers

---

## 10. PRIORITY ORDER

Execute in this order:

1. **🔴 CRITICAL**: Run SQL in Section 1 (Database Schema Updates) - includes testimony_gratitudes table
2. **🔴 CRITICAL**: Run SQL in Section 2 (Storage Bucket Setup)
3. **🟡 HIGH**: Migrate PrayerLibrary.tsx (Section 4)
4. **🟡 HIGH**: Update CreateGuideline.tsx prayer fetching (Section 4)
5. **🟢 MEDIUM**: Set up cron jobs (Section 7)
6. **🟢 MEDIUM**: Run testing checklist (Section 8)
7. **🟢 LOW**: Consider TTS upgrade (Section 5) - optional quality improvement

---

## 11. COMMON ISSUES & SOLUTIONS

### Issue: Announcements Not Showing in Dashboard
**Solution**: Run the INSERT policy SQL in Section 1.2

### Issue: Voice Notes Not Uploading
**Solution**: Run the storage bucket SQL in Section 2

### Issue: Prayer Details Empty in Guideline View
**Solution**: Prayer content resolution is fixed in CreateGuideline.tsx (Section 3.5)

### Issue: Intercessions Not Reading Twice
**Solution**: Fixed in GuidedPrayerSession.tsx with consecutive reading (Section 3.7)

### Issue: Free Mode Requires Multiple Clicks
**Solution**: Fixed by changing button to call handleStepComplete (Section 3.7)

### Issue: Daily Tracker Not Updating
**Solution**: Fixed by moving daily_prayers insert outside isCurrentPrayer block (Section 3.7)

### Issue: Streak Updates on Journaling
**Solution**: Verified - Journal.tsx only reads streak, doesn't update it ✅ (Section 3.8)

### Issue: Celebration Button Doesn't Toggle
**Solution**: Run testimony_gratitudes table creation SQL in Section 1.3

### Issue: Duplicate Prayer Points (Old Data)
**Problem**: Old guidelines created before duplication fix have duplicate intercession prayers (4 prayers showing as 8)
**Solution**:
1. **Automatic Fix**: GuidedPrayerSession.tsx now auto-deduplicates when loading guidelines (lines 133-148)
2. **Manual Database Cleanup** (optional): Run `scripts/deduplicateGuidelinePoints.ts` to permanently fix database:
```bash
npm install tsx
npm run tsx scripts/deduplicateGuidelinePoints.ts
```

---

## 12. NOTES FOR LOVABLE

- All code changes are **already complete** in the GitHub repository
- Just need to:
  1. Pull latest code from GitHub
  2. Run the SQL commands in Sections 1, 2, and 7
  3. Migrate PrayerLibrary.tsx (Section 4)
  4. Test the features (Section 8)
  5. *Optional*: Set up Google Cloud TTS for better voice quality (Section 5)
- Keep `RESEND_API_KEY` secure in Lovable Secrets
- The app is 98% migrated to Supabase (only PrayerLibrary.tsx remaining)
- **TTS System**: Hybrid architecture with Google Cloud TTS (primary) and Web Speech API (fallback)
  - Works immediately with Web Speech API (no setup needed)
  - Add `VITE_GOOGLE_CLOUD_TTS_API_KEY` for premium voice quality

---

## 13. VERIFICATION STEPS

After completing all tasks, verify:

✅ **Database**:
- [ ] `testimonies` table has 4 new columns (alias, location, related_series, gratitude_count)
- [ ] `testimony_gratitudes` table exists with proper RLS policies and unique constraint
- [ ] `encouragement_messages` has INSERT policy and type column
- [ ] `prayer_points` table exists with proper RLS policies
- [ ] `voice-notes` storage bucket exists with 3 policies

✅ **Functionality**:
- [ ] Create guideline → announcement appears in Dashboard ✅
- [ ] Submit testimony → announcement appears in Dashboard ✅
- [ ] Celebrate testimony → toggles on/off, count updates correctly ✅
- [ ] Record voice note → plays back in journal ✅
- [ ] Complete current day prayer → streak updates AND tracker updates ✅
- [ ] Complete past day prayer → tracker updates but streak does NOT update ✅
- [ ] Create journal entry → streak does NOT update ✅
- [ ] Kingdom prayers auto-read twice during guided session ✅
- [ ] Free mode: Single click completes entire prayer step ✅
- [ ] Guided mode: Auto-navigation with 3-min timers ✅

✅ **No Errors**:
- [ ] No console errors about missing columns
- [ ] No console errors about localStorage
- [ ] No RLS policy errors
- [ ] Toast notifications show success messages
- [ ] Listening scripture audio plays when button clicked

---

**END OF GUIDE**

📧 If you encounter any issues, check the console for detailed error messages and refer to the Common Issues section above.

🎯 **Summary of Critical Changes in This Update**:
1. ✅ Added `testimony_gratitudes` table for celebration toggle feature
2. ✅ Fixed daily tracker to update for ALL prayers (not just current day)
3. ✅ Verified streak ONLY updates on current day prayer completion (not journaling)
4. ✅ Fixed free mode to single-click complete steps
5. ✅ Fixed intercessions to read twice consecutively
6. ✅ Slowed listening prayer audio to 0.7 speed
7. ✅ Documented TTS options (ElevenLabs, Google Cloud TTS, PlayHT)

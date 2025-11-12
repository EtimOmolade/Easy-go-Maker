# Spirit Scribe Path - Prayer Journal Web App

## Project Overview
Spirit Scribe Path is a comprehensive prayer journal and guided prayer session web application that helps users maintain consistent prayer habits through structured daily guidelines, milestone tracking, and community testimonies.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage, Cron Jobs)
- **Deployment**: Lovable Cloud
- **Audio**: Speechmatics TTS API (pre-generated male voice for prompts, female voice for prayers)
- **Email**: Resend API (automated reminders and summaries)
- **Version Control**: Git (bincom/main and origin/main remotes)

## Current Implementation Status

### Completed Features
1. **Authentication System** - Supabase Auth with signup/login/password reset
2. **Admin Dashboard** - User management, prayer library management, guidelines creation
3. **Prayer Library** - Database-backed prayer points with categories (Kingdom Focus, Listening Prayer)
4. **Automated Guidelines** - Daily prayer guidelines with month/day scheduling
5. **Guided Prayer Sessions** - Two modes:
   - **Guided Mode**: Auto-navigation with timers and voice prompts
   - **Free Mode**: Manual navigation at user's pace
6. **Journal System** - Prayer journal with voice notes, sharing, PDF export
7. **Testimony System** - Community testimonies with celebration toggle
8. **Milestone Tracking** - 7-level achievement system (1, 7, 21, 50, 100, 365, 545 days)
9. **Email Notifications** - Daily reminders and weekly summaries via cron jobs
10. **Audio System** - Speechmatics pre-generated audio with browser TTS fallback

### Audio System Architecture (Speechmatics)
**Voice Differentiation Strategy**:
- **Voice Prompts**: Male voice (Speechmatics 'theo') - calm, deep, father-like
- **Prayer Audio**: Female voice (Speechmatics 'sarah') - clear, gentle

**Audio Files**:
- Pre-generated voice prompts stored in Supabase Storage (`prayer-audio/voice-prompts/`)
- Prayer audio generated via `generate-weekly-guideline` edge function
- Fallback to browser Web Speech API if audio unavailable

**Playback Speed**:
- Kingdom Focus prayers: 85% speed (0.85 playbackRate)
- Listening prayers: 70% speed (0.7 playbackRate) - slower for meditation

**Edge Functions**:
- `generate-voice-prompts`: Creates male-voiced system prompts
- `generate-weekly-guideline`: Creates guidelines with female-voiced prayer audio
- Uses Speechmatics API key from environment secrets

## Database Schema

### Core Tables

#### 1. profiles
User profiles with streak tracking and settings.
```sql
- id (UUID, PK, FK → auth.users)
- name (TEXT)
- email (TEXT, unique)
- streak_count (INTEGER, default 0)
- last_journal_date (DATE)
- reminders_enabled (BOOLEAN, default true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
**RLS**: Users can view/update own profile

#### 2. user_roles
Admin role management with precedence system.
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users, unique)
- role (TEXT: 'admin' | 'user')
- created_at (TIMESTAMP)
```
**RLS**: Everyone can view roles, only existing admins can insert/update/delete
**Note**: First admin (oldest created_at) has highest precedence

#### 3. prayer_library
Prayer content organized by calendar date and category.
```sql
- id (UUID, PK)
- title (TEXT)
- content (TEXT)
- category (TEXT: 'Kingdom Focus' | 'Listening Prayer')
- month (TEXT: 'January'..'December')
- day (INTEGER: 1-31)
- day_of_week (TEXT: 'Monday'..'Sunday')
- intercession_number (INTEGER: 1-5)
- chapter (INTEGER, for Proverbs)
- start_verse (INTEGER)
- end_verse (INTEGER)
- reference_text (TEXT, e.g., "Proverbs 1:1-9 (KJV)")
- audio_url (TEXT, Speechmatics audio file URL)
- created_by (UUID, FK → auth.users)
- created_at (TIMESTAMP)
```
**RLS**: Everyone can view, only admins can insert/update/delete

#### 4. guidelines
Daily prayer guidelines with resolved content and audio.
```sql
- id (UUID, PK)
- month (TEXT)
- day (INTEGER)
- day_of_week (TEXT)
- title (TEXT)
- steps (JSONB) - Array of step objects with resolved prayer content
- created_by (UUID, FK → auth.users)
- created_at (TIMESTAMP)
```
**Steps Structure**:
```javascript
{
  id: string,
  type: 'kingdom' | 'personal' | 'listening' | 'reflection',
  title: string,
  duration: number, // seconds
  points: [{ id, title, content, audio_url }], // resolved from prayer_library
  content: string, // for listening prayers
  audio_url: string // for listening prayers
}
```
**RLS**: Everyone can view, admins can insert/update/delete

#### 5. daily_prayers
Tracks prayer completion for weekly progress display.
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- guideline_id (UUID, FK → guidelines)
- completed_at (TIMESTAMP)
- prayer_date (DATE)
```
**RLS**: Users can view own prayers, admins can view all
**Purpose**: Updates for ALL prayer completions (past, present, future) - used for weekly tracker display

#### 6. journal_entries
Prayer journal with voice notes support.
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- title (TEXT)
- content (TEXT)
- is_answered (BOOLEAN, default false)
- voice_note_url (TEXT, storage path)
- shared_as_testimony (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
**RLS**: Users can CRUD own entries

#### 7. testimonies
User testimonies with celebration tracking.
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- alias (TEXT, default 'Anonymous Seeker')
- location (TEXT, optional)
- content (TEXT)
- related_series (TEXT, optional link to guideline)
- status (TEXT: 'pending' | 'approved' | 'rejected')
- rejection_reason (TEXT, optional)
- gratitude_count (INTEGER, default 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
**RLS**:
- Everyone can view approved testimonies
- Users can create/update own pending testimonies
- Admins can view/update all

#### 8. testimony_gratitudes
Prevents duplicate testimony celebrations.
```sql
- id (UUID, PK)
- testimony_id (UUID, FK → testimonies, ON DELETE CASCADE)
- user_id (UUID, FK → auth.users, ON DELETE CASCADE)
- created_at (TIMESTAMP)
- UNIQUE(testimony_id, user_id)
```
**RLS**:
- Everyone can view
- Users can insert/delete own gratitudes
**Purpose**: Toggle celebration (insert to celebrate, delete to uncelebrate)

#### 9. encouragement_messages
Announcements with 48-hour retention.
```sql
- id (UUID, PK)
- title (TEXT)
- content (TEXT)
- type (TEXT: 'general' | 'guideline_new' | 'testimony_pending' | 'testimony_approved')
- created_by (UUID, FK → auth.users)
- created_at (TIMESTAMP)
```
**RLS**: Everyone can view, authenticated users can insert

### Storage Buckets

#### voice-notes
User-recorded journal audio files.
```
Path structure: {user_id}/{timestamp}.webm
Public: true (read), authenticated upload/delete
Max size: 20MB
```

#### prayer-audio
Pre-generated Speechmatics TTS audio.
```
Paths:
- voice-prompts/*.wav (male voice system prompts)
- prayers/*.wav (female voice prayer audio)
Public: true (read), admin upload only
```

### Indexes
```sql
CREATE INDEX idx_prayer_library_category ON prayer_library(category);
CREATE INDEX idx_testimony_gratitudes_testimony_id ON testimony_gratitudes(testimony_id);
CREATE INDEX idx_testimony_gratitudes_user_id ON testimony_gratitudes(user_id);
CREATE INDEX idx_daily_prayers_user_id ON daily_prayers(user_id);
CREATE INDEX idx_daily_prayers_prayer_date ON daily_prayers(prayer_date);
```

## Key Features & Logic

### Prayer Flow
**Kingdom Focus Step**:
- 4-5 intercession points per day
- Each prayer read with audio (female voice)
- 3-minute timer per point in guided mode
- Sequential progression through all points

**Personal Supplication**:
- 5-minute timer
- User-led silent prayer
- No text provided

**Listening Prayer (Proverbs)**:
- 91-day cycle through book of Proverbs
- ~10 verses per day
- Slow audio playback (70% speed)
- Auto-generated via `generate-proverbs-plan` function

**Reflection & Journaling**:
- Redirects to journal
- Creates entry with prayer date
- Updates streak (current day only)

### Streak Logic
**Streak UPDATES (profiles.streak_count)**:
- Only when completing CURRENT DAY prayer via GuidedPrayerSession
- Not updated for past prayers
- Not updated when creating journal entries manually

**Weekly Tracker UPDATES (daily_prayers table)**:
- Updates for ALL prayer completions (past, present, future)
- Shows 7-day completion status on guideline details page

### Voice Prompts
Pre-generated male voice prompts (Speechmatics 'theo'):
- `kingdom-start`: "Now pray for kingdom purposes..."
- `kingdom-next`: "Continue praying for the next kingdom-focused point."
- `personal-start`: "Now bring your personal requests to God..."
- `listening-start`: "Take a moment to listen and meditate..."
- `journaling-start`: "Open your journal and write down..."
- `session-complete`: "Well done! You've completed today's prayer session."

Stored at: `prayer-audio/voice-prompts/*.wav`

## Important File Locations

### Pages
- `src/pages/Auth.tsx` - Login/signup
- `src/pages/Dashboard.tsx` - Main dashboard with announcements
- `src/pages/Admin.tsx` - Admin panel
- `src/pages/PrayerLibrary.tsx` - Manage prayer points
- `src/pages/PrayerLibraryAdmin.tsx` - Admin prayer management
- `src/pages/Guidelines.tsx` - View prayer guidelines
- `src/pages/GuidedPrayerSession.tsx` - Active prayer session
- `src/pages/Journal.tsx` - Prayer journal
- `src/pages/Testimonies.tsx` - Community testimonies

### Utilities
- `src/utils/voicePrompts.ts` - Voice prompt audio playback (Speechmatics + browser TTS fallback)
- `src/services/tts.ts` - Browser TTS service (used as fallback)
- `src/contexts/AuthContext.tsx` - Supabase authentication

### Edge Functions
- `supabase/functions/generate-weekly-guideline/` - Creates guidelines with Speechmatics audio
- `supabase/functions/generate-proverbs-plan/` - Generates 91-day Proverbs cycle
- `supabase/functions/generate-voice-prompts/` - Pre-generates system voice prompts
- `supabase/functions/send-prayer-reminder/` - Daily email reminders
- `supabase/functions/send-weekly-summary/` - Weekly progress emails
- `supabase/functions/send-announcement-email/` - Admin broadcasts

## Environment Variables

### Required (Auto-configured)
```bash
VITE_SUPABASE_URL=https://wmdtsdicaonrdtcfqyyr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=wmdtsdicaonrdtcfqyyr
```

### User-Provided Secrets
```bash
SPEECHMATICS_API_KEY=<api_key>  # Required for TTS audio generation
RESEND_API_KEY=<api_key>        # Required for email notifications
```

### Speechmatics Setup
1. Get API key from Speechmatics (free tier available until Nov 15, 2025)
2. Add `SPEECHMATICS_API_KEY` to Supabase Dashboard → Edge Functions → Secrets
3. Run `generate-voice-prompts` function once to create prompt audio files
4. Guidelines will auto-generate prayer audio when created

## Cron Jobs Schedule

### Daily Prayer Reminders
- **Schedule**: 6:00 PM UTC daily
- **Function**: `send-prayer-reminder`
- **Purpose**: Email users who haven't completed today's prayer

### Weekly Summaries
- **Schedule**: 8:00 AM UTC Sundays
- **Function**: `send-weekly-summary`
- **Purpose**: Send weekly progress reports with streak and prayer count

## Testing Checklist

### Audio System
- [ ] Voice prompts play with male voice (Speechmatics 'theo')
- [ ] Kingdom prayers play with female voice (Speechmatics 'sarah')
- [ ] Listening prayers play at 70% speed
- [ ] Audio falls back to browser TTS if Speechmatics unavailable
- [ ] Audio stops when leaving page
- [ ] Audio stops when switching steps
- [ ] No overlapping audio playback

### Prayer Sessions
- [ ] Guided mode: Auto-navigation with timers
- [ ] Free mode: Manual "Next Prayer" navigation
- [ ] Kingdom prayers: Each point plays once
- [ ] 3-second pause between voice prompt and prayer audio
- [ ] Listening prayer: Scripture plays at slow speed
- [ ] Session completion creates journal entry
- [ ] Current day: Updates streak and weekly tracker
- [ ] Past day: Updates weekly tracker only (no streak)

### Milestones
- [ ] Streak increments on current day completion
- [ ] Modal shows on milestone achievement (1, 7, 21, 50, 100, 365, 545)
- [ ] Past prayers don't trigger milestones
- [ ] Journal creation doesn't affect streak

### Testimonies
- [ ] Submit testimony → pending status
- [ ] Admin approve/reject
- [ ] Celebration toggle (heart icon)
- [ ] Gratitude count updates correctly
- [ ] No duplicate celebrations from same user

## Mobile Responsiveness

All pages are mobile-first responsive with:
- Icon-only buttons on small screens (<640px)
- Full text labels on larger screens (>=640px)
- Responsive grids: `grid-cols-1 sm:grid-cols-2`
- Responsive flex: `flex-col sm:flex-row`
- Hidden table columns on mobile: `hidden sm:table-cell`
- Mobile-optimized dialog widths: `w-[95vw] sm:w-full`

Pattern used throughout:
```tsx
<Button>
  <Icon className="h-4 w-4" />
  <span className="hidden sm:inline ml-2">Button Text</span>
</Button>
```

## Recent Updates

### Audio System Migration (Latest)
- Migrated from Python Coqui TTS to Speechmatics API
- Voice differentiation: Male prompts, female prayers
- Pre-generated audio stored in Supabase Storage
- Slower playback speeds for better meditation
- 3-second pause between prompt and prayer
- Comprehensive audio cleanup on page exit

### Mobile Responsiveness (Latest)
- All prayer library buttons now icon-only on mobile
- Bulk import modal fully responsive
- All dialogs optimized for mobile screens
- Responsive tables with hidden columns

## Troubleshooting

### Issue: No Audio Playing
**Solution**:
- Check Supabase Storage → `prayer-audio` bucket for audio files
- Verify `SPEECHMATICS_API_KEY` is set in edge function secrets
- Run `generate-voice-prompts` function if voice prompts missing
- Check browser console for error messages
- Ensure browser allows audio autoplay (may need user interaction first)

### Issue: Audio Not Stopping
**Solution**:
- Audio cleanup is handled in `stopAllAudio()` function
- Removes event listeners before stopping to prevent fallback
- Uses `currentAudioRef` for synchronous tracking

### Issue: Emails Not Sending
**Solution**:
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Check cron jobs are active in Supabase dashboard
- Review edge function logs for errors
- Verify sending domain at resend.com

### Issue: Streak Not Updating
**Solution**:
- Verify completing CURRENT day prayer (not past)
- Check `daily_prayers` insert succeeded
- Verify `profiles.streak_count` column exists

## Production Deployment

### Pre-Deployment Checklist
- [ ] All environment variables set
- [ ] Speechmatics API key configured
- [ ] Voice prompts generated
- [ ] Resend API key for emails
- [ ] Cron jobs scheduled
- [ ] Database migrations run
- [ ] RLS policies verified
- [ ] Storage buckets created
- [ ] All tests passing

### Deployment Steps
1. Push latest code to repository
2. Lovable auto-deploys from main branch
3. Run database migrations if needed
4. Verify environment secrets
5. Test critical user flows
6. Monitor edge function logs

## Support & Maintenance

### Monitoring
- **Edge Function Logs**: Supabase Dashboard → Edge Functions → Logs
- **Cron Job History**: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;`
- **Email Delivery**: Resend Dashboard → Logs
- **Storage Usage**: Supabase Dashboard → Storage

### Regular Maintenance
- Review edge function logs weekly
- Monitor Speechmatics API usage (1M characters/month free tier)
- Check Resend email delivery rates
- Verify cron jobs running on schedule
- Update prayer library content seasonally

## License & Credits
- **Project**: Spirit Scribe Path
- **Developers**: Development team + Claude Code assistance
- **TTS Provider**: Speechmatics (free tier until Nov 15, 2025)
- **Email Provider**: Resend
- **Backend**: Supabase
- **Frontend Framework**: React + Vite + Tailwind CSS

---

**Last Updated**: 2025-01-12
**Version**: 1.0
**Status**: Production Ready

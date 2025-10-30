## Project: Spirit Scribe Path - Prayer Journal Web App

## Team:
- Me: Developer
- Team Lead: Project manager
- Client: Approved 5 new features + backend activation

## Tech Stack:
- React + TypeScript + Tailwind
- Lovable (frontend + backend) - approved for full Supabase access
- Supabase (PostgreSQL, Auth, RLS, Edge Functions, Cron Jobs)

## Current Status (Backend Activation Phase):
- ✅ Phase 1 complete: Admin dashboard, announcements, prayer tracking (prototype)
- ✅ Phase 2: Backend activation started - 3 features activated:
  - **Authentication**: Supabase Auth with proper signup/login/redirect
  - **Admin User Management**: Promote/demote users with precedence system
  - **Announcements**: Real-time encouragement messages display
- ✅ Client approved moving to full Supabase with own account (no Lovable constraints)
- ⏳ Ready for Lovable to complete backend implementation

## Features Implemented (Prototype):
1. ✅ Testimony rejection with reasons + resubmission
2. ✅ Share/download journal entries
3. ✅ Enhanced 7-level milestone system with celebrations
4. ✅ Voice notes (recording + playback)
5. ✅ Guided prayer sessions (timer-based, text MVP)
6. ✅ Prayer Library (localStorage-based, ready for automation)

## Backend Tasks for Lovable (Next Steps):

### 1. Complete Database Schema
- Ensure all tables exist with proper columns (profiles, user_roles, journal_entries, testimonies, encouragement_messages, guidelines)
- Add any missing columns for full feature parity
- Set up Row Level Security (RLS) policies
- Create database triggers if needed

### 2. Automated Prayer Guideline Generation (NEW REQUIREMENT)
**Client Request**: Admin will supply prayers for a whole year, app should automatically create prayer guidelines on a schedule
- **Options**: Weekly, daily, or monthly generation (recommend weekly or monthly for professional approach)
- **Implementation**:
  - Use Supabase Cron Jobs to schedule automatic guideline creation
  - Create Edge Function to pull prayers from Prayer Library and format into guidelines
  - Store generated guidelines in `guidelines` table
  - Notify admins when new guidelines are auto-generated
- **Prayer Library**: Already exists at src/pages/PrayerLibrary.tsx (localStorage-based, needs migration to Supabase)

### 3. Email Notifications
- Set up Supabase Edge Functions for email sending
- Daily reminder emails for users with reminders_enabled
- Testimony approval/rejection notifications
- New announcement notifications
- Weekly prayer guideline notifications

### 4. Real-time Features
- Uncomment and activate Supabase real-time subscriptions
- Live announcement updates on Dashboard
- Live testimony count updates for admins

### 5. Data Migration
- Migrate existing localStorage data to Supabase if needed
- Sync auth.users with profiles table
- Set up proper foreign key relationships

## Key Decisions Made:
- Backend activated: Authentication, Admin Management, Announcements working with Supabase
- Removed @admin mock logic, using proper Supabase Auth
- Admin precedence based on created_at timestamp in user_roles
- 48-hour announcement visibility on Dashboard
- Prayer Library ready for automation integration
- Budget-friendly: Google Cloud TTS (free tier) over Eleven Labs

## Important Files (Backend-Enabled):
- src/contexts/AuthContext.tsx - Supabase Auth ACTIVATED
- src/pages/Dashboard.tsx - Supabase announcements ACTIVATED
- src/pages/Admin.tsx - Supabase user management ACTIVATED
- src/pages/Auth.tsx - Supabase signup/login ACTIVATED
- src/pages/Journal.tsx - Entries, streak, testimony (still localStorage)
- src/pages/PrayerLibrary.tsx - Prayer management (localStorage, needs Supabase migration)
- src/data/mockData.ts - localStorage keys and helper functions
- supabase/migrations/ - Existing database migrations
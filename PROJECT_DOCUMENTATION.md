# Spirit Connect(Formerly Spirit-Scribe-Path) - Project Documentation

## Project Development Process & Management Guide

This document outlines the complete development process, project structure, management workflow, and deployment procedures for the Spirit Scribe Path project.

---

# Table of Contents

1. [Project Genesis](#1-project-genesis)
2. [Development Phases](#2-development-phases)
3. [Project Structure & Architecture](#3-project-structure--architecture)
4. [Development Environment Setup](#4-development-environment-setup)
5. [Git Workflow & Remote Management](#5-git-workflow--remote-management)
6. [Configuration & Secrets Management](#6-configuration--secrets-management)
7. [Database Management](#7-database-management)
8. [Deployment Process](#8-deployment-process)
9. [Collaboration Workflow](#9-collaboration-workflow)
10. [Troubleshooting Common Issues](#10-troubleshooting-common-issues)
11. [Future Maintenance](#11-future-maintenance)

---

## 1. Project Genesis

### Initial Concept
Spirit Scribe Path (SpiritConnect/Seek First) began as a vision to create a guided prayer application that helps users maintain consistent prayer habits through structured daily guidelines.

### Platform Selection: Lovable
The project was initiated on **Lovable** (lovable.dev), a no-code/low-code platform that provides:
- Visual development interface
- Integrated Supabase backend
- One-click deployment
- GitHub synchronization

**Why Lovable?**
- Rapid prototyping capability
- Built-in Supabase integration
- Easy client demonstrations
- Quick iteration cycles

### Prototyping Phase
1. Created initial UI mockups in Lovable
2. Demonstrated to client for feedback
3. Iterated based on client requirements
4. Established core feature set:
   - User authentication
   - Prayer guidelines system
   - Journal with audio notes
   - Milestone/streak tracking
   - Admin dashboard

---

## 2. Development Phases

### Phase 1: Prototype (Lovable)
**Duration**: Initial development
**Activities**:
- Built UI components using Lovable's prompts
- Connected to Lovable's integrated Supabase
- Created database schema through Lovable
- Tested basic functionality
- Client review and feedback cycles

### Phase 2: Local Development Setup
**Trigger**: Need for advanced features and custom code
**Activities**:
- Cloned repository from Lovable's GitHub
- Set up local development environment
- Configured environment variables
- Established dual remote workflow

### Phase 3: Feature Development
**Activities**:
- Implemented complex features locally
- Prayer session audio playback
- Push notification system
- Offline functionality
- Bulk operations

### Phase 4: Integration & Testing
**Activities**:
- Edge function development
- Push notification configuration
- Audio generation integration (Speechmatics)
- Cross-browser testing

### Phase 5: Deployment & Maintenance
**Activities**:
- Deploy via Lovable
- Monitor and fix issues
- Continuous improvements

---

## 3. Project Structure & Architecture

### Directory Structure
```
spirit-scribe-path/
│
├── public/                    # Static assets
│   ├── service-worker.js      # PWA service worker
│   ├── manifest.json          # PWA manifest
│   ├── logo-192.png          # App icons
│   └── logo-512.png
│
├── src/                       # Source code
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui base components
│   │   └── [Feature].tsx     # Feature-specific components
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── OfflineContext.tsx # Offline functionality
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useOfflineJournal.ts
│   │
│   ├── integrations/          # External integrations
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client
│   │       └── types.ts      # Generated types
│   │
│   ├── pages/                 # Route components
│   │   ├── Index.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Guidelines.tsx
│   │   └── ...
│   │
│   ├── utils/                 # Utility functions
│   │   ├── pushNotifications.ts
│   │   ├── offlineStorage.ts
│   │   └── voicePrompts.ts
│   │
│   ├── data/                  # Static data & types
│   │   └── mockData.ts
│   │
│   ├── App.tsx               # Root component with routes
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
│
├── supabase/                  # Backend code
│   ├── functions/             # Edge Functions
│   │   ├── generate-weekly-guideline/
│   │   ├── send-push-notification/
│   │   ├── send-prayer-reminder/
│   │   └── ...
│   │
│   └── migrations/            # Database migrations
│       └── *.sql
│
├── scripts/                   # Utility scripts
│
├── .env                       # Local environment (not committed)
├── .env.example              # Environment template
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

### Architecture Decisions

**Frontend Architecture**
- **Component-based**: Each UI element is a reusable component
- **Context for state**: Global state via React Context (Auth, Offline)
- **Custom hooks**: Encapsulate complex logic (useOfflineJournal)
- **Page-based routing**: Each route maps to a page component

**Backend Architecture**
- **Supabase BaaS**: Authentication, Database, Storage, Edge Functions
- **Row Level Security**: Database-level access control
- **Edge Functions**: Server-side logic in Deno runtime

**Data Flow**
```
User Action → Component → Supabase Client → Database
                ↓
            Context Update → Re-render
```

---

## 4. Development Environment Setup

### Prerequisites
- Node.js v18+ (recommend using nvm)
- Git
- VS Code (recommended)
- Supabase CLI (optional, for edge function testing)

### Initial Setup

1. **Clone the Repository**
```bash
git clone https://github.com/Joshua-Ejiobih/spirit-scribe-path.git
cd spirit-scribe-path
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
```bash
# Copy example file
cp .env.example .env

# Edit with your values
# Get these from Supabase Dashboard or Lovable
```

Required variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Access the App**
Open http://localhost:5173 in your browser

### VS Code Extensions (Recommended)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- TypeScript Importer
- GitLens

---

## 5. Git Workflow & Remote Management

### Remote Configuration

This project uses **two Git remotes**:
- `origin` - Personal development repository
- `bincom` - Client repository

**Setting Up Remotes**
```bash
# Check current remotes
git remote -v

# Add personal remote (if not exists)
git remote add origin https://github.com/Joshua-Ejiobih/spirit-scribe-path.git

# Add client remote
git remote add bincom https://github.com/bincomict/easy-go-maker.git
```

### Branch Strategy
- `main` - Production-ready code
- Feature branches for development (optional)

### Workflow

**Daily Development**
```bash
# Make changes
git add .
git commit -m "feat: add bulk delete feature"

# Push to personal repo
git push origin main

# Push to client repo when ready
git push bincom main
```

**Syncing Between Remotes**
```bash
# Pull latest from client
git pull bincom main

# Resolve any conflicts
git add .
git commit -m "merge: sync with client repo"

# Push to both
git push origin main
git push bincom main
```

**Common Git Commands**
```bash
# View status
git status

# View differences
git diff

# View commit history
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Stash changes temporarily
git stash
git stash pop
```

### Commit Message Convention
```
type: short description

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code restructuring
- style: Formatting changes
- docs: Documentation
- chore: Maintenance
```

---

## 6. Configuration & Secrets Management

### Environment Variables

**Local Development** (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Push Notifications
VITE_VAPID_PUBLIC_KEY=BKhix...
```

**Important**: Never commit `.env` file. It's in `.gitignore`.

### Supabase Secrets (for Edge Functions)

Set via Supabase Dashboard: **Project Settings → Edge Functions → Secrets**

Required secrets:
```
SUPABASE_URL          - Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY - Service role key (full access)
VAPID_PUBLIC_KEY      - For push notifications
VAPID_PRIVATE_KEY     - For push notifications
VAPID_SUBJECT         - mailto:your-email@example.com
SPEECHMATICS_API_KEY  - For TTS audio generation
```

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

This outputs:
```
Public Key: BKhix...
Private Key: wKltz...
```

### Accessing Configuration in Code

**Frontend** (Vite):
```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
```

**Edge Functions** (Deno):
```typescript
const key = Deno.env.get('VAPID_PRIVATE_KEY');
```

---

## 7. Database Management

### Supabase Dashboard
Access via:
- Lovable: Click "Supabase" button in your project
- Direct: https://supabase.com/dashboard

### Key Tables

| Table | Purpose |
|-------|---------|
| profiles | User profiles, streaks, admin status |
| prayer_library | Prayer points (Kingdom Focus, Listening) |
| guidelines | Daily prayer guidelines |
| journal_entries | User journal entries |
| testimonies | Shared prayer testimonies |
| push_subscriptions | Web push subscription data |
| prayer_reminders | User reminder preferences |

### Database Migrations

Migrations are SQL files that modify the database schema.

Location: `supabase/migrations/`

**Creating a Migration**
```bash
# Via Supabase CLI
supabase migration new add_voice_preference

# This creates: supabase/migrations/[timestamp]_add_voice_preference.sql
```

**Migration Example**
```sql
-- Add voice preference column
ALTER TABLE user_settings
ADD COLUMN voice_preference TEXT DEFAULT 'sarah';
```

**Applying Migrations**
- Via Supabase Dashboard: SQL Editor → paste and run
- Via CLI: `supabase db push`

### Row Level Security (RLS)

All tables should have RLS enabled with appropriate policies.

Example policy:
```sql
-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own entries
CREATE POLICY "Users access own entries" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);
```

---

## 8. Deployment Process

### Deploying via Lovable

**Frontend Deployment**
1. Push changes to GitHub (either remote)
2. Go to Lovable project
3. Click **Share** → **Publish**
4. Wait for build to complete
5. Access via your Lovable URL or custom domain

**Edge Function Deployment**
Edge functions deploy automatically when you:
- Push changes to `supabase/functions/`
- Deploy via Lovable

**Manual Edge Function Deployment** (if needed)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy specific function
supabase functions deploy send-push-notification

# Deploy all functions
supabase functions deploy
```

### Custom Domain Setup

1. In Lovable: **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Add your domain
4. Configure DNS records as shown
5. Wait for SSL certificate

### Build Configuration

The project uses Vite for building:
```bash
# Build for production
npm run build

# Output goes to /dist
```

Build settings in `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## 9. Collaboration Workflow

### Working with Lovable

**Lovable → Local**
1. Make changes in Lovable
2. Lovable auto-commits to GitHub
3. Pull changes locally:
```bash
git pull origin main
```

**Local → Lovable**
1. Make changes locally
2. Commit and push:
```bash
git add .
git commit -m "description"
git push origin main
```
3. Lovable automatically syncs

### Code Review Process

1. Make changes in feature branch (optional)
2. Test locally
3. Commit with descriptive message
4. Push to repository
5. Review in GitHub or deploy to staging
6. Merge to main

### Communication with Client

1. Share Lovable preview URL for demos
2. Document changes in commit messages
3. Keep PROJECT_DOCUMENTATION.md updated
4. Create issues for tracking tasks

---

## 10. Troubleshooting Common Issues

### Build Errors

**TypeScript Errors**
```bash
# Check for type errors
npm run build

# Common fixes:
# - Add proper type annotations
# - Fix import paths
# - Update interface definitions
```

**Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Supabase Connection Issues

**"Invalid API key"**
- Check `.env` file has correct values
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`

**RLS Policy Errors**
- Check policies in Supabase Dashboard
- Ensure user is authenticated
- Verify policy conditions

### Push Notification Issues

**Subscription Fails**
- Verify VAPID public key matches
- Check browser permissions
- Ensure HTTPS (required for push)

**Notifications Not Received**
- Check Supabase Edge Function logs
- Verify VAPID secrets are set correctly
- Check `push_subscriptions` table for valid entries

### Edge Function Errors

**"Function not found"**
- Ensure function is deployed
- Check function name matches exactly
- Verify project is linked correctly

**Runtime Errors**
- Check Supabase Dashboard → Edge Functions → Logs
- Verify all required secrets are set
- Check Deno imports are correct versions

### Git Issues

**Merge Conflicts**
```bash
# Pull with rebase
git pull --rebase origin main

# If conflicts:
# 1. Edit conflicted files
# 2. git add .
# 3. git rebase --continue
```

**Wrong Remote**
```bash
# Check remotes
git remote -v

# Change remote URL
git remote set-url origin new-url
```

---

## 11. Future Maintenance

### Regular Tasks

**Weekly**
- Check Supabase Dashboard for errors
- Review Edge Function logs
- Monitor storage usage

**Monthly**
- Update npm dependencies
- Review and clean up unused code
- Backup database (Supabase handles this)

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

### Adding New Features

1. Plan the feature
2. Update database schema if needed
3. Create necessary components
4. Test locally
5. Deploy via Lovable
6. Update documentation

### Monitoring

**Supabase Dashboard**
- Database usage
- API calls
- Storage usage
- Edge Function invocations

**Error Tracking**
- Console logs in browser DevTools
- Edge Function logs in Supabase
- Network tab for API errors

---

## Appendix A: Quick Reference

### Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Git
git status           # Check status
git pull origin main # Pull latest
git push origin main # Push changes

# Supabase CLI
supabase login       # Login to Supabase
supabase link        # Link to project
supabase functions deploy  # Deploy functions
```

### Important URLs

- **Lovable Project**: https://lovable.dev/projects/53e1b464-50af-45e6-a12e-4b6e5a1fa706
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub (Personal)**: https://github.com/Joshua-Ejiobih/spirit-scribe-path
- **GitHub (Client)**: https://github.com/bincomict/easy-go-maker

### Contact & Support

- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Report bugs and feature requests

---

## Appendix B: Lessons Learned

### What Worked Well

1. **Starting with Lovable** - Rapid prototyping and client demos
2. **Supabase BaaS** - Quick backend setup, real-time features
3. **shadcn/ui** - Consistent, customizable components
4. **Dual remote workflow** - Separation of dev and client repos

### Challenges & Solutions

1. **Push Notifications**
   - Challenge: VAPID key configuration complexity
   - Solution: Detailed logging, step-by-step debugging

2. **Offline Functionality**
   - Challenge: Syncing offline data reliably
   - Solution: LocalStorage + sync queue pattern

3. **Audio Generation**
   - Challenge: API rate limits, fallback needed
   - Solution: Browser TTS as fallback

4. **Large Codebase Management**
   - Challenge: Files becoming too large
   - Solution: Component extraction, code cleanup

### Recommendations for Future Projects

1. Set up CI/CD early
2. Implement error tracking from start
3. Document as you build
4. Plan database schema carefully
5. Consider offline-first from beginning

---

*Last Updated: November 2025*
*Version: 1.0*

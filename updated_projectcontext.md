# Spirit Scribe Path - Project Context

## Project Overview

**Spirit Scribe Path** (also known as SpiritConnect) is a Progressive Web App (PWA) for guided prayer and journaling. It helps users maintain consistent prayer habits through daily guidelines, milestone tracking, and community features.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Framer Motion** - Animations
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (email, OAuth)
  - Edge Functions (Deno runtime)
  - Real-time subscriptions
  - Storage (for audio files)
  - Row Level Security (RLS)

### Additional Services
- **Speechmatics TTS** - Text-to-speech for prayer audio
- **Web Push API** - Browser push notifications

## Project Structure

```
spirit-scribe-path/
├── public/
│   ├── service-worker.js    # PWA service worker
│   └── manifest.json        # PWA manifest
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   └── *.tsx            # App-specific components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── OfflineContext.tsx # Offline functionality
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # External service integrations
│   │   └── supabase/        # Supabase client & types
│   ├── pages/               # Route page components
│   ├── utils/               # Utility functions
│   └── data/                # Mock data and constants
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── generate-weekly-guideline/
│   │   ├── send-push-notification/
│   │   └── ...
│   └── migrations/          # Database migrations
└── scripts/                 # Utility scripts
```

## Key Features

### 1. Prayer Guidelines System
- Daily auto-generated guidelines via cron job
- Steps: Kingdom Focus (4 prayers) → Personal Supplication → Listening Prayer → Reflection
- Audio playback with TTS (Speechmatics or browser fallback)
- Cycle through 91-day Listening Prayer rotation

### 2. Journal & Testimonies
- Personal prayer journal with audio notes
- Mark prayers as answered
- Share as testimonies (admin approval required)
- Offline-first with sync capability

### 3. Milestone System
- Streak-based achievements (1, 7, 21, 50, 100, 365, 545 days)
- Visual celebrations with confetti
- Scripture-based encouragement

### 4. Push Notifications
- Browser push notifications via Web Push API
- VAPID authentication
- Reminder scheduling (7 AM, 8 PM defaults)

### 5. Admin Features
- Prayer Library management (bulk import/delete)
- Testimony approval workflow
- User management
- Encouragement message broadcasting

## Database Schema

### Key Tables
- `profiles` - User profiles with streak data
- `prayer_library` - Prayer points (Kingdom Focus, Listening Prayer)
- `guidelines` - Daily prayer guidelines with steps
- `journal_entries` - User journal entries
- `testimonies` - Shared testimonies
- `push_subscriptions` - Web push subscription data
- `prayer_reminders` - User reminder preferences

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Supabase Secrets (Edge Functions)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `SPEECHMATICS_API_KEY`
- `RESEND_API_KEY`

## Development Workflow

### Running Locally
```bash
npm install
npm run dev
```

### Git Remotes
- `origin` - Personal repo (Joshua-Ejiobih/spirit-scribe-path)
- `bincom` - Client repo (bincomict/easy-go-maker)

### Deployment
- Frontend: Deploy via Lovable (Share → Publish)
- Edge Functions: Deploy via Supabase CLI or Lovable

## Code Patterns

### State Management
- React Context for global state (Auth, Offline)
- Local state with useState/useReducer
- localStorage for offline caching
- Supabase for persistent data

### Component Patterns
- Functional components with hooks
- shadcn/ui composable components
- Responsive design (mobile-first)
- Glass morphism UI style

### Data Flow
1. User action triggers handler
2. Optimistic UI update (if applicable)
3. Supabase mutation
4. Real-time subscription updates other clients
5. Error handling with toast notifications

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link if needed

### Adding Edge Function
1. Create folder in `supabase/functions/`
2. Add `index.ts` with Deno.serve handler
3. Deploy via Supabase CLI or Lovable

### Modifying Database
1. Create migration in `supabase/migrations/`
2. Apply via Supabase dashboard or CLI

## Known Issues & Considerations

### Push Notifications
- VAPID keys must be properly configured in Supabase secrets
- Web-push library version may need updating
- Browser compatibility varies (Chrome best support)

### Offline Functionality
- Uses localStorage + IndexedDB pattern
- Syncs with Supabase when online
- Service worker handles caching

### TTS Audio
- Speechmatics API has rate limits
- Falls back to browser TTS if API fails
- Audio files stored in Supabase Storage

## Contact & Resources

- **Lovable Project**: https://lovable.dev/projects/53e1b464-50af-45e6-a12e-4b6e5a1fa706
- **Supabase Dashboard**: Access via Lovable integration
- **Documentation**: See PROJECT_DOCUMENTATION.md

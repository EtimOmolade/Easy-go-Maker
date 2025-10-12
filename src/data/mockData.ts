// Mock data for front-end prototype
// Backend integration can be restored by uncommenting Supabase code in components

export interface MockUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface MockProfile {
  id: string;
  name: string;
  email: string;
  streak_count: number;
  reminders_enabled: boolean;
  last_journal_date: string | null;
}

export interface MockJournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
  is_answered: boolean;
  is_shared: boolean;
  testimony_text?: string;
}

export interface MockTestimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  approved: boolean;
  profiles: {
    name: string;
  };
}

export interface MockGuideline {
  id: string;
  title: string;
  week_number: number;
  content: string;
  date_uploaded: string;
}

export interface MockEncouragementMessage {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

// Sample users
export const mockUsers: MockUser[] = [
  { id: '1', email: 'user@example.com', name: 'John Doe', isAdmin: false },
  { id: '2', email: 'admin@admin.com', name: 'Admin User', isAdmin: true },
  { id: '3', email: 'jane@example.com', name: 'Jane Smith', isAdmin: false },
];

// Sample profiles
export const mockProfiles: MockProfile[] = [
  { id: '1', name: 'John Doe', email: 'user@example.com', streak_count: 5, reminders_enabled: true, last_journal_date: new Date().toISOString().split('T')[0] },
  { id: '2', name: 'Admin User', email: 'admin@admin.com', streak_count: 15, reminders_enabled: true, last_journal_date: new Date().toISOString().split('T')[0] },
  { id: '3', name: 'Jane Smith', email: 'jane@example.com', streak_count: 3, reminders_enabled: false, last_journal_date: new Date().toISOString().split('T')[0] },
];

// Sample journal entries
export const mockJournalEntries: MockJournalEntry[] = [
  {
    id: '1',
    user_id: '1',
    title: 'Prayer for Family',
    content: 'Praying for peace and unity in my family. Lord, help us to love one another deeply.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_answered: true,
    is_shared: true,
    testimony_text: 'God has answered my prayer! My family had a wonderful reconciliation.'
  },
  {
    id: '2',
    user_id: '1',
    title: 'Job Opportunity',
    content: 'Asking God for guidance in my career path and for doors to open.',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_answered: false,
    is_shared: false
  },
  {
    id: '3',
    user_id: '1',
    title: 'Health and Healing',
    content: 'Praying for healing for my mother who is sick. Lord, touch her with your healing hand.',
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    is_answered: true,
    is_shared: false
  },
];

// Sample testimonies
export const mockTestimonies: MockTestimony[] = [
  {
    id: '1',
    user_id: '1',
    title: 'Prayer for Family',
    content: 'God has answered my prayer! My family had a wonderful reconciliation. We spent time together and truly connected. Praise the Lord!',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    approved: true,
    profiles: { name: 'John Doe' }
  },
  {
    id: '2',
    user_id: '3',
    title: 'Financial Breakthrough',
    content: 'God has answered my prayer! After months of struggle, I received an unexpected blessing that covered all my needs. God is faithful!',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    approved: true,
    profiles: { name: 'Jane Smith' }
  },
  {
    id: '3',
    user_id: '1',
    title: 'Pending Approval',
    content: 'This testimony is pending approval from admin.',
    date: new Date().toISOString().split('T')[0],
    approved: false,
    profiles: { name: 'John Doe' }
  }
];

// Sample guidelines
export const mockGuidelines: MockGuideline[] = [
  {
    id: '1',
    title: 'Week of Faith and Trust',
    week_number: 3,
    content: `Monday: Trust in the Lord
Proverbs 3:5-6
Pray for complete trust in God's plan for your life.

Tuesday: Faith Over Fear
2 Timothy 1:7
Ask God to replace your fears with faith and courage.

Wednesday: Walking by Faith
2 Corinthians 5:7
Pray for guidance to walk by faith, not by sight.

Thursday: Strengthening Faith
Romans 10:17
Thank God for His word that builds your faith.

Friday: Faith in Action
James 2:17
Ask God to help you demonstrate your faith through actions.

Saturday: Unwavering Faith
Hebrews 11:1
Pray for steadfast faith in God's promises.

Sunday: Rest and Reflection
Reflect on how God has strengthened your faith this week.`,
    date_uploaded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Week of Gratitude',
    week_number: 2,
    content: `Monday: Thankful Heart
Psalm 100:4
Begin the week with thanksgiving for God's blessings.

Tuesday: Count Your Blessings
1 Thessalonians 5:18
List and pray over all the ways God has blessed you.

Wednesday: Grateful in Trials
James 1:2-4
Thank God for growth through challenges.

Thursday: Worship Through Thanks
Psalm 95:2
Worship God with a grateful heart today.

Friday: Sharing Gratitude
Colossians 3:17
Thank God and share your gratitude with others.

Saturday: Grateful Living
Ephesians 5:20
Live today with constant awareness of God's goodness.

Sunday: Reflection on Blessings
Meditate on God's faithfulness in your life.`,
    date_uploaded: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Week of Prayer for Others',
    week_number: 1,
    content: `Monday: Family Members
Pray for each family member by name and their specific needs.

Tuesday: Friends and Community
Lift up friends and community members in prayer.

Wednesday: Church Leaders
Pray for wisdom and strength for church leaders.

Thursday: Those in Authority
1 Timothy 2:1-2
Pray for government leaders and those in authority.

Friday: The Sick and Suffering
Pray for healing and comfort for those who are ill.

Saturday: Lost and Unsaved
Pray for the salvation of those who don't know Christ.

Sunday: World Missions
Pray for missionaries and the spread of the Gospel worldwide.`,
    date_uploaded: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Sample encouragement messages
export const mockEncouragementMessages: MockEncouragementMessage[] = [
  {
    id: '1',
    content: `"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9

Remember, God's promises are true! As you continue your prayer journey, know that He hears every word and sees every tear. Stay consistent in your prayers, and watch how God works in your life.`,
    created_at: new Date().toISOString(),
    created_by: '2'
  }
];

// LocalStorage keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'prayerjournal_current_user',
  PROFILES: 'prayerjournal_profiles',
  JOURNAL_ENTRIES: 'prayerjournal_entries',
  TESTIMONIES: 'prayerjournal_testimonies',
  GUIDELINES: 'prayerjournal_guidelines',
  ENCOURAGEMENT: 'prayerjournal_encouragement',
  POPUP_SHOWN: 'prayerjournal_popup_shown'
};

// Initialize localStorage with mock data if empty
export const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(mockProfiles));
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES)) {
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(mockJournalEntries));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TESTIMONIES)) {
    localStorage.setItem(STORAGE_KEYS.TESTIMONIES, JSON.stringify(mockTestimonies));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GUIDELINES)) {
    localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(mockGuidelines));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENCOURAGEMENT)) {
    localStorage.setItem(STORAGE_KEYS.ENCOURAGEMENT, JSON.stringify(mockEncouragementMessages));
  }
};

// Helper functions for localStorage operations
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

export const setToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

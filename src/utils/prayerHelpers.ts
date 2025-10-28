import { STORAGE_KEYS, MILESTONES, getFromStorage, setToStorage, createNotification } from "@/data/mockData";

export const markPrayerCompleted = (userId: string): { newStreak: number; milestone?: any } => {
  const profiles = getFromStorage(STORAGE_KEYS.PROFILES, [] as any[]);

  console.log('[markPrayerCompleted] START - userId:', userId);
  console.log('[markPrayerCompleted] ALL profiles in localStorage (array):', profiles);

  // Find user profile in array
  let userProfile = profiles.find((p: any) => p.id === userId);

  if (!userProfile) {
    console.log('[markPrayerCompleted] Creating NEW profile for user:', userId);
    userProfile = {
      id: userId,
      streak_count: 0,
      last_prayer_date: null,
      current_milestone: 0,
      milestone_unlocked_dates: {}
    };
    profiles.push(userProfile);
  }

  const today = new Date().toISOString().split('T')[0];
  const lastPrayerDate = userProfile.last_prayer_date || userProfile.last_journal_date;
  let currentStreak = userProfile.streak_count || 0;

  console.log('[markPrayerCompleted] BEFORE update:', {
    userId,
    userProfile,
    currentStreak,
    lastPrayerDate,
    today
  });

  // Check if already prayed today
  if (lastPrayerDate === today) {
    console.log('Already prayed today, returning current streak:', currentStreak);
    return { newStreak: currentStreak };
  }

  // Calculate new streak (consecutive days)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastPrayerDate === yesterdayStr) {
    // Consecutive day - increment streak
    currentStreak += 1;
    console.log('Consecutive day! New streak:', currentStreak);
  } else if (!lastPrayerDate || lastPrayerDate < yesterdayStr) {
    // Streak broken or first prayer - start at 1
    currentStreak = 1;
    console.log('First prayer or streak broken. Starting new streak:', currentStreak);
  }

  // Check for milestone achievement based on STREAK
  const milestone = updateMilestoneForProfile(userId, currentStreak, profiles);

  // Update profile in the array
  userProfile.streak_count = currentStreak;
  userProfile.last_prayer_date = today;
  userProfile.last_journal_date = today;

  console.log('[markPrayerCompleted] SAVING to localStorage:', {
    userId,
    updatedProfile: userProfile,
    allProfilesCount: profiles.length
  });

  setToStorage(STORAGE_KEYS.PROFILES, profiles);

  console.log('[markPrayerCompleted] SAVED! Profile updated:', { userId, streak: currentStreak, milestone: milestone?.name });

  // Verify it was saved correctly
  const verifyProfiles = getFromStorage(STORAGE_KEYS.PROFILES, [] as any[]);
  const verifyProfile = verifyProfiles.find((p: any) => p.id === userId);
  console.log('[markPrayerCompleted] VERIFICATION - Reading back from localStorage:', {
    userId,
    savedProfile: verifyProfile,
    savedStreak: verifyProfile?.streak_count
  });

  // Create streak notification if multiple of 7
  if (currentStreak > 0 && currentStreak % 7 === 0) {
    createNotification(
      'streak',
      `${currentStreak}-Day Streak! 🔥`,
      `Amazing! You've prayed ${currentStreak} days in a row. Keep seeking Him first!`,
      userId,
      undefined,
      '🔥'
    );
  }

  return { newStreak: currentStreak, milestone };
};

const updateMilestoneForProfile = (userId: string, currentStreak: number, profiles: any[]): any | undefined => {
  // Find user profile in array
  const userProfile = profiles.find((p: any) => p.id === userId);
  if (!userProfile) return undefined;

  const currentMilestone = userProfile.current_milestone || 0;
  const shownCelebrations = getFromStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, {} as any);
  const userCelebrations = shownCelebrations[userId] || [];

  console.log('Checking milestones for streak:', currentStreak, 'Current milestone level:', currentMilestone);

  // Find the highest milestone achieved based on STREAK
  let newMilestone = currentMilestone;
  let achievedMilestoneData;

  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak >= MILESTONES[i].streak_needed) {
      newMilestone = MILESTONES[i].level;
      achievedMilestoneData = MILESTONES[i];
      console.log('Milestone found:', MILESTONES[i].name, 'Level:', MILESTONES[i].level);
      break;
    }
  }

  // If new milestone achieved
  if (newMilestone > currentMilestone) {
    console.log('NEW MILESTONE ACHIEVED!', achievedMilestoneData?.name);
    userProfile.current_milestone = newMilestone;
    if (!userProfile.milestone_unlocked_dates) {
      userProfile.milestone_unlocked_dates = {};
    }
    userProfile.milestone_unlocked_dates[newMilestone] = new Date().toISOString();

    // Check if we should show celebration (not shown before)
    if (!userCelebrations.includes(newMilestone)) {
      userCelebrations.push(newMilestone);
      shownCelebrations[userId] = userCelebrations;
      setToStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, shownCelebrations);
      console.log('Celebration will be shown for:', achievedMilestoneData?.name);
      return achievedMilestoneData;
    } else {
      console.log('Celebration already shown for this milestone');
    }
  }

  return undefined;
};

export const checkMilestoneAchievement = (userId: string): any | undefined => {
  const profiles = getFromStorage(STORAGE_KEYS.PROFILES, [] as any[]);
  const userProfile = profiles.find((p: any) => p.id === userId);
  if (!userProfile) return undefined;

  const currentMilestone = userProfile.current_milestone || 0;
  const currentStreak = userProfile.streak_count || 0;
  const shownCelebrations = getFromStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, {} as any);
  const userCelebrations = shownCelebrations[userId] || [];

  // Find the highest milestone achieved based on STREAK
  let newMilestone = currentMilestone;
  let achievedMilestoneData;

  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak >= MILESTONES[i].streak_needed) {
      newMilestone = MILESTONES[i].level;
      achievedMilestoneData = MILESTONES[i];
      break;
    }
  }

  // If new milestone and not shown before
  if (newMilestone > currentMilestone && !userCelebrations.includes(newMilestone)) {
    profiles[userId].current_milestone = newMilestone;
    if (!profiles[userId].milestone_unlocked_dates) {
      profiles[userId].milestone_unlocked_dates = {};
    }
    profiles[userId].milestone_unlocked_dates[newMilestone] = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PROFILES, profiles);

    // Mark celebration as shown
    userCelebrations.push(newMilestone);
    shownCelebrations[userId] = userCelebrations;
    setToStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, shownCelebrations);

    return achievedMilestoneData;
  }

  return undefined;
};

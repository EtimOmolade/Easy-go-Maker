import { STORAGE_KEYS, MILESTONES, getFromStorage, setToStorage } from "@/data/mockData";

export const markPrayerCompleted = (userId: string): { newStreak: number; milestone?: any } => {
  const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
  
  if (!profiles[userId]) {
    profiles[userId] = {
      streak_count: 0,
      last_journal_date: null,
      current_milestone: 0,
      milestone_unlocked_dates: {}
    };
  }
  
  const today = new Date().toISOString().split('T')[0];
  const lastPrayerDate = profiles[userId].last_journal_date;
  let currentStreak = profiles[userId].streak_count || 0;
  
  // Check if already prayed today
  if (lastPrayerDate === today) {
    return { newStreak: currentStreak };
  }
  
  // Calculate new streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastPrayerDate === yesterdayStr) {
    // Consecutive day
    currentStreak += 1;
  } else if (!lastPrayerDate || lastPrayerDate < yesterdayStr) {
    // Streak broken or first prayer
    currentStreak = 1;
  }
  
  // Update profile
  profiles[userId].streak_count = currentStreak;
  profiles[userId].last_journal_date = today;
  setToStorage(STORAGE_KEYS.PROFILES, profiles);
  
  // Check for milestone achievement
  const milestone = checkMilestoneAchievement(userId, currentStreak);
  
  return { newStreak: currentStreak, milestone };
};

export const checkMilestoneAchievement = (userId: string, currentStreak: number): any | undefined => {
  const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
  const userProfile = profiles[userId] || {};
  const currentMilestone = userProfile.current_milestone || 0;
  const shownCelebrations = getFromStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, {} as any);
  const userCelebrations = shownCelebrations[userId] || [];
  
  // Find the highest milestone achieved based on streak
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

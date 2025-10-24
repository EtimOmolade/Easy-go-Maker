import { STORAGE_KEYS, getFromStorage, setToStorage, createNotification } from "@/data/mockData";

export const submitTestimony = (
  userId: string,
  title: string,
  content: string,
  userName: string,
  audioNote?: string,
  audioDuration?: number
) => {
  const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
  const newTestimony = {
    id: `testimony-${Date.now()}`,
    user_id: userId,
    title,
    content,
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    approved: false,
    status: 'pending',
    audio_note: audioNote,
    audio_duration: audioDuration,
    profiles: { name: userName }
  };
  
  testimonies.push(newTestimony);
  setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);

  // Create admin notification for new testimony
  createAdminNotificationForTestimony(newTestimony);
  
  return newTestimony;
};

export const resubmitTestimony = (
  testimonyId: string,
  title: string,
  content: string,
  audioNote?: string,
  audioDuration?: number
) => {
  const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
  const testimonyIndex = testimonies.findIndex((t: any) => t.id === testimonyId);
  
  if (testimonyIndex !== -1) {
    testimonies[testimonyIndex] = {
      ...testimonies[testimonyIndex],
      title,
      content,
      status: 'pending',
      approved: false,
      rejection_reason: undefined,
      admin_note: undefined,
      rejected_by: undefined,
      rejected_at: undefined,
      resubmitted_at: new Date().toISOString(),
      audio_note: audioNote,
      audio_duration: audioDuration
    };
    setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
    
    // Create admin notification for resubmitted testimony
    createAdminNotificationForResubmission(testimonies[testimonyIndex]);
  }
};

export const approveTestimony = (testimonyId: string, adminName: string) => {
  const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
  const testimonyIndex = testimonies.findIndex((t: any) => t.id === testimonyId);
  
  if (testimonyIndex !== -1) {
    const testimony = testimonies[testimonyIndex];
    testimonies[testimonyIndex].approved = true;
    testimonies[testimonyIndex].status = 'approved';
    testimonies[testimonyIndex].approved_at = new Date().toISOString();
    testimonies[testimonyIndex].approved_by = adminName;
    setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
    
    // Create announcement for approved testimony
    createAnnouncementForTestimony(testimony);
    
    // Mark related admin notification as read
    markAdminNotificationAsHandled(testimony.id);
  }
};

export const rejectTestimony = (
  testimonyId: string,
  reason: string,
  adminNote: string | undefined,
  adminName: string
) => {
  const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
  const testimonyIndex = testimonies.findIndex((t: any) => t.id === testimonyId);
  
  if (testimonyIndex !== -1) {
    testimonies[testimonyIndex].approved = false;
    testimonies[testimonyIndex].status = 'rejected';
    testimonies[testimonyIndex].rejection_reason = reason;
    testimonies[testimonyIndex].admin_note = adminNote;
    testimonies[testimonyIndex].rejected_by = adminName;
    testimonies[testimonyIndex].rejected_at = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
    
    // Mark related admin notification as handled
    markAdminNotificationAsHandled(testimonyId);
  }
};

const createAdminNotificationForTestimony = (testimony: any) => {
  // Get all admin users
  const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});
  const adminUserIds = Object.keys(userRoles).filter(userId => userRoles[userId] === 'admin');
  
  // Create notification for each admin
  adminUserIds.forEach(adminId => {
    createNotification(
      'testimony',
      'New Testimony Pending',
      `📝 New testimony: "${testimony.title}"`,
      adminId,
      testimony.id,
      '📝',
      true // isAdminOnly
    );
  });
};

const createAdminNotificationForResubmission = (testimony: any) => {
  // Get all admin users
  const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});
  const adminUserIds = Object.keys(userRoles).filter(userId => userRoles[userId] === 'admin');
  
  // Create notification for each admin
  adminUserIds.forEach(adminId => {
    createNotification(
      'testimony',
      'Testimony Resubmitted',
      `🔄 Resubmitted testimony: "${testimony.title}"`,
      adminId,
      testimony.id,
      '🔄',
      true // isAdminOnly
    );
  });
};

const createAnnouncementForTestimony = (testimony: any) => {
  const messages = getFromStorage(STORAGE_KEYS.ENCOURAGEMENT, [] as any[]);
  const announcement = {
    id: `announce-testimony-${Date.now()}`,
    content: `✨ New testimony: ${testimony.title.substring(0, 40)}${testimony.title.length > 40 ? '...' : ''}\n\nA member has shared an inspiring testimony!`,
    created_at: new Date().toISOString(),
    created_by: 'system'
  };
  messages.push(announcement);
  setToStorage(STORAGE_KEYS.ENCOURAGEMENT, messages);
};

const markAdminNotificationAsHandled = (testimonyId: string) => {
  const { markNotificationAsRead, getFromStorage, STORAGE_KEYS } = require('@/data/mockData');
  const notifications = getFromStorage(STORAGE_KEYS.NOTIFICATIONS, [] as any[]);
  
  notifications.forEach((n: any) => {
    if (n.messageId === testimonyId && n.type === 'testimony') {
      markNotificationAsRead(n.id);
    }
  });
};

// IndexedDB utility for offline storage
const DB_NAME = 'SpiritConnectDB';
const DB_VERSION = 4; // v4: Add voice prompts, user data, announcements, guidelines list

// Store names
export const STORES = {
  GUIDELINES: 'guidelines',
  JOURNAL_ENTRIES: 'journalEntries',
  PRAYER_HISTORY: 'prayerHistory',
  SYNC_QUEUE: 'syncQueue',
  VOICE_PROMPTS: 'voicePrompts', // NEW: Voice prompt audio files
  USER_DATA: 'userData', // NEW: User profile and stats
  ANNOUNCEMENTS: 'announcements', // NEW: Community announcements
  GUIDELINES_LIST: 'guidelinesList', // NEW: Complete list of guidelines
  PRAYER_PROGRESS: 'prayerProgress', // NEW: Daily prayer completion tracking
};

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.GUIDELINES)) {
        db.createObjectStore(STORES.GUIDELINES, { keyPath: 'id' });
      }

      // Migrate JOURNAL_ENTRIES store from v1 to v3 (remove autoIncrement, use number for synced)
      if (oldVersion < 3 && db.objectStoreNames.contains(STORES.JOURNAL_ENTRIES)) {
        console.log('🔄 Migrating JOURNAL_ENTRIES store to v3 (removing autoIncrement, fixing synced index)');
        db.deleteObjectStore(STORES.JOURNAL_ENTRIES);
      }

      if (!db.objectStoreNames.contains(STORES.JOURNAL_ENTRIES)) {
        const journalStore = db.createObjectStore(STORES.JOURNAL_ENTRIES, {
          keyPath: 'id',
        });
        journalStore.createIndex('created_at', 'created_at', { unique: false });
        journalStore.createIndex('synced', 'synced', { unique: false });
      }

      // Migrate PRAYER_HISTORY store from v1 to v3 (remove autoIncrement, use number for synced)
      if (oldVersion < 3 && db.objectStoreNames.contains(STORES.PRAYER_HISTORY)) {
        console.log('🔄 Migrating PRAYER_HISTORY store to v3 (removing autoIncrement, fixing synced index)');
        db.deleteObjectStore(STORES.PRAYER_HISTORY);
      }

      if (!db.objectStoreNames.contains(STORES.PRAYER_HISTORY)) {
        const prayerStore = db.createObjectStore(STORES.PRAYER_HISTORY, {
          keyPath: 'id',
        });
        prayerStore.createIndex('date', 'date', { unique: false });
        prayerStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // NEW STORES for v4
      if (!db.objectStoreNames.contains(STORES.VOICE_PROMPTS)) {
        const voiceStore = db.createObjectStore(STORES.VOICE_PROMPTS, {
          keyPath: 'name',
        });
        voiceStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.ANNOUNCEMENTS)) {
        const announcementStore = db.createObjectStore(STORES.ANNOUNCEMENTS, {
          keyPath: 'id',
        });
        announcementStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.GUIDELINES_LIST)) {
        const guidelinesListStore = db.createObjectStore(STORES.GUIDELINES_LIST, {
          keyPath: 'id',
        });
        guidelinesListStore.createIndex('month', 'month', { unique: false });
        guidelinesListStore.createIndex('day', 'day', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PRAYER_PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PRAYER_PROGRESS, {
          keyPath: 'id',
        });
        progressStore.createIndex('user_id', 'user_id', { unique: false });
        progressStore.createIndex('guideline_id', 'guideline_id', { unique: false });
      }
    };
  });
};

// Generic CRUD operations
export const saveToStore = async (
  storeName: string,
  data: any
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFromStore = async (
  storeName: string,
  key: any
): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFromStore = async (storeName: string): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFromStore = async (
  storeName: string,
  key: any
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Sync queue operations
export const addToSyncQueue = async (
  type: string,
  data: any
): Promise<void> => {
  await saveToStore(STORES.SYNC_QUEUE, {
    type,
    data,
    timestamp: Date.now(),
  });
};

export const getSyncQueue = async (): Promise<any[]> => {
  return getAllFromStore(STORES.SYNC_QUEUE);
};

export const clearSyncQueue = async (): Promise<void> => {
  return clearStore(STORES.SYNC_QUEUE);
};

// Cache guidelines for offline access
export const cacheGuidelines = async (guidelines: any[]): Promise<void> => {
  for (const guideline of guidelines) {
    await saveToStore(STORES.GUIDELINES, {
      ...guideline,
      cachedAt: Date.now(), // Add timestamp for cache invalidation
    });
  }
};

export const getCachedGuidelines = async (): Promise<any[]> => {
  return getAllFromStore(STORES.GUIDELINES);
};

// Cache a single guideline with all its data (for prayer sessions)
export const cacheGuideline = async (guideline: any): Promise<void> => {
  await saveToStore(STORES.GUIDELINES, {
    ...guideline,
    cachedAt: Date.now(),
  });
  console.log(`✅ Cached guideline: ${guideline.id}`);
};

// Get a cached guideline by ID
export const getCachedGuideline = async (id: string): Promise<any | null> => {
  try {
    const guideline = await getFromStore(STORES.GUIDELINES, id);

    // Check if cache is still valid (e.g., 7 days)
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (guideline && guideline.cachedAt) {
      const age = Date.now() - guideline.cachedAt;
      if (age > CACHE_DURATION) {
        console.log(`⚠️ Cached guideline expired: ${id}`);
        return null; // Cache expired
      }
    }

    return guideline;
  } catch (error) {
    console.error('Error getting cached guideline:', error);
    return null;
  }
};

// Cache journal entries from Supabase for offline access
export const cacheJournalEntries = async (entries: any[]): Promise<void> => {
  try {
    for (const entry of entries) {
      await saveToStore(STORES.JOURNAL_ENTRIES, {
        ...entry,
        cached: true, // Mark as cached from Supabase
        synced: 1, // Already synced (came from server) - 1 = true
        cachedAt: Date.now(),
      });
    }
    console.log(`✅ Cached ${entries.length} journal entries for offline access`);
  } catch (error) {
    console.error('Error caching journal entries:', error);
  }
};

// Get all cached journal entries (from Supabase)
export const getCachedJournalEntries = async (): Promise<any[]> => {
  try {
    const allEntries = await getAllFromStore(STORES.JOURNAL_ENTRIES);
    // Return only cached entries (synced: true, cached: true)
    return allEntries.filter((entry: any) => entry.cached === true);
  } catch (error) {
    console.error('Error getting cached journal entries:', error);
    return [];
  }
};

// Helper: Generate UUID for offline entries
const generateOfflineId = (): string => {
  return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Save journal entry offline
export const saveJournalOffline = async (entry: any): Promise<void> => {
  await saveToStore(STORES.JOURNAL_ENTRIES, {
    ...entry,
    id: entry.id || generateOfflineId(), // Generate ID if not present
    cached: false, // Not a cached entry, created offline
    synced: 0, // Not synced yet - 0 = false
    created_at: new Date().toISOString(),
  });
};

// Get unsynced journal entries (created offline, not synced yet)
export const getUnsyncedJournalEntries = async (): Promise<any[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.JOURNAL_ENTRIES], 'readonly');
      const store = transaction.objectStore(STORES.JOURNAL_ENTRIES);

      // Check if index exists
      if (!store.indexNames.contains('synced')) {
        console.warn('Index "synced" not found in journal entries, returning empty array');
        resolve([]);
        return;
      }

      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0)); // 0 = not synced

      request.onsuccess = () => {
        // Filter out cached entries - only return offline entries
        const unsyncedEntries = (request.result || []).filter((entry: any) => entry.cached !== true);
        resolve(unsyncedEntries);
      };
      request.onerror = () => {
        console.error('Error fetching unsynced journal entries:', request.error);
        resolve([]); // Return empty array instead of rejecting
      };
    });
  } catch (error) {
    console.error('Error in getUnsyncedJournalEntries:', error);
    return []; // Return empty array on error
  }
};

// Mark journal entry as synced
export const markJournalSynced = async (id: string | number): Promise<void> => {
  const entry = await getFromStore(STORES.JOURNAL_ENTRIES, id);
  if (entry) {
    await saveToStore(STORES.JOURNAL_ENTRIES, { ...entry, synced: 1 }); // 1 = true
  }
};

// Save prayer history offline
export const savePrayerHistoryOffline = async (
  history: any
): Promise<void> => {
  await saveToStore(STORES.PRAYER_HISTORY, {
    ...history,
    id: history.id || generateOfflineId(), // Generate ID if not present
    synced: 0, // Not synced yet - 0 = false
    date: new Date().toISOString(),
  });
};

// Get unsynced prayer history
export const getUnsyncedPrayerHistory = async (): Promise<any[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PRAYER_HISTORY], 'readonly');
      const store = transaction.objectStore(STORES.PRAYER_HISTORY);

      // Check if index exists
      if (!store.indexNames.contains('synced')) {
        console.warn('Index "synced" not found in prayer history, returning empty array');
        resolve([]);
        return;
      }

      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0)); // 0 = not synced

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Error fetching unsynced prayer history:', request.error);
        resolve([]); // Return empty array instead of rejecting
      };
    });
  } catch (error) {
    console.error('Error in getUnsyncedPrayerHistory:', error);
    return []; // Return empty array on error
  }
};

// Mark prayer history as synced
export const markPrayerHistorySynced = async (id: string | number): Promise<void> => {
  const history = await getFromStore(STORES.PRAYER_HISTORY, id);
  if (history) {
    await saveToStore(STORES.PRAYER_HISTORY, { ...history, synced: 1 }); // 1 = true
  }
};

// Save prayer session completion offline
export const savePrayerCompletionOffline = async (completion: {
  user_id: string;
  guideline_id: string;
  day_of_week: string;
  journal_entry: {
    title: string;
    content: string;
    date: string;
  };
}): Promise<void> => {
  await saveToStore(STORES.PRAYER_HISTORY, {
    ...completion,
    id: generateOfflineId(), // Generate ID for prayer completion
    type: 'completion', // Mark as completion event
    synced: 0, // Not synced yet - 0 = false
    date: new Date().toISOString(),
  });
  console.log(`✅ Saved prayer completion offline: ${completion.guideline_id}`);
};

// Delete synced offline entries (cleanup after successful sync)
export const cleanupSyncedEntries = async (): Promise<void> => {
  try {
    const journalEntries = await getAllFromStore(STORES.JOURNAL_ENTRIES);
    const syncedJournal = journalEntries.filter((entry: any) => entry.synced === 1); // 1 = true

    for (const entry of syncedJournal) {
      if (entry.id) {
        await deleteFromStore(STORES.JOURNAL_ENTRIES, entry.id);
      }
    }

    const prayerHistory = await getAllFromStore(STORES.PRAYER_HISTORY);
    const syncedPrayers = prayerHistory.filter((entry: any) => entry.synced === 1); // 1 = true

    for (const entry of syncedPrayers) {
      if (entry.id) {
        await deleteFromStore(STORES.PRAYER_HISTORY, entry.id);
      }
    }

    console.log(`🧹 Cleaned up ${syncedJournal.length} journal entries and ${syncedPrayers.length} prayer entries`);
  } catch (error) {
    console.error('Error cleaning up synced entries:', error);
  }
};

// ============================================================================
// NEW: Voice Prompt Caching Functions
// ============================================================================

export interface VoicePrompt {
  name: string;
  url: string;
  blob?: Blob;
  cachedAt: number;
}

// Cache voice prompt audio file
export const cacheVoicePrompt = async (name: string, url: string, blob?: Blob): Promise<void> => {
  try {
    await saveToStore(STORES.VOICE_PROMPTS, {
      name,
      url,
      blob,
      cachedAt: Date.now(),
    });
    console.log(`✅ Cached voice prompt: ${name}`);
  } catch (error) {
    console.error(`Error caching voice prompt ${name}:`, error);
  }
};

// Get cached voice prompt
export const getCachedVoicePrompt = async (name: string): Promise<VoicePrompt | null> => {
  try {
    const prompt = await getFromStore(STORES.VOICE_PROMPTS, name);

    // Check if cache is still valid (30 days)
    const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (prompt && prompt.cachedAt) {
      const age = Date.now() - prompt.cachedAt;
      if (age > CACHE_DURATION) {
        console.log(`⚠️ Voice prompt cache expired: ${name}`);
        await deleteFromStore(STORES.VOICE_PROMPTS, name);
        return null;
      }
    }

    return prompt;
  } catch (error) {
    console.error(`Error getting cached voice prompt ${name}:`, error);
    return null;
  }
};

// Download and cache all voice prompts
export const downloadAndCacheVoicePrompts = async (prompts: { name: string; url: string }[]): Promise<void> => {
  console.log(`📥 Downloading ${prompts.length} voice prompts...`);
  let cached = 0;
  let failed = 0;

  for (const prompt of prompts) {
    try {
      // Check if already cached
      const existing = await getCachedVoicePrompt(prompt.name);
      if (existing) {
        console.log(`✓ Voice prompt already cached: ${prompt.name}`);
        cached++;
        continue;
      }

      // Download the audio file
      const response = await fetch(prompt.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      await cacheVoicePrompt(prompt.name, prompt.url, blob);
      cached++;
    } catch (error) {
      console.error(`Failed to cache voice prompt ${prompt.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Voice prompts cached: ${cached}/${prompts.length} (${failed} failed)`);
};

// ============================================================================
// NEW: User Data Caching Functions
// ============================================================================

// Cache user profile data
export const cacheUserData = async (userId: string, data: any): Promise<void> => {
  try {
    await saveToStore(STORES.USER_DATA, {
      id: userId,
      ...data,
      cachedAt: Date.now(),
    });
    console.log(`✅ Cached user data for: ${userId}`);
  } catch (error) {
    console.error('Error caching user data:', error);
  }
};

// Get cached user data
export const getCachedUserData = async (userId: string): Promise<any | null> => {
  try {
    const userData = await getFromStore(STORES.USER_DATA, userId);

    // Check if cache is still valid (24 hours)
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    if (userData && userData.cachedAt) {
      const age = Date.now() - userData.cachedAt;
      if (age > CACHE_DURATION) {
        console.log(`⚠️ User data cache expired: ${userId}`);
        return null;
      }
    }

    return userData;
  } catch (error) {
    console.error('Error getting cached user data:', error);
    return null;
  }
};

// ============================================================================
// NEW: Announcements Caching Functions
// ============================================================================

// Cache community announcements
export const cacheAnnouncements = async (announcements: any[]): Promise<void> => {
  try {
    for (const announcement of announcements) {
      await saveToStore(STORES.ANNOUNCEMENTS, {
        ...announcement,
        cachedAt: Date.now(),
      });
    }
    console.log(`✅ Cached ${announcements.length} announcements`);
  } catch (error) {
    console.error('Error caching announcements:', error);
  }
};

// Get cached announcements
export const getCachedAnnouncements = async (): Promise<any[]> => {
  try {
    const announcements = await getAllFromStore(STORES.ANNOUNCEMENTS);

    // Filter out expired announcements (48 hours)
    const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();

    return announcements.filter((announcement: any) => {
      if (!announcement.cachedAt) return true;
      const age = now - announcement.cachedAt;
      return age < CACHE_DURATION;
    });
  } catch (error) {
    console.error('Error getting cached announcements:', error);
    return [];
  }
};

// ============================================================================
// NEW: Guidelines List Caching Functions
// ============================================================================

// Cache complete guidelines list
export const cacheGuidelinesList = async (guidelines: any[]): Promise<void> => {
  try {
    for (const guideline of guidelines) {
      await saveToStore(STORES.GUIDELINES_LIST, {
        ...guideline,
        cachedAt: Date.now(),
      });
    }
    console.log(`✅ Cached ${guidelines.length} guidelines in list`);
  } catch (error) {
    console.error('Error caching guidelines list:', error);
  }
};

// Get cached guidelines list
export const getCachedGuidelinesList = async (): Promise<any[]> => {
  try {
    const guidelines = await getAllFromStore(STORES.GUIDELINES_LIST);

    // Check if cache is still valid (7 days)
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    const validGuidelines = guidelines.filter((guideline: any) => {
      if (!guideline.cachedAt) return true;
      const age = now - guideline.cachedAt;
      return age < CACHE_DURATION;
    });

    return validGuidelines;
  } catch (error) {
    console.error('Error getting cached guidelines list:', error);
    return [];
  }
};

// ============================================================================
// NEW: Prayer Progress Caching Functions
// ============================================================================

// Cache prayer progress data
export const cachePrayerProgress = async (progress: any[]): Promise<void> => {
  try {
    for (const record of progress) {
      await saveToStore(STORES.PRAYER_PROGRESS, {
        ...record,
        cachedAt: Date.now(),
      });
    }
    console.log(`✅ Cached ${progress.length} prayer progress records`);
  } catch (error) {
    console.error('Error caching prayer progress:', error);
  }
};

// Get cached prayer progress for user and guideline
export const getCachedPrayerProgress = async (userId: string, guidelineId: string): Promise<any[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PRAYER_PROGRESS], 'readonly');
      const store = transaction.objectStore(STORES.PRAYER_PROGRESS);
      const request = store.getAll();

      request.onsuccess = () => {
        const allProgress = request.result || [];
        const filtered = allProgress.filter((record: any) =>
          record.user_id === userId && record.guideline_id === guidelineId
        );
        resolve(filtered);
      };
      request.onerror = () => {
        console.error('Error fetching prayer progress:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Error getting cached prayer progress:', error);
    return [];
  }
};

// IndexedDB utility for offline storage
const DB_NAME = 'SpiritConnectDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  GUIDELINES: 'guidelines',
  JOURNAL_ENTRIES: 'journalEntries',
  PRAYER_HISTORY: 'prayerHistory',
  SYNC_QUEUE: 'syncQueue',
};

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.GUIDELINES)) {
        db.createObjectStore(STORES.GUIDELINES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.JOURNAL_ENTRIES)) {
        const journalStore = db.createObjectStore(STORES.JOURNAL_ENTRIES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        journalStore.createIndex('created_at', 'created_at', { unique: false });
        journalStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PRAYER_HISTORY)) {
        const prayerStore = db.createObjectStore(STORES.PRAYER_HISTORY, {
          keyPath: 'id',
          autoIncrement: true,
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
    await saveToStore(STORES.GUIDELINES, guideline);
  }
};

export const getCachedGuidelines = async (): Promise<any[]> => {
  return getAllFromStore(STORES.GUIDELINES);
};

// Save journal entry offline
export const saveJournalOffline = async (entry: any): Promise<void> => {
  await saveToStore(STORES.JOURNAL_ENTRIES, {
    ...entry,
    synced: false,
    created_at: new Date().toISOString(),
  });
};

// Get unsynced journal entries
export const getUnsyncedJournalEntries = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.JOURNAL_ENTRIES], 'readonly');
    const store = transaction.objectStore(STORES.JOURNAL_ENTRIES);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Mark journal entry as synced
export const markJournalSynced = async (id: number): Promise<void> => {
  const entry = await getFromStore(STORES.JOURNAL_ENTRIES, id);
  if (entry) {
    await saveToStore(STORES.JOURNAL_ENTRIES, { ...entry, synced: true });
  }
};

// Save prayer history offline
export const savePrayerHistoryOffline = async (
  history: any
): Promise<void> => {
  await saveToStore(STORES.PRAYER_HISTORY, {
    ...history,
    synced: false,
    date: new Date().toISOString(),
  });
};

// Get unsynced prayer history
export const getUnsyncedPrayerHistory = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PRAYER_HISTORY], 'readonly');
    const store = transaction.objectStore(STORES.PRAYER_HISTORY);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

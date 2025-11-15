import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getSyncQueue,
  clearSyncQueue,
  getUnsyncedJournalEntries,
  markJournalSynced,
  getUnsyncedPrayerHistory,
} from "@/utils/offlineStorage";
import { supabase } from "@/integrations/supabase/client";

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSync: number;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  // Check pending sync count
  const checkPendingSync = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      const unsyncedJournal = await getUnsyncedJournalEntries();
      const unsyncedPrayer = await getUnsyncedPrayerHistory();

      setPendingSync(
        queue.length + unsyncedJournal.length + unsyncedPrayer.length
      );
    } catch (error) {
      console.error('Error checking pending sync:', error);
    }
  }, []);

  // Sync offline data when back online
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      // Sync journal entries
      const unsyncedJournal = await getUnsyncedJournalEntries();
      for (const entry of unsyncedJournal) {
        try {
          const { error } = await supabase
            .from('journal_entries')
            .insert({
              content: entry.content,
              guideline_id: entry.guideline_id,
              created_at: entry.created_at,
            } as any);

          if (!error && entry.id) {
            await markJournalSynced(entry.id);
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing journal entry:', error);
        }
      }

      // Sync prayer history
      const unsyncedPrayer = await getUnsyncedPrayerHistory();
      for (const history of unsyncedPrayer) {
        try {
          const { error } = await (supabase as any)
            .from('prayer_history')
            .insert({
              guideline_id: history.guideline_id,
              completed_at: history.date,
            });

          if (!error) {
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing prayer history:', error);
        }
      }

      // Clear sync queue
      await clearSyncQueue();

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} item${syncedCount > 1 ? 's' : ''} successfully!`);
      }

      await checkPendingSync();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Some items failed to sync. Will retry when connection is stable.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, checkPendingSync]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing your data...');
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline. Don\'t worry, your progress will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending sync after a short delay to ensure DB is initialized
    setTimeout(() => {
      checkPendingSync();
    }, 1000);

    // Auto-sync every 30 seconds if online
    const syncInterval = setInterval(() => {
      if (isOnline && pendingSync > 0) {
        syncNow();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncNow, checkPendingSync, isOnline, pendingSync]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingSync,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};

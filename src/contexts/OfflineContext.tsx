import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getSyncQueue,
  clearSyncQueue,
  getUnsyncedJournalEntries,
  markJournalSynced,
  getUnsyncedPrayerHistory,
  markPrayerHistorySynced,
  cleanupSyncedEntries,
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
      // Silently handle IndexedDB errors - database may not be initialized yet
      console.debug('IndexedDB check skipped:', error);
      setPendingSync(0);
    }
  }, []);

  // Sync offline data when back online
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Sync journal entries
      const unsyncedJournal = await getUnsyncedJournalEntries();
      for (const entry of unsyncedJournal) {
        try {
          const { error } = await supabase
            .from('journal_entries')
            .insert({
              user_id: entry.user_id,
              title: entry.title,
              content: entry.content,
              date: entry.date,
              guideline_id: entry.guideline_id,
              created_at: entry.created_at,
              is_answered: entry.is_answered || false,
              is_shared: entry.is_shared || false,
            } as any);

          if (!error && entry.id) {
            await markJournalSynced(entry.id);
            syncedCount++;
          } else {
            failedCount++;
            console.error('Error syncing journal entry:', error);
          }
        } catch (error) {
          failedCount++;
          console.error('Error syncing journal entry:', error);
        }
      }

      // Sync prayer completions (includes daily_prayers + journal entries)
      const unsyncedPrayer = await getUnsyncedPrayerHistory();
      for (const history of unsyncedPrayer) {
        try {
          if (history.type === 'completion') {
            // This is a prayer session completion
            const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayOfWeekLowercase = history.day_of_week.toLowerCase();

            // Check if already synced to avoid duplicates
            const { data: existingPrayer } = await supabase
              .from('daily_prayers')
              .select('*')
              .eq('user_id', history.user_id)
              .eq('guideline_id', history.guideline_id)
              .eq('day_of_week', dayOfWeekLowercase)
              .maybeSingle();

            if (!existingPrayer) {
              // Sync daily prayer record
              const { error: prayerError } = await supabase
                .from('daily_prayers')
                .insert({
                  user_id: history.user_id,
                  guideline_id: history.guideline_id,
                  day_of_week: dayOfWeekLowercase,
                  completed_at: history.date || new Date().toISOString(),
                });

              if (prayerError) {
                console.error('Error syncing daily prayer:', prayerError);
                failedCount++;
                continue;
              }

              // Sync associated journal entry
              if (history.journal_entry) {
                const { error: journalError } = await supabase
                  .from('journal_entries')
                  .insert({
                    user_id: history.user_id,
                    title: history.journal_entry.title,
                    content: history.journal_entry.content,
                    date: history.journal_entry.date,
                    is_answered: false,
                    is_shared: false,
                  });

                if (journalError) {
                  console.error('Error syncing prayer journal entry:', journalError);
                  // Don't increment failedCount here - prayer was synced successfully
                }
              }

              if (history.id) {
                await markPrayerHistorySynced(history.id);
              }
              syncedCount++;
            } else {
              // Already synced, just mark as synced in IndexedDB
              if (history.id) {
                await markPrayerHistorySynced(history.id);
              }
            }
          } else {
            // Legacy prayer history format
            const { error } = await supabase
              .from('prayer_history')
              .insert({
                guideline_id: history.guideline_id,
                completed_at: history.date,
              } as any);

            if (!error && history.id) {
              await markPrayerHistorySynced(history.id);
              syncedCount++;
            } else {
              failedCount++;
            }
          }
        } catch (error) {
          failedCount++;
          console.error('Error syncing prayer data:', error);
        }
      }

      // Clean up synced entries from IndexedDB
      await cleanupSyncedEntries();

      // Clear sync queue
      await clearSyncQueue();

      if (syncedCount > 0) {
        toast.success(`✅ Synced ${syncedCount} item${syncedCount > 1 ? 's' : ''} successfully!`);
      }

      if (failedCount > 0) {
        toast.warning(`⚠️ ${failedCount} item${failedCount > 1 ? 's' : ''} failed to sync. Will retry automatically.`);
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

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOffline } from '@/contexts/OfflineContext';
import { 
  saveJournalOffline, 
  getUnsyncedJournalEntries,
  getAllFromStore,
  STORES 
} from '@/utils/offlineStorage';
import { toast } from 'sonner';

interface JournalEntry {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  date?: string;
  created_at?: string;
  guideline_id?: string;
  is_answered?: boolean;
  is_shared?: boolean;
  voice_note_url?: string;
  testimony_text?: string;
}

export const useOfflineJournal = (userId: string | undefined) => {
  const { isOnline } = useOffline();
  const [syncing, setSyncing] = useState(false);

  const saveEntry = useCallback(async (entry: JournalEntry) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      if (isOnline) {
        // Save to Supabase when online
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            ...entry,
            date: entry.date || new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
        return true;
      } else {
        // Save to IndexedDB when offline
        await saveJournalOffline({
          ...entry,
          user_id: userId,
          date: entry.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });
        toast.info('Saved offline. Will sync when connection is restored.');
        return true;
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      // Try to save offline as fallback
      if (isOnline) {
        try {
          await saveJournalOffline({
            ...entry,
            user_id: userId,
            date: entry.date || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          });
          toast.warning('Saved offline due to sync error. Will retry later.');
          return true;
        } catch (offlineError) {
          console.error('Error saving offline:', offlineError);
        }
      }
      return false;
    }
  }, [userId, isOnline]);

  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    if (!userId) return false;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('journal_entries')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return true;
      } else {
        toast.info('Cannot update entries while offline. Changes will not be saved.');
        return false;
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      return false;
    }
  }, [userId, isOnline]);

  const fetchEntries = useCallback(async () => {
    if (!userId) return [];

    try {
      if (isOnline) {
        // Fetch from Supabase when online
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        // Fetch from IndexedDB when offline
        const offlineEntries = await getAllFromStore(STORES.JOURNAL_ENTRIES);
        return offlineEntries
          .filter((entry: any) => entry.user_id === userId)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      // Try offline storage as fallback
      try {
        const offlineEntries = await getAllFromStore(STORES.JOURNAL_ENTRIES);
        return offlineEntries
          .filter((entry: any) => entry.user_id === userId)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (offlineError) {
        console.error('Error fetching offline entries:', offlineError);
        return [];
      }
    }
  }, [userId, isOnline]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!userId) return false;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } else {
        toast.info('Cannot delete entries while offline.');
        return false;
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  }, [userId, isOnline]);

  return {
    saveEntry,
    updateEntry,
    fetchEntries,
    deleteEntry,
    isOnline,
    syncing,
  };
};

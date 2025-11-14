import { useOffline } from "@/contexts/OfflineContext";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingSync, syncNow } = useOffline();

  return (
    <AnimatePresence>
      {(!isOnline || pendingSync > 0) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!isOnline ? (
                  <>
                    <WifiOff className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">You're offline</p>
                      <p className="text-xs opacity-90">
                        Your progress is being saved locally and will sync when you're back online
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <div>
                          <p className="font-semibold text-sm">Syncing...</p>
                          <p className="text-xs opacity-90">
                            Uploading {pendingSync} item{pendingSync !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-5 w-5" />
                        <div>
                          <p className="font-semibold text-sm">
                            {pendingSync} item{pendingSync !== 1 ? 's' : ''} pending sync
                          </p>
                          <p className="text-xs opacity-90">
                            Click sync to upload now
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {isOnline && pendingSync > 0 && !isSyncing && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={syncNow}
                  className="bg-white text-orange-600 hover:bg-white/90"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

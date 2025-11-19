import { useOffline } from "@/contexts/OfflineContext";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Cloud, CloudOff, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingSync, syncNow } = useOffline();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-dismiss offline notification after 5 seconds (but keep if pending sync)
  useEffect(() => {
    if (!isOnline && pendingSync === 0) {
      setIsVisible(true);
      setIsMinimized(false);

      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 5000); // Auto-minimize after 5 seconds

      return () => clearTimeout(timer);
    } else if (pendingSync > 0) {
      // Always show when there are pending items
      setIsVisible(true);
    } else if (isOnline && pendingSync === 0) {
      // Hide when online and nothing pending
      setIsVisible(false);
    }
  }, [isOnline, pendingSync]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <AnimatePresence>
      {isVisible && (!isOnline || pendingSync > 0) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-2">
            {isMinimized ? (
              // Minimized state - compact indicator
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleToggleMinimize}
                  className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
                >
                  {!isOnline ? (
                    <WifiOff className="h-4 w-4" />
                  ) : isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudOff className="h-4 w-4" />
                  )}
                  <p className="font-semibold text-sm">
                    {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : `${pendingSync} pending`}
                  </p>
                </button>
                {!isOnline && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              // Expanded state - full details
              <div className="py-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
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

                  <div className="flex items-center gap-2">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleMinimize}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      title="Minimize"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    {!isOnline && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

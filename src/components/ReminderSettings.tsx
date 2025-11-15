import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Plus, X, Clock, Smartphone, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  checkPushSupport,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
} from "@/utils/pushNotifications";

const ReminderSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["07:00", "20:00"]);
  const [newTime, setNewTime] = useState("12:00");
  const [notificationMethods, setNotificationMethods] = useState<string[]>(["in-app"]);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState({
    enabled: true,
    reminderTimes: ["07:00", "20:00"],
    notificationMethods: ["in-app"]
  });

  useEffect(() => {
    fetchReminderSettings();
    checkPushStatus().then(() => {
      checkForOrphanedPermissions();
    });
  }, [user]);

  // Track unsaved changes
  useEffect(() => {
    const settingsChanged = 
      enabled !== initialSettings.enabled ||
      JSON.stringify(reminderTimes) !== JSON.stringify(initialSettings.reminderTimes) ||
      JSON.stringify(notificationMethods) !== JSON.stringify(initialSettings.notificationMethods);
    
    setHasUnsavedChanges(settingsChanged);
  }, [enabled, reminderTimes, notificationMethods, initialSettings]);

  const checkPushStatus = async () => {
    const supported = await checkPushSupport();
    setPushSupported(supported);
    if (supported && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
    const subscription = await getCurrentPushSubscription();
    setIsSubscribed(!!subscription);
  };

  const checkForOrphanedPermissions = async () => {
    // If permission is granted but no subscription exists, offer to retry
    if (pushSupported && pushPermission === 'granted' && !isSubscribed && !notificationMethods.includes('push')) {
      console.log('Found granted permission without subscription - user can retry');
    }
  };

  const fetchReminderSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("prayer_reminders").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      
      if (data) {
        setEnabled(data.enabled);
        setReminderTimes(data.reminder_times || ["07:00", "20:00"]);
        setNotificationMethods(data.notification_methods || ["in-app"]);
        
        // Save initial state for comparison
        setInitialSettings({
          enabled: data.enabled,
          reminderTimes: data.reminder_times || ["07:00", "20:00"],
          notificationMethods: data.notification_methods || ["in-app"]
        });
      } else {
        // No settings found, create default
        await createDefaultSettings();
      }
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
      toast.error("Failed to load reminder settings");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("prayer_reminders").insert({
        user_id: user.id,
        reminder_type: "daily",
        reminder_times: ["07:00", "20:00"],
        notification_methods: ["in-app"],
        enabled: true
      });
      if (error) throw error;
      
      // Set initial state after creating defaults
      setInitialSettings({
        enabled: true,
        reminderTimes: ["07:00", "20:00"],
        notificationMethods: ["in-app"]
      });
    } catch (error) {
      console.error("Error creating default settings:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("prayer_reminders").upsert({
        user_id: user.id,
        enabled,
        reminder_times: reminderTimes,
        notification_methods: notificationMethods,
        reminder_type: "daily"
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
      if (error) throw error;
      
      // Reset unsaved changes state after successful save
      setInitialSettings({
        enabled,
        reminderTimes,
        notificationMethods
      });
      setHasUnsavedChanges(false);
      
      toast.success("Reminder settings saved successfully!");
    } catch (error) {
      console.error("Error saving reminder settings:", error);
      toast.error("Failed to save reminder settings");
    } finally {
      setSaving(false);
    }
  };



  const addReminderTime = () => {
    if (!reminderTimes.includes(newTime)) {
      setReminderTimes([...reminderTimes, newTime].sort());
      setNewTime("12:00");
    } else {
      toast.error("This reminder time already exists");
    }
  };

  const removeReminderTime = (time: string) => {
    if (reminderTimes.length > 1) {
      setReminderTimes(reminderTimes.filter(t => t !== time));
    } else {
      toast.error("You must have at least one reminder time");
    }
  };

const toggleNotificationMethod = async (method: string) => {
  // TEMPORARILY DISABLED: Push notifications
  if (method === 'push') {
    toast.info('Push notifications are temporarily disabled while we configure them properly.');
    return;
  }
  
  // Toggle in-app notifications
  if (notificationMethods.includes(method)) {
    if (notificationMethods.length > 1) {
      setNotificationMethods(notificationMethods.filter(m => m !== method));
    } else {
      toast.error("You must have at least one notification method");
    }
  } else {
    setNotificationMethods([...notificationMethods, method]);
  }
};

  const getPushStatus = () => {
    if (!pushSupported) {
      return {
        icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
        text: "Not Supported",
        description: "Your browser doesn't support push notifications",
        badge: <Badge variant="outline" className="text-muted-foreground">Not Available</Badge>,
        canEnable: false,
      };
    }
    
    if (pushPermission === 'denied') {
      return {
        icon: <AlertCircle className="h-4 w-4 text-destructive" />,
        text: "Permission Denied",
        description: "Please reset permissions in browser settings",
        badge: <Badge variant="destructive">Blocked</Badge>,
        canEnable: false,
      };
    }
    
    if (isSubscribed && notificationMethods.includes('push')) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Active",
        description: "You'll receive push notifications even when app is closed",
        badge: <Badge className="bg-green-600">Enabled</Badge>,
        canEnable: true,
      };
    }
    
    return {
      icon: <Smartphone className="h-4 w-4 text-blue-600" />,
      text: "Available",
      description: "Click to enable push notifications",
      badge: <Badge variant="secondary">Click to Enable</Badge>,
      canEnable: true,
    };
  };

  const pushStatus = getPushStatus();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prayer Reminders
          </CardTitle>
          <CardDescription>
            Set up daily reminders to help you maintain your prayer practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasUnsavedChanges && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You have unsaved changes. Click "Save Changes" to apply them.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="reminders-enabled">Enable Prayer Reminders</Label>
            <Switch 
              id="reminders-enabled" 
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
          </div>

          {enabled && (
            <>
              <div className="space-y-4">
                <Label>Reminder Times</Label>
                <div className="space-y-2">
                  {reminderTimes.map((time) => (
                    <div key={time} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-mono">{time}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeReminderTime(time)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)} 
                    className="flex-1" 
                  />
                  <Button onClick={addReminderTime} variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notification Methods</Label>
                
                {/* In-App Notifications */}
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="in-app"
                    checked={notificationMethods.includes("in-app")}
                    onCheckedChange={() => toggleNotificationMethod("in-app")}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor="in-app" 
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      In-App Notifications
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shows modal when app is open
                    </p>
                  </div>
                </div>

                {/* TEMPORARILY DISABLED - Browser Push Notifications
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="push"
                    checked={notificationMethods.includes("push")}
                    onCheckedChange={() => toggleNotificationMethod("push")}
                    disabled={subscribing || !pushStatus.canEnable}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label 
                        htmlFor="push" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        Browser Push Notifications
                        {pushStatus.icon}
                      </label>
                      {pushStatus.badge}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pushStatus.description}
                    </p>
                    
                    {subscribing && (
                      <p className="text-xs text-blue-600 animate-pulse">
                        Managing subscription...
                      </p>
                    )}
                  </div>
                </div>
                */}

                {/* Browser compatibility alert */}
                {!pushSupported && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Push Notifications Not Supported</AlertTitle>
                    <AlertDescription>
                      Your browser doesn't support push notifications. Try using Chrome, Firefox, Edge, or Safari on desktop.
                      Mobile browsers may have limited support.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Permission denied alert */}
                {pushSupported && pushPermission === 'denied' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Permission Denied</AlertTitle>
                    <AlertDescription>
                      To enable push notifications:
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Click the lock icon in your browser's address bar</li>
                        <li>Find "Notifications" and change it to "Allow"</li>
                        <li>Refresh this page and try again</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Active push notifications info */}
                {isSubscribed && notificationMethods.includes('push') && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Push Notifications Active</AlertTitle>
                    <AlertDescription>
                      You'll receive notifications in your system tray even when this tab is closed.
                      Make sure your browser is running (not force-closed).
                    </AlertDescription>
                  </Alert>
                )}

                {/* Permission granted but subscription incomplete */}
                {pushSupported && pushPermission === 'granted' && !isSubscribed && !notificationMethods.includes('push') && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Push Permission Granted</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p>Your browser has granted push notification permission, but the subscription wasn't completed.</p>
                      <Button 
                        size="sm" 
                        onClick={() => toggleNotificationMethod('push')}
                        disabled={subscribing}
                      >
                        {subscribing ? 'Subscribing...' : 'Complete Push Setup'}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          <Button 
            onClick={handleSave} 
            disabled={saving || !hasUnsavedChanges} 
            className="w-full"
            variant={hasUnsavedChanges ? "default" : "outline"}
          >
            {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "No Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderSettings;

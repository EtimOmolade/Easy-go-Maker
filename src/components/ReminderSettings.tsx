import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Bell, Plus, X, Clock, Smartphone, CheckCircle, XCircle, AlertCircle, Loader2, Info } from "lucide-react";
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
  const [pushSubscriptions, setPushSubscriptions] = useState<any[]>([]);
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState({
    enabled: true,
    reminderTimes: ["07:00", "20:00"],
    notificationMethods: ["in-app"]
  });

  useEffect(() => {
    fetchReminderSettings();
    checkPushStatus();
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
    if (user) fetchPushSubscriptions();
  };

  const fetchPushSubscriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('push_subscriptions').select('*').eq('user_id', user.id);
      if (error) throw error;
      setPushSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching push subscriptions:', error);
    }
  };

  const fetchReminderSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("prayer_reminders").select("*").eq("user_id", user.id).single();
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          await createDefaultSettings();
          return;
        }
        throw error;
      }
      setEnabled(data.enabled);
      setReminderTimes(data.reminder_times || ["07:00", "20:00"]);
      setNotificationMethods(data.notification_methods || ["in-app"]);
      
      // Save initial state for comparison
      setInitialSettings({
        enabled: data.enabled,
        reminderTimes: data.reminder_times || ["07:00", "20:00"],
        notificationMethods: data.notification_methods || ["in-app"]
      });
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

  const handleEnablePush = async () => {
    if (!user) return;
    setSubscribing(true);
    try {
      const success = await subscribeToPushNotifications(user.id);
      if (success) {
        setIsSubscribed(true);
        setPushPermission(Notification.permission);
        if (!notificationMethods.includes('push')) {
          const newMethods = [...notificationMethods, 'push'];
          setNotificationMethods(newMethods);
          await supabase.from("prayer_reminders").upsert({ user_id: user.id, notification_methods: newMethods });
        }
        await fetchPushSubscriptions();
      }
    } catch (error) {
      console.error('Error enabling push:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDisablePush = async () => {
    if (!user) return;
    setSubscribing(true);
    try {
      await unsubscribeFromPushNotifications(user.id);
      setIsSubscribed(false);
      const newMethods = notificationMethods.filter(m => m !== 'push');
      setNotificationMethods(newMethods);
      await supabase.from("prayer_reminders").upsert({ user_id: user.id, notification_methods: newMethods });
      await fetchPushSubscriptions();
    } catch (error) {
      console.error('Error disabling push:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const handleRemoveSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase.from('push_subscriptions').delete().eq('id', subscriptionId);
      if (error) throw error;
      toast.success('Device removed successfully');
      await fetchPushSubscriptions();
      const remainingSubs = pushSubscriptions.filter(s => s.id !== subscriptionId);
      if (remainingSubs.length === 0) setIsSubscribed(false);
    } catch (error) {
      console.error('Error removing subscription:', error);
      toast.error('Failed to remove device');
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

  const toggleNotificationMethod = (method: string) => {
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

  const getPermissionIcon = () => {
    switch (pushPermission) {
      case 'granted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPermissionText = () => {
    switch (pushPermission) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      default: return 'Not Set';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Prayer Reminders</CardTitle>
          <CardDescription>Set up daily reminders to help you maintain your prayer practice</CardDescription>
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
            <Switch id="reminders-enabled" checked={enabled} onCheckedChange={setEnabled} />
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
                      <Button variant="ghost" size="sm" onClick={() => removeReminderTime(time)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flex-1" />
                  <Button onClick={addReminderTime} variant="outline"><Plus className="h-4 w-4 mr-1" />Add Time</Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Notification Methods</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">In-App Notifications</span>
                    <Switch checked={notificationMethods.includes("in-app")} onCheckedChange={() => toggleNotificationMethod("in-app")} />
                  </div>
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Browser Push Notifications</CardTitle>
          <CardDescription>Receive prayer reminders and community updates even when the app is closed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">Push notifications are not supported in your browser.</div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">{getPermissionIcon()}<span className="text-sm font-medium">Permission Status:</span></div>
                <Badge variant={pushPermission === 'granted' ? 'default' : 'secondary'}>{getPermissionText()}</Badge>
              </div>
              {isSubscribed && pushSubscriptions.length > 0 && (
                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm">✓ Push enabled on {pushSubscriptions.length} device{pushSubscriptions.length > 1 ? 's' : ''}</p>
                </div>
              )}
              <div className="space-y-2">
                {!isSubscribed ? (
                  <Button 
                    onClick={handleEnablePush} 
                    disabled={subscribing || pushPermission === 'denied'} 
                    className="w-full"
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Enable Push Notifications'
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDisablePush} 
                    disabled={subscribing} 
                    variant="destructive" 
                    className="w-full"
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Unsubscribing...
                      </>
                    ) : (
                      'Disable Push Notifications'
                    )}
                  </Button>
                )}
              </div>
              {pushSubscriptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Active Devices ({pushSubscriptions.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pushSubscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-start justify-between gap-2 p-3 bg-muted rounded-lg text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sub.user_agent || 'Unknown Device'}</p>
                          <p className="text-xs text-muted-foreground">Added: {new Date(sub.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveSubscription(sub.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isSubscribed && (
                <>
                  <Separator className="my-4" />
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>How Browser Push Notifications Work</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                        <li>Appear in your system notification tray (not just in the app)</li>
                        <li>Work even when this tab/window is closed</li>
                        <li>Show notifications even when browser is in background</li>
                        <li>Require browser to be running (not force-closed)</li>
                        <li>Queue notifications when offline (delivered when online)</li>
                        <li>May be hidden by browser when you're actively on this page</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderSettings;

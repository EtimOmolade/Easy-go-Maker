import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ReminderSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["07:00", "20:00"]);
  const [newTime, setNewTime] = useState("12:00");
  const [notificationMethods, setNotificationMethods] = useState<string[]>(["in-app"]);

  useEffect(() => {
    fetchReminderSettings();
  }, [user]);

  const fetchReminderSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prayer_reminders")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEnabled(data.enabled);
        setReminderTimes(data.reminder_times || ["07:00", "20:00"]);
        setNotificationMethods(data.notification_methods || ["in-app"]);
      } else {
        // Create default settings if none exist
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
      const { error } = await supabase
        .from("prayer_reminders")
        .insert({
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
      const { error } = await supabase
        .from("prayer_reminders")
        .upsert({
          user_id: user.id,
          enabled,
          reminder_times: reminderTimes,
          notification_methods: notificationMethods,
          reminder_type: "daily"
        });

      if (error) throw error;

      toast.success("Reminder settings saved successfully");
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

  const testReminder = () => {
    toast.info("🕊️ Time for Prayer! This is a test reminder.", {
      description: "Take a moment to connect with God through prayer.",
      duration: 5000,
    });
  };

  if (loading) {
    return (
      <Card className="shadow-medium mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prayer Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Prayer Reminders
        </CardTitle>
        <CardDescription>
          Configure when and how you receive prayer reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <Label htmlFor="enableReminders">Enable Prayer Reminders</Label>
            <p className="text-xs text-muted-foreground">
              Receive reminders to pray throughout the day
            </p>
          </div>
          <Switch
            id="enableReminders"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Reminder Times */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Reminder Times</Label>
              <div className="flex flex-wrap gap-2">
                {reminderTimes.map((time) => (
                  <Badge
                    key={time}
                    variant="secondary"
                    className="px-3 py-2 text-sm flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3" />
                    {time}
                    <button
                      onClick={() => removeReminderTime(time)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminderTime}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time
                </Button>
              </div>
            </div>

            {/* Notification Methods */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Notification Methods</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">In-App Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Show reminders while using the app
                    </p>
                  </div>
                  <Switch
                    checked={notificationMethods.includes("in-app")}
                    onCheckedChange={() => toggleNotificationMethod("in-app")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive reminders via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationMethods.includes("email")}
                    onCheckedChange={() => toggleNotificationMethod("email")}
                  />
                </div>
              </div>
            </div>

            {/* Test Reminder Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={testReminder}
            >
              <Bell className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Reminder Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReminderSettings;
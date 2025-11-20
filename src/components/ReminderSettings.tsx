import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Clock, Trash2, Plus, Bell } from "lucide-react";

interface ReminderSettings {
  id: string;
  enabled: boolean;
  reminder_times: string[];
  notification_methods: string[];
  days_of_week: number[];
}

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export const ReminderSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTime, setNewTime] = useState("09:00");

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("prayer_reminders")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from("prayer_reminders")
          .insert({
            user_id: user?.id,
            enabled: true,
            reminder_times: ["07:00", "20:00"],
            notification_methods: ["in-app"],
            days_of_week: [1, 2, 3, 4, 5, 6, 0],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
      toast.error("Failed to load reminder settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<ReminderSettings>) => {
    if (!settings || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prayer_reminders")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success("Reminder settings updated");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const addReminderTime = () => {
    if (!settings) return;
    
    if (settings.reminder_times.includes(newTime)) {
      toast.error("This time already exists");
      return;
    }

    const updatedTimes = [...settings.reminder_times, newTime].sort();
    updateSettings({ reminder_times: updatedTimes });
  };

  const removeReminderTime = (time: string) => {
    if (!settings) return;
    const updatedTimes = settings.reminder_times.filter((t) => t !== time);
    updateSettings({ reminder_times: updatedTimes });
  };

  const toggleNotificationMethod = (method: string) => {
    if (!settings) return;
    
    const methods = settings.notification_methods.includes(method)
      ? settings.notification_methods.filter((m) => m !== method)
      : [...settings.notification_methods, method];
    
    updateSettings({ notification_methods: methods });
  };

  const toggleDay = (day: number) => {
    if (!settings) return;
    
    const days = settings.days_of_week.includes(day)
      ? settings.days_of_week.filter((d) => d !== day)
      : [...settings.days_of_week, day];
    
    updateSettings({ days_of_week: days });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prayer Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Prayer Reminders
        </CardTitle>
        <CardDescription>
          Set up daily reminders to help maintain your prayer routine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications at your chosen times
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
            disabled={saving}
          />
        </div>

        {/* Days of Week */}
        <div className="space-y-3">
          <Label>Days</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((day) => (
              <Badge
                key={day.value}
                variant={settings.days_of_week.includes(day.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notification Methods */}
        <div className="space-y-3">
          <Label>Notification Methods</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="in-app"
                checked={settings.notification_methods.includes("in-app")}
                onCheckedChange={() => toggleNotificationMethod("in-app")}
              />
              <label htmlFor="in-app" className="text-sm cursor-pointer">
                In-App Notifications
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="push"
                checked={settings.notification_methods.includes("push")}
                onCheckedChange={() => toggleNotificationMethod("push")}
              />
              <label htmlFor="push" className="text-sm cursor-pointer">
                Push Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Reminder Times */}
        <div className="space-y-3">
          <Label>Reminder Times</Label>
          <div className="space-y-2">
            {settings.reminder_times.map((time) => (
              <div key={time} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{time}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReminderTime(time)}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
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
            <Button onClick={addReminderTime} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

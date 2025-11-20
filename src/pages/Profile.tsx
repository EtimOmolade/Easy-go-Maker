import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { supabase } from "@/integrations/supabase/client";
import { MILESTONES } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Award, Scale, Smartphone, Trash2, Moon, Sun, HelpCircle, Type, Minus, Plus, RotateCcw, Volume2, Clock, X } from "lucide-react";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { generateDeviceFingerprint } from "@/utils/deviceFingerprint";
import NotificationDropdown from "@/components/NotificationDropdown";
import { TutorialWalkthrough } from "@/components/TutorialWalkthrough";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileData {
  name: string;
  email: string;
  streak_count: number;
  reminders_enabled: boolean;
  two_factor_enabled: boolean;
  voice_preference?: string;
}

interface ReminderSettings {
  reminder_times: string[];
  days_of_week: number[];
  enabled: boolean;
}
const Profile = () => {
  const {
    user
  } = useAuth();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  } = useFontSize();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [reminders, setReminders] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>("");
  const [tutorialEnabled, setTutorialEnabled] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [voicePreference, setVoicePreference] = useState<string>("sarah");
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    reminder_times: [],
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    enabled: true,
  });
  
  useEffect(() => {
    fetchProfile();
    fetchTrustedDevices();
    fetchReminderSettings();
    setCurrentFingerprint(generateDeviceFingerprint());
    // Check tutorial status
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    setTutorialEnabled(!hasSeenTutorial);
  }, [user]);

  // DON'T refetch every second - it causes the name field to reset while typing!
  // Only fetch on mount and after successful update

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("name, email, streak_count, reminders_enabled, two_factor_enabled, voice_preference").eq("id", user.id).single();
      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
        setName(data.name);
        setReminders(data.reminders_enabled);
        setTwoFactorEnabled(data.two_factor_enabled || false);
        setVoicePreference(data.voice_preference || 'sarah');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      console.log('Updating profile with:', {
        name,
        reminders,
        userId: user.id
      });
      const {
        data,
        error
      } = await supabase.from("profiles").update({
        name,
        reminders_enabled: reminders,
        voice_preference: voicePreference
      }).eq("id", user.id).select();
      if (error) {
        console.error("Error updating profile:", error);
        toast.error(`Failed to update profile: ${error.message}`);
      } else {
        console.log('Profile updated successfully:', data);
        toast.success("Profile updated successfully");
        fetchProfile();
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    }
    setLoading(false);
  };
  const fetchReminderSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('prayer_reminders')
        .select('reminder_times, days_of_week, enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setReminderSettings({
          reminder_times: data.reminder_times || [],
          days_of_week: data.days_of_week || [1, 2, 3, 4, 5, 6, 7],
          enabled: data.enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
    }
  };

  const fetchTrustedDevices = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from("trusted_devices").select("*").eq("user_id", user.id).order("last_used_at", {
        ascending: false
      });
      if (error) throw error;
      setTrustedDevices(data || []);
    } catch (error) {
      console.error("Error fetching trusted devices:", error);
    }
  };
  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;
    setToggling2FA(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("toggle-2fa", {
        body: {
          enabled
        }
      });
      if (error) throw error;
      setTwoFactorEnabled(enabled);

      // If disabling 2FA, also revoke all trusted devices
      if (!enabled) {
        await supabase.from("trusted_devices").delete().eq("user_id", user.id);
        setTrustedDevices([]);
      }
      toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`);
      fetchProfile();
    } catch (error: any) {
      console.error("Error toggling 2FA:", error);
      toast.error(error.message || "Failed to update 2FA settings");
    } finally {
      setToggling2FA(false);
    }
  };
  const handleRevokeDevice = async (deviceId: string) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from("trusted_devices").delete().eq("id", deviceId).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Device trust revoked");
      fetchTrustedDevices();
    } catch (error: any) {
      console.error("Error revoking device:", error);
      toast.error("Failed to revoke device");
    }
  };
  const {
    unlocked,
    locked,
    currentStreak
  } = useMemo(() => {
    if (!user || !profile) return {
      unlocked: [],
      locked: MILESTONES,
      currentStreak: 0
    };
    const currentStreak = profile.streak_count || 0;
    const unlocked = MILESTONES.filter(m => currentStreak >= m.streak_needed).map(m => ({
      ...m,
      unlockedDate: 'Recently unlocked'
    }));
    const locked = MILESTONES.filter(m => currentStreak < m.streak_needed).map(m => ({
      ...m,
      daysNeeded: m.streak_needed - currentStreak
    }));
    return {
      unlocked,
      locked,
      currentStreak
    };
  }, [user, profile]);
  return <div className="min-h-screen relative overflow-hidden gradient-hero">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl" animate={{
        y: [0, -50, 0],
        x: [0, 30, 0],
        scale: [1, 1.2, 1]
      }} transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-light/20 rounded-full blur-3xl" animate={{
        y: [0, 40, 0],
        x: [0, -40, 0],
        scale: [1, 1.3, 1]
      }} transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
      </div>

      <div className="max-w-2xl relative z-10 mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="text-white hover:bg-white/10 border border-white/20" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {user && <NotificationDropdown userId={user.id} isAdmin={false} />}
        </div>

        <h1 className="text-4xl font-heading font-bold text-white drop-shadow-lg mb-8">
          Profile Settings
        </h1>

        {/* Achievements Card */}
        <Card className="mb-6 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-accent" />
              Prayer Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Prayer Streak</p>
              <p className="text-3xl font-bold text-accent">{currentStreak} Day{currentStreak !== 1 ? 's' : ''}</p>
            </div>

            {/* Unlocked Achievements */}
            {unlocked.length > 0 && <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Unlocked</h3>
                {unlocked.map(milestone => <div key={milestone.level} className="p-4 rounded-lg bg-primary/10 border-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{milestone.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{milestone.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.message}
                        </p>
                        <p className="text-xs italic text-foreground/70">
                          "{milestone.scripture}" - {milestone.scripture_ref}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Unlocked: {new Date(milestone.unlockedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div>}

            {/* Locked Achievements */}
            {locked.length > 0 && <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Locked</h3>
                {locked.map(milestone => <div key={milestone.level} className="p-4 rounded-lg bg-muted/50 border-2 border-muted opacity-60">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl grayscale">{milestone.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-muted-foreground">{milestone.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {milestone.daysNeeded} more day{milestone.daysNeeded !== 1 ? 's' : ''} to unlock
                        </p>
                        <p className="text-xs italic text-muted-foreground mt-1">
                          Requires {milestone.streak_needed}-day prayer streak
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div>}

            {unlocked.length === 0 && <p className="text-center text-muted-foreground py-4">
                Start praying to unlock achievements!
              </p>}
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="darkMode" className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Dark Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch id="darkMode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Size
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fontSize}%</span>
                    <Button type="button" variant="ghost" size="sm" onClick={resetFontSize} className="h-8 w-8 p-0" title="Reset to default">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust text size for better readability (85% - 125%)
                </p>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={decreaseFontSize} disabled={fontSize <= 85} className="flex-1">
                    <Minus className="h-4 w-4 mr-1" />
                    Smaller
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={increaseFontSize} disabled={fontSize >= 125} className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Larger
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="2fa">Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Require a verification code sent to your email when logging in
                  </p>
                </div>
                <Switch id="2fa" checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} disabled={toggling2FA} />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="tutorial" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Tutorial
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable to go through the tutorial guide again
                  </p>
                </div>
                <Switch id="tutorial" checked={tutorialEnabled} onCheckedChange={checked => {
                setTutorialEnabled(checked);
                if (checked) {
                  localStorage.removeItem('hasSeenWelcome');
                  localStorage.removeItem('hasSeenTutorial');
                  toast.success("Tutorial enabled! Starting guide...");
                  setTimeout(() => {
                    setRunTutorial(true);
                  }, 500);
                }
              }} />
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Prayer Reminder Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Prayer Reminders
            </CardTitle>
            <CardDescription>
              Customize when and which days you want to receive prayer reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders-enabled">Enable Prayer Reminders</Label>
              <Switch
                id="reminders-enabled"
                checked={reminderSettings.enabled}
                onCheckedChange={async (checked) => {
                  setReminderSettings(prev => ({ ...prev, enabled: checked }));
                  try {
                    const { data: current, error: fetchError } = await supabase
                      .from('prayer_reminders')
                      .select('id')
                      .eq('user_id', user?.id)
                      .maybeSingle();
                    
                    if (fetchError) throw fetchError;
                    
                    if (current?.id) {
                      const { error } = await supabase
                        .from('prayer_reminders')
                        .update({ enabled: checked })
                        .eq('id', current.id);
                      if (error) throw error;
                    } else {
                      const { error } = await supabase
                        .from('prayer_reminders')
                        .insert({
                          user_id: user?.id,
                          enabled: checked,
                          reminder_times: ['07:00', '20:00'],
                          notification_methods: ['in-app', 'push'],
                        });
                      if (error) throw error;
                    }
                    
                    toast.success(`Reminders ${checked ? 'enabled' : 'disabled'}`);
                    fetchReminderSettings();
                  } catch (error) {
                    console.error('Error updating reminders:', error);
                    toast.error('Failed to update reminders');
                  }
                }}
              />
            </div>

            {reminderSettings.enabled && (
              <>
                {/* Active Days */}
                <div className="space-y-3">
                  <Label>Active Days</Label>
                  <p className="text-sm text-muted-foreground">
                    Select which days to receive reminders
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { label: 'S', value: 7, name: 'Sunday' },
                      { label: 'M', value: 1, name: 'Monday' },
                      { label: 'T', value: 2, name: 'Tuesday' },
                      { label: 'W', value: 3, name: 'Wednesday' },
                      { label: 'T', value: 4, name: 'Thursday' },
                      { label: 'F', value: 5, name: 'Friday' },
                      { label: 'S', value: 6, name: 'Saturday' },
                    ].map((day) => {
                      const isActive = reminderSettings.days_of_week.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className="h-10 w-full"
                          onClick={async () => {
                            const newDays = isActive
                              ? reminderSettings.days_of_week.filter(d => d !== day.value)
                              : [...reminderSettings.days_of_week, day.value];
                            
                            if (newDays.length === 0) {
                              toast.error('At least one day must be selected');
                              return;
                            }
                            
                            setReminderSettings(prev => ({ ...prev, days_of_week: newDays }));
                            
                            try {
                              const { data: current, error: fetchError } = await supabase
                                .from('prayer_reminders')
                                .select('id')
                                .eq('user_id', user?.id)
                                .maybeSingle();
                              
                              if (fetchError) throw fetchError;
                              
                              if (current?.id) {
                                const { error } = await supabase
                                  .from('prayer_reminders')
                                  .update({ days_of_week: newDays })
                                  .eq('id', current.id);
                                if (error) throw error;
                                toast.success('Days updated');
                              }
                            } catch (error) {
                              console.error('Error updating days:', error);
                              toast.error('Failed to update days');
                            }
                          }}
                          title={day.name}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Reminder Times */}
                {reminderSettings.reminder_times.length > 0 && (
                  <div className="space-y-3">
                    <Label>Your Reminder Times</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {reminderSettings.reminder_times.map((time, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <span className="font-medium">{time}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={async () => {
                              const newTimes = reminderSettings.reminder_times.filter((_, i) => i !== index);
                              
                              setReminderSettings(prev => ({ ...prev, reminder_times: newTimes }));
                              
                              try {
                                const { data: current, error: fetchError } = await supabase
                                  .from('prayer_reminders')
                                  .select('id')
                                  .eq('user_id', user?.id)
                                  .maybeSingle();
                                
                                if (fetchError) throw fetchError;
                                
                                if (current?.id) {
                                  const { error } = await supabase
                                    .from('prayer_reminders')
                                    .update({ reminder_times: newTimes })
                                    .eq('id', current.id);
                                  if (error) throw error;
                                  toast.success('Reminder time removed');
                                }
                              } catch (error) {
                                console.error('Error removing reminder:', error);
                                toast.error('Failed to remove reminder');
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Reminder Times */}
                <div className="space-y-3">
                  <Label>Quick Add Times</Label>
                  <p className="text-sm text-muted-foreground">
                    Add common prayer times quickly
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['06:00', '09:00', '12:00', '15:00', '18:00', '20:00', '21:00', '22:00'].map((presetTime) => {
                      const isAdded = reminderSettings.reminder_times.includes(presetTime);
                      return (
                        <Button
                          key={presetTime}
                          type="button"
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          disabled={isAdded}
                          onClick={async () => {
                            const newTimes = [...reminderSettings.reminder_times, presetTime].sort();
                            
                            setReminderSettings(prev => ({ ...prev, reminder_times: newTimes }));
                            
                            try {
                              const { data: current, error: fetchError } = await supabase
                                .from('prayer_reminders')
                                .select('id')
                                .eq('user_id', user?.id)
                                .maybeSingle();
                              
                              if (fetchError) throw fetchError;
                              
                              if (current?.id) {
                                const { error } = await supabase
                                  .from('prayer_reminders')
                                  .update({
                                    reminder_times: newTimes,
                                    enabled: true,
                                    notification_methods: ['in-app', 'push'],
                                  })
                                  .eq('id', current.id);
                                if (error) throw error;
                              } else {
                                const { error } = await supabase
                                  .from('prayer_reminders')
                                  .insert({
                                    user_id: user?.id,
                                    reminder_times: newTimes,
                                    enabled: true,
                                    notification_methods: ['in-app', 'push'],
                                  });
                                if (error) throw error;
                              }
                              
                              toast.success('Reminder time added');
                            } catch (error) {
                              console.error('Error adding reminder:', error);
                              toast.error('Failed to add reminder');
                            }
                          }}
                        >
                          {presetTime}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Time Input */}
                <div className="space-y-3">
                  <Label>Custom Time</Label>
                  <p className="text-sm text-muted-foreground">
                    Add your own reminder time
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="time"
                      placeholder="Add reminder time"
                      className="flex-1"
                      id="new-reminder-time"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        const input = document.getElementById('new-reminder-time') as HTMLInputElement;
                        if (!input.value) {
                          toast.error('Please select a time');
                          return;
                        }
                        
                        if (reminderSettings.reminder_times.includes(input.value)) {
                          toast.error('This time is already added');
                          return;
                        }
                        
                        const newTimes = [...reminderSettings.reminder_times, input.value].sort();
                        
                        setReminderSettings(prev => ({ ...prev, reminder_times: newTimes }));
                        
                        try {
                          const { data: current, error: fetchError } = await supabase
                            .from('prayer_reminders')
                            .select('id')
                            .eq('user_id', user?.id)
                            .maybeSingle();
                          
                          if (fetchError) throw fetchError;
                          
                          if (current?.id) {
                            const { error } = await supabase
                              .from('prayer_reminders')
                              .update({
                                reminder_times: newTimes,
                                enabled: true,
                                notification_methods: ['in-app', 'push'],
                              })
                              .eq('id', current.id);
                            if (error) throw error;
                          } else {
                            const { error } = await supabase
                              .from('prayer_reminders')
                              .insert({
                                user_id: user?.id,
                                reminder_times: newTimes,
                                enabled: true,
                                notification_methods: ['in-app', 'push'],
                              });
                            if (error) throw error;
                          }
                          
                          toast.success('Reminder time added');
                          input.value = '';
                        } catch (error) {
                          console.error('Error adding reminder:', error);
                          toast.error('Failed to add reminder');
                        }
                      }}
                    >
                      Add Custom Time
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <PushNotificationSettings />

        {/* Trusted Devices Card - Only show if 2FA is enabled */}
        {twoFactorEnabled && <Card className="shadow-medium mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Trusted Devices
              </CardTitle>
              <CardDescription>
                Devices you've marked as trusted won't require 2FA for 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trustedDevices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">
                  No trusted devices yet
                </p> : <div className="space-y-3">
                  {trustedDevices.map(device => <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{device.device_name}</span>
                          {device.device_fingerprint === currentFingerprint && <Badge variant="secondary" className="text-xs">This device</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last used: {format(new Date(device.last_used_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {format(new Date(device.expires_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleRevokeDevice(device.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>)}
                </div>}
            </CardContent>
          </Card>}

        {/* Legal & Policies Section */}
        <Card className="shadow-medium my-[20px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-muted-foreground" />
              Legal & Policies
            </CardTitle>
            <CardDescription className="text-xs">
              Important information about your privacy and our terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    🧾 Privacy Policy
                  </span>
                  <span className="text-xs text-muted-foreground">View</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Data We Collect:</p>
                    <p>Alias, testimony story, and optional location.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">How We Store It:</p>
                    <p>Information is encrypted and used internally only.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Your Rights:</p>
                    <p>You may edit or delete your testimony anytime.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Consent:</p>
                    <p>By submitting, you grant Spirit Connect a non-exclusive right to display and lightly edit your story for clarity and encouragement.</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    📜 Terms of Use
                  </span>
                  <span className="text-xs text-muted-foreground">View</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>By using this app, you agree to share only true experiences and respect others' privacy.</p>
                  <p>Spirit Connect reserves the right to review and moderate content before publication.</p>
                  <p>Testimonies are personal experiences and not verified claims.</p>
                  <p className="text-xs italic text-foreground/70 pt-2 border-t">
                    © Spirit Connect — All rights reserved.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      {/* Tutorial Walkthrough */}
      <TutorialWalkthrough run={runTutorial} onComplete={() => {
      setRunTutorial(false);
      setTutorialEnabled(false);
      localStorage.setItem('hasSeenTutorial', 'true');
      toast.success("Tutorial completed!");
    }} />
    </div>;
};
export default Profile;
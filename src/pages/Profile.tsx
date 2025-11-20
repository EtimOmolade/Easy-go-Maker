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
import { ArrowLeft, Award, Scale, Smartphone, Trash2, Moon, Sun, HelpCircle, Type, Minus, Plus, RotateCcw, Volume2 } from "lucide-react";
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

interface ProfileData {
  name: string;
  email: string;
  streak_count: number;
  reminders_enabled: boolean;
  two_factor_enabled: boolean;
  voice_preference?: string;
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
  
  useEffect(() => {
    fetchProfile();
    fetchTrustedDevices();
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

        {/* Prayer Reminders Settings */}
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
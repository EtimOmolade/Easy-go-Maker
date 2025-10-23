import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  name: string;
  email: string;
  streak_count: number;
  reminders_enabled: boolean;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [reminders, setReminders] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    // Prototype mode: Fetch from localStorage
    const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
    const userProfile = profiles[user.id];

    if (userProfile) {
      const profileData = {
        name: userProfile.name || user.user_metadata?.name || 'Friend',
        email: user.email || '',
        streak_count: userProfile.streak_count || 0,
        reminders_enabled: userProfile.reminders_enabled || false
      };
      setProfile(profileData);
      setName(profileData.name);
      setReminders(profileData.reminders_enabled);
    } else {
      // Create default profile
      const defaultProfile = {
        name: user.user_metadata?.name || 'Friend',
        email: user.email || '',
        streak_count: 0,
        reminders_enabled: false
      };
      setProfile(defaultProfile);
      setName(defaultProfile.name);
      setReminders(false);
    }

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("profiles")
    //   .select("name, email, streak_count, reminders_enabled")
    //   .eq("id", user.id)
    //   .single();
    //
    // if (error) {
    //   console.error("Error fetching profile:", error);
    //   toast.error("Failed to load profile");
    // } else {
    //   setProfile(data);
    //   setName(data.name);
    //   setReminders(data.reminders_enabled);
    // }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    // Prototype mode: Update in localStorage
    const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
    if (!profiles[user.id]) {
      profiles[user.id] = {};
    }
    profiles[user.id].name = name;
    profiles[user.id].reminders_enabled = reminders;
    setToStorage(STORAGE_KEYS.PROFILES, profiles);

    toast.success("Profile updated successfully");
    fetchProfile();
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { error } = await supabase
    //   .from("profiles")
    //   .update({ name, reminders_enabled: reminders })
    //   .eq("id", user.id);
    //
    // if (error) {
    //   console.error("Error updating profile:", error);
    //   toast.error("Failed to update profile");
    // } else {
    //   toast.success("Profile updated successfully");
    //   fetchProfile();
    // }
    // setLoading(false);
  };

  const getBadges = (streak: number) => {
    const badges = [];
    if (streak >= 3) badges.push({ name: "3-Day Starter", icon: "🌱" });
    if (streak >= 7) badges.push({ name: "Week Warrior", icon: "⭐" });
    if (streak >= 14) badges.push({ name: "Fortnight Faithful", icon: "🔥" });
    if (streak >= 30) badges.push({ name: "Monthly Champion", icon: "🏆" });
    return badges;
  };

  const badges = profile ? getBadges(profile.streak_count) : [];

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-8">
          Profile Settings
        </h1>

        {/* Badges Card */}
        <Card className="mb-6 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-accent" />
              Your Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <p className="text-muted-foreground">Keep journaling to earn badges!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <Badge key={badge.name} variant="secondary" className="text-base py-2 px-4">
                    {badge.icon} {badge.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Notifications are always enabled - no toggle needed */}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

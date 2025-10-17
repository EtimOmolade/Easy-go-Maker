import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";

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

    // Get profile from localStorage
    const profiles = getFromStorage<any[]>(STORAGE_KEYS.PROFILES, []);
    const userProfile = profiles.find(p => p.id === user.id);
    
    if (userProfile) {
      const profileData: ProfileData = {
        name: userProfile.name,
        email: userProfile.email,
        streak_count: userProfile.streak_count,
        reminders_enabled: userProfile.reminders_enabled
      };
      setProfile(profileData);
      setName(profileData.name);
      setReminders(profileData.reminders_enabled);
    }

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { data, error } = await supabase
      .from("profiles")
      .select("name, email, streak_count, reminders_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setName(data.name);
      setReminders(data.reminders_enabled);
    }
    */
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    // Update profile in localStorage
    const profiles = getFromStorage<any[]>(STORAGE_KEYS.PROFILES, []);
    const updatedProfiles = profiles.map(p =>
      p.id === user.id
        ? { ...p, name, reminders_enabled: reminders }
        : p
    );
    setToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
    
    toast.success("Profile updated successfully");
    fetchProfile();
    setLoading(false);

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { error } = await supabase
      .from("profiles")
      .update({ name, reminders_enabled: reminders })
      .eq("id", user.id);

    if (error) {
      toast.error("Error updating profile");
    } else {
      toast.success("Profile updated successfully");
      fetchProfile();
    }
    setLoading(false);
    */
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

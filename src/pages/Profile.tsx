import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MILESTONES } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Award, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState as useCollapsibleState } from "react";

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

  // Refetch profile when component mounts or when navigating back to this page
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile();
    }, 1000); // Refresh every second to catch updates

    return () => clearInterval(interval);
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, streak_count, reminders_enabled")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
        setName(data.name);
        setReminders(data.reminders_enabled);
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
      const { error } = await supabase
        .from("profiles")
        .update({ name, reminders_enabled: reminders })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
      } else {
        toast.success("Profile updated successfully");
        fetchProfile();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }

    setLoading(false);
  };

  const { unlocked, locked, currentStreak } = useMemo(() => {
    if (!user || !profile) return { unlocked: [], locked: MILESTONES, currentStreak: 0 };

    const currentStreak = profile.streak_count || 0;

    const unlocked = MILESTONES.filter(m => currentStreak >= m.streak_needed).map(m => ({
      ...m,
      unlockedDate: 'Recently unlocked'
    }));

    const locked = MILESTONES.filter(m => currentStreak < m.streak_needed).map(m => ({
      ...m,
      daysNeeded: m.streak_needed - currentStreak
    }));

    return { unlocked, locked, currentStreak };
  }, [user, profile]);

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

        <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-8">
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
            {unlocked.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Unlocked</h3>
                {unlocked.map((milestone) => (
                  <div key={milestone.level} className="p-4 rounded-lg bg-primary/10 border-2 border-primary/20">
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
                  </div>
                ))}
              </div>
            )}

            {/* Locked Achievements */}
            {locked.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Locked</h3>
                {locked.map((milestone) => (
                  <div key={milestone.level} className="p-4 rounded-lg bg-muted/50 border-2 border-muted opacity-60">
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
                  </div>
                ))}
              </div>
            )}

            {unlocked.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Start praying to unlock achievements!
              </p>
            )}
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

        {/* Legal & Policies Section */}
        <Card className="shadow-medium">
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
    </div>
  );
};

export default Profile;

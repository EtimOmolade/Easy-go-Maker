import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, MessageSquare, User, LogOut, Shield, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  name: string;
  streak_count: number;
  reminders_enabled: boolean;
}

const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("name, streak_count, reminders_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const quickActions = [
    {
      title: "Prayer Guidelines",
      description: "View weekly prayer instructions",
      icon: BookMarked,
      path: "/guidelines",
      color: "text-primary",
    },
    {
      title: "My Journal",
      description: "Write and manage your entries",
      icon: BookOpen,
      path: "/journal",
      color: "text-accent",
    },
    {
      title: "Testimonies",
      description: "Share and read testimonies",
      icon: MessageSquare,
      path: "/testimonies",
      color: "text-primary",
    },
    {
      title: "Profile",
      description: "Manage your settings",
      icon: User,
      path: "/profile",
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
              Welcome back, {profile?.name || "Friend"}! 🙏
            </h1>
            <p className="text-muted-foreground mt-2">Continue your prayer journey today</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Streak Card */}
        <Card className="mb-8 shadow-medium border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-accent" />
              Prayer Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-accent mb-2">
                {profile?.streak_count || 0}
              </div>
              <p className="text-muted-foreground">
                {profile?.streak_count === 1 ? "day" : "days"} in a row
              </p>
              <Badge variant="secondary" className="mt-4">
                {profile?.streak_count === 0 && "Start your journey today!"}
                {profile?.streak_count && profile.streak_count >= 1 && profile.streak_count < 7 && "Keep it up!"}
                {profile?.streak_count && profile.streak_count >= 7 && profile.streak_count < 30 && "Amazing consistency!"}
                {profile?.streak_count && profile.streak_count >= 30 && "Prayer Warrior! 🌟"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-medium transition-all hover:scale-105"
              onClick={() => navigate(action.path)}
            >
              <CardHeader>
                <action.icon className={`h-8 w-8 ${action.color} mb-2`} />
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Admin Card */}
        {isAdmin && (
          <Card className="shadow-medium border-2 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                Admin Access
              </CardTitle>
              <CardDescription>Manage content and moderate the community</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/admin")}
                className="w-full"
                variant="default"
              >
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, MessageSquare, User, LogOut, Shield, Flame, Megaphone, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StreakBadge from "@/components/StreakBadge";
import EncouragementPopup from "@/components/EncouragementPopup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORAGE_KEYS, getFromStorage, MockProfile, MockEncouragementMessage, hasUnreadEncouragementNotification, markEncouragementAsRead } from "@/data/mockData";
import { toast } from "sonner";

interface Profile {
  name: string;
  streak_count: number;
  reminders_enabled: boolean;
}

interface EncouragementMessage {
  id: string;
  content: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [encouragementMessage, setEncouragementMessage] = useState<EncouragementMessage | null>(null);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEncouragementMessage();
      checkForNotifications();
    }
  }, [user]);

  const checkForNotifications = () => {
    if (!user) return;
    const hasUnread = hasUnreadEncouragementNotification(user.id);
    setHasUnreadNotification(hasUnread);
  };

  const handleNotificationClick = () => {
    if (!user) return;
    markEncouragementAsRead(user.id);
    setHasUnreadNotification(false);
    
    // Scroll to encouragement message if it exists
    const encouragementCard = document.querySelector('[data-encouragement-card]');
    if (encouragementCard) {
      encouragementCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const fetchProfile = () => {
    if (!user) return;

    // Mock data fetch
    const profiles = getFromStorage<MockProfile[]>(STORAGE_KEYS.PROFILES, []);
    const userProfile = profiles.find(p => p.id === user.id);

    if (userProfile) {
      if (profile) {
        setPreviousStreak(profile.streak_count);
      }
      setProfile({
        name: userProfile.name,
        streak_count: userProfile.streak_count,
        reminders_enabled: userProfile.reminders_enabled
      });
    }

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { data, error } = await supabase
      .from("profiles")
      .select("name, streak_count, reminders_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      if (profile) {
        setPreviousStreak(profile.streak_count);
      }
      setProfile(data);
    }
    */
  };

  const fetchEncouragementMessage = () => {
    // Mock data fetch - get most recent message from last 24 hours
    const messages = getFromStorage<MockEncouragementMessage[]>(STORAGE_KEYS.ENCOURAGEMENT, []);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const recentMessage = messages
      .filter(msg => new Date(msg.created_at).getTime() > twentyFourHoursAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (recentMessage) {
      setEncouragementMessage({
        id: recentMessage.id,
        content: recentMessage.content,
        created_at: recentMessage.created_at
      });
    }

    // Backend integration: Uncomment when restoring Supabase
    /*
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("encouragement_messages")
      .select("*")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setEncouragementMessage(data);
    }
    */
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
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <EncouragementPopup streakCount={profile?.streak_count || 0} previousStreak={previousStreak} />
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
                Welcome back, {profile?.name || "Friend"}! 🙏
              </h1>
              <p className="text-muted-foreground mt-2">Continue your prayer journey today</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleNotificationClick}
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {hasUnreadNotification && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasUnreadNotification ? "New encouragement available!" : "No new notifications"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out of your account</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Daily Encouragement Message */}
          {encouragementMessage && (
            <Card className="mb-8 shadow-medium border-2 border-accent/20" data-encouragement-card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-accent" />
                  Today's Encouragement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{encouragementMessage.content}</p>
              </CardContent>
            </Card>
          )}

        {/* Streak & Badge Card */}
        <Card className="mb-8 shadow-medium border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-accent" />
              Prayer Streak & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-accent mb-2">
                  {profile?.streak_count || 0}
                </div>
                <p className="text-muted-foreground mb-4">
                  {profile?.streak_count === 1 ? "day" : "days"} in a row
                </p>
              </div>
              
              {/* Current Badge */}
              <div>
                <p className="text-sm font-medium mb-3 text-center">Current Achievement</p>
                <div className="flex justify-center">
                  <StreakBadge streakCount={profile?.streak_count || 0} size="lg" />
                </div>
              </div>

              {/* Badge Progress */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Badge Milestones</p>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-2 rounded ${(profile?.streak_count || 0) >= 1 ? 'bg-green-500/10' : 'bg-muted'}`}>
                    <span className="text-sm">Prayer Starter</span>
                    <span className="text-xs font-medium">1 day</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded ${(profile?.streak_count || 0) >= 10 ? 'bg-blue-500/10' : 'bg-muted'}`}>
                    <span className="text-sm">Faithful Servant</span>
                    <span className="text-xs font-medium">10 days</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded ${(profile?.streak_count || 0) >= 20 ? 'bg-purple-500/10' : 'bg-muted'}`}>
                    <span className="text-sm">Prayer Warrior</span>
                    <span className="text-xs font-medium">20 days</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded ${(profile?.streak_count || 0) >= 50 ? 'bg-yellow-500/10' : 'bg-muted'}`}>
                    <span className="text-sm">Prayer Champion</span>
                    <span className="text-xs font-medium">50 days</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => (
            <Tooltip key={action.path}>
              <TooltipTrigger asChild>
                <Card
                  className="cursor-pointer hover:shadow-medium transition-all hover:scale-105"
                  onClick={() => navigate(action.path)}
                >
                  <CardHeader>
                    <action.icon className={`h-8 w-8 ${action.color} mb-2`} />
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>{action.description}</TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  );
};

export default Dashboard;

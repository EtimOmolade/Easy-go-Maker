import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MILESTONES } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, MessageSquare, User, LogOut, Shield, Flame, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StreakBadge from "@/components/StreakBadge";
import EncouragementPopup from "@/components/EncouragementPopup";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { checkMilestoneAchievement } from "@/utils/prayerHelpers";

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
  const [encouragementMessages, setEncouragementMessages] = useState<EncouragementMessage[]>([]);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [pendingTestimonyCount, setPendingTestimonyCount] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [achievedMilestoneLevel, setAchievedMilestoneLevel] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEncouragementMessage();
      checkReminders();
      checkForNewMilestones();

      // Fetch pending testimony count for admins
      if (isAdmin) {
        fetchPendingTestimonies();
      }
      
      // Refresh data when returning to dashboard
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchProfile();
          fetchEncouragementMessage();
          checkForNewMilestones();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Poll for updates every second
      const interval = setInterval(() => {
        fetchProfile();
        fetchEncouragementMessage();
      }, 1000);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(interval);
      };

      // Backend integration - Supabase real-time COMMENTED OUT (Prototype mode)
      // const channel = supabase
      //   .channel('dashboard_updates')
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'INSERT',
      //       schema: 'public',
      //       table: 'encouragement_messages'
      //     },
      //     (payload) => {
      //       setEncouragementMessages((prev) => [payload.new as EncouragementMessage, ...prev].slice(0, 3));
      //       toast.info('📢 New community announcement!', {
      //         duration: 5000,
      //       });
      //     }
      //   );
      //
      // if (isAdmin) {
      //   channel.on(
      //     'postgres_changes',
      //     {
      //       event: '*',
      //       schema: 'public',
      //       table: 'testimonies'
      //     },
      //     () => {
      //       fetchPendingTestimonies();
      //     }
      //   );
      // }
      //
      // channel.subscribe();
      //
      // return () => {
      //   supabase.removeChannel(channel);
      // };
    }
  }, [user, isAdmin]);

  const checkReminders = () => {
    if (!user) return;

    // TODO: Implement push notification reminders in Phase 4
    console.log('(Push placeholder) Checking for new updates...');
  };

  const checkForNewMilestones = () => {
    if (!user) return;

    // Check if there's a new milestone to celebrate (based on total prayers)
    const milestone = checkMilestoneAchievement(user.id);
    if (milestone) {
      setAchievedMilestoneLevel(milestone.level);
      setShowMilestoneModal(true);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, streak_count, reminders_enabled")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } else {
        if (profile) {
          setPreviousStreak(profile.streak_count);
        }
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchEncouragementMessage = async () => {
    // Backend integration - Supabase ACTIVATED
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("encouragement_messages")
      .select("*")
      .gte("created_at", twoDaysAgo)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching encouragement messages:", error);
      toast.error("Failed to load announcements");
    } else {
      console.log("Fetched announcements:", data);
      console.log("Number of announcements:", data?.length || 0);
      setEncouragementMessages(data || []);

      if (!data || data.length === 0) {
        console.warn("No announcements found in the last 48 hours");
      }
    }
  };

  const fetchPendingTestimonies = async () => {
    try {
      const { count, error } = await supabase
        .from("testimonies")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching pending testimonies:", error);
      } else {
        setPendingTestimonyCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching pending testimonies:", error);
    }
  };

  const milestoneData = useMemo(() => {
    if (!user || !profile) return { current: MILESTONES[0], progress: 0, currentStreak: 0, nextMilestone: MILESTONES[0], daysToNext: 1 };

    const currentStreak = profile.streak_count || 0;

    console.log('[Dashboard] Computing milestone data for streak:', currentStreak);

    // Find the NEXT milestone to work towards (not yet achieved)
    let nextMilestone = MILESTONES[0]; // Default to first milestone
    let lastAchieved = null; // Track last achieved milestone

    for (let i = 0; i < MILESTONES.length; i++) {
      if (currentStreak >= MILESTONES[i].streak_needed) {
        // This milestone is achieved
        lastAchieved = MILESTONES[i];
        console.log('[Dashboard] Milestone achieved:', MILESTONES[i].name);
      } else {
        // This is the first milestone not yet achieved - this is our NEXT goal
        nextMilestone = MILESTONES[i];
        console.log('[Dashboard] Next milestone to achieve:', MILESTONES[i].name);
        break;
      }
    }

    // If all milestones achieved, stay at the last one
    if (currentStreak >= MILESTONES[MILESTONES.length - 1].streak_needed) {
      nextMilestone = MILESTONES[MILESTONES.length - 1];
      lastAchieved = MILESTONES[MILESTONES.length - 1];
      console.log('[Dashboard] All milestones achieved!');
    }

    // Calculate progress to NEXT milestone
    const daysToNext = Math.max(0, nextMilestone.streak_needed - currentStreak);

    // Progress is simply: current streak out of next milestone's requirement
    // Example: streak = 1, next = 7 days → progress = 1/7 = ~14%
    // Example: streak = 5, next = 7 days → progress = 5/7 = ~71%
    const progress = nextMilestone.streak_needed > 0
      ? (currentStreak / nextMilestone.streak_needed) * 100
      : 100;

    console.log('[Dashboard] Progress:', {
      currentStreak,
      nextMilestone: nextMilestone.name,
      nextMilestoneRequired: nextMilestone.streak_needed,
      daysToNext,
      progress: Math.min(progress, 100)
    });

    return {
      nextMilestone, // The goal to work towards
      progress: Math.min(progress, 100),
      currentStreak,
      daysToNext,
      lastAchieved, // Last milestone achieved (can be null)
      isMaxLevel: currentStreak >= MILESTONES[MILESTONES.length - 1].streak_needed
    };
  }, [user, profile]);

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
          <MilestoneAchievementModal 
            milestoneLevel={achievedMilestoneLevel}
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
          />
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome back, {profile?.name || "Friend"}! 🙏
              </h1>
              <p className="text-muted-foreground mt-2">Continue your prayer journey today</p>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Community Announcements */}
          {encouragementMessages.length > 0 && (
            <Card className="mb-8 shadow-medium border-2 border-accent/20" data-encouragement-card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-accent" />
                  Community Announcements
                </CardTitle>
                <CardDescription>Important updates from our community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show first announcement always, others collapsible */}
                {(showAllAnnouncements ? encouragementMessages : encouragementMessages.slice(0, 1)).map((message, index) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${index === 0 ? 'bg-accent/10 border-l-4 border-accent' : 'bg-muted/50'}`}
                  >
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(message.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}

                {/* Show More / Show Less button */}
                {encouragementMessages.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
                    className="w-full"
                  >
                    {showAllAnnouncements
                      ? 'Show Less'
                      : `Show ${encouragementMessages.length - 1} More ${encouragementMessages.length - 1 === 1 ? 'Update' : 'Updates'}`
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

        {/* Milestone & Badge Card */}
        <Card className="mb-8 shadow-medium border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-accent" />
              Prayer Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Next Milestone Goal */}
              <div className="text-center">
                <div className="text-6xl mb-3">{milestoneData.nextMilestone.emoji}</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {milestoneData.nextMilestone.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {milestoneData.currentStreak} day{milestoneData.currentStreak !== 1 ? 's' : ''} streak
                </p>
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm italic text-foreground/90">
                    "{milestoneData.nextMilestone.scripture}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    - {milestoneData.nextMilestone.scripture_ref}
                  </p>
                </div>
              </div>

              {/* Progress to Goal */}
              {!milestoneData.isMaxLevel && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {milestoneData.daysToNext === 0 ? 'Achieved!' : `${milestoneData.daysToNext} day${milestoneData.daysToNext !== 1 ? 's' : ''} to go`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {milestoneData.currentStreak} / {milestoneData.nextMilestone.streak_needed}
                    </span>
                  </div>
                  <Progress value={milestoneData.progress} className="h-2" />
                  {milestoneData.lastAchieved && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Last unlocked: {milestoneData.lastAchieved.name} {milestoneData.lastAchieved.emoji}
                    </p>
                  )}
                </div>
              )}

              {/* Max Level Achieved */}
              {milestoneData.isMaxLevel && (
                <div className="pt-4 border-t text-center">
                  <p className="text-sm font-medium text-accent">
                    🎉 Maximum level achieved! Keep praying!
                  </p>
                </div>
              )}
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
                {pendingTestimonyCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingTestimonyCount} pending
                  </Badge>
                )}
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
                {pendingTestimonyCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingTestimonyCount}
                  </Badge>
                )}
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

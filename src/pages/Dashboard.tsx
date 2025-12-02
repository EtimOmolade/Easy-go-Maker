import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MILESTONES } from "@/data/mockData";
import {
  cacheUserData,
  getCachedUserData,
  cacheAnnouncements,
  getCachedAnnouncements,
  cachePrayerProgress,
  getCachedPrayerProgress,
} from "@/utils/offlineStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, MessageSquare, User, LogOut, Shield, Flame, Megaphone, BookHeart, Menu } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EncouragementPopup from "@/components/EncouragementPopup";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { checkMilestoneAchievement } from "@/utils/prayerHelpers";
import { CircularProgress } from "@/components/CircularProgress";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { haptics } from "@/utils/haptics";
import { WelcomeWizard } from "@/components/WelcomeWizard";
import { TutorialWalkthrough } from "@/components/TutorialWalkthrough";
import NotificationDropdown from "@/components/NotificationDropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoText from "@/assets/logo-text.png";
import logoOnly from "@/assets/logo-only.png";
import prayIcon from "@/assets/pray.png";
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
  const {
    user,
    signOut,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [encouragementMessages, setEncouragementMessages] = useState<EncouragementMessage[]>([]);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [pendingTestimonyCount, setPendingTestimonyCount] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [achievedMilestoneLevel, setAchievedMilestoneLevel] = useState(0);
  const [todaysGuideline, setTodaysGuideline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  // Onboarding states
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEncouragementMessage();
      fetchTodaysGuideline();
      checkForNewMilestones();
      if (isAdmin) {
        fetchPendingTestimonies();
      }
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchProfile();
          fetchEncouragementMessage();
          checkForNewMilestones();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Realtime subscription for announcements
      const channel = supabase
        .channel('encouragement-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'encouragement_messages'
          },
          (payload) => {
            console.log('Realtime announcement change:', payload);
            fetchEncouragementMessage();
          }
        )
        .subscribe();
      
      // Poll profile every 5 minutes
      const profileInterval = setInterval(() => {
        fetchProfile();
      }, 300000);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(profileInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  // Check if user should see onboarding
  useEffect(() => {
    if (user && !loading) {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        // Small delay to let the dashboard load first
        setTimeout(() => {
          setShowWelcomeWizard(true);
        }, 500);
      }
    }
  }, [user, loading]);
  const handleWelcomeComplete = () => {
    setShowWelcomeWizard(false);
    localStorage.setItem('hasSeenWelcome', 'true');
    // Start the tutorial walkthrough after welcome wizard
    setTimeout(() => {
      setRunTutorial(true);
    }, 500);
  };
  const handleTutorialComplete = () => {
    setRunTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
    toast.success("Welcome to SpiritConnect! You're all set to begin your prayer journey.");
  };
  const checkForNewMilestones = () => {
    if (!user) return;
    const milestone = checkMilestoneAchievement(user.id);
    if (milestone) {
      setAchievedMilestoneLevel(milestone.level);
      setShowMilestoneModal(true);
    }
  };
  const fetchProfile = async () => {
    if (!user) return;
    try {
      // Try cache first for offline support
      const cached = await getCachedUserData(user.id);
      if (cached) {
        console.log('📦 Using cached user data');
        if (profile) {
          setPreviousStreak(profile.streak_count);
        }
        setProfile(cached);
        if (loading) {
          setLoading(false);
        }
      }

      // Fetch fresh data from network
      const {
        data,
        error
      } = await supabase.from("profiles").select("name, streak_count, reminders_enabled").eq("id", user.id).single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Only show error if we don't have cached data
        if (!cached) {
          toast.error("Failed to load profile data");
        }
      } else {
        // Cache the fresh data
        await cacheUserData(user.id, data);

        if (profile) {
          setPreviousStreak(profile.streak_count);
        }
        setProfile(data);
        // Only set loading to false after first successful fetch
        if (loading) {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Set loading to false even on error
      if (loading) {
        setLoading(false);
      }
    }
  };
  const fetchCompletedDays = async () => {
    if (!user || !todaysGuideline) return;
    try {
      // Try cache first for offline support
      const cached = await getCachedPrayerProgress(user.id, todaysGuideline.id);
      if (cached && cached.length > 0) {
        console.log(`📦 Using ${cached.length} cached prayer progress records`);
        setCompletedDays(cached.map(d => d.day_of_week));
      }

      // Fetch fresh data from network
      const {
        data,
        error
      } = await supabase.from("daily_prayers").select("day_of_week").eq("user_id", user.id).eq("guideline_id", todaysGuideline.id);

      if (!error && data) {
        // Cache the fresh data
        await cachePrayerProgress(data.map(d => ({
          id: `${user.id}-${todaysGuideline.id}-${d.day_of_week}`,
          user_id: user.id,
          guideline_id: todaysGuideline.id,
          day_of_week: d.day_of_week,
        })));

        setCompletedDays(data.map(d => d.day_of_week));
      }
    } catch (error) {
      console.error("Error fetching completed days:", error);
    }
  };
  const fetchEncouragementMessage = async () => {
    try {
      // Try cache first for offline support
      const cached = await getCachedAnnouncements();
      if (cached && cached.length > 0) {
        console.log(`📦 Using ${cached.length} cached announcements`);
        setEncouragementMessages(cached);
      }

      // Fetch fresh data from network
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const {
        data,
        error
      } = await supabase.from("encouragement_messages").select("*").gte("created_at", twoDaysAgo).order("created_at", {
        ascending: false
      }).limit(3);

      if (error) {
        console.error("Error fetching encouragement messages:", error);
        // Only show error if we don't have cached data
        if (!cached || cached.length === 0) {
          toast.error("Failed to load announcements");
        }
      } else {
        // Cache the fresh data
        if (data && data.length > 0) {
          await cacheAnnouncements(data);
        }

        console.log("Fetched announcements:", data);
        console.log("Number of announcements:", data?.length || 0);
        setEncouragementMessages(data || []);
        if (!data || data.length === 0) {
          console.warn("No announcements found in the last 48 hours");
        }
      }
    } catch (error) {
      console.error("Error in fetchEncouragementMessage:", error);
    }
  };
  const fetchPendingTestimonies = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from("testimonies").select("*", {
        count: 'exact',
        head: true
      }).eq("status", "pending");
      if (error) {
        console.error("Error fetching pending testimonies:", error);
      } else {
        setPendingTestimonyCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching pending testimonies:", error);
    }
  };
  const fetchTodaysGuideline = async () => {
    try {
      const today = new Date();
      const month = today.toLocaleDateString('en-US', {
        month: 'long'
      });
      const day = today.getDate();
      const {
        data,
        error
      } = await supabase.from("guidelines").select("*").eq("month", month).eq("day", day).single();
      if (error) {
        console.error("Error fetching today's guideline:", error);
      } else {
        setTodaysGuideline(data);
      }
    } catch (error) {
      console.error("Error fetching today's guideline:", error);
    }
  };

  // Fetch completed days when guideline is loaded
  useEffect(() => {
    if (todaysGuideline) {
      fetchCompletedDays();
    }
  }, [todaysGuideline]);
  const milestoneData = useMemo(() => {
    if (!user || !profile) return {
      current: MILESTONES[0],
      progress: 0,
      currentStreak: 0,
      nextMilestone: MILESTONES[0],
      daysToNext: 1
    };
    const currentStreak = profile.streak_count || 0;
    let nextMilestone = MILESTONES[0];
    let lastAchieved = null;
    for (let i = 0; i < MILESTONES.length; i++) {
      if (currentStreak >= MILESTONES[i].streak_needed) {
        lastAchieved = MILESTONES[i];
      } else {
        nextMilestone = MILESTONES[i];
        break;
      }
    }
    if (currentStreak >= MILESTONES[MILESTONES.length - 1].streak_needed) {
      nextMilestone = MILESTONES[MILESTONES.length - 1];
      lastAchieved = MILESTONES[MILESTONES.length - 1];
    }
    const daysToNext = Math.max(0, nextMilestone.streak_needed - currentStreak);
    const progress = nextMilestone.streak_needed > 0 ? currentStreak / nextMilestone.streak_needed * 100 : 100;
    return {
      nextMilestone,
      progress: Math.min(progress, 100),
      currentStreak,
      daysToNext,
      lastAchieved,
      isMaxLevel: currentStreak >= MILESTONES[MILESTONES.length - 1].streak_needed
    };
  }, [user, profile]);
  const quickActions = [{
    title: "Prayer Guidelines",
    description: "View weekly prayer instructions",
    icon: BookMarked,
    path: "/guidelines",
    color: "from-primary to-primary-light",
    iconBg: "bg-gradient-primary"
  }, {
    title: "My Journal",
    description: "Write and manage your entries",
    icon: BookOpen,
    path: "/journal",
    color: "from-secondary to-secondary-glow",
    iconBg: "bg-gradient-secondary"
  }, {
    title: "Testimonies",
    description: "Share and read testimonies",
    icon: MessageSquare,
    path: "/testimonies",
    color: "from-primary to-primary-light",
    iconBg: "bg-gradient-primary"
  }, {
    title: "Profile",
    description: "Manage your settings",
    icon: User,
    path: "/profile",
    color: "from-secondary to-secondary-glow",
    iconBg: "bg-gradient-secondary"
  }];
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Hide notification center for admins ONLY on Admin Dashboard and Guided-Session pages
  const shouldHideNotification = isAdmin && (
    location.pathname === '/admin' ||
    location.pathname.includes('/guided-session')
  );

  // Show loading skeleton while data is being fetched
  if (loading) {
    return <div className="min-h-screen relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="relative z-10">
          <DashboardSkeleton />
        </div>
      </div>;
  }
  return <TooltipProvider>
      <div className="min-h-screen relative overflow-hidden gradient-hero">
        {/* Static Background Gradient */}
        <div className="absolute inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
          <EncouragementPopup streakCount={profile?.streak_count || 0} previousStreak={previousStreak} />
          <MilestoneAchievementModal milestoneLevel={achievedMilestoneLevel} isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} />

          {/* Onboarding Components */}
          <WelcomeWizard isOpen={showWelcomeWizard} onComplete={handleWelcomeComplete} />
          <TutorialWalkthrough run={runTutorial} onComplete={handleTutorialComplete} />

          {/* Logo Section */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="flex justify-center mb-6">
            <motion.img src={logoText} alt="SpiritConnect" className="h-20 lg:h-24 w-auto hidden lg:block" animate={{
            y: [0, -8, 0],
            filter: [
              "drop-shadow(0 0 15px rgba(244, 225, 128, 0.3))",
              "drop-shadow(0 0 20px rgba(244, 225, 128, 0.4))",
              "drop-shadow(0 0 15px rgba(244, 225, 128, 0.3))"
            ]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }} />
            <motion.img src={logoOnly} alt="SpiritConnect" className="h-14 w-auto lg:hidden" animate={{
            y: [0, -6, 0],
            filter: [
              "drop-shadow(0 0 12px rgba(244, 225, 128, 0.3))",
              "drop-shadow(0 0 16px rgba(244, 225, 128, 0.4))",
              "drop-shadow(0 0 12px rgba(244, 225, 128, 0.3))"
            ]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }} />
          </motion.div>

          {/* Welcome Section */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.1
        }} className="relative mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Welcome Text */}
                <div className="flex-1 space-y-2">
                  <motion.h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight" initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  duration: 0.5,
                  delay: 0.2
                }}>
                    Welcome back,
                    <span className="block mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_15px_rgba(244,225,128,0.5)] font-bold text-foreground">
                      {profile?.name || "Friend"}!
                    </span>
                  </motion.h1>
                  <motion.p className="text-white/80 text-base md:text-lg font-light" initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  duration: 0.5,
                  delay: 0.3
                }}>
                    Continue your prayer journey today
                  </motion.p>
                </div>

                {/* Actions */}
                <motion.div className="flex items-center gap-3 w-full lg:w-auto" initial={{
                opacity: 0,
                x: 20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                duration: 0.5,
                delay: 0.4
              }}>
                  {user && !shouldHideNotification && <NotificationDropdown userId={user.id} isAdmin={isAdmin} />}
                  
                  {/* Desktop Sign Out Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => {
                      haptics.light();
                      signOut();
                    }} className="hidden md:flex border-white/20 text-white bg-white/10 hover:border-white/40 hover:bg-white/20 transition-all backdrop-blur-sm min-h-[44px]">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sign out of your account</TooltipContent>
                  </Tooltip>

                  {/* Mobile Menu Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden border-white/20 text-white bg-white/10 hover:border-white/40 hover:bg-white/20 transition-all backdrop-blur-sm min-h-[44px] min-w-[44px]">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-3xl">
                      <SheetHeader className="pb-4">
                        <SheetTitle className="text-center">Account</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-3 pb-6">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            haptics.light();
                            signOut();
                          }} 
                          className="w-full justify-start min-h-[52px] text-base border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign Out
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {/* Today's Prayer Focus - Always Show */}
            <motion.div variants={itemVariants}>
                <Card className="shadow-elegant glass border-white/10 overflow-hidden relative backdrop-blur-xl" data-tour="today-prayer">
                  {/* Enhanced gradient backgrounds */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent" />
                  
                  {/* Animated orb effects */}
                  <motion.div 
                    className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-secondary/30 to-primary/20 rounded-full blur-3xl" 
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0.6, 0.4],
                      rotate: [0, 90, 0]
                    }} 
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }} 
                  />
                  <motion.div 
                    className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-primary/20 to-secondary/30 rounded-full blur-3xl" 
                    animate={{
                      scale: [1.2, 1, 1.2],
                      opacity: [0.3, 0.5, 0.3],
                      rotate: [0, -90, 0]
                    }} 
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }} 
                  />
                  
                  <CardHeader className="text-center pb-6 relative z-10">
                    {/* Enhanced icon container with prayer image */}
                    <motion.div 
                      className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary via-primary-light to-secondary rounded-3xl flex items-center justify-center shadow-elegant relative overflow-hidden" 
                      animate={{
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 10px 30px -10px hsl(var(--primary) / 0.3)",
                          "0 20px 40px -10px hsl(var(--primary) / 0.5)",
                          "0 10px 30px -10px hsl(var(--primary) / 0.3)"
                        ]
                      }} 
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {/* Rotating gradient overlay */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                        animate={{
                          rotate: [0, 360]
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      <img 
                        src={prayIcon} 
                        alt="Prayer" 
                        className="h-10 w-10 brightness-0 invert relative z-10"
                      />
                    </motion.div>
                    
                    <CardTitle className="text-3xl md:text-4xl font-heading dark:text-white text-foreground bg-clip-text">
                      Today's Prayer Focus
                    </CardTitle>
                    <CardDescription className="text-base mt-3 dark:text-white/70 text-muted-foreground font-medium">
                      {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    {todaysGuideline ? <>
                        <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-4 dark:text-white text-foreground">
                        {todaysGuideline.title}
                      </h3>
                      <p className="dark:text-white/80 text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap text-lg">
                            {todaysGuideline.content?.substring(0, 200)}...
                          </p>
                        </div>
                        <Button onClick={() => {
                    haptics.medium();
                    navigate(`/guideline/${todaysGuideline.id}`);
                  }} size="lg" className="w-full text-lg text-primary-foreground min-h-[48px] h-14 bg-gradient-primary transition-all duration-300 relative overflow-hidden group">
                          <span className="relative z-10 flex items-center gap-2">
                            <BookMarked className="h-5 w-5" />
                            Begin Today's Prayer
                          </span>
                          <motion.div className="absolute inset-0 bg-white/20" initial={{
                      x: "-100%"
                    }} whileHover={{
                      x: "100%"
                    }} transition={{
                      duration: 0.5
                    }} />
                        </Button>
                      </> : <>
                        <div className="text-center">
                          <p className="dark:text-white/80 text-muted-foreground leading-relaxed mb-6 text-lg">
                            No prayer guideline scheduled for today. Explore all available prayers below or check back tomorrow.
                          </p>
                        </div>
                        <Button onClick={() => {
                    haptics.medium();
                    navigate('/guidelines');
                  }} size="lg" className="w-full text-lg min-h-[48px] h-14 bg-gradient-primary transition-all duration-300 relative overflow-hidden group">
                          <span className="relative z-10 flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Browse All Prayers
                          </span>
                          <motion.div className="absolute inset-0 bg-white/20" initial={{
                      x: "-100%"
                    }} whileHover={{
                      x: "100%"
                    }} transition={{
                      duration: 0.5
                    }} />
                        </Button>
                      </>}
                  </CardContent>
                </Card>
              </motion.div>

            {/* Enhanced Streak Badge with Circular Progress */}
            {profile && <motion.div variants={itemVariants}>
                <Card className="shadow-large glass border-white/20 overflow-hidden relative" data-tour="prayer-streak">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-secondary/5" />
                  <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex items-center gap-2 dark:text-white text-foreground">
                      <Flame className="h-5 w-5 text-secondary" />
                      Your Prayer Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                      {/* Circular Progress */}
                      <div className="flex flex-col items-center gap-3" data-tour="streak-count">
                        <CircularProgress value={profile.streak_count / milestoneData.nextMilestone.streak_needed * 100} size={140} strokeWidth={12} color="hsl(var(--secondary))">
                          <div className="text-center">
                            <motion.p className="text-4xl font-bold dark:text-white text-foreground" animate={{
                          scale: [1, 1.1, 1]
                        }} transition={{
                          duration: 2,
                          repeat: Infinity
                        }}>
                              {profile.streak_count}
                            </motion.p>
                            <p className="text-sm dark:text-white/80 text-muted-foreground">days</p>
                          </div>
                        </CircularProgress>
                        <div className="text-center">
                          <p className="text-sm dark:text-white/90 text-muted-foreground">
                            {milestoneData.daysToNext} days to
                          </p>
                          <p className="font-semibold text-secondary">
                            {milestoneData.nextMilestone.name}
                          </p>
                        </div>
                      </div>

                      {/* Badge Display */}
                      <div className="flex flex-col items-center gap-2" data-tour="streak-badge">
                        <motion.div 
                          className="relative"
                          animate={{
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0]
                          }} 
                          transition={{
                            duration: 3,
                            repeat: Infinity
                          }}
                        >
                          {(() => {
                            const currentMilestone = milestoneData.lastAchieved || milestoneData.nextMilestone;
                            const IconComponent = (LucideIcons as any)[currentMilestone.icon];
                            return IconComponent ? (
                              <div 
                                className="p-6 rounded-3xl"
                                style={{
                                  backgroundColor: currentMilestone.bgColor
                                }}
                              >
                                <IconComponent 
                                  className="h-16 w-16" 
                                  style={{ 
                                    color: currentMilestone.iconColor,
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                  }} 
                                  strokeWidth={2.5}
                                />
                              </div>
                            ) : null;
                          })()}
                        </motion.div>
                        <div className="text-center">
                          <p className="font-bold text-lg dark:text-white text-foreground">
                            {(milestoneData.lastAchieved || milestoneData.nextMilestone).name}
                          </p>
                          <p className="text-xs dark:text-white/70 text-muted-foreground">Current Badge</p>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Calendar */}
                    <div className="border-t border-white/20 pt-6" data-tour="prayer-journey">
                      <p className="text-sm dark:text-white/90 text-muted-foreground text-center mb-4">This Week's Progress</p>
                      <WeeklyCalendar completedDays={completedDays} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>}

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-heading font-semibold mb-4 dark:text-white text-foreground drop-shadow">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-tour="quick-actions">
                {quickActions.map(action => <motion.div key={action.path} whileHover={{
                scale: 1.05,
                y: -5
              }} whileTap={{
                scale: 0.98
              }} transition={{
                type: "spring",
                stiffness: 300
              }}>
                    <Card className="cursor-pointer shadow-large transition-all border-white/20 overflow-hidden group relative glass backdrop-blur-xl h-full min-h-[120px]" onClick={() => {
                  haptics.light();
                  navigate(action.path);
                }}>
                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 via-transparent to-secondary/0 group-hover:from-secondary/20 group-hover:to-secondary/10 transition-all duration-500" />

                      <CardHeader className="relative z-10 p-4 md:p-6 text-center">
                        <motion.div className={`w-12 h-12 md:w-14 md:h-14 ${action.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 transition-all`} whileHover={{
                      rotate: 360
                    }} transition={{
                      duration: 0.6
                    }}>
                          <action.icon className="h-6 w-6 md:h-7 md:w-7 dark:text-white text-primary" />
                        </motion.div>
                        <CardTitle className="text-base md:text-xl font-heading dark:text-white text-foreground mb-1 md:mb-2">
                          {action.title}
                        </CardTitle>
                        {/* Always visible description for mobile-first approach */}
                        <CardDescription className="text-xs md:text-sm dark:text-white/80 text-muted-foreground leading-tight">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>)}
              </div>
            </motion.div>

            {/* Community Announcements */}
            {encouragementMessages.length > 0 && <motion.div variants={itemVariants}>
                <Card className="shadow-large glass border-white/20 overflow-hidden relative" data-encouragement-card>
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-secondary/5" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 dark:text-white text-foreground">
                      <Megaphone className="h-5 w-5 text-secondary" />
                      Community Updates
                    </CardTitle>
                    <CardDescription className="dark:text-white/80 text-muted-foreground">Latest news and announcements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    {(showAllAnnouncements ? encouragementMessages : encouragementMessages.slice(0, 1)).map((message, index) => <motion.div key={message.id} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: index * 0.1
                }} className={`p-4 rounded-xl ${index === 0 ? 'bg-secondary/20 border-l-4 border-secondary' : 'bg-white/10'}`}>
                    <p className="dark:text-white/90 text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs dark:text-white/60 text-muted-foreground mt-2">
                          {new Date(message.created_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </p>
                      </motion.div>)}

                    {encouragementMessages.length > 1 && <Button variant="ghost" onClick={() => setShowAllAnnouncements(!showAllAnnouncements)} className="w-full hover:bg-white/10 dark:text-white text-foreground">
                        {showAllAnnouncements ? 'Show Less' : `Show ${encouragementMessages.length - 1} More ${encouragementMessages.length - 1 === 1 ? 'Update' : 'Updates'}`}
                      </Button>}
                  </CardContent>
                </Card>
              </motion.div>}

            {/* Admin Card */}
            {isAdmin && <motion.div variants={itemVariants}>
                <Card className="shadow-large glass border-white/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-accent/10" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 dark:text-white text-foreground">
                      <Shield className="h-6 w-6 text-secondary" />
                      Admin Access
                      {pendingTestimonyCount > 0 && <Badge variant="destructive" className="ml-2">
                          {pendingTestimonyCount} pending
                        </Badge>}
                    </CardTitle>
                    <CardDescription className="dark:text-white/80 text-muted-foreground">Manage content and moderate the community</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button onClick={() => {
                  haptics.medium();
                  navigate("/admin");
                }} className="w-full min-h-[48px] h-12 bg-primary dark:bg-gradient-to-r dark:from-secondary dark:via-secondary dark:to-accent text-primary-foreground font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300" variant="default">
                      Go to Admin Dashboard
                      {pendingTestimonyCount > 0 && <Badge variant="secondary" className="ml-2 bg-card text-primary">
                          {pendingTestimonyCount}
                        </Badge>}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>}
          </motion.div>
        </div>
      </div>
    </TooltipProvider>;
};
export default Dashboard;
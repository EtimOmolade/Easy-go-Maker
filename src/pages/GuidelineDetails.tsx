import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DailyPrayer {
  day: string;
  completed: boolean;
  completedAt?: string;
}

const GuidelineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [guideline, setGuideline] = useState<any>(null);
  const [dailyPrayers, setDailyPrayers] = useState<DailyPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'locked' | 'current' | 'past'>('current');

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
    }
  }, [id, user]);

  // Check completion after guideline is loaded
  useEffect(() => {
    if (guideline && user) {
      checkCompletion();
    }
  }, [guideline, user]);

  // Refetch tracker data when page becomes visible (e.g., returning from prayer session)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id && user) {
        console.log('🔄 Page visible again - refreshing tracker data');
        fetchGuideline();
        // checkCompletion will be triggered by guideline update
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, user]);

  // Check access status when guideline data is loaded
  useEffect(() => {
    if (guideline) {
      checkAccessStatus();
    }
  }, [guideline]);

  const checkCompletion = async () => {
    if (!id || !user || !guideline) return;

    try {
      // Check if this guideline has been completed TODAY (actual current day)
      const today = DAYS[new Date().getDay()].toLowerCase(); // Database expects lowercase

      const { data, error } = await supabase
        .from('daily_prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('guideline_id', id)
        .eq('day_of_week', today)
        .maybeSingle();

      if (error) console.error('Error checking completion:', error);
      setIsCompleted(!!data);
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const checkAccessStatus = () => {
    if (!guideline) return;

    // Date-aware access control
    const now = new Date();
    const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = now.getMonth();
    const currentDay = now.getDate();
    const currentDayName = DAYS[now.getDay()];

    const guidelineMonth = guideline.month;
    const guidelineDay = guideline.day;
    const guidelineMonthIndex = monthsOrder.indexOf(guidelineMonth);

    // Check if month is in the future
    if (guidelineMonthIndex > currentMonthIndex) {
      setAccessStatus('locked');
      return;
    }

    // Check if month is in the past
    if (guidelineMonthIndex < currentMonthIndex) {
      setAccessStatus('past');
      return;
    }

    // Same month - check day
    if (guidelineDay === currentDay) {
      setAccessStatus('current');
    } else if (guidelineDay > currentDay) {
      // Future day in current month
      setAccessStatus('locked');
    } else {
      // Past day in current month
      setAccessStatus('past');
    }
  };

  const fetchGuideline = async () => {
    if (!id) return;

    try {
      // Fetch guideline from Supabase
      const { data: guidelineData, error: guidelineError } = await supabase
        .from('guidelines')
        .select('*')
        .eq('id', id)
        .single();

      if (guidelineError) throw guidelineError;

      if (guidelineData) {
        setGuideline(guidelineData);

        // Fetch completed prayers for this guideline
        if (user) {
          const { data: completedPrayers, error: prayersError } = await supabase
            .from('daily_prayers')
            .select('day_of_week, completed_at')
            .eq('user_id', user.id)
            .eq('guideline_id', id);

          if (prayersError) console.error('Error fetching prayers:', prayersError);

          // Create daily prayers array with completion status
          // Database stores lowercase day names, so we need to capitalize for comparison
          const completedDays = new Set(
            completedPrayers?.map(p => p.day_of_week.charAt(0).toUpperCase() + p.day_of_week.slice(1)) || []
          );
          const prayers = DAYS.map(day => ({
            day,
            completed: completedDays.has(day),
            completedAt: completedPrayers?.find(p =>
              (p.day_of_week.charAt(0).toUpperCase() + p.day_of_week.slice(1)) === day
            )?.completed_at
          }));
          setDailyPrayers(prayers);
        } else {
          // User not logged in - show all as incomplete
          const prayers = DAYS.map(day => ({ day, completed: false }));
          setDailyPrayers(prayers);
        }
      }
    } catch (error) {
      console.error('Error fetching guideline:', error);
      toast.error('Failed to load guideline');
    }

    setLoading(false);
  };


  const handleStartGuidedSession = () => {
    if (accessStatus === 'locked') {
      toast.error("This prayer will unlock on its scheduled day");
      return;
    }
    if (isCompleted) {
      toast.info("You've already completed this prayer session");
      return;
    }
    navigate(`/guided-session/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden gradient-hero flex items-center justify-center">
        <p className="text-white/80">Loading guideline...</p>
      </div>
    );
  }

  if (!guideline) {
    return (
      <div className="min-h-screen relative overflow-hidden gradient-hero flex items-center justify-center">
        <p className="text-white/80">Guideline not found</p>
      </div>
    );
  }

  const completedCount = dailyPrayers.filter(p => p.completed).length;
  const progress = (completedCount / DAYS.length) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden gradient-hero">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-light/20 rounded-full blur-3xl"
          animate={{
            y: [0, 40, 0],
            x: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-4xl relative z-10 mx-auto p-4 md:p-6 lg:p-8">
        <AppHeader showBack={true} backTo="/guidelines" />

        <Card className="shadow-large glass border-white/20 mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <Badge variant="secondary" className="mb-2 w-fit text-xs bg-gradient-secondary text-white border-0">
              Week {guideline.week_number}
            </Badge>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl text-white">{guideline.title}</CardTitle>
            <p className="text-sm md:text-base text-white/90 mt-2">
              Track your daily prayer progress throughout the week
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-medium text-white">Weekly Progress</span>
                <span className="text-xs md:text-sm text-white/80">{completedCount}/{DAYS.length} days</span>
              </div>
              <div className="w-full bg-accent/20 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {isCompleted ? (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="text-sm font-medium text-primary">
                    ✓ You've already completed this prayer session
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can revisit your reflections in your Journal
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/journal')}
                  variant="outline"
                  className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-foreground hover:bg-white/20 hover:border-white/40"
                >
                  View Journal
                </Button>
              </div>
            ) : accessStatus === 'locked' ? (
              <div className="p-4 bg-muted/50 border border-border rounded-lg text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  🔒 This prayer will unlock on its scheduled day
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {guideline.day_of_week || guideline.day} - Week {guideline.week_number}
                </p>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleStartGuidedSession}
                  className="w-full bg-gradient-to-r from-primary via-primary to-primary-light text-gray-100 font-semibold shadow-lg hover:scale-[1.02] hover:text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Start Guided Prayer Session
                </Button>
                {accessStatus === 'past' && !isCompleted && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    This is a past prayer. Completing it won't count toward your daily streak.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-large glass border-white/20">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl text-white">Daily Prayer Tracker</CardTitle>
            <p className="text-xs md:text-sm text-white/90">
              Complete each day's guided prayer to mark it as done
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {dailyPrayers.map((prayer) => (
                <div
                  key={prayer.day}
                  className={`flex items-center justify-between p-3 md:p-4 rounded-lg border-2 ${
                    prayer.completed
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${
                      prayer.completed
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {prayer.completed && <Check className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-sm md:text-base">{prayer.day}</span>
                  </div>
                  {prayer.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(prayer.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuidelineDetails;

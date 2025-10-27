import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage, DailyPrayer } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { toast } from "sonner";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GuidelineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [guideline, setGuideline] = useState<any>(null);
  const [dailyPrayers, setDailyPrayers] = useState<DailyPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'locked' | 'current' | 'past'>('current');
  
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = DAYS[new Date().getDay()];

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
      checkCompletion();
      checkAccessStatus();
    }
  }, [id, user]);

  const checkCompletion = () => {
    if (!id || !user) return;
    const completedGuidelines = getFromStorage(STORAGE_KEYS.COMPLETED_GUIDELINES, {} as any);
    const userCompleted = completedGuidelines[user.id] || [];
    setIsCompleted(userCompleted.includes(id));
  };

  const checkAccessStatus = () => {
    if (!id) return;
    
    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const foundGuideline = guidelines.find((g: any) => g.id === id);
    
    if (!foundGuideline) return;

    // Date-aware access control
    const now = new Date();
    const currentWeek = Math.ceil((now.getDate()) / 7);
    const guidelineWeek = foundGuideline.week_number;
    const guidelineDay = foundGuideline.day_of_week || foundGuideline.day;

    // Check if week is in the future
    if (guidelineWeek > currentWeek) {
      setAccessStatus('locked');
      return;
    }
    
    // Check if week is in the past
    if (guidelineWeek < currentWeek) {
      setAccessStatus('past');
      return;
    }
    
    // Same week - check day
    if (guidelineDay === currentDay) {
      setAccessStatus('current');
    } else if (DAYS.indexOf(guidelineDay) > DAYS.indexOf(currentDay)) {
      // Future day in current week
      setAccessStatus('locked');
    } else {
      // Past day in current week
      setAccessStatus('past');
    }
  };

  const fetchGuideline = async () => {
    if (!id) return;

    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const foundGuideline = guidelines.find((g: any) => g.id === id);

    if (foundGuideline) {
      setGuideline(foundGuideline);
      
      // Initialize daily prayers if not exists
      const prayers = foundGuideline.dailyPrayers || DAYS.map(day => ({
        day,
        completed: false
      }));
      setDailyPrayers(prayers);
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
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading guideline...</p>
      </div>
    );
  }

  if (!guideline) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Guideline not found</p>
      </div>
    );
  }

  const completedCount = dailyPrayers.filter(p => p.completed).length;
  const progress = (completedCount / DAYS.length) * 100;

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <Button
          variant="ghost"
          className="mb-4 md:mb-6"
          onClick={() => navigate('/guidelines')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Guidelines
        </Button>

        <Card className="shadow-medium mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <Badge variant="secondary" className="mb-2 w-fit text-xs">
              Week {guideline.week_number}
            </Badge>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl">{guideline.title}</CardTitle>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Track your daily prayer progress throughout the week
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-medium">Weekly Progress</span>
                <span className="text-xs md:text-sm text-muted-foreground">{completedCount}/{DAYS.length} days</span>
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
                  className="w-full"
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
                  className="w-full"
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

        <Card className="shadow-medium">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Daily Prayer Tracker</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">
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

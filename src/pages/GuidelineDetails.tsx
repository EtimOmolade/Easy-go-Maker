import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, PrayerGuideline, DailyPrayer, getUserProgress, PrayerPoint } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, CheckCircle2, Circle, Volume2, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PrayerTimer } from "@/components/PrayerTimer";
import { markPrayerCompleted } from "@/utils/prayerHelpers";
import { toast } from "sonner";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { VOICE_PROMPTS, playVoicePrompt } from "@/utils/voicePrompts";
import { Progress } from "@/components/ui/progress";

const GuidelineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guideline, setGuideline] = useState<PrayerGuideline | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const [showTrackerDialog, setShowTrackerDialog] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [achievedMilestoneLevel, setAchievedMilestoneLevel] = useState<number | null>(null);
  const [dailyPrayers, setDailyPrayers] = useState<DailyPrayer[]>([]);
  
  // Guided session state
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
      fetchDailyProgress();
    }
  }, [id, user]);

  const fetchGuideline = () => {
    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as PrayerGuideline[]);
    const found = guidelines.find((g: PrayerGuideline) => g.id === id);
    if (found) {
      setGuideline(found);
    }

    const points = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, [] as PrayerPoint[]);
    setPrayerPoints(points);
  };

  const fetchDailyProgress = () => {
    if (!user || !id) return;

    const progress = getUserProgress(user.id);
    if (progress.dailyPrayers[id]) {
      setDailyPrayers(progress.dailyPrayers[id]);
    } else {
      // Initialize daily prayers for this guideline
      setDailyPrayers([
        { day: 'Monday', completed: false },
        { day: 'Tuesday', completed: false },
        { day: 'Wednesday', completed: false },
        { day: 'Thursday', completed: false },
        { day: 'Friday', completed: false },
        { day: 'Saturday', completed: false },
        { day: 'Sunday', completed: false }
      ]);
    }
  };

  const handleMarkComplete = (day: string) => {
    if (!user || !guideline) return;

    const { newStreak, milestone } = markPrayerCompleted(user.id);
    fetchDailyProgress();

    if (milestone) {
      setAchievedMilestoneLevel(milestone.level);
      setShowMilestoneModal(true);
    } else {
      toast.success(`${day} completed! ${newStreak}-day streak!`);
    }
  };

  if (!guideline) {
    return (
      <div className="min-h-screen gradient-subtle p-8">
        <Button variant="ghost" onClick={() => navigate("/guidelines")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Guidelines
        </Button>
        <p className="text-center text-muted-foreground mt-8">Guideline not found</p>
      </div>
    );
  }

  const startGuidedSession = () => {
    setIsGuidedMode(true);
    setCurrentStepIndex(0);
    setCurrentPointIndex(0);
    
    // Play welcome prompt
    setTimeout(() => {
      playVoicePrompt("Welcome to today's prayer session. Let's begin by seeking first the Kingdom of God.");
    }, 500);
    
    // Start first step
    setTimeout(() => {
      playVoicePrompt(VOICE_PROMPTS.KINGDOM_START);
    }, 4000);
  };

  const handleStepComplete = () => {
    const nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex < guideline.steps.length) {
      setCurrentStepIndex(nextStepIndex);
      setCurrentPointIndex(0);
      
      const nextStep = guideline.steps[nextStepIndex];
      
      // Play transition prompt
      setTimeout(() => {
        if (nextStep.type === 'personal') {
          playVoicePrompt(VOICE_PROMPTS.PERSONAL_START);
        } else if (nextStep.type === 'listening') {
          playVoicePrompt(VOICE_PROMPTS.LISTENING_START);
        }
      }, 500);
    } else {
      // Session complete
      setIsGuidedMode(false);
      playVoicePrompt(VOICE_PROMPTS.SESSION_COMPLETE);
      toast.success("Prayer session completed!");
      
      // Redirect to journal
      setTimeout(() => {
        playVoicePrompt(VOICE_PROMPTS.JOURNALING_START);
        navigate("/journal");
      }, 3000);
    }
  };

  const handlePointComplete = () => {
    const currentStep = guideline.steps[currentStepIndex];
    const nextPointIndex = currentPointIndex + 1;
    
    if (nextPointIndex < currentStep.prayer_point_ids.length) {
      setCurrentPointIndex(nextPointIndex);
      
      // Play next point prompt for kingdom prayers
      if (currentStep.type === 'kingdom') {
        setTimeout(() => {
          playVoicePrompt(VOICE_PROMPTS.KINGDOM_NEXT);
        }, 500);
      }
    } else {
      handleStepComplete();
    }
  };

  const toggleAudioReading = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const currentStep = guideline.steps[currentStepIndex];
      const point = prayerPoints.find(p => p.id === currentStep.prayer_point_ids[currentPointIndex]);
      
      if (point && currentStep.type === 'listening') {
        const utterance = new SpeechSynthesisUtterance(point.content);
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
          setIsPlayingAudio(false);
          // Auto-advance to next point after listening
          setTimeout(() => {
            handlePointComplete();
          }, 1000);
        };
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const getCurrentStepInfo = () => {
    if (!isGuidedMode) return null;
    
    const step = guideline.steps[currentStepIndex];
    const point = prayerPoints.find(p => p.id === step.prayer_point_ids[currentPointIndex]);
    const progress = ((currentStepIndex / guideline.steps.length) * 100);
    
    return { step, point, progress };
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <MilestoneAchievementModal 
          milestoneLevel={achievedMilestoneLevel || 0}
          isOpen={showMilestoneModal}
          onClose={() => setShowMilestoneModal(false)}
        />

        <Button variant="ghost" className="mb-6" onClick={() => navigate("/guidelines")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Guidelines
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            {guideline.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Week {guideline.week_number} • {guideline.day}
          </p>
        </div>

        {!isGuidedMode ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Start Guided Prayer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Begin today's prayer journey with step-by-step guidance, timers, and voice prompts.
                </p>
                <Button className="w-full" onClick={startGuidedSession}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Guided Session
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Daily Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowTrackerDialog(true)}
                >
                  View Week Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-glow border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Step {currentStepIndex + 1} of {guideline.steps.length}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsGuidedMode(false)}>
                  Exit Session
                </Button>
              </div>
              <Progress value={stepInfo?.progress || 0} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              {stepInfo?.step.type === 'kingdom' && stepInfo.point && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-primary">Kingdom Focused Prayer</h3>
                    <span className="text-sm text-muted-foreground">
                      Point {currentPointIndex + 1} of {stepInfo.step.prayer_point_ids.length}
                    </span>
                  </div>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">{stepInfo.point.title}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap">{stepInfo.point.content}</p>
                  </div>
                  <PrayerTimer 
                    duration={180}
                    onComplete={handlePointComplete}
                    autoStart={true}
                  />
                </div>
              )}
              
              {stepInfo?.step.type === 'personal' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">Personal Supplication</h3>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <p className="text-foreground/90">
                      Now is the time to bring your personal requests to God. Share what's on your heart - your needs, your family, your work, your health. God is listening.
                    </p>
                  </div>
                  <PrayerTimer 
                    duration={300}
                    onComplete={handleStepComplete}
                    autoStart={true}
                  />
                </div>
              )}
              
              {stepInfo?.step.type === 'listening' && stepInfo.point && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-primary">Listening Prayer</h3>
                    <span className="text-sm text-muted-foreground">
                      Passage {currentPointIndex + 1} of {stepInfo.step.prayer_point_ids.length}
                    </span>
                  </div>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3">{stepInfo.point.title}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{stepInfo.point.content}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={toggleAudioReading}
                      variant={isPlayingAudio ? "secondary" : "default"}
                      className="flex-1"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Audio
                        </>
                      ) : (
                        <>
                          <Volume2 className="mr-2 h-4 w-4" />
                          Listen to Scripture
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handlePointComplete}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={showTrackerDialog} onOpenChange={setShowTrackerDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Weekly Prayer Tracker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                {dailyPrayers.map((prayer, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`day-${index}`}
                        checked={prayer.completed}
                        onCheckedChange={() => handleMarkComplete(prayer.day)}
                      />
                      <label 
                        htmlFor={`day-${index}`}
                        className="font-medium cursor-pointer select-none"
                      >
                        {prayer.day}
                      </label>
                    </div>
                    {prayer.completed ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>
                          {prayer.completedAt 
                            ? new Date(prayer.completedAt).toLocaleDateString()
                            : 'Completed'}
                        </span>
                      </div>
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">
                  Progress: {dailyPrayers.filter(p => p.completed).length} of 7 days completed
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GuidelineDetails;

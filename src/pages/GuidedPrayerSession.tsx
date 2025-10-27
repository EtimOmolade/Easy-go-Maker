import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage, PrayerPoint } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { PrayerTimer } from "@/components/PrayerTimer";
import { playVoicePrompt, stopVoicePrompt, VOICE_PROMPTS } from "@/utils/voicePrompts";
import { Progress } from "@/components/ui/progress";

interface PrayerStep {
  id: string;
  type: 'kingdom' | 'personal' | 'listening' | 'reflection' | 'testimony';
  title: string;
  content: string;
  duration: number; // in seconds
  audioUrl?: string;
  points?: string[];
}

interface GuidelineSession {
  id: string;
  guideline_id: string;
  day: string;
  steps: PrayerStep[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GuidedPrayerSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [guideline, setGuideline] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGuidedMode, setIsGuidedMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentDay = DAYS[new Date().getDay()];

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
    }
  }, [id, user]);

  useEffect(() => {
    if (voiceEnabled && isGuidedMode && guideline && hasStarted) {
      const step = guideline.steps[currentStepIndex];
      if (step && !completedSteps.includes(currentStepIndex)) {
        playStepVoicePrompt(step.type);
      }
    }
  }, [currentStepIndex, voiceEnabled, isGuidedMode, hasStarted]);

  const fetchGuideline = async () => {
    if (!id) return;

    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const foundGuideline = guidelines.find((g: any) => g.id === id);

    if (foundGuideline) {
      // Check if guideline has steps (new structure)
      if (foundGuideline.steps && foundGuideline.steps.length > 0) {
        // New structure with library-based steps
        const prayerPoints = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, [] as PrayerPoint[]);
        
        const enrichedSteps = foundGuideline.steps.map((step: any) => {
          const points = prayerPoints.filter(p => step.prayer_point_ids?.includes(p.id));
          
          return {
            id: step.id,
            type: step.type,
            title: step.type,
            content: '',
            duration: step.duration,
            audioUrl: step.custom_audio_url,
            prayer_point_ids: step.prayer_point_ids,
            points: points.map(p => p.title)
          };
        });

        setGuideline({ ...foundGuideline, steps: enrichedSteps });
      } else {
        // Fallback: No steps defined, show message
        setGuideline(null);
      }
    }
    setLoading(false);
  };

  const playStepVoicePrompt = (type: string) => {
    let prompt = '';
    switch (type) {
      case 'kingdom':
        prompt = currentStepIndex === 0 ? VOICE_PROMPTS.KINGDOM_START : VOICE_PROMPTS.KINGDOM_NEXT;
        break;
      case 'personal':
        prompt = VOICE_PROMPTS.PERSONAL_START;
        break;
      case 'listening':
        prompt = VOICE_PROMPTS.LISTENING_START;
        break;
      case 'reflection':
        prompt = VOICE_PROMPTS.JOURNALING_START;
        break;
    }
    if (prompt) playVoicePrompt(prompt);
  };

  const handlePointComplete = () => {
    const currentStep = guideline.steps[currentStepIndex];
    const nextPointIndex = currentPointIndex + 1;
    
    if (currentStep.type === 'kingdom' && nextPointIndex < (currentStep.prayer_point_ids?.length || 0)) {
      // Move to next prayer point and trigger a re-render to reset timer
      setCurrentPointIndex(nextPointIndex);
      
      // Play next point prompt after short delay
      if (voiceEnabled) {
        setTimeout(() => {
          playVoicePrompt(VOICE_PROMPTS.KINGDOM_NEXT);
        }, 500);
      }
    } else {
      // All kingdom points complete or not a kingdom step, move to next step
      handleStepComplete();
    }
  };

  const handleStepComplete = () => {
    const newCompleted = [...completedSteps, currentStepIndex];
    setCompletedSteps(newCompleted);
    setCurrentPointIndex(0); // Reset point index for next step

    if (currentStepIndex < guideline.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = async () => {
    if (!user || !guideline) return;

    try {
      const { markPrayerCompleted } = await import('@/utils/prayerHelpers');
      const { newStreak } = markPrayerCompleted(user.id);

      // Update the guideline's daily tracker for current day
      const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
      const updatedGuidelines = guidelines.map((g: any) => {
        if (g.id === guideline.id) {
          const dailyPrayers = g.dailyPrayers || DAYS.map((day: string) => ({
            day,
            completed: false
          }));
          
          const updatedDailyPrayers = dailyPrayers.map((p: any) => 
            p.day === currentDay 
              ? { ...p, completed: true, completedAt: new Date().toISOString() }
              : p
          );
          
          return { ...g, dailyPrayers: updatedDailyPrayers };
        }
        return g;
      });
      setToStorage(STORAGE_KEYS.GUIDELINES, updatedGuidelines);

      // Create journal entry
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
      const newEntry = {
        id: `prayer-${Date.now()}`,
        user_id: user.id,
        title: `[PRAYER_TRACK] ${guideline.id} - ${currentDay}`,
        content: `Completed guided prayer session for ${guideline.title} - ${currentDay}`,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        is_answered: true,
        is_shared: false
      };
      allEntries.push(newEntry);
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);

      if (voiceEnabled) {
        playVoicePrompt(VOICE_PROMPTS.SESSION_COMPLETE);
      }

      toast.success(`🎉 Prayer session complete! ${newStreak}-day streak!`);
      
      setTimeout(() => {
        navigate('/journal');
      }, 2000);
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to save progress');
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopVoicePrompt();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const toggleAudioReading = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const currentStep = guideline.steps[currentStepIndex];
      const prayerPoints = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, [] as PrayerPoint[]);
      const point = prayerPoints.find(p => p.id === currentStep.prayer_point_ids?.[currentPointIndex]);
      
      if (point && currentStep.type === 'listening') {
        const utterance = new SpeechSynthesisUtterance(point.content);
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
          setIsPlayingAudio(false);
        };
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleBeginSession = () => {
    setHasStarted(true);
    if (voiceEnabled) {
      setTimeout(() => {
        playVoicePrompt(VOICE_PROMPTS.KINGDOM_START);
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading prayer session...</p>
      </div>
    );
  }

  if (!guideline) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Prayer guideline not found</p>
      </div>
    );
  }

  const currentStep = guideline.steps[currentStepIndex];
  const progress = ((completedSteps.length) / guideline.steps.length) * 100;
  const prayerPoints = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, [] as PrayerPoint[]);
  const currentPoint = currentStep?.prayer_point_ids?.[currentPointIndex] 
    ? prayerPoints.find(p => p.id === currentStep.prayer_point_ids[currentPointIndex])
    : null;

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/guideline/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoice}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant={isGuidedMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsGuidedMode(!isGuidedMode)}
            >
              {isGuidedMode ? 'Guided' : 'Free'}
            </Button>
          </div>
        </div>

        <Card className="shadow-medium mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">{currentDay}</Badge>
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {guideline.steps.length}
              </span>
            </div>
            <CardTitle className="text-2xl">{guideline.title}</CardTitle>
            <Progress value={progress} className="h-2 mt-4" />
          </CardHeader>
        </Card>

        {!hasStarted ? (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Ready to Begin?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                This guided prayer session will take you through {guideline.steps.length} steps including kingdom focused prayers, personal supplication, listening prayer, and reflection.
              </p>
              <Button 
                onClick={handleBeginSession} 
                className="w-full"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Begin Prayer Session
              </Button>
            </CardContent>
          </Card>
        ) : currentStep && (
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {currentStep.type === 'kingdom' && 'Kingdom Focused Prayer'}
                  {currentStep.type === 'personal' && 'Personal Supplication'}
                  {currentStep.type === 'listening' && 'Listening Prayer - Bible Reading'}
                  {currentStep.type === 'reflection' && 'Reflection & Journaling'}
                </CardTitle>
                {completedSteps.includes(currentStepIndex) && (
                  <Check className="h-6 w-6 text-primary" />
                )}
              </div>
              {currentStep.type === 'kingdom' && currentStep.prayer_point_ids && (
                <p className="text-sm text-muted-foreground mt-2">
                  Point {currentPointIndex + 1} of {currentStep.prayer_point_ids.length}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep.type === 'kingdom' && currentPoint && (
                <>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">{currentPoint.title}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap">{currentPoint.content}</p>
                  </div>
                  
                  {currentStep.custom_audio_url && (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <audio controls className="w-full">
                        <source src={currentStep.custom_audio_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {isGuidedMode && !completedSteps.includes(currentStepIndex) ? (
                    <PrayerTimer
                      key={`kingdom-${currentStepIndex}-${currentPointIndex}`}
                      duration={180}
                      onComplete={handlePointComplete}
                      autoStart={true}
                      label="3 minutes"
                    />
                  ) : (
                    <Button onClick={handlePointComplete} className="w-full">
                      Next Prayer Point
                    </Button>
                  )}
                </>
              )}

              {currentStep.type === 'personal' && (
                <>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <p className="text-foreground/90">
                      Now is the time to bring your personal requests to God. Share what's on your heart - your needs, your family, your work, your health. God is listening.
                    </p>
                  </div>
                  
                  {currentStep.custom_audio_url && (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <audio controls className="w-full">
                        <source src={currentStep.custom_audio_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {isGuidedMode && !completedSteps.includes(currentStepIndex) ? (
                    <PrayerTimer
                      key={`personal-${currentStepIndex}`}
                      duration={300}
                      onComplete={handleStepComplete}
                      autoStart={true}
                      label="5 minutes"
                    />
                  ) : (
                    <Button onClick={handleStepComplete} className="w-full">
                      Complete Personal Prayer
                    </Button>
                  )}
                </>
              )}

              {currentStep.type === 'listening' && currentPoint && (
                <>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3">{currentPoint.title}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{currentPoint.content}</p>
                  </div>
                  
                  {currentStep.custom_audio_url && (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <audio controls className="w-full">
                        <source src={currentStep.custom_audio_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
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
                      {currentStep.prayer_point_ids && currentPointIndex < currentStep.prayer_point_ids.length - 1 ? 'Next Passage' : 'Complete'}
                    </Button>
                  </div>
                </>
              )}

              {currentStep.type === 'reflection' && (
                <>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <p className="text-foreground/90">
                      Take time to reflect on what you've prayed and what God has spoken to you. Write down your thoughts, insights, and what you sense God is saying.
                    </p>
                  </div>
                  
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate('/journal')}
                  >
                    Open Journal
                  </Button>
                  
                  <Button onClick={handleStepComplete} variant="outline" className="w-full">
                    Complete Session
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-4 md:grid-cols-7 gap-2">
          {guideline.steps.map((step: PrayerStep, idx: number) => (
            <button
              key={step.id}
              onClick={() => !isGuidedMode && setCurrentStepIndex(idx)}
              disabled={isGuidedMode}
              className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${
                completedSteps.includes(idx)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : idx === currentStepIndex
                  ? 'bg-accent border-accent text-accent-foreground'
                  : 'bg-card border-border hover:border-accent'
              } ${isGuidedMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidedPrayerSession;

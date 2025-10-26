import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage, PrayerPoint } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { PrayerTimer } from "@/components/PrayerTimer";
import { playVoicePrompt, stopVoicePrompt, VOICE_PROMPTS } from "@/utils/voicePrompts";
import { AudioPlayer } from "@/components/AudioPlayer";
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GuidedPrayerSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [guideline, setGuideline] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGuidedMode, setIsGuidedMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const currentDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
    }
  }, [id, user]);

  useEffect(() => {
    if (voiceEnabled && isGuidedMode && guideline) {
      const step = guideline.steps[currentStepIndex];
      if (step && !completedSteps.includes(currentStepIndex)) {
        playStepVoicePrompt(step.type);
      }
    }
  }, [currentStepIndex, voiceEnabled, isGuidedMode]);

  const fetchGuideline = async () => {
    if (!id) return;

    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const foundGuideline = guidelines.find((g: any) => g.id === id);

    if (foundGuideline && foundGuideline.steps) {
      // New structure with library-based steps
      const prayerPoints = getFromStorage(STORAGE_KEYS.PRAYER_POINTS, [] as PrayerPoint[]);
      
      const enrichedSteps = foundGuideline.steps.map((step: any) => {
        const points = prayerPoints.filter(p => step.prayer_point_ids?.includes(p.id));
        
        let content = '';
        let title = '';
        
        switch (step.type) {
          case 'kingdom':
            title = `Kingdom Focused Prayer`;
            content = points.map(p => `${p.title}\n${p.content}`).join('\n\n');
            break;
          case 'personal':
            title = 'Personal Supplication';
            content = 'Bring your personal requests to God. Share what\'s on your heart.';
            break;
          case 'listening':
            title = 'Listening Prayer - Bible Reading';
            content = points.map(p => `${p.title}\n\n${p.content}`).join('\n\n---\n\n');
            break;
          case 'reflection':
            title = 'Reflection & Journaling';
            content = 'Write down what you sense or learned during prayer.';
            break;
        }

        return {
          id: step.id,
          type: step.type,
          title,
          content,
          duration: step.duration,
          audioUrl: step.custom_audio_url,
          points: points.map(p => p.title)
        };
      });

      setGuideline({ ...foundGuideline, steps: enrichedSteps });
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

  const handleStepComplete = () => {
    const newCompleted = [...completedSteps, currentStepIndex];
    setCompletedSteps(newCompleted);

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

        {currentStep && (
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                {completedSteps.includes(currentStepIndex) && (
                  <Check className="h-6 w-6 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground/90 whitespace-pre-wrap">{currentStep.content}</p>
              </div>

              {currentStep.points && currentStep.points.length > 0 && (
                <ul className="space-y-2 list-disc list-inside">
                  {currentStep.points.map((point, idx) => (
                    <li key={idx} className="text-foreground/80">{point}</li>
                  ))}
                </ul>
              )}

              {currentStep.audioUrl && (
                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <audio controls className="w-full">
                    <source src={currentStep.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {isGuidedMode && currentStep.duration > 0 && !completedSteps.includes(currentStepIndex) ? (
                <PrayerTimer
                  duration={currentStep.duration}
                  onComplete={handleStepComplete}
                  label={`${Math.floor(currentStep.duration / 60)} minute${currentStep.duration >= 120 ? 's' : ''}`}
                />
              ) : (
                <div className="flex gap-2 flex-col md:flex-row">
                  {!completedSteps.includes(currentStepIndex) && (
                    <Button onClick={handleStepComplete} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                  {currentStepIndex < guideline.steps.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                      className="flex-1"
                    >
                      Next Step
                    </Button>
                  )}
                </div>
              )}

              {currentStep.type === 'reflection' && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/journal')}
                >
                  Open Journal
                </Button>
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

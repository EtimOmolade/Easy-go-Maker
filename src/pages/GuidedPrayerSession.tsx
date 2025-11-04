import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { PrayerTimer } from "@/components/PrayerTimer";
import { playVoicePrompt, stopVoicePrompt, VOICE_PROMPTS } from "@/utils/voicePrompts";
import { Progress } from "@/components/ui/progress";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { speak, speakTwice, cancelSpeech } from "@/services/tts";

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
  const [achievedMilestone, setAchievedMilestone] = useState<any>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const currentDay = DAYS[new Date().getDay()];

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
    }

    // Cleanup: Stop voice when component unmounts (user leaves page)
    return () => {
      stopVoicePrompt();
      window.speechSynthesis.cancel(); // Also stop any audio reading
    };
  }, [id, user]);

  // Auto-disable voice when switching to free mode
  useEffect(() => {
    if (!isGuidedMode) {
      if (voiceEnabled) {
        stopVoicePrompt();
      }
      setVoiceEnabled(false);
    }
  }, [isGuidedMode]);

  useEffect(() => {
    if (voiceEnabled && isGuidedMode && guideline && hasStarted) {
      const step = guideline.steps[currentStepIndex];
      if (step && !completedSteps.includes(currentStepIndex)) {
        playStepVoicePrompt(step.type);
      }
    }
  }, [currentStepIndex, voiceEnabled, isGuidedMode, hasStarted]);

  // Auto-read kingdom prayer content TWICE when point changes
  useEffect(() => {
    if (hasStarted && !completedSteps.includes(currentStepIndex)) {
      const step = guideline?.steps[currentStepIndex];
      if (step?.type === 'kingdom' && step.points?.[currentPointIndex]) {
        const point = step.points[currentPointIndex];

        // Read the prayer twice consecutively using TTS service
        speakTwice(point.content, {
          rate: 0.65,
          pitch: 1,
          volume: 1
        });
      }
    }

    // Cleanup when component unmounts or before next read
    return () => {
      cancelSpeech();
    };
  }, [currentPointIndex, currentStepIndex, hasStarted, guideline, completedSteps]);

  const fetchGuideline = async () => {
    if (!id) return;

    try {
      const { data: guideline, error } = await supabase
        .from('guidelines')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (guideline) {
        // Deduplicate prayer points in each step (fix for old data with duplicates)
        const deduplicatedGuideline = {
          ...guideline,
          steps: Array.isArray(guideline.steps) ? guideline.steps.map((step: any) => {
            if (step.points && Array.isArray(step.points)) {
              // Remove duplicate points based on ID
              const uniquePoints = step.points.filter((point: any, index: number, self: any[]) =>
                index === self.findIndex((p: any) => p.id === point.id)
              );
              return { ...step, points: uniquePoints };
            }
            return step;
          }) : guideline.steps
        };
        setGuideline(deduplicatedGuideline);
      }
    } catch (error) {
      console.error("Error fetching guideline:", error);
      toast.error("Failed to load guideline");
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
    const currentStep = guideline.steps?.[currentStepIndex];
    const nextPointIndex = currentPointIndex + 1;
    
    if (currentStep?.type === 'kingdom' && nextPointIndex < (currentStep.points?.length || 0)) {
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

    if (currentStepIndex < (guideline.steps?.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = async () => {
    if (!user || !guideline) return;

    try {
      // Determine if this is current day prayer (date-aware)
      const now = new Date();
      const currentMonthIndex = now.getMonth();
      const monthsOrder = ['June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonthName = monthsOrder[currentMonthIndex] || '';
      const currentDay = now.getDate();
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = DAYS[now.getDay()];
      
      const guidelineMonth = guideline.month;
      const guidelineDay = guideline.day;
      const guidelineMonthIndex = monthsOrder.indexOf(guidelineMonth);
      
      const isCurrentMonth = guidelineMonthIndex === currentMonthIndex;
      const isCurrentDay = guidelineDay === currentDay;
      const isCurrentPrayer = isCurrentMonth && isCurrentDay;
      
      let newStreak = 0;
      let milestone = null;

      // Only update streak for current day prayers
      if (isCurrentPrayer) {
        const { markPrayerCompleted } = await import('@/utils/prayerHelpers');
        const result = markPrayerCompleted(user.id);
        newStreak = result.newStreak;
        milestone = result.milestone;

        console.log('Prayer completed! Result:', { newStreak, milestone });

        // Show milestone modal if achieved
        if (milestone) {
          console.log('Setting milestone modal:', milestone);
          setAchievedMilestone(milestone);
          setShowMilestoneModal(true);
        }
      }

      // Log daily prayer completion in Supabase (for ALL prayers - current, past, future)
      // This updates the weekly tracker
      // Check if already completed to avoid duplicates
      const { data: existingPrayer, error: checkError } = await supabase
        .from('daily_prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('guideline_id', guideline.id)
        .eq('day_of_week', guideline.day_of_week || currentDayName)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking daily prayer:', checkError);
      }

      // Only insert if not already completed
      if (!existingPrayer) {
        const { error: insertError } = await supabase
          .from('daily_prayers')
          .insert({
            user_id: user.id,
            guideline_id: guideline.id,
            day_of_week: guideline.day_of_week || currentDayName,
            completed_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting daily prayer:', insertError);
          toast.error('Failed to update prayer tracker');
        } else {
          console.log('✅ Daily prayer tracker updated successfully');
        }
      } else {
        console.log('ℹ️ Prayer already marked as completed in tracker');
      }

      // Create journal entry with appropriate message
      const journalContent = isCurrentPrayer 
        ? 'Completed prayer session (edit journal to add reflections)'
        : 'Completed guided prayer session (Past prayer - edit to add reflections)';
        
      await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: guideline.title,
          content: journalContent,
          date: new Date().toISOString().split('T')[0],
          is_answered: false,
          is_shared: false,
        });

      if (voiceEnabled) {
        playVoicePrompt(VOICE_PROMPTS.SESSION_COMPLETE);
      }

      const message = isCurrentPrayer
        ? `🎉 Prayer session complete! ${newStreak}-day streak!`
        : '🎉 Prayer session complete! Saved to your journal.';

      toast.success(message);

      // Redirect to journal after 2 seconds
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
      cancelSpeech();
      setIsPlayingAudio(false);
    } else {
      const currentStep = guideline.steps[currentStepIndex];

      // For listening prayers, use currentPoint which has the resolved content
      if (currentStep && currentStep.type === 'listening' && currentPoint?.content) {
        setIsPlayingAudio(true);
        speak(currentPoint.content, {
          rate: 0.5, // Very slow for meditative scripture reading
          pitch: 1,
          volume: 1,
          onEnd: () => setIsPlayingAudio(false)
        });
      } else if (currentStep && currentStep.type === 'kingdom' && currentPoint?.content) {
        setIsPlayingAudio(true);
        speak(currentPoint.content, {
          rate: 0.65,
          pitch: 1,
          volume: 1,
          onEnd: () => setIsPlayingAudio(false)
        });
      }
    }
  };

  const handleBeginSession = () => {
    setHasStarted(true);
    // Voice prompt will be triggered by useEffect when hasStarted becomes true
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

  const currentStep = guideline.steps?.[currentStepIndex];
  const progress = ((completedSteps.length) / (guideline.steps?.length || 1)) * 100;

  // Get current point for both kingdom and listening prayers
  const currentPoint = (currentStep?.type === 'kingdom' || currentStep?.type === 'listening') && currentStep?.points?.[currentPointIndex]
    ? currentStep.points[currentPointIndex]
    : null;

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-3 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/guideline/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoice}
              disabled={!isGuidedMode}
              className={!isGuidedMode ? 'opacity-50 cursor-not-allowed' : ''}
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

        <Card className="shadow-medium mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <Badge variant="secondary" className="text-xs">{guideline.day_of_week}</Badge>
                <span className="text-xs md:text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {guideline.steps?.length || 0}
                </span>
              </div>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">{guideline.title}</CardTitle>
            <Progress value={progress} className="h-2 mt-3 md:mt-4" />
          </CardHeader>
        </Card>

        {!hasStarted ? (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Ready to Begin?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                This guided prayer session will take you through {guideline.steps?.length || 0} steps including kingdom focused prayers, personal supplication, listening prayer, and reflection.
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
              {currentStep.type === 'kingdom' && currentStep.points && (
                <p className="text-sm text-muted-foreground mt-2">
                  Point {currentPointIndex + 1} of {currentStep.points.length}
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
                  
                  {currentStep.audioUrl && (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <audio controls className="w-full">
                        <source src={currentStep.audioUrl} type="audio/mpeg" />
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
                    <>
                      {currentPointIndex < (currentStep.points?.length || 0) - 1 ? (
                        <Button onClick={handlePointComplete} className="w-full">
                          Next Prayer
                        </Button>
                      ) : (
                        <Button onClick={handleStepComplete} className="w-full">
                          Complete Prayer Step
                        </Button>
                      )}
                    </>
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
                  
                  {currentStep.audioUrl && (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <audio controls className="w-full">
                        <source src={currentStep.audioUrl} type="audio/mpeg" />
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
                    <h4 className="font-semibold text-lg mb-3">Reflection & Journaling</h4>
                    <p className="text-foreground/90 leading-relaxed">
                      Take time to reflect on what you've prayed and what God has spoken to you. Write down your thoughts, insights, and what you sense God is saying.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSessionComplete} 
                    className="w-full"
                    size="lg"
                  >
                    Complete Session → Open Journal
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

      {/* Milestone Achievement Modal */}
      {achievedMilestone && (
        <MilestoneAchievementModal
          milestoneLevel={achievedMilestone.level}
          isOpen={showMilestoneModal}
          onClose={() => {
            setShowMilestoneModal(false);
            setAchievedMilestone(null);
          }}
        />
      )}
    </div>
  );
};

export default GuidedPrayerSession;

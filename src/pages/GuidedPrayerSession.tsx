import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Volume2, VolumeX, Play, Pause, Music2, Settings } from "lucide-react";
import { toast } from "sonner";
import { PrayerTimer } from "@/components/PrayerTimer";
import { playVoicePrompt, stopVoicePrompt, VOICE_PROMPTS } from "@/utils/voicePrompts";
import { Progress } from "@/components/ui/progress";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { speak, speakTwice, cancelSpeech } from "@/services/tts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PrayerStep {
  id: string;
  type: 'kingdom' | 'personal' | 'listening' | 'reflection' | 'testimony';
  title: string;
  content: string;
  duration: number; // in seconds
  audioUrl?: string;
  audio_url?: string; // NEW - Speechmatics generated audio
  points?: {
    id: string;
    content: string;
    title: string;
    audio_url?: string; // NEW - Speechmatics generated audio
  }[];
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
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true);
  const [bgAudio, setBgAudio] = useState<HTMLAudioElement | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingVoicePrompt, setIsPlayingVoicePrompt] = useState(false);

  // Use ref for synchronous audio tracking (prevents race conditions when switching steps)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentDay = DAYS[new Date().getDay()];

  // Helper function to stop all audio
  const stopAllAudio = () => {
    // Stop HTML5 Audio elements (use ref for immediate access)
    if (currentAudioRef.current) {
      // CRITICAL: Remove event listeners BEFORE stopping to prevent error fallback
      currentAudioRef.current.onerror = null;
      currentAudioRef.current.onended = null;
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    if (currentAudio) {
      // Remove event listeners to prevent fallback
      currentAudio.onerror = null;
      currentAudio.onended = null;
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    // Stop Web Speech API (browser TTS)
    cancelSpeech();
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
    }

    // Cleanup: Stop ALL audio when component unmounts (user leaves page)
    return () => {
      stopVoicePrompt();
      stopAllAudio();
      // Also stop background music
      if (bgAudio) {
        bgAudio.pause();
        bgAudio.src = '';
      }
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

  // Combined effect: Voice prompt THEN prayer audio (sequential, not simultaneous)
  //
  // FIXES APPLIED:
  // 1. ✅ Audio stops when leaving page (cleanup in mount useEffect)
  // 2. ✅ Audio stops when switching steps (stopAllAudio called first + cleanup in return)
  // 3. ✅ No overlapping audio (currentAudioRef tracked and cleaned up)
  // 4. ✅ Voice prompt plays FIRST, then 1.5-second pause, then prayer audio
  // 5. ✅ Voice differentiation: Male voice (prompts) vs Female voice (prayers)
  // 6. ✅ Speechmatics audio slowed down (playbackRate = 0.85)
  // 7. ✅ Only Speechmatics plays (no browser TTS fallback unless error)
  //
  useEffect(() => {
    if (!hasStarted || completedSteps.includes(currentStepIndex)) {
      return;
    }

    const step = guideline?.steps[currentStepIndex];
    if (!step) return;

    // STOP ALL PREVIOUS AUDIO FIRST (prevents overlapping)
    stopAllAudio();

    const playPrayerAudio = () => {
      if (step?.type === 'kingdom' && step.points?.[currentPointIndex]) {
        const point = step.points[currentPointIndex];

        // TRY PRE-GENERATED AUDIO FIRST (Speechmatics)
        if (point.audio_url) {
          const audio = new Audio(point.audio_url);
          audio.playbackRate = 0.85; // Slow down Speechmatics audio (85% speed)

          setCurrentAudio(audio);
          currentAudioRef.current = audio; // Also track in ref for immediate cleanup

          let playCount = 0;

          audio.onended = () => {
            playCount++;
            if (playCount < 2) {
              // Play twice (like speakTwice)
              audio.currentTime = 0;
              audio.play().catch(() => {
                console.warn('⚠️ Audio replay failed');
              });
            } else {
              setIsPlayingAudio(false);
              setCurrentAudio(null);
              currentAudioRef.current = null;
            }
          };

          audio.onerror = () => {
            // FALLBACK TO BROWSER TTS ONLY ON ERROR
            console.warn('⚠️ Audio failed to load, using browser TTS fallback');
            setCurrentAudio(null);
            currentAudioRef.current = null;
            speakTwice(point.content, {
              rate: 0.65,
              pitch: 1,
              volume: 1
            });
          };

          audio.play().catch(() => {
            // FALLBACK IF PLAY FAILS
            console.warn('⚠️ Audio playback failed, using browser TTS fallback');
            setCurrentAudio(null);
            currentAudioRef.current = null;
            speakTwice(point.content, {
              rate: 0.65,
              pitch: 1,
              volume: 1
            });
          });

          setIsPlayingAudio(true);
        } else {
          // NO AUDIO URL, USE BROWSER TTS
          speakTwice(point.content, {
            rate: 0.65,
            pitch: 1,
            volume: 1
          });
        }
      }
    };

    // SEQUENCE: Voice prompt → 3 second pause → Prayer audio (GUIDED MODE ONLY)
    if (voiceEnabled && isGuidedMode) {
      playStepVoicePrompt(step.type);

      // Wait for voice prompt to finish + 3 second pause, then play prayer
      setTimeout(() => {
        playPrayerAudio();
      }, 5000); // Voice prompt takes ~2s, + 3s pause = 5s total
    } else if (isGuidedMode) {
      // Guided mode but voice disabled - play prayer audio immediately
      playPrayerAudio();
    }
    // FREE MODE: Don't auto-play audio, user controls it manually with toggleAudioReading

    // Cleanup when step/point changes - CRITICAL for free mode step switching
    return () => {
      stopAllAudio();
    };
  }, [currentPointIndex, currentStepIndex, hasStarted, guideline, completedSteps, voiceEnabled, isGuidedMode]);

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
      // This updates the weekly tracker - marks the ACTUAL day the user prayed
      // Database expects lowercase day names
      const dayOfWeekLowercase = currentDayName.toLowerCase();

      // Check if already completed TODAY to avoid duplicates
      const { data: existingPrayer, error: checkError } = await supabase
        .from('daily_prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('guideline_id', guideline.id)
        .eq('day_of_week', dayOfWeekLowercase)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking daily prayer:', checkError);
      }

      // Only insert if not already completed TODAY
      if (!existingPrayer) {
        const { error: insertError } = await supabase
          .from('daily_prayers')
          .insert({
            user_id: user.id,
            guideline_id: guideline.id,
            day_of_week: dayOfWeekLowercase, // Store the actual day user is praying (lowercase)
            completed_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Error inserting daily prayer:', insertError);
          toast.error(`Failed to update prayer tracker: ${insertError.message}`);
        } else {
          console.log(`✅ Daily prayer tracker updated - marked ${currentDayName} as completed`);
        }
      } else {
        console.log(`ℹ️ ${currentDayName} already marked as completed in tracker for this guideline`);
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
      // Stop all audio
      stopAllAudio();
    } else {
      // Stop any previous audio first
      stopAllAudio();

      const currentStep = guideline.steps[currentStepIndex];

      // For listening prayers, use listeningPrayer which has the resolved content
      const listeningPrayer = currentStep.type === 'listening'
        ? (currentStep.points?.[0] || currentStep.prayer || currentStep)
        : null;

      if (currentStep && currentStep.type === 'listening' && listeningPrayer?.content) {
        // TRY PRE-GENERATED AUDIO FIRST (Speechmatics)
        if (currentStep.audio_url) {
          const audio = new Audio(currentStep.audio_url);
          audio.playbackRate = 0.7; // Slow down Speechmatics audio for meditative scripture (70% speed)

          setCurrentAudio(audio);
          currentAudioRef.current = audio; // Track in ref for immediate cleanup

          audio.onended = () => {
            setIsPlayingAudio(false);
            setCurrentAudio(null);
            currentAudioRef.current = null;
          };

          audio.onerror = () => {
            // FALLBACK TO BROWSER TTS ONLY ON ERROR
            console.warn('⚠️ Listening audio failed, using browser TTS');
            setCurrentAudio(null);
            currentAudioRef.current = null;
            setIsPlayingAudio(true);
            speak(listeningPrayer.content, {
              rate: 0.5, // Very slow for meditative scripture
              pitch: 1,
              volume: 1,
              onEnd: () => setIsPlayingAudio(false)
            });
          };

          audio.play().catch(() => {
            // FALLBACK IF PLAY FAILS
            console.warn('⚠️ Listening playback failed, using browser TTS');
            setCurrentAudio(null);
            currentAudioRef.current = null;
            setIsPlayingAudio(true);
            speak(listeningPrayer.content, {
              rate: 0.5,
              pitch: 1,
              volume: 1,
              onEnd: () => setIsPlayingAudio(false)
            });
          });

          setIsPlayingAudio(true);
        } else {
          // NO AUDIO URL, USE BROWSER TTS
          setIsPlayingAudio(true);
          speak(listeningPrayer.content, {
            rate: 0.5, // Very slow for meditative scripture reading
            pitch: 1,
            volume: 1,
            onEnd: () => setIsPlayingAudio(false)
          });
        }
      } else if (currentStep && currentStep.type === 'kingdom') {
        const kingdomPoint = currentStep.points?.[currentPointIndex];
        if (kingdomPoint?.content) {
          // TRY PRE-GENERATED AUDIO FIRST (Speechmatics)
          if (kingdomPoint.audio_url) {
            const audio = new Audio(kingdomPoint.audio_url);
            audio.playbackRate = 0.85; // Slow down Speechmatics audio (85% speed)

            setCurrentAudio(audio);
            currentAudioRef.current = audio; // Track in ref for immediate cleanup

            audio.onended = () => {
              setIsPlayingAudio(false);
              setCurrentAudio(null);
              currentAudioRef.current = null;
            };

            audio.onerror = () => {
              // FALLBACK TO BROWSER TTS ONLY ON ERROR
              setCurrentAudio(null);
              currentAudioRef.current = null;
              speak(kingdomPoint.content, {
                rate: 0.65,
                pitch: 1,
                volume: 1,
                onEnd: () => setIsPlayingAudio(false)
              });
            };

            audio.play().catch(() => {
              // FALLBACK IF PLAY FAILS
              setCurrentAudio(null);
              currentAudioRef.current = null;
              speak(kingdomPoint.content, {
                rate: 0.65,
                pitch: 1,
                volume: 1,
                onEnd: () => setIsPlayingAudio(false)
              });
            });
            setIsPlayingAudio(true);
          } else {
            // NO AUDIO URL, USE BROWSER TTS
            setIsPlayingAudio(true);
            speak(kingdomPoint.content, {
              rate: 0.65,
              pitch: 1,
              volume: 1,
              onEnd: () => setIsPlayingAudio(false)
            });
          }
        }
      }
    }
  };

  // Initialize background music when session starts
  useEffect(() => {
    if (hasStarted && backgroundMusicEnabled) {
      const audio = new Audio('/assets/music/Ambient_Music.mp3');
      audio.loop = true;
      audio.volume = 0.15; // Subtle 15% volume
      
      audio.play().catch(err => {
        console.warn('⚠️ Background music autoplay blocked:', err);
        // User needs to interact with page first (browser policy)
      });
      
      setBgAudio(audio);
      
      return () => {
        audio.pause();
        audio.src = '';
      };
    } else if (bgAudio && !backgroundMusicEnabled) {
      // User toggled off
      bgAudio.pause();
      bgAudio.src = '';
      setBgAudio(null);
    }
  }, [hasStarted, backgroundMusicEnabled]);

  // Volume ducking: Lower background music during prayer audio
  useEffect(() => {
    if (bgAudio) {
      bgAudio.volume = isPlayingAudio ? 0.05 : 0.15; // 5% during speech, 15% normally
    }
  }, [isPlayingAudio, bgAudio]);

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

  // Get current point for kingdom prayers (which have points array)
  const currentPoint = currentStep?.type === 'kingdom' && currentStep?.points?.[currentPointIndex]
    ? currentStep.points[currentPointIndex]
    : null;

  // Get listening prayer directly (single object, not array)
  const listeningPrayer = currentStep?.type === 'listening' 
    ? (currentStep.points?.[0] || currentStep.prayer || currentStep)
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

          <TooltipProvider>
            <div className="flex gap-2">
              {/* Audio Settings Dropdown - Mobile First */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Audio</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Audio Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={toggleVoice}
                    disabled={!isGuidedMode}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {voiceEnabled ? (
                        <Volume2 className="h-4 w-4 text-primary" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Voice Guidance</p>
                        <p className="text-xs text-muted-foreground">Spoken prompts</p>
                      </div>
                    </div>
                    <Badge variant={voiceEnabled ? "default" : "secondary"} className="ml-2">
                      {voiceEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setBackgroundMusicEnabled(!backgroundMusicEnabled)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Music2 className={`h-4 w-4 ${backgroundMusicEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">Background Music</p>
                        <p className="text-xs text-muted-foreground">Ambient sounds</p>
                      </div>
                    </div>
                    <Badge variant={backgroundMusicEnabled ? "default" : "secondary"} className="ml-2">
                      {backgroundMusicEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </DropdownMenuItem>

                  {!isGuidedMode && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Voice guidance only works in Guided mode
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={isGuidedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsGuidedMode(!isGuidedMode)}
              >
                {isGuidedMode ? 'Guided' : 'Free'}
              </Button>
            </div>
          </TooltipProvider>
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

              {currentStep.type === 'listening' && listeningPrayer && (
                <>
                  <div className="p-6 bg-accent/5 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3">{listeningPrayer.title || listeningPrayer.reference || 'Scripture Reading'}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{listeningPrayer.content}</p>
                    {listeningPrayer.reference && (
                      <p className="text-sm text-muted-foreground mt-3 italic">— {listeningPrayer.reference}</p>
                    )}
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
                      onClick={handleStepComplete}
                      variant="outline"
                    >
                      Complete Listening Prayer
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

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Volume2, VolumeX, Play, Pause, Music2, Settings } from "lucide-react";
import { toast } from "sonner";
import { PrayerTimer } from "@/components/PrayerTimer";
import { playVoicePrompt, stopVoicePrompt, pauseVoicePrompt, resumeVoicePrompt, resetVoicePromptTracking, VOICE_PROMPTS } from "@/utils/voicePrompts";
import { Progress } from "@/components/ui/progress";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { speak, speakTwice, cancelSpeech, pauseTTS, resumeTTS } from "@/services/tts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppHeader } from "@/components/AppHeader";
import { useOffline } from "@/contexts/OfflineContext";
import { cacheGuideline, getCachedGuideline, savePrayerCompletionOffline } from "@/utils/offlineStorage";
import { formatBibleReferenceForDisplay } from "@/utils/bibleReferenceFormatter";


interface PrayerStep {
  id: string;
  type: 'kingdom' | 'personal' | 'listening' | 'reflection' | 'testimony';
  title: string;
  content: string;
  duration: number; // in seconds
  audioUrl?: string;
  audio_url?: string; // Single voice audio (backward compatibility)
  audio_urls?: {
    sarah?: string;
    theo?: string;
    megan?: string;
  };
  points?: {
    id: string;
    content: string;
    title: string;
    audio_url?: string; // Single voice audio (backward compatibility)
    audio_urls?: {
      sarah?: string;
      theo?: string;
      megan?: string;
    };
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
  const { isOnline } = useOffline();

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
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'sarah' | 'theo' | 'megan'>('sarah');

  // Use ref for synchronous audio tracking (prevents race conditions when switching steps)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPausedRef = useRef<boolean>(false); // Ref for synchronous pause state checks

  const currentDay = DAYS[new Date().getDay()];

  // Helper function to add fade-out effect to audio
  const addFadeOut = (audio: HTMLAudioElement, fadeStartSeconds = 1.5) => {
    const handleTimeUpdate = () => {
      const timeRemaining = audio.duration - audio.currentTime;

      if (timeRemaining <= fadeStartSeconds && timeRemaining > 0) {
        // Calculate fade-out progress (1 = full volume, 0 = silent)
        const fadeProgress = timeRemaining / fadeStartSeconds;
        audio.volume = Math.max(0, Math.min(1, fadeProgress));
      } else if (audio.volume !== 1 && timeRemaining > fadeStartSeconds) {
        // Reset volume if we're not in fade-out zone
        audio.volume = 1;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup function to remove listener
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  };

  // Helper function to format scripture for better TTS pronunciation
  // Improves pronunciation of scripture references for browser TTS fallback
  const formatScriptureForTTS = (text: string): string => {
    // Replace verse references like "17:1-9" with "17, verses 1 to 9."
    // Use "to" instead of "through" to avoid sounding like "three"
    let formatted = text.replace(/(\d+):(\d+)-(\d+)/g, '$1, verses $2 to $3.')
      .replace(/(\d+):(\d+)(?!-)/g, '$1, verse $2.'); // Handle single verses like "17:1"

    // Add full stop after Bible version (KJV, NIV, etc.) for pause before scripture content
    // Pattern: "(KJV)" becomes "(KJV). " or "KJV" becomes "KJV. "
    formatted = formatted.replace(/\(([A-Z]{2,5})\)/g, '($1). ')
      .replace(/([A-Z]{2,5})(?=\s+[A-Z])/g, '$1. '); // Version followed by capital letter (verse start)

    // Add commas for better pacing between phrases
    formatted = formatted.replace(/\.\s+/g, '. , '); // Add comma after periods for slight pause

    return formatted;
  };

  // Helper function to check if we can start new audio (not paused)
  const canStartAudio = (): boolean => {
    if (isPausedRef.current) {
      console.log('⏸️ Audio start blocked - session is paused');
      return false;
    }
    return true;
  };

  // Helper function to pause/resume all audio and session flow
  const handleTimerPauseToggle = (isPausedNow: boolean) => {
    // Update both state and ref for synchronous access
    setIsPaused(isPausedNow);
    isPausedRef.current = isPausedNow;

    if (isPausedNow) {
      // PAUSE: Freeze entire session flow
      console.log('🛑 Session paused - freezing all audio and flow');

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (currentAudio) {
        currentAudio.pause();
      }
      if (bgAudio) {
        bgAudio.pause();
      }
      // Pause voice prompts (both Speechmatics audio and TTS)
      pauseVoicePrompt();
      // Pause TTS service (for listening prayers using browser TTS or Google TTS)
      pauseTTS();
    } else {
      // RESUME: Continue session flow from where it was paused
      console.log('▶️ Session resumed - continuing from pause point');

      if (currentAudioRef.current && currentAudioRef.current.paused) {
        currentAudioRef.current.play().catch(err => console.warn('Resume audio failed:', err));
      }
      if (currentAudio && currentAudio.paused) {
        currentAudio.play().catch(err => console.warn('Resume audio failed:', err));
      }
      if (bgAudio && bgAudio.paused) {
        bgAudio.play().catch(err => console.warn('Resume background music failed:', err));
      }
      // Resume voice prompts (both Speechmatics audio and TTS)
      resumeVoicePrompt();
      // Resume TTS service (for listening prayers using browser TTS or Google TTS)
      resumeTTS();
    }
  };

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
      fetchUserVoicePreference();
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

  const fetchUserVoicePreference = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('voice_preference')
      .eq('id', user.id)
      .single();

    if (data?.voice_preference) {
      setSelectedVoice(data.voice_preference as 'sarah' | 'theo' | 'megan');
    }
  };

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
      if (!canStartAudio()) {
        console.log('⏸️ Prayer audio start blocked - session is paused');
        return;
      }

      if (step?.type === 'kingdom' && step.points?.[currentPointIndex]) {
        const point = step.points[currentPointIndex];

        // TRY PRE-GENERATED AUDIO FIRST (Speechmatics) - Use selected voice
        const audioUrl = point.audio_urls?.[selectedVoice] || point.audio_url;
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.playbackRate = 0.85; // Slow down Speechmatics audio (85% speed)
          audio.volume = 1; // Start at full volume

          // Add fade-out effect (1.5 seconds before audio ends)
          const removeFadeOut = addFadeOut(audio, 1.5);

          setCurrentAudio(audio);
          currentAudioRef.current = audio; // Also track in ref for immediate cleanup

          let playCount = 0;

          audio.onended = () => {
            removeFadeOut(); // Clean up fade-out listener
            playCount++;
            if (playCount < 2 && canStartAudio()) {
              // Play twice (like speakTwice) - but only if not paused
              audio.currentTime = 0;
              audio.volume = 1; // Reset volume for replay
              // Re-add fade-out for second playback
              const removeFadeOut2 = addFadeOut(audio, 1.5);
              audio.play().catch(() => {
                console.warn('⚠️ Audio replay failed');
                removeFadeOut2();
              });
              // Update the cleanup for second playback
              audio.onended = () => {
                removeFadeOut2();
                setIsPlayingAudio(false);
                setCurrentAudio(null);
                currentAudioRef.current = null;
              };
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
      const prompt = getPromptForStepType(step.type);
      if (prompt) {
        playVoicePrompt(prompt, {
          onEnd: () => {
            // Wait 3 seconds after prompt finishes, THEN play prayer audio
            setTimeout(() => {
              // CRITICAL: Re-check voiceEnabled inside timeout in case user toggled it OFF during the pause
              if (canStartAudio() && voiceEnabled) {
                playPrayerAudio();
              }
            }, 3000);
          }
        });
      }
    } else if (isGuidedMode && !voiceEnabled) {
      // Guided mode but voice disabled - DO NOT play prayer audio automatically
      console.log('🔇 Voice Guidance disabled - suppressing all automatic audio');
      stopAllAudio();
      stopVoicePrompt();
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
      if (isOnline) {
        // Try to fetch from Supabase when online
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

          // Cache the guideline for offline access
          await cacheGuideline(deduplicatedGuideline);

          setGuideline(deduplicatedGuideline);
        }
      } else {
        // Load from cache when offline
        console.log('📵 Offline mode - loading from cache');
        const cachedGuideline = await getCachedGuideline(id);

        if (cachedGuideline) {
          setGuideline(cachedGuideline);
          toast.info('Loaded prayer from offline cache');
        } else {
          toast.error('This prayer is not available offline. Please go online to access it.');
        }
      }
    } catch (error) {
      console.error("Error fetching guideline:", error);

      // Try to load from cache as fallback
      try {
        const cachedGuideline = await getCachedGuideline(id);
        if (cachedGuideline) {
          setGuideline(cachedGuideline);
          toast.warning('Loaded from offline cache due to connection error');
        } else {
          toast.error("Failed to load guideline");
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);
        toast.error("Failed to load guideline");
      }
    }

    setLoading(false);
  };

  // Helper function to get the appropriate voice prompt for a step type
  const getPromptForStepType = (type: string): string => {
    switch (type) {
      case 'kingdom':
        return currentStepIndex === 0 ? VOICE_PROMPTS.KINGDOM_START : VOICE_PROMPTS.KINGDOM_NEXT;
      case 'personal':
        return VOICE_PROMPTS.PERSONAL_START;
      case 'listening':
        return VOICE_PROMPTS.LISTENING_START;
      case 'reflection':
        return VOICE_PROMPTS.JOURNALING_START;
      default:
        return '';
    }
  };

  const handlePointComplete = () => {
    const currentStep = guideline.steps?.[currentStepIndex];
    const nextPointIndex = currentPointIndex + 1;

    if (currentStep?.type === 'kingdom' && nextPointIndex < (currentStep.points?.length || 0)) {
      // Move to next prayer point and trigger a re-render to reset timer
      setCurrentPointIndex(nextPointIndex);

      // REMOVED: Duplicate playVoicePrompt call (useEffect already handles this)
      // The useEffect at line 257 will automatically play the prompt when currentPointIndex changes
      console.log(`✅ Moving to next intercession prayer point: ${nextPointIndex + 1}`);
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
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth();
      const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentDay = now.getDate();
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = DAYS[now.getDay()];

      const guidelineMonth = guideline.month;
      const guidelineDay = guideline.day;
      const guidelineMonthIndex = monthsOrder.indexOf(guidelineMonth);

      // Get year from date_uploaded if available, otherwise assume current year
      const guidelineYear = guideline.date_uploaded ? new Date(guideline.date_uploaded).getFullYear() : currentYear;

      const isCurrentYear = guidelineYear === currentYear;
      const isCurrentMonth = guidelineMonthIndex === currentMonthIndex;
      const isCurrentDay = guidelineDay === currentDay;
      const isCurrentPrayer = isCurrentYear && isCurrentMonth && isCurrentDay;

      let newStreak = 0;
      let milestone = null;

      // Database expects lowercase day names
      const dayOfWeekLowercase = currentDayName.toLowerCase();
      const journalContent = isCurrentPrayer
        ? 'Completed prayer session (edit journal to add reflections)'
        : 'Completed guided prayer session (Past prayer - edit to add reflections)';

      if (isOnline) {
        // ONLINE MODE: Save directly to Supabase
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
              day_of_week: dayOfWeekLowercase,
              completed_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Error inserting daily prayer:', insertError);
          } else {
            console.log(`✅ Daily prayer tracker updated - marked ${currentDayName} as completed`);
          }
        }

        // Create journal entry
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
      } else {
        // OFFLINE MODE: Queue for sync when back online
        console.log('📵 Offline mode - saving prayer completion to sync queue');
        await savePrayerCompletionOffline({
          user_id: user.id,
          guideline_id: guideline.id,
          day_of_week: dayOfWeekLowercase,
          journal_entry: {
            title: guideline.title,
            content: journalContent,
            date: new Date().toISOString().split('T')[0],
          },
        });
      }

      if (voiceEnabled && canStartAudio()) {
        playVoicePrompt(VOICE_PROMPTS.SESSION_COMPLETE);
      }

      const message = isOnline
        ? (isCurrentPrayer
          ? `🎉 Prayer session complete! ${newStreak}-day streak!`
          : '🎉 Prayer session complete! Saved to your journal.')
        : '🎉 Prayer session complete! Will sync when you\'re back online.';

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

  const handleVoiceChange = async (voice: 'sarah' | 'theo' | 'megan') => {
    setSelectedVoice(voice);

    // Update user's preference in database
    if (user) {
      await supabase
        .from('profiles')
        .update({ voice_preference: voice })
        .eq('id', user.id);

      toast.success(`Voice changed to ${voice.charAt(0).toUpperCase() + voice.slice(1)}`);
    }

    // If audio is currently playing, restart with new voice
    if (isPlayingAudio && currentStepIndex !== undefined) {
      const step = guideline?.steps[currentStepIndex];

      // Handle kingdom prayer voice change
      if (step?.type === 'kingdom' && currentPointIndex !== undefined && step.points?.[currentPointIndex]) {
        stopAllAudio();
        // Replay with new voice after short delay
        setTimeout(() => {
          const point = step.points[currentPointIndex];
          const audioUrl = point.audio_urls?.[voice] || point.audio_url;
          if (audioUrl && canStartAudio()) {
            const audio = new Audio(audioUrl);
            audio.playbackRate = 0.85;
            audio.volume = 1;
            const removeFadeOut = addFadeOut(audio, 1.5);
            setCurrentAudio(audio);
            currentAudioRef.current = audio;

            audio.onended = () => {
              removeFadeOut();
              setIsPlayingAudio(false);
              setCurrentAudio(null);
              currentAudioRef.current = null;
            };

            audio.play().catch(() => {
              console.warn('⚠️ Audio playback failed');
              setCurrentAudio(null);
              currentAudioRef.current = null;
            });

            setIsPlayingAudio(true);
          }
        }, 300);
      }

      // Handle listening prayer voice change
      if (step?.type === 'listening') {
        stopAllAudio();
        // Replay with new voice after short delay
        setTimeout(() => {
          const audioUrl = step.audio_urls?.[voice] || step.audio_url;
          if (audioUrl && canStartAudio()) {
            const audio = new Audio(audioUrl);
            audio.playbackRate = 0.76;
            audio.volume = 1;
            const removeFadeOut = addFadeOut(audio, 1.75);
            setCurrentAudio(audio);
            currentAudioRef.current = audio;

            audio.onended = () => {
              removeFadeOut();
              setIsPlayingAudio(false);
              setCurrentAudio(null);
              currentAudioRef.current = null;
            };

            audio.play().catch(() => {
              console.warn('⚠️ Audio playback failed');
              setCurrentAudio(null);
              currentAudioRef.current = null;
            });

            setIsPlayingAudio(true);
          }
        }, 300);
      }
    }
  };

  const toggleAudioReading = () => {
    if (isPlayingAudio) {
      // PAUSE instead of STOP (preserves audio position)
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      pauseTTS(); // Pause TTS fallback if it's being used
      setIsPlayingAudio(false);
    } else {
      // Check if resuming existing audio
      if (currentAudioRef.current && currentAudioRef.current.paused) {
        // Resume from same position
        currentAudioRef.current.play().catch(err => console.warn('Resume listening audio failed:', err));
        resumeTTS(); // Resume TTS fallback if it was being used
        setIsPlayingAudio(true);
        return;
      }

      // Create new audio only if none exists
      stopAllAudio();

      const currentStep = guideline.steps[currentStepIndex];

      // For listening prayers, use listeningPrayer which has the resolved content
      const listeningPrayer = currentStep.type === 'listening'
        ? (currentStep.points?.[0] || currentStep.prayer || currentStep)
        : null;

      if (currentStep && currentStep.type === 'listening' && listeningPrayer?.content) {
        // TRY PRE-GENERATED AUDIO FIRST (Speechmatics) - use selected voice
        const audioUrl = currentStep.audio_urls?.[selectedVoice] || currentStep.audio_url;
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.playbackRate = 0.76; // Slow down Speechmatics audio for meditative scripture (70% speed)
          audio.volume = 1; // Start at full volume

          // Add fade-out effect (2 seconds before audio ends)
          const removeFadeOut = addFadeOut(audio, 1.75);

          setCurrentAudio(audio);
          currentAudioRef.current = audio; // Track in ref for immediate cleanup

          audio.onended = () => {
            removeFadeOut(); // Clean up fade-out listener
            setIsPlayingAudio(false);
            setCurrentAudio(null);
            currentAudioRef.current = null;
          };

          audio.onerror = () => {
            // FALLBACK TO BROWSER TTS ONLY ON ERROR
            console.warn('⚠️ Listening audio failed, using browser TTS');
            removeFadeOut(); // Clean up fade-out listener
            setCurrentAudio(null);
            currentAudioRef.current = null;
            setIsPlayingAudio(true);
            speak(formatScriptureForTTS(listeningPrayer.content), {
              rate: 0.5, // Very slow for meditative scripture
              pitch: 1,
              volume: 1,
              onEnd: () => setIsPlayingAudio(false)
            });
          };

          audio.play().catch(() => {
            // FALLBACK IF PLAY FAILS
            console.warn('⚠️ Listening playback failed, using browser TTS');
            removeFadeOut(); // Clean up fade-out listener
            setCurrentAudio(null);
            currentAudioRef.current = null;
            setIsPlayingAudio(true);
            speak(formatScriptureForTTS(listeningPrayer.content), {
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
          speak(formatScriptureForTTS(listeningPrayer.content), {
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
    // Reset voice prompt tracking for new session
    resetVoicePromptTracking();
    setHasStarted(true);
    // Voice prompt will be triggered by useEffect when hasStarted becomes true
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden gradient-hero flex items-center justify-center">
        <p className="text-white/80">Loading prayer session...</p>
      </div>
    );
  }

  if (!guideline) {
    return (
      <div className="min-h-screen relative overflow-hidden gradient-hero flex items-center justify-center">
        <p className="text-white/80">Prayer guideline not found</p>
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

      <div className="max-w-4xl relative z-10 mx-auto p-3 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <AppHeader showBack={true} backTo={`/guideline/${id}`} hideNotifications={true} />

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
                    <span className="sm:hidden">Audio</span>
                    <span className="hidden sm:inline">Audio Settings</span>
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

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Prayer Voice</DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => handleVoiceChange('sarah')}
                    className={selectedVoice === 'sarah' ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">👩</span>
                    Sarah {selectedVoice === 'sarah' && '✓'}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleVoiceChange('theo')}
                    className={selectedVoice === 'theo' ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">👨</span>
                    Theo {selectedVoice === 'theo' && '✓'}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleVoiceChange('megan')}
                    className={selectedVoice === 'megan' ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">👩</span>
                    Megan {selectedVoice === 'megan' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

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

        <Card className="shadow-large glass border-white/20 mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Badge variant="secondary" className="text-xs bg-gradient-secondary text-white border-0">{guideline.day_of_week}</Badge>
              <span className="text-xs md:text-sm text-white/80">
                Step {currentStepIndex + 1} of {guideline.steps?.length || 0}
              </span>
            </div>
            <CardTitle className="text-lg md:text-xl lg:text-2xl text-white">{guideline.title}</CardTitle>
            <Progress value={progress} className="h-2 mt-3 md:mt-4" />
          </CardHeader>
        </Card>

        {!hasStarted ? (
          <Card className="shadow-large glass border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">Ready to Begin?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-white/90">
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
          <Card className="shadow-large glass border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">
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
                <p className="text-sm text-white/80 mt-2">
                  Point {currentPointIndex + 1} of {currentStep.points.length}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep.type === 'kingdom' && currentPoint && (
                <>
                  <div className="p-6 bg-white/50 backdrop-blur-md rounded-lg border border-white/30 shadow-medium">
                    <h4 className="font-semibold mb-2 text-foreground">{currentPoint.title}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap">{formatBibleReferenceForDisplay(currentPoint.content)}</p>
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
                      onPauseToggle={handleTimerPauseToggle}
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
                  <div className="p-6 bg-white/50 backdrop-blur-md rounded-lg border border-white/30 shadow-medium">
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
                      onPauseToggle={handleTimerPauseToggle}
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
                  <div className="p-6 bg-white/50 backdrop-blur-md rounded-lg border border-white/30 shadow-medium">
                    <h4 className="font-semibold mb-3 text-foreground">{listeningPrayer.title || listeningPrayer.reference || 'Scripture Reading'}</h4>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{formatBibleReferenceForDisplay(listeningPrayer.content)}</p>
                    {listeningPrayer.reference && (
                      <p className="text-sm text-muted-foreground mt-3 italic">— {formatBibleReferenceForDisplay(listeningPrayer.reference)}</p>
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
                  <div className="p-6 bg-white/50 backdrop-blur-md rounded-lg border border-white/30 shadow-medium">
                    <h4 className="font-semibold text-lg mb-3 text-foreground">Reflection & Journaling</h4>
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
              className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${completedSteps.includes(idx)
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

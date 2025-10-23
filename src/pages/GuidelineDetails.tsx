import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Guideline {
  id: string;
  title: string;
  week_number: number;
  content: string;
  date_uploaded: string;
}

const GuidelineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchGuideline();
      fetchPrayerCompletions();
      fetchUserStreak();
    }
  }, [id, user]);

  const fetchGuideline = async () => {
    if (!id) return;

    // Prototype mode: Fetch from localStorage
    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const foundGuideline = guidelines.find((g: any) => g.id === id);

    if (foundGuideline) {
      setGuideline(foundGuideline);
    } else {
      toast.error("Guideline not found");
    }
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("guidelines")
    //   .select("*")
    //   .eq("id", id)
    //   .single();
    //
    // if (error) {
    //   console.error("Error fetching guideline:", error);
    //   toast.error("Failed to load guideline");
    // } else {
    //   setGuideline(data);
    // }
    // setLoading(false);
  };

  const fetchPrayerCompletions = async () => {
    if (!id || !user) return;

    // Prototype mode: Fetch from localStorage
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const prayerEntries = allEntries
      .filter((entry: any) =>
        entry.user_id === user.id &&
        entry.title.startsWith('[PRAYER_TRACK]') &&
        entry.title.includes(id)
      );

    const days = prayerEntries
      .map((entry: any) => {
        const match = entry.title.match(/- (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    setCompletedDays(days);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("journal_entries")
    //   .select("title")
    //   .eq("user_id", user.id)
    //   .like("title", `[PRAYER_TRACK]%${id}%`);
    //
    // if (error) {
    //   console.error("Error fetching prayer completions:", error);
    // } else if (data) {
    //   const days = data
    //     .map(entry => {
    //       const match = entry.title.match(/- (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
    //       return match ? match[1] : null;
    //     })
    //     .filter(Boolean) as string[];
    //
    //   setCompletedDays(days);
    // }
  };

  const fetchUserStreak = async () => {
    if (!user) return;

    // Prototype mode: Fetch from localStorage
    const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
    const userProfile = profiles[user.id];
    if (userProfile) {
      setStreakCount(userProfile.streak_count || 0);
    }

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("profiles")
    //   .select("streak_count")
    //   .eq("id", user.id)
    //   .single();
    //
    // if (error) {
    //   console.error("Error fetching streak:", error);
    // } else if (data) {
    //   setStreakCount(data.streak_count);
    // }
  };

  const handleDayComplete = async (day: string) => {
    if (!user || !guideline) return;

    try {
      // Prototype mode: Create hidden journal entry in localStorage
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
      const newEntry = {
        id: `prayer-${Date.now()}`,
        user_id: user.id,
        title: `[PRAYER_TRACK] ${guideline.id} - ${day}`,
        content: `Completed daily prayer for ${guideline.title} - ${day}`,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        is_answered: true,
        is_shared: false
      };
      allEntries.push(newEntry);
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);

      // Update streak
      const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
      if (profiles[user.id]) {
        profiles[user.id].streak_count = (profiles[user.id].streak_count || 0) + 1;
        setToStorage(STORAGE_KEYS.PROFILES, profiles);
      }

      // Update local state
      setCompletedDays([...completedDays, day]);
      await fetchUserStreak();

      toast.success(`🎉 ${day} Complete! Keep the fire burning! +1 to your streak!`);

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from("journal_entries")
      //   .insert({
      //     user_id: user.id,
      //     title: `[PRAYER_TRACK] ${guideline.id} - ${day}`,
      //     content: `Completed daily prayer for ${guideline.title} - ${day}`,
      //     is_answered: true
      //   });
      //
      // if (error) throw error;
      // setCompletedDays([...completedDays, day]);
      // await fetchUserStreak();
      // toast.success(`🎉 ${day} Complete! Keep the fire burning! +1 to your streak!`);
    } catch (error: any) {
      console.error("Error completing prayer:", error);
      toast.error(error.message || "Failed to mark prayer as complete");
    }
  };

  const getDayStatus = (day: string) => {
    return completedDays.includes(day);
  };

  const isTodaysDay = (day: string) => {
    const dayIndex = DAYS.indexOf(day);
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert JavaScript day (0=Sun) to our array index (0=Mon)
    const currentDayIndex = today === 0 ? 6 : today - 1;
    return dayIndex === currentDayIndex;
  };

  const completedCount = completedDays.length;
  const progressPercent = (completedCount / 7) * 100;

  const formatGuidelineDate = (dateUploaded: string) => {
    const date = new Date(dateUploaded);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/guidelines")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Guidelines
        </Button>

        <Card className="shadow-medium mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Week {guideline.week_number} - {formatGuidelineDate(guideline.date_uploaded)}
                </Badge>
                <CardTitle className="text-3xl">{guideline.title}</CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent">{streakCount}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Weekly Progress</p>
                <p className="text-sm text-muted-foreground">{completedCount}/7 days</p>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="prose prose-sm max-w-none mb-8">
              <p className="text-foreground/90 whitespace-pre-wrap">{guideline.content}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg mb-4">Daily Prayer Tracker</h3>
              {DAYS.map((day) => {
                const isCompleted = getDayStatus(day);
                const isToday = isTodaysDay(day);
                const canCheck = isToday && !isCompleted;

                return (
                  <Card key={day} className={`${isCompleted ? 'bg-primary/5 border-primary/20' : isToday ? 'bg-accent/5 border-accent/20' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={day}
                            checked={isCompleted}
                            onCheckedChange={() => canCheck && handleDayComplete(day)}
                            disabled={!canCheck}
                          />
                          <label
                            htmlFor={day}
                            className={`text-base font-medium ${
                              isCompleted
                                ? 'line-through text-muted-foreground cursor-default'
                                : canCheck
                                ? 'cursor-pointer'
                                : 'text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            {day}
                            {isToday && !isCompleted && <span className="ml-2 text-xs text-accent">(Today)</span>}
                            {!isToday && !isCompleted && <span className="ml-2 text-xs italic">(Available on {day})</span>}
                          </label>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuidelineDetails;

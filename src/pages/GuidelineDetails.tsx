import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { STORAGE_KEYS, getFromStorage, MockGuideline, getUserProgress, markDayCompleted, UserProgress } from "@/data/mockData";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GuidelineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guideline, setGuideline] = useState<MockGuideline | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (id && user) {
      const guidelines = getFromStorage<MockGuideline[]>(STORAGE_KEYS.GUIDELINES, []);
      const found = guidelines.find(g => g.id === id);
      setGuideline(found || null);
      
      const userProgress = getUserProgress(user.id);
      setProgress(userProgress);
    }
  }, [id, user]);

  const handleDayComplete = (day: string) => {
    if (!user || !guideline) return;
    
    markDayCompleted(user.id, guideline.id, day);
    const updatedProgress = getUserProgress(user.id);
    setProgress(updatedProgress);
    
    toast.success(`🎉 ${day} Complete! Keep the fire burning! +1 to your streak!`);
    
    // Backend placeholder
    // await supabase.from('user_progress').upsert({
    //   user_id: user.id,
    //   guideline_id: guideline.id,
    //   day: day,
    //   completed: true
    // });
  };

  const getDayStatus = (day: string) => {
    if (!progress || !guideline) return false;
    const guidelinePrayers = progress.dailyPrayers[guideline.id];
    if (!guidelinePrayers) return false;
    const dayData = guidelinePrayers.find(d => d.day === day);
    return dayData?.completed || false;
  };

  const getCompletedCount = () => {
    if (!progress || !guideline) return 0;
    const guidelinePrayers = progress.dailyPrayers[guideline.id];
    if (!guidelinePrayers) return 0;
    return guidelinePrayers.filter(d => d.completed).length;
  };

  const completedCount = getCompletedCount();
  const progressPercent = (completedCount / 7) * 100;

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
                <Badge variant="secondary" className="mb-2">Week {guideline.week_number}</Badge>
                <CardTitle className="text-3xl">{guideline.title}</CardTitle>
              </div>
              {progress && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent">{progress.streakCount}</div>
                  <div className="text-xs text-muted-foreground">day streak</div>
                </div>
              )}
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
                return (
                  <Card key={day} className={`${isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={day}
                            checked={isCompleted}
                            onCheckedChange={() => !isCompleted && handleDayComplete(day)}
                            disabled={isCompleted}
                          />
                          <label
                            htmlFor={day}
                            className={`text-base font-medium cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {day}
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

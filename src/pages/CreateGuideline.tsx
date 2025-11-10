import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PrayerStep } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  category: string;
  audio_url?: string;
  created_at: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STEP_TYPES = [
  { value: 'kingdom', label: 'Kingdom Focused Prayer', defaultDuration: 180 },
  { value: 'personal', label: 'Personal Supplication', defaultDuration: 300 },
  { value: 'listening', label: 'Listening Prayer', defaultDuration: 240 }
];

const CreateGuideline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingGuideline = location.state?.guideline;
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState(1);
  const [day, setDay] = useState("Monday");
  const [steps, setSteps] = useState<PrayerStep[]>([]);
  const [currentStep, setCurrentStep] = useState<Partial<PrayerStep>>({
    type: 'kingdom',
    prayer_point_ids: [],
    duration: 180
  });

  useEffect(() => {
    fetchPrayerPoints();

    // Load editing data if available
    if (editingGuideline) {
      setTitle(editingGuideline.title || "");
      setWeekNumber(editingGuideline.week_number || 1);
      setDay(editingGuideline.day_of_week || "Monday");
      setSteps(editingGuideline.steps || []);
    }
  }, []);

  const fetchPrayerPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrayerPoints(data || []);
    } catch (error) {
      console.error('Error fetching prayer points:', error);
      toast.error('Failed to load prayer points');
    }
  };

  const getPointsByCategory = (stepType: string) => {
    const categoryMap: Record<string, string> = {
      'kingdom': 'Kingdom Focus',
      'listening': 'Listening Prayer'
    };
    const category = categoryMap[stepType];
    return category ? prayerPoints.filter(p => p.category === category) : [];
  };

  const handleAddStep = () => {
    if (!currentStep.type) {
      toast.error("Please select a step type");
      return;
    }

    if (currentStep.type !== 'personal' && (!currentStep.prayer_point_ids || currentStep.prayer_point_ids.length === 0)) {
      toast.error("Please select at least one prayer point");
      return;
    }

    const newStep: PrayerStep = {
      id: `step-${Date.now()}`,
      type: currentStep.type as 'kingdom' | 'personal' | 'listening' | 'reflection',
      prayer_point_ids: currentStep.prayer_point_ids || [],
      duration: currentStep.duration || 0,
      custom_audio_url: currentStep.custom_audio_url
    };

    setSteps([...steps, newStep]);
    setCurrentStep({
      type: 'kingdom',
      prayer_point_ids: [],
      duration: 180
    });
    toast.success("Step added");
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one prayer step");
      return;
    }

    try {
      // Resolve prayer_point_ids to actual prayer point objects
      const resolvedSteps = steps.map(step => {
        if (step.prayer_point_ids && step.prayer_point_ids.length > 0) {
          const prayerPointsWithContent = step.prayer_point_ids
            .map(id => prayerPoints.find(p => p.id === id))
            .filter(Boolean) // Remove any undefined values
            .map(point => ({
              id: point!.id,
              title: point!.title,
              content: point!.content
            }));

          // Don't duplicate - let GuidedPrayerSession handle reading twice
          const finalPoints = prayerPointsWithContent;

          return {
            id: step.id,
            type: step.type,
            duration: step.duration,
            custom_audio_url: step.custom_audio_url,
            prayer_point_ids: step.prayer_point_ids, // Keep IDs for reference
            points: finalPoints // Add resolved prayer content
          };
        }

        return step;
      });

      // Auto-append reflection step if not already present
      const hasReflection = resolvedSteps.some(s => s.type === 'reflection');
      const finalSteps = hasReflection ? resolvedSteps : [
        ...resolvedSteps,
        {
          id: `step-reflection-${Date.now()}`,
          type: 'reflection' as const,
          duration: 0,
          prayer_point_ids: [],
          custom_audio_url: '',
          points: []
        }
      ];

      // Get current date info for month and day fields
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[now.getMonth()];
      const dayOfMonth = now.getDate();

      if (editingGuideline) {
        // Update existing guideline in Supabase
        const { error: updateError } = await supabase
          .from("guidelines")
          .update({
            title,
            week_number: weekNumber,
            day_of_week: day,
            steps: finalSteps as any, // Cast to any to avoid type issues
            content: `${title} - Week ${weekNumber}`,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingGuideline.id);

        if (updateError) throw updateError;
        toast.success("Prayer guideline updated successfully!");
      } else {
        // Create new guideline in Supabase
        const { data: newGuideline, error: createError } = await supabase
          .from("guidelines")
          .insert([{
            title,
            week_number: weekNumber,
            month: month,
            day: dayOfMonth,
            day_of_week: day,
            steps: finalSteps as any, // Cast to any to avoid type issues
            content: `${title} - Week ${weekNumber}`,
            created_by: user.id,
            date_uploaded: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;

        // Create announcement for new guideline
        const { error: announcementError } = await supabase
          .from("encouragement_messages")
          .insert([{
            content: `🕊️ New Prayer Guideline Available!\n\n${month} ${dayOfMonth} - ${day}: ${title}\n\nCheck the Guidelines page to start your prayer journey!`,
            created_at: new Date().toISOString()
          }]);

        if (announcementError) {
          console.error("Error creating announcement:", announcementError);
          toast.error("Guideline created but failed to send announcement: " + announcementError.message);
        } else {
          console.log("Announcement created successfully!");
          toast.success("Prayer guideline created and announcement sent!");
        }
      }

      navigate('/admin');
    } catch (error: any) {
      console.error("Error creating/updating guideline:", error);
      toast.error(error.message || "Failed to save guideline");
    }
  };

  const togglePrayerPoint = (pointId: string) => {
    const current = currentStep.prayer_point_ids || [];
    const updated = current.includes(pointId)
      ? current.filter(id => id !== pointId)
      : [...current, pointId];
    setCurrentStep({ ...currentStep, prayer_point_ids: updated });
  };

  const availablePoints = getPointsByCategory(currentStep.type || '');

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-8">
          {editingGuideline ? 'Edit Prayer Guideline' : 'Create Prayer Guideline'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Guideline Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Week of Intercession"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="week">Week Number</Label>
                  <Input
                    id="week"
                    type="number"
                    min="1"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select value={day} onValueChange={setDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Build Prayer Steps</CardTitle>
              <p className="text-sm text-muted-foreground">Add steps in the order users will follow</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 border border-border rounded-lg bg-accent/5">
                <div>
                  <Label>Step Type</Label>
                  <Select
                    value={currentStep.type}
                    onValueChange={(val) => {
                      const stepType = STEP_TYPES.find(t => t.value === val);
                      setCurrentStep({
                        type: val as any,
                        prayer_point_ids: [],
                        duration: stepType?.defaultDuration || 0
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STEP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentStep.type !== 'personal' && (
                  <div>
                    <Label>Select Prayer Points</Label>
                    {availablePoints.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        No prayer points available. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/prayer-library')}>Add to library</Button>
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                        {availablePoints.map(point => (
                          <div key={point.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/10">
                            <Checkbox
                              checked={(currentStep.prayer_point_ids || []).includes(point.id)}
                              onCheckedChange={() => togglePrayerPoint(point.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{point.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{point.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={currentStep.duration}
                    onChange={(e) => setCurrentStep({ ...currentStep, duration: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentStep.duration ? `${Math.floor((currentStep.duration || 0) / 60)} min ${(currentStep.duration || 0) % 60} sec` : 'No timer (user-paced)'}
                  </p>
                </div>

                {/* TODO: Implement audio playback in prayer sessions
                <div>
                  <Label htmlFor="custom_audio">Custom Audio URL (Optional)</Label>
                  <Input
                    id="custom_audio"
                    value={currentStep.custom_audio_url || ''}
                    onChange={(e) => setCurrentStep({ ...currentStep, custom_audio_url: e.target.value })}
                    placeholder="https://example.com/audio.mp3"
                  />
                </div>
                */}

                <Button type="button" onClick={handleAddStep} variant="secondary" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>

              {steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Prayer Flow ({steps.length} steps)</h4>
                  {steps.map((step, index) => {
                    const stepType = STEP_TYPES.find(t => t.value === step.type);
                    const selectedPoints = prayerPoints.filter(p => (step.prayer_point_ids || []).includes(p.id));
                    
                    return (
                      <Card key={step.id} className="shadow-sm">
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{index + 1}</Badge>
                                <span className="font-medium">{stepType?.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({Math.floor(step.duration / 60)}:{String(step.duration % 60).padStart(2, '0')})
                                </span>
                              </div>
                              {selectedPoints.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {selectedPoints.map(p => p.title).join(', ')}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={steps.length === 0}>
              {editingGuideline ? 'Update Guideline' : 'Create Guideline'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGuideline;

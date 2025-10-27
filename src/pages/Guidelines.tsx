import { useEffect, useState } from "react";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { STORAGE_KEYS, getFromStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookMarked, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Guideline {
  id: string;
  title: string;
  week_number: number;
  content: string;
  date_uploaded: string;
}

const Guidelines = () => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const formatGuidelineDate = (dateUploaded: string) => {
    const date = new Date(dateUploaded);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchGuidelines = async () => {
    // Prototype mode: Fetch from localStorage
    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const sortedGuidelines = guidelines.sort((a: any, b: any) => a.week_number - b.week_number);
    setGuidelines(sortedGuidelines);
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("guidelines")
    //   .select("*")
    //   .order("week_number", { ascending: true });
    //
    // if (error) {
    //   console.error("Error fetching guidelines:", error);
    //   toast.error("Failed to load guidelines");
    // } else {
    //   setGuidelines(data || []);
    // }
    // setLoading(false);
  };

  // Group guidelines by week and day
  const groupedByWeek = guidelines.reduce((acc, guideline: any) => {
    const week = guideline.week_number;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(guideline);
    return acc;
  }, {} as Record<number, any[]>);

  const weeks = Object.keys(groupedByWeek).map(Number).sort((a, b) => a - b);

  // Day order for proper sorting
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Sort days within each week
  Object.keys(groupedByWeek).forEach(weekKey => {
    groupedByWeek[parseInt(weekKey)].sort((a, b) => {
      return dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
    });
  });

  // Get current date info for access control
  const now = new Date();
  const currentWeek = Math.ceil((now.getDate()) / 7);
  const currentDayName = dayOrder[now.getDay()];
  
  // Function to check if a guideline is accessible
  const getAccessStatus = (guideline: any): 'locked' | 'current' | 'past' => {
    const guidelineWeek = guideline.week_number;
    const guidelineDay = guideline.day_of_week || guideline.day;
    
    // Check week status
    if (guidelineWeek > currentWeek) return 'locked';
    if (guidelineWeek < currentWeek) return 'past';
    
    // Same week - check day
    if (guidelineDay === currentDayName) return 'current';
    if (dayOrder.indexOf(guidelineDay) > dayOrder.indexOf(currentDayName)) return 'locked';
    return 'past';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Dashboard</TooltipContent>
          </Tooltip>

        <div className="flex items-center gap-3 mb-2">
          <BookMarked className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            Prayer Guidelines
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Weekly prayer instructions to guide your spiritual journey
        </p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading guidelines...</p>
          </div>
        ) : guidelines.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No guidelines available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {weeks.map((weekNum) => {
              const weekGuidelines = groupedByWeek[weekNum];
              const isExpanded = expandedWeek === weekNum;
              const firstGuideline = weekGuidelines[0];
              
              return (
                <Card key={weekNum} className="shadow-medium">
                  <CardHeader 
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Week {weekNum}</Badge>
                        <CardTitle className="text-xl">
                          Week {weekNum} Prayer Journey
                        </CardTitle>
                      </div>
                      <Calendar className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {weekGuidelines.length} days • {formatGuidelineDate(firstGuideline?.date_uploaded)}
                    </p>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="border-t pt-4">
                      <div className="space-y-3">
                        {weekGuidelines.map((guideline: any) => {
                          const accessStatus = getAccessStatus(guideline);
                          const isLocked = accessStatus === 'locked';
                          
                          return (
                            <Card key={guideline.id} className="shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {guideline.day_of_week}
                                      </Badge>
                                      <h4 className="font-medium text-sm">
                                        {guideline.title?.replace(`Week ${weekNum} - ${guideline.day_of_week}: `, '') || guideline.day_of_week}
                                      </h4>
                                      {isLocked && (
                                        <Badge variant="secondary" className="text-xs">
                                          🔒 Locked
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {guideline.steps?.length || 0} steps
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {!isLocked && (
                                      <Button 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/guided-session/${guideline.id}`);
                                        }}
                                      >
                                        <span className="md:hidden">Start</span>
                                        <span className="hidden md:inline">Start Prayer</span>
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm"
                                      variant="outline" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/guideline/${guideline.id}`);
                                      }}
                                    >
                                      <BookMarked className="h-4 w-4 md:mr-2" />
                                      <span className="hidden md:inline">Tracker</span>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default Guidelines;

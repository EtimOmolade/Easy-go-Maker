import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  month: string;
  day: number;
  day_of_week: string;
  content: string;
  date_uploaded: string;
  steps?: any[];
}

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    try {
      const { data, error } = await supabase
        .from("guidelines")
        .select("*")
        .order("month", { ascending: true })
        .order("day", { ascending: true });

      if (error) throw error;
      
      setGuidelines((data as any[]) || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching guidelines:", error);
      toast.error("Failed to load guidelines");
      setLoading(false);
    }
  };

  // Group guidelines by month
  const groupedByMonth = guidelines.reduce((acc, guideline: any) => {
    const month = guideline.month || 'Unknown';
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(guideline);
    return acc;
  }, {} as Record<string, any[]>);

  const monthsOrder = ['June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const months = monthsOrder.filter(m => groupedByMonth[m] && groupedByMonth[m].length > 0);
  
  // Sort days within each month
  Object.keys(groupedByMonth).forEach(monthKey => {
    groupedByMonth[monthKey].sort((a, b) => a.day - b.day);
  });

  // Get current date info for access control
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-11
  const currentMonthName = monthsOrder[currentMonthIndex] || '';
  const currentDay = now.getDate();
  const currentDayName = dayOrder[now.getDay()];
  
  // Function to check if a guideline is accessible
  const getAccessStatus = (guideline: any): 'locked' | 'current' | 'past' => {
    const guidelineMonthIndex = monthsOrder.indexOf(guideline.month);
    const guidelineDay = guideline.day;
    
    // Check month status
    if (guidelineMonthIndex > currentMonthIndex) return 'locked';
    if (guidelineMonthIndex < currentMonthIndex) return 'past';
    
    // Same month - check day
    if (guidelineDay === currentDay) return 'current';
    if (guidelineDay > currentDay) return 'locked';
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
            {months.map((monthName) => {
              const monthGuidelines = groupedByMonth[monthName];
              const isExpanded = expandedWeek === monthsOrder.indexOf(monthName);
              
              return (
                <Card key={monthName} className="shadow-medium">
                  <CardHeader 
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setExpandedWeek(isExpanded ? null : monthsOrder.indexOf(monthName))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{monthName}</Badge>
                        <CardTitle className="text-xl">
                          {monthName} 2025 Prayers
                        </CardTitle>
                      </div>
                      <Calendar className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {monthGuidelines.length} days
                    </p>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="border-t pt-4">
                      <div className="space-y-3">
                        {monthGuidelines.map((guideline: any) => {
                          const accessStatus = getAccessStatus(guideline);
                          const isLocked = accessStatus === 'locked';
                          
                          return (
                            <Card key={guideline.id} className="shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {monthName} {guideline.day} - {guideline.day_of_week}
                                      </Badge>
                                      {isLocked && (
                                        <Badge variant="secondary" className="text-xs">
                                          🔒 Locked
                                        </Badge>
                                      )}
                                    </div>
                                    <h4 className="font-medium text-sm">
                                      {guideline.title}
                                    </h4>
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

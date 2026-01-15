import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookMarked, Calendar, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import {
  cacheGuidelinesList,
  getCachedGuidelinesList,
} from "@/utils/offlineStorage";

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
      // Try cache first for offline support
      const cached = await getCachedGuidelinesList();
      if (cached && cached.length > 0) {
        console.log(`📦 Using ${cached.length} cached guidelines`);
        setGuidelines(cached);
        setLoading(false);
      }

      // Fetch fresh data from network
      const { data, error } = await supabase
        .from("guidelines")
        .select("*")
        .order("month", { ascending: true })
        .order("day", { ascending: true });

      if (error) {
        // Only show error if we don't have cached data
        if (!cached || cached.length === 0) {
          throw error;
        }
      } else {
        // Cache the fresh data
        if (data && data.length > 0) {
          await cacheGuidelinesList(data);
        }

        setGuidelines((data as any[]) || []);
        setLoading(false);
      }
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

  const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const months = monthsOrder.filter(m => groupedByMonth[m] && groupedByMonth[m].length > 0);

  // Sort days within each month
  Object.keys(groupedByMonth).forEach(monthKey => {
    groupedByMonth[monthKey].sort((a, b) => a.day - b.day);
  });

  // Helper function to get the year for a given month from the guidelines data
  const getYearForMonth = (monthName: string): number => {
    const monthGuidelines = groupedByMonth[monthName];
    if (monthGuidelines && monthGuidelines.length > 0) {
      // Get the year from the first guideline's date_uploaded field
      const firstGuideline = monthGuidelines[0];
      if (firstGuideline.date_uploaded) {
        const date = new Date(firstGuideline.date_uploaded);
        return date.getFullYear();
      }
    }
    // Fallback to current year if no date_uploaded found
    return new Date().getFullYear();
  };

  // Get current date info for access control
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-11
  const currentMonthName = monthsOrder[currentMonthIndex] || '';
  const currentDay = now.getDate();
  const currentDayName = dayOrder[now.getDay()];

  // Function to check if a guideline is accessible
  const getAccessStatus = (guideline: any): 'locked' | 'current' | 'past' => {
    const guidelineYear = getYearForMonth(guideline.month);
    const currentYear = now.getFullYear();
    const guidelineMonthIndex = monthsOrder.indexOf(guideline.month);
    const guidelineDay = guideline.day;

    // Check year status
    if (guidelineYear > currentYear) return 'locked';
    if (guidelineYear < currentYear) return 'past';

    // Same year - check month status
    if (guidelineMonthIndex > currentMonthIndex) return 'locked';
    if (guidelineMonthIndex < currentMonthIndex) return 'past';

    // Same year, same month - check day
    if (guidelineDay === currentDay) return 'current';
    if (guidelineDay > currentDay) return 'locked';
    return 'past';
  };

  return (
    <TooltipProvider>
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

        <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8">
          <AppHeader showBack={true} backTo="/dashboard" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <BookMarked className="h-8 w-8 text-secondary" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white drop-shadow-lg">
                Prayer Guidelines
              </h1>
            </div>
            <p className="text-white/90 drop-shadow">
              Weekly prayer instructions to guide your spiritual journey
            </p>
          </motion.div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-white/80">Loading guidelines...</p>
            </motion.div>
          ) : guidelines.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="shadow-large glass border-white/20">
                <CardContent className="py-12 text-center">
                  <p className="text-white/80">No guidelines available yet. Check back soon!</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {months.map((monthName, index) => {
                const monthGuidelines = groupedByMonth[monthName];
                const isExpanded = expandedWeek === monthsOrder.indexOf(monthName);

                return (
                  <motion.div
                    key={monthName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="shadow-large glass border-white/20 overflow-hidden">
                      <CardHeader
                        className="cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setExpandedWeek(isExpanded ? null : monthsOrder.indexOf(monthName))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-gradient-secondary text-white border-0">
                              {monthName}
                            </Badge>
                            <CardTitle className="text-lg md:text-xl text-white">
                              {monthName} {getYearForMonth(monthName)} Prayers
                            </CardTitle>
                          </div>
                          <Calendar className={`h-5 w-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <p className="text-sm text-white/70 mt-2">
                          {monthGuidelines.length} day{monthGuidelines.length !== 1 ? 's' : ''}
                        </p>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="border-t border-white/10 pt-4">
                          <div className="space-y-3">
                            {monthGuidelines.map((guideline: any, guidelineIndex: number) => {
                              const accessStatus = getAccessStatus(guideline);
                              const isLocked = accessStatus === 'locked';

                              return (
                                <motion.div
                                  key={guideline.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: guidelineIndex * 0.05 }}
                                >
                                  <Card className="shadow-medium bg-card/90 border-border/30">
                                    <CardContent className="p-3 md:p-4">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                                              {monthName} {guideline.day}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                              {guideline.day_of_week}
                                            </Badge>
                                            {isLocked && (
                                              <Badge variant="secondary" className="text-xs">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Locked
                                              </Badge>
                                            )}
                                          </div>
                                          <h4 className="font-medium text-sm md:text-base truncate text-foreground">
                                            {guideline.title}
                                          </h4>
                                          <p className="text-xs text-muted-foreground">
                                            {guideline.steps?.length || 0} step{guideline.steps?.length !== 1 ? 's' : ''}
                                          </p>
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-center">
                                          {!isLocked && (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/guided-session/${guideline.id}`);
                                              }}
                                              className="bg-gradient-primary text-primary dark:text-white"
                                            >
                                              <span className="text-xs md:text-sm">Start</span>
                                            </Button>
                                          )}
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigate(`/guideline/${guideline.id}`);
                                                }}
                                              >
                                                <BookMarked className="h-4 w-4" />
                                                <span className="hidden md:inline ml-2 text-xs md:text-sm">Tracker</span>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View prayer tracker</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Guidelines;

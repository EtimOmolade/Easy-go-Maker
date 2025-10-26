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
    const sortedGuidelines = guidelines.sort((a: any, b: any) => b.week_number - a.week_number);
    setGuidelines(sortedGuidelines);
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("guidelines")
    //   .select("*")
    //   .order("week_number", { ascending: false });
    //
    // if (error) {
    //   console.error("Error fetching guidelines:", error);
    //   toast.error("Failed to load guidelines");
    // } else {
    //   setGuidelines(data || []);
    // }
    // setLoading(false);
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
          <div className="space-y-6">
            {guidelines.map((guideline) => (
              <Card key={guideline.id} className="shadow-medium hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        Week {guideline.week_number} - {formatGuidelineDate(guideline.date_uploaded)}
                      </Badge>
                      <CardTitle className="text-2xl">{guideline.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Posted {new Date(guideline.date_uploaded).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3">
                    {guideline.content}
                  </p>
                  <div className="flex gap-2 flex-col md:flex-row">
                    <Button variant="outline" onClick={() => navigate(`/guideline/${guideline.id}`)}>
                      <Calendar className="mr-2 h-4 w-4 hidden md:inline" />
                      <span className="md:hidden">Tracker</span>
                      <span className="hidden md:inline">Daily Tracker</span>
                    </Button>
                    <Button onClick={() => navigate(`/guided-session/${guideline.id}`)}>
                      <Calendar className="mr-2 h-4 w-4 hidden md:inline" />
                      <span className="md:hidden">Start</span>
                      <span className="hidden md:inline">Start Guided Prayer</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default Guidelines;

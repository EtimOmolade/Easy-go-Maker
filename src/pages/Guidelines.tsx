import { useEffect, useState } from "react";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { STORAGE_KEYS, getFromStorage, MockGuideline } from "@/data/mockData";

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

  const fetchGuidelines = async () => {
    // Get guidelines from localStorage
    const guidelinesData = getFromStorage<MockGuideline[]>(STORAGE_KEYS.GUIDELINES, []);
    // Sort by week number descending
    const sorted = [...guidelinesData].sort((a, b) => b.week_number - a.week_number);
    setGuidelines(sorted as Guideline[]);
    setLoading(false);

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { data, error } = await supabase
      .from("guidelines")
      .select("*")
      .order("week_number", { ascending: false });

    if (error) {
      console.error("Error fetching guidelines:", error);
    } else {
      setGuidelines(data || []);
    }
    setLoading(false);
    */
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-2">
          Prayer Guidelines
        </h1>
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
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Week {guideline.week_number}
                      </Badge>
                      <CardTitle className="text-2xl">{guideline.title}</CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(guideline.date_uploaded).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {guideline.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Guidelines;

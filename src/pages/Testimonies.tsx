import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Testimony {
  id: string;
  title: string;
  content: string;
  date: string;
  profiles: {
    name: string;
  };
}

const Testimonies = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    const { data, error } = await supabase
      .from("testimonies")
      .select("id, title, content, date, profiles(name)")
      .eq("approved", true)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching testimonies:", error);
    } else {
      setTestimonies(data || []);
    }
    setLoading(false);
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

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            Testimonies
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Stories of answered prayers and faith journeys from our community
        </p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading testimonies...</p>
          </div>
        ) : testimonies.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No testimonies yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {testimonies.map((testimony) => (
              <Card key={testimony.id} className="shadow-medium hover:shadow-glow transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">{testimony.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">{testimony.profiles?.name}</span>
                    <span>•</span>
                    <span>{new Date(testimony.date).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {testimony.content}
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

export default Testimonies;

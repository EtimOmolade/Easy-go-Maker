import { useEffect, useState } from "react";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS, getFromStorage, MockTestimony } from "@/data/mockData";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null);
  const navigate = useNavigate();

  const filteredTestimonies = testimonies.filter(testimony =>
    testimony.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimony.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    // Get approved testimonies from localStorage
    const allTestimonies = getFromStorage<MockTestimony[]>(STORAGE_KEYS.TESTIMONIES, []);
    const approved = allTestimonies
      .filter(t => t.approved)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTestimonies(approved as Testimony[]);
    setLoading(false);

    // Backend integration: Uncomment when restoring Supabase
    /*
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
    */
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Dashboard</TooltipContent>
          </Tooltip>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            Testimonies
          </h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Stories of answered prayers and faith journeys from our community
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search testimonies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
        ) : filteredTestimonies.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No testimonies found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredTestimonies.map((testimony) => (
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
                  <p className="text-foreground/90 leading-relaxed mb-4">
                    {testimony.content.substring(0, 70)}
                    {testimony.content.length > 70 && '...'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTestimony(testimony)}
                  >
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Read More Modal */}
        <Dialog open={!!selectedTestimony} onOpenChange={() => setSelectedTestimony(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl pr-8">{selectedTestimony?.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <span className="font-medium">{selectedTestimony?.profiles?.name}</span>
                <span>•</span>
                <span>{selectedTestimony && new Date(selectedTestimony.date).toLocaleDateString()}</span>
              </div>
            </DialogHeader>
            <div className="mt-4 overflow-hidden">
              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed break-words overflow-wrap-anywhere">
                {selectedTestimony?.content}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default Testimonies;

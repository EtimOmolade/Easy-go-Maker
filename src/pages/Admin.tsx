import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Check, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Testimony {
  id: string;
  title: string;
  content: string;
  date: string;
  approved: boolean;
  profiles: {
    name: string;
  };
}

const Admin = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    const { data, error } = await supabase
      .from("testimonies")
      .select("id, title, content, date, approved, profiles(name)")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching testimonies:", error);
    } else {
      setTestimonies(data || []);
    }
  };

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("guidelines")
        .insert({
          title,
          week_number: parseInt(weekNumber),
          content,
        });

      if (error) throw error;

      toast.success("Guideline created successfully");
      setTitle("");
      setWeekNumber("");
      setContent("");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleApproveTestimony = async (id: string, approved: boolean) => {
    const { error } = await supabase
      .from("testimonies")
      .update({ approved })
      .eq("id", id);

    if (error) {
      toast.error("Error updating testimony");
    } else {
      toast.success(approved ? "Testimony approved" : "Testimony rejected");
      fetchTestimonies();
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;

    const { error } = await supabase
      .from("testimonies")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting testimony");
    } else {
      toast.success("Testimony deleted");
      fetchTestimonies();
    }
  };

  const pendingTestimonies = testimonies.filter((t) => !t.approved);
  const approvedTestimonies = testimonies.filter((t) => t.approved);

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-8">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="guidelines" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guidelines">Prayer Guidelines</TabsTrigger>
            <TabsTrigger value="testimonies">
              Testimonies
              {pendingTestimonies.length > 0 && (
                <span className="ml-2 bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
                  {pendingTestimonies.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guidelines">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upload Prayer Guidelines</CardTitle>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Guideline
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Prayer Guideline</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateGuideline} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Prayers for Peace"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="week">Week Number</Label>
                          <Input
                            id="week"
                            type="number"
                            value={weekNumber}
                            onChange={(e) => setWeekNumber(e.target.value)}
                            placeholder="1"
                            required
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter the prayer guideline content..."
                            rows={12}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Create Guideline
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create and manage weekly prayer guidelines for the community.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonies">
            <div className="space-y-6">
              {/* Pending Testimonies */}
              {pendingTestimonies.length > 0 && (
                <Card className="shadow-medium border-2 border-accent/20">
                  <CardHeader>
                    <CardTitle>Pending Approval ({pendingTestimonies.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingTestimonies.map((testimony) => (
                      <Card key={testimony.id} className="bg-muted/50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTestimony(testimony.id, true)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTestimony(testimony.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm">{testimony.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Approved Testimonies */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Approved Testimonies ({approvedTestimonies.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvedTestimonies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No approved testimonies yet
                    </p>
                  ) : (
                    approvedTestimonies.map((testimony) => (
                      <Card key={testimony.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTestimony(testimony.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm">{testimony.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

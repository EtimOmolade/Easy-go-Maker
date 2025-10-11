import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Check, X, Trash2, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface EncouragementMessage {
  id: string;
  content: string;
  created_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [encouragementMessages, setEncouragementMessages] = useState<EncouragementMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEncouragementDialogOpen, setIsEncouragementDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [content, setContent] = useState("");
  const [encouragementContent, setEncouragementContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonies();
    fetchEncouragementMessages();
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

  const fetchEncouragementMessages = async () => {
    const { data, error } = await supabase
      .from("encouragement_messages" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setEncouragementMessages(data as unknown as EncouragementMessage[]);
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

  const handleCreateEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase
        .from("encouragement_messages" as any)
        .insert({
          content: encouragementContent,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Encouragement message posted! It will be visible for 24 hours.");
      setEncouragementContent("");
      setIsEncouragementDialogOpen(false);
      fetchEncouragementMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteEncouragement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this encouragement message?")) return;

    const { error } = await supabase
      .from("encouragement_messages" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting message");
    } else {
      toast.success("Message deleted");
      fetchEncouragementMessages();
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
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
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

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-8">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="guidelines" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guidelines">Prayer Guidelines</TabsTrigger>
            <TabsTrigger value="encouragement">Daily Encouragement</TabsTrigger>
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

          <TabsContent value="encouragement">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-6 w-6 text-accent" />
                      Daily Encouragement Messages
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Post encouragement messages that will be visible to all users for 24 hours
                    </p>
                  </div>
                  <Dialog open={isEncouragementDialogOpen} onOpenChange={setIsEncouragementDialogOpen}>
                    <DialogTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Message
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Post a new encouragement message</TooltipContent>
                      </Tooltip>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Post Encouragement Message</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateEncouragement} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="encouragement">Message</Label>
                          <Textarea
                            id="encouragement"
                            value={encouragementContent}
                            onChange={(e) => setEncouragementContent(e.target.value)}
                            placeholder="Write an encouraging message or teaching for the community..."
                            rows={8}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            This message will be visible to all users for 24 hours from posting
                          </p>
                        </div>
                        <Button type="submit" className="w-full">
                          Post Message
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {encouragementMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No encouragement messages yet. Post one to inspire the community!
                  </p>
                ) : (
                  encouragementMessages.map((message) => (
                    <Card key={message.id} className="bg-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4">
                          <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEncouragement(message.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Posted {new Date(message.created_at).toLocaleDateString()} at {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
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
    </TooltipProvider>
  );
};

export default Admin;

import { useEffect, useState } from "react";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORAGE_KEYS, getFromStorage, setToStorage, MockTestimony, MockGuideline, MockEncouragementMessage, MockUser, createNotification, mockUsers, checkPendingTestimonies } from "@/data/mockData";

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
  const [editingGuideline, setEditingGuideline] = useState<MockGuideline | null>(null);
  const [guidelines, setGuidelines] = useState<MockGuideline[]>([]);
  const [encouragementContent, setEncouragementContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonies();
    fetchEncouragementMessages();
    fetchGuidelines();
    checkPendingTestimonies(); // Check for pending testimonies on load
  }, []);

  const fetchGuidelines = () => {
    const allGuidelines = getFromStorage<MockGuideline[]>(STORAGE_KEYS.GUIDELINES, []);
    const sorted = [...allGuidelines].sort((a, b) => b.week_number - a.week_number);
    setGuidelines(sorted);
  };

  const fetchTestimonies = async () => {
    const allTestimonies = getFromStorage<MockTestimony[]>(STORAGE_KEYS.TESTIMONIES, []);
    const sorted = [...allTestimonies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTestimonies(sorted as Testimony[]);
  };

  const fetchEncouragementMessages = async () => {
    const messages = getFromStorage<MockEncouragementMessage[]>(STORAGE_KEYS.ENCOURAGEMENT, []);
    const sorted = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEncouragementMessages(sorted.slice(0, 10) as EncouragementMessage[]);
  };

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();

    const guidelines = getFromStorage<MockGuideline[]>(STORAGE_KEYS.GUIDELINES, []);
    
    if (editingGuideline) {
      // Update existing guideline
      const updated = guidelines.map(g => 
        g.id === editingGuideline.id 
          ? { ...g, title, week_number: parseInt(weekNumber), content }
          : g
      );
      setToStorage(STORAGE_KEYS.GUIDELINES, updated);
      toast.success("Guideline updated successfully");
    } else {
      // Create new guideline
      const newGuideline: MockGuideline = {
        id: String(Date.now()),
        title,
        week_number: parseInt(weekNumber),
        content,
        date_uploaded: new Date().toISOString()
      };
      guidelines.push(newGuideline);
      setToStorage(STORAGE_KEYS.GUIDELINES, guidelines);
      
      // Notify all users about new guideline
      const users = mockUsers.filter(u => !u.isAdmin);
      users.forEach(u => {
        createNotification(
          'guideline',
          'New Prayer Guideline',
          '📖 A new prayer guideline has been added.',
          u.id,
          newGuideline.id,
          '📋'
        );
      });
      
      toast.success("📖 Guideline created! All users have been notified.");
      console.log('(Push placeholder) New guideline broadcast to all users');
    }

    setTitle("");
    setWeekNumber("");
    setContent("");
    setEditingGuideline(null);
    setIsDialogOpen(false);
    fetchGuidelines();
  };

  const handleEditGuideline = (guideline: MockGuideline) => {
    setEditingGuideline(guideline);
    setTitle(guideline.title);
    setWeekNumber(String(guideline.week_number));
    setContent(guideline.content);
    setIsDialogOpen(true);
  };

  const handleDeleteGuideline = (id: string) => {
    if (!confirm("Are you sure you want to delete this guideline?")) return;
    
    const guidelines = getFromStorage<MockGuideline[]>(STORAGE_KEYS.GUIDELINES, []);
    const updated = guidelines.filter(g => g.id !== id);
    setToStorage(STORAGE_KEYS.GUIDELINES, updated);
    
    toast.success("Guideline deleted");
    fetchGuidelines();
  };

  const handleCreateEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const messages = getFromStorage<MockEncouragementMessage[]>(STORAGE_KEYS.ENCOURAGEMENT, []);
    const newMessage: MockEncouragementMessage = {
      id: String(Date.now()),
      content: encouragementContent,
      created_at: new Date().toISOString(),
      created_by: user.id
    };
    messages.push(newMessage);
    setToStorage(STORAGE_KEYS.ENCOURAGEMENT, messages);
    
    // Create notifications for all users
    const users = mockUsers.filter(u => !u.isAdmin);
    users.forEach(u => {
      createNotification(
        'encouragement',
        'New Daily Encouragement',
        '✨ New daily encouragement available! Check your dashboard.',
        u.id,
        newMessage.id,
        '💬'
      );
    });
    
    toast.success("✨ New daily encouragement posted! All users have been notified.");
    
    // Simulate push notification placeholder
    console.log('(Push placeholder) New encouragement message broadcast to all users');
    
    setEncouragementContent("");
    setIsEncouragementDialogOpen(false);
    fetchEncouragementMessages();
  };

  const handleDeleteEncouragement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this encouragement message?")) return;

    const messages = getFromStorage<MockEncouragementMessage[]>(STORAGE_KEYS.ENCOURAGEMENT, []);
    const updated = messages.filter(m => m.id !== id);
    setToStorage(STORAGE_KEYS.ENCOURAGEMENT, updated);

    toast.success("Message deleted");
    fetchEncouragementMessages();
  };

  const handleApproveTestimony = async (id: string, approved: boolean) => {
    const testimonies = getFromStorage<MockTestimony[]>(STORAGE_KEYS.TESTIMONIES, []);
    const testimony = testimonies.find(t => t.id === id);
    const updated = testimonies.map(t => t.id === id ? { ...t, approved } : t);
    setToStorage(STORAGE_KEYS.TESTIMONIES, updated);

    if (approved && testimony) {
      // Notify all users about new approved testimony
      const users = mockUsers.filter(u => !u.isAdmin);
      users.forEach(u => {
        createNotification(
          'testimony',
          'New Testimony Shared',
          '✨ A new testimony has just been shared.',
          u.id,
          testimony.id,
          '✨'
        );
      });
      
      // Remove admin notification about pending testimony
      const adminUsers = mockUsers.filter(u => u.isAdmin);
      adminUsers.forEach(admin => {
        const notifications = getFromStorage('notifications', []);
        const filtered = notifications.filter(n => 
          !(n.type === 'testimony' && n.relatedId === id && n.userId === admin.id && n.message.includes('pending'))
        );
        setToStorage('notifications', filtered);
      });
      
      toast.success("✨ Testimony approved! All users have been notified.");
      console.log('(Push placeholder) New testimony broadcast to all users');
    } else {
      toast.success("Testimony rejected");
    }
    
    fetchTestimonies();
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;

    const testimonies = getFromStorage<MockTestimony[]>(STORAGE_KEYS.TESTIMONIES, []);
    const updated = testimonies.filter(t => t.id !== id);
    setToStorage(STORAGE_KEYS.TESTIMONIES, updated);

    toast.success("Testimony deleted");
    fetchTestimonies();
  };

  const pendingTestimonies = testimonies.filter((t) => !t.approved);
  const approvedTestimonies = testimonies.filter((t) => t.approved);

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
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
                  <CardTitle>Prayer Guidelines Management</CardTitle>
                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                      setEditingGuideline(null);
                      setTitle("");
                      setWeekNumber("");
                      setContent("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Guideline
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingGuideline ? 'Edit' : 'Create'} Prayer Guideline</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateGuideline} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Prayers for Peace" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="week">Week Number</Label>
                          <Input id="week" type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="1" required min="1" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter the prayer guideline content..." rows={12} required />
                        </div>
                        <Button type="submit" className="w-full">{editingGuideline ? 'Update' : 'Create'} Guideline</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {guidelines.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No guidelines yet. Create one to get started!</p>
                ) : (
                  guidelines.map((guideline) => (
                    <Card key={guideline.id} className="bg-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Week {guideline.week_number}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{guideline.title}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{guideline.content}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                              Uploaded {new Date(guideline.date_uploaded).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleEditGuideline(guideline)}>
                                  Edit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit guideline</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteGuideline(guideline.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete guideline</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
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
                    <p className="text-sm text-muted-foreground mt-2">Post encouragement messages that will be visible to all users for 24 hours</p>
                  </div>
                  <Dialog open={isEncouragementDialogOpen} onOpenChange={setIsEncouragementDialogOpen}>
                    <DialogTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => {
                            setEncouragementContent("");
                            setIsEncouragementDialogOpen(true);
                          }}>
                            <Plus className="mr-2 h-4 w-4" />New Message
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
                          <Textarea id="encouragement" value={encouragementContent} onChange={(e) => setEncouragementContent(e.target.value)} placeholder="Write an encouraging message or teaching for the community..." rows={8} required />
                          <p className="text-xs text-muted-foreground">This message will be visible to all users for 24 hours from posting</p>
                        </div>
                        <Button type="submit" className="w-full">Post Message</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {encouragementMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No encouragement messages yet. Post one to inspire the community!</p>
                ) : (
                  encouragementMessages.map((message) => (
                    <Card key={message.id} className="bg-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4">
                          <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteEncouragement(message.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Posted {new Date(message.created_at).toLocaleDateString()} at {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonies">
            <div className="space-y-6">
              {pendingTestimonies.length > 0 && (
                <Card className="shadow-medium border-2 border-accent/20">
                  <CardHeader><CardTitle>Pending Approval ({pendingTestimonies.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {pendingTestimonies.map((testimony) => (
                      <Card key={testimony.id} className="bg-muted/50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 overflow-hidden">
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button size="sm" onClick={() => handleApproveTestimony(testimony.id, true)}><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteTestimony(testimony.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap text-sm break-words">{testimony.content}</p></CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-medium">
                <CardHeader><CardTitle>Approved Testimonies ({approvedTestimonies.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {approvedTestimonies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No approved testimonies yet</p>
                  ) : (
                    approvedTestimonies.map((testimony) => (
                      <Card key={testimony.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 overflow-hidden">
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteTestimony(testimony.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap text-sm break-words">{testimony.content}</p></CardContent>
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

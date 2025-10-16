import { useEffect, useState } from "react";
// Backend integration placeholder - Supabase commented out for prototype
// import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Share2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORAGE_KEYS, getFromStorage, setToStorage, MockJournalEntry, MockTestimony, createNotification, checkPendingTestimonies } from "@/data/mockData";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
  is_answered: boolean;
  is_shared: boolean;
  testimony_text?: string;
}

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingEntry, setSharingEntry] = useState<JournalEntry | null>(null);
  const [testimonyText, setTestimonyText] = useState("God has answered my prayer");
  const [isTestimonyDialogOpen, setIsTestimonyDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    // Get entries from localStorage
    const allEntries = getFromStorage<MockJournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
    const userEntries = allEntries.filter(entry => entry.user_id === user.id);
    setEntries(userEntries);
    setLoading(false);

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
    */
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const allEntries = getFromStorage<MockJournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
      
      if (editingEntry) {
        // Update existing entry
        const updatedEntries = allEntries.map(entry =>
          entry.id === editingEntry.id
            ? { ...entry, title, content }
            : entry
        );
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updatedEntries);
        toast.success("Entry updated successfully");
      } else {
        // Create new entry
        const now = new Date().toISOString();
        const newEntry: MockJournalEntry = {
          id: String(Date.now()),
          user_id: user.id,
          title,
          content,
          date: now.split('T')[0],
          created_at: now,
          is_answered: false,
          is_shared: false
        };
        allEntries.push(newEntry);
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
        
        // Update streak
        updateStreak();
        
        toast.success("📝 Your new journal entry has been saved!");
        
        // Simulate push notification placeholder
        console.log('(Push placeholder) New journal entry added. Streak updated!');
      }

      setTitle("");
      setContent("");
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();

      // Backend integration: Uncomment when restoring Supabase
      /*
      if (editingEntry) {
        const { error } = await supabase
          .from("journal_entries")
          .update({ title, content })
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Entry updated successfully");
      } else {
        const { error } = await supabase
          .from("journal_entries")
          .insert({ user_id: user.id, title, content });

        if (error) throw error;
        toast.success("Entry created successfully");
      }
      */
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateStreak = () => {
    if (!user) return;
    
    const profiles = getFromStorage<any[]>(STORAGE_KEYS.PROFILES, []);
    const today = new Date().toISOString().split('T')[0];
    
    const updatedProfiles = profiles.map(profile => {
      if (profile.id === user.id) {
        const lastDate = profile.last_journal_date;
        let newStreak = profile.streak_count;
        
        if (!lastDate || lastDate < today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastDate === yesterdayStr) {
            newStreak += 1;
          } else if (lastDate < yesterdayStr) {
            newStreak = 1;
          }
          
          return {
            ...profile,
            streak_count: newStreak,
            last_journal_date: today
          };
        }
      }
      return profile;
    });
    
    setToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const allEntries = getFromStorage<MockJournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
    const updatedEntries = allEntries.filter(entry => entry.id !== id);
    setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updatedEntries);
    
    toast.success("Entry deleted");
    fetchEntries();

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting entry");
    } else {
      toast.success("Entry deleted");
      fetchEntries();
    }
    */
  };

  const toggleAnswered = async (entry: JournalEntry) => {
    const allEntries = getFromStorage<MockJournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
    const updatedEntries = allEntries.map(e =>
      e.id === entry.id
        ? { ...e, is_answered: !e.is_answered }
        : e
    );
    setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updatedEntries);
    
    toast.success(entry.is_answered ? "Marked as unanswered" : "Marked as answered!");
    fetchEntries();

    // Backend integration: Uncomment when restoring Supabase
    /*
    const { error } = await supabase
      .from("journal_entries")
      .update({ is_answered: !entry.is_answered })
      .eq("id", entry.id);

    if (error) {
      toast.error("Error updating entry");
    } else {
      toast.success(entry.is_answered ? "Marked as unanswered" : "Marked as answered!");
      fetchEntries();
    }
    */
  };

  const openTestimonyDialog = (entry: JournalEntry) => {
    setSharingEntry(entry);
    setTestimonyText(entry.testimony_text || "God has answered my prayer");
    setIsTestimonyDialogOpen(true);
  };

  const shareAsTestimony = async () => {
    if (!user || !sharingEntry) return;

    try {
      const fullTestimonyContent = `${testimonyText}\n\n${sharingEntry.content}`;
      
      // Get profiles to get user name
      const profiles = getFromStorage<any[]>(STORAGE_KEYS.PROFILES, []);
      const userProfile = profiles.find(p => p.id === user.id);
      
      // Add to testimonies
      const testimonies = getFromStorage<MockTestimony[]>(STORAGE_KEYS.TESTIMONIES, []);
      const newTestimony: MockTestimony = {
        id: String(Date.now()),
        user_id: user.id,
        title: sharingEntry.title,
        content: fullTestimonyContent,
        date: new Date().toISOString().split('T')[0],
        approved: false,
        profiles: { name: userProfile?.name || 'User' }
      };
      testimonies.push(newTestimony);
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
      
      // Check and create admin notifications for pending testimonies
      checkPendingTestimonies();

      // Update journal entry
      const allEntries = getFromStorage<MockJournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
      const updatedEntries = allEntries.map(e =>
        e.id === sharingEntry.id
          ? { ...e, is_shared: true, testimony_text: testimonyText }
          : e
      );
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updatedEntries);

      toast.success("Shared as testimony! Awaiting admin approval.");
      setIsTestimonyDialogOpen(false);
      setSharingEntry(null);
      setTestimonyText("God has answered my prayer");
      fetchEntries();

      // Backend integration: Uncomment when restoring Supabase
      /*
      const { error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          title: sharingEntry.title,
          content: fullTestimonyContent,
        });

      if (error) throw error;

      await supabase
        .from("journal_entries")
        .update({ 
          is_shared: true,
          testimony_text: testimonyText
        })
        .eq("id", sharingEntry.id);

      toast.success("Shared as testimony! Awaiting admin approval.");
      setIsTestimonyDialogOpen(false);
      setSharingEntry(null);
      setTestimonyText("God has answered my prayer");
      fetchEntries();
      */
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </TooltipTrigger>
              <TooltipContent>Return to Dashboard</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => { 
                      setEditingEntry(null); 
                      setTitle(""); 
                      setContent(""); 
                      setIsDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create a new journal entry</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Prayer request or topic"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your prayer, reflection, or thoughts..."
                    rows={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingEntry ? "Update Entry" : "Create Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-2">
          My Prayer Journal
        </h1>
        <p className="text-muted-foreground mb-4">
          Your private space for prayers and reflections
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No entries yet. Start your journey!</p>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No entries found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="shadow-medium hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{entry.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={entry.is_answered ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleAnswered(entry)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {entry.is_answered ? "Mark as unanswered" : "Mark as answered"}
                        </TooltipContent>
                      </Tooltip>
                      {entry.is_answered && !entry.is_shared && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTestimonyDialog(entry)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share as testimony</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit entry</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete entry</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/90">
                    {entry.content}
                  </p>
                  {entry.is_answered && (
                    <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                      <p className="text-sm font-medium text-accent">✨ Prayer Answered</p>
                    </div>
                  )}
                  {entry.is_shared && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-primary">📢 Shared as Testimony</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Testimony Sharing Dialog */}
        <Dialog open={isTestimonyDialogOpen} onOpenChange={setIsTestimonyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share as Testimony</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testimony-text">Testimony Message</Label>
                <Textarea
                  id="testimony-text"
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  placeholder="God has answered my prayer..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This message will appear at the beginning of your testimony
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={shareAsTestimony} className="flex-1">
                  Share Testimony
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsTestimonyDialogOpen(false);
                    setSharingEntry(null);
                    setTestimonyText("God has answered my prayer");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default Journal;

import { useEffect, useState } from "react";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Share2, Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from 'jspdf';

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

    // Prototype mode: Fetch from localStorage
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const userEntries = allEntries
      .filter((entry: any) => entry.user_id === user.id && !entry.title.startsWith('[PRAYER_TRACK]'))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEntries(userEntries);
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("journal_entries")
    //   .select("*")
    //   .eq("user_id", user.id)
    //   .not("title", "like", "[PRAYER_TRACK]%")
    //   .order("date", { ascending: false });
    //
    // if (error) {
    //   console.error("Error fetching entries:", error);
    //   toast.error("Failed to load journal entries");
    // } else {
    //   setEntries(data || []);
    // }
    // setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Prototype mode: Save to localStorage
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);

      if (editingEntry) {
        // Update existing entry
        const entryIndex = allEntries.findIndex((e: any) => e.id === editingEntry.id);
        if (entryIndex !== -1) {
          allEntries[entryIndex] = { ...allEntries[entryIndex], title, content };
          setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
          toast.success("Entry updated successfully");
        }
      } else {
        // Create new entry
        const newEntry = {
          id: `entry-${Date.now()}`,
          user_id: user.id,
          title,
          content,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          is_answered: false,
          is_shared: false
        };
        allEntries.push(newEntry);
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
        toast.success("📝 Your new journal entry has been saved!");

        // Update streak count in prototype
        const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
        if (profiles[user.id]) {
          profiles[user.id].streak_count = (profiles[user.id].streak_count || 0) + 1;
          setToStorage(STORAGE_KEYS.PROFILES, profiles);
        }
      }

      setTitle("");
      setContent("");
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();

      // Backend integration - Supabase COMMENTED OUT
      // if (editingEntry) {
      //   const { error } = await supabase
      //     .from("journal_entries")
      //     .update({ title, content })
      //     .eq("id", editingEntry.id);
      //   if (error) throw error;
      //   toast.success("Entry updated successfully");
      // } else {
      //   const { error } = await supabase
      //     .from("journal_entries")
      //     .insert({ user_id: user.id, title, content });
      //   if (error) throw error;
      //   toast.success("📝 Your new journal entry has been saved!");
      // }
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Failed to save entry");
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    // Prototype mode: Delete from localStorage
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const filteredEntries = allEntries.filter((entry: any) => entry.id !== id);
    setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, filteredEntries);
    toast.success("Entry deleted");
    fetchEntries();

    // Backend integration - Supabase COMMENTED OUT
    // const { error } = await supabase
    //   .from("journal_entries")
    //   .delete()
    //   .eq("id", id);
    //
    // if (error) {
    //   console.error("Error deleting entry:", error);
    //   toast.error("Failed to delete entry");
    // } else {
    //   toast.success("Entry deleted");
    //   fetchEntries();
    // }
  };

  const toggleAnswered = async (entry: JournalEntry) => {
    // Prototype mode: Update in localStorage
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const entryIndex = allEntries.findIndex((e: any) => e.id === entry.id);
    if (entryIndex !== -1) {
      allEntries[entryIndex].is_answered = !entry.is_answered;
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
      toast.success(entry.is_answered ? "Marked as unanswered" : "Marked as answered!");
      fetchEntries();
    }

    // Backend integration - Supabase COMMENTED OUT
    // const { error } = await supabase
    //   .from("journal_entries")
    //   .update({ is_answered: !entry.is_answered })
    //   .eq("id", entry.id);
    //
    // if (error) {
    //   console.error("Error updating entry:", error);
    //   toast.error("Failed to update entry");
    // } else {
    //   toast.success(entry.is_answered ? "Marked as unanswered" : "Marked as answered!");
    //   fetchEntries();
    // }
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

      // Prototype mode: Save to localStorage
      const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
      const newTestimony = {
        id: `testimony-${Date.now()}`,
        user_id: user.id,
        title: sharingEntry.title,
        content: fullTestimonyContent,
        approved: false,
        created_at: new Date().toISOString()
      };
      testimonies.push(newTestimony);
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);

      // Mark journal entry as shared
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
      const entryIndex = allEntries.findIndex((e: any) => e.id === sharingEntry.id);
      if (entryIndex !== -1) {
        allEntries[entryIndex].is_shared = true;
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
      }

      toast.success("Shared as testimony! Awaiting admin approval.");
      setIsTestimonyDialogOpen(false);
      setSharingEntry(null);
      setTestimonyText("God has answered my prayer");
      fetchEntries();

      // Backend integration - Supabase COMMENTED OUT
      // const { error: testimonyError } = await supabase
      //   .from("testimonies")
      //   .insert({
      //     user_id: user.id,
      //     title: sharingEntry.title,
      //     content: fullTestimonyContent,
      //   });
      //
      // if (testimonyError) throw testimonyError;
      //
      // const { error: updateError } = await supabase
      //   .from("journal_entries")
      //   .update({ is_shared: true })
      //   .eq("id", sharingEntry.id);
      //
      // if (updateError) throw updateError;
    } catch (error: any) {
      console.error("Error sharing testimony:", error);
      toast.error(error.message || "Failed to share testimony");
    }
  };

  const handleShareEntry = async (entry: JournalEntry) => {
    const shareData = {
      title: entry.title,
      text: entry.content
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error sharing:", error);
          // Fallback to clipboard
          handleCopyToClipboard(entry);
        }
      }
    } else {
      // Fallback to clipboard
      handleCopyToClipboard(entry);
    }
  };

  const handleCopyToClipboard = (entry: JournalEntry) => {
    const text = `${entry.title}\n\n${entry.content}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch((error) => {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    });
  };

  const handleDownloadEntry = (entry: JournalEntry) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = 20;

      // Add header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Spirit Scribe Path", margin, yPos);
      yPos += 15;

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(entry.title, maxWidth);
      doc.text(titleLines, margin, yPos);
      yPos += titleLines.length * 7 + 5;

      // Add date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date(entry.date).toLocaleDateString()}`, margin, yPos);
      yPos += 10;

      // Add content
      doc.setFontSize(12);
      const contentLines = doc.splitTextToSize(entry.content, maxWidth);
      contentLines.forEach((line: string) => {
        if (yPos > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 7;
      });

      // Save PDF
      const filename = `journal-${entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${entry.date}.pdf`;
      doc.save(filename);
      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
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
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareEntry(entry)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share entry</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadEntry(entry)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download as PDF</TooltipContent>
                      </Tooltip>
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
                  <p className="whitespace-pre-wrap text-foreground/90 break-words overflow-wrap-anywhere max-h-[150px] overflow-y-auto">
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

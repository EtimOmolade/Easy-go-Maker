import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  is_answered: boolean;
  is_shared: boolean;
}

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
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

      setTitle("");
      setContent("");
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message);
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
  };

  const toggleAnswered = async (entry: JournalEntry) => {
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
  };

  const shareAsTestimony = async (entry: JournalEntry) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          title: entry.title,
          content: entry.content,
        });

      if (error) throw error;

      await supabase
        .from("journal_entries")
        .update({ is_shared: true })
        .eq("id", entry.id);

      toast.success("Shared as testimony! Awaiting admin approval.");
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingEntry(null); setTitle(""); setContent(""); }}>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
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
        <p className="text-muted-foreground mb-8">
          Your private space for prayers and reflections
        </p>

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
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="shadow-medium hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{entry.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={entry.is_answered ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAnswered(entry)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      {!entry.is_shared && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareAsTestimony(entry)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
      </div>
    </div>
  );
};

export default Journal;

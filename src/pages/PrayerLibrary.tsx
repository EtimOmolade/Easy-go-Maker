import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PrayerPointCategory } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES: PrayerPointCategory[] = ['Kingdom Focused', 'Listening Prayer'];

interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  category: string; // Change to string instead of PrayerPointCategory
  audio_url?: string;
  created_at: string;
}

const PrayerLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PrayerPoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Kingdom Focused');
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>('Kingdom Focused');
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    fetchPrayerPoints();
  }, []);

  const fetchPrayerPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_points')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prayer points:', error);
        toast.error('Failed to load prayer library');
        return;
      }

      setPrayerPoints(data || []);
    } catch (error) {
      console.error('Error fetching prayer points:', error);
      toast.error('Failed to load prayer library');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!title || !content || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingPoint?.id) {
        // Update existing point
        const { error } = await supabase
          .from('prayer_points')
          .update({
            title,
            content,
            category,
            audio_url: audioUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPoint.id);

        if (error) throw error;
        toast.success('Prayer point updated');
      } else {
        // Create new point
        const { error } = await supabase
          .from('prayer_points')
          .insert([{
            title,
            content,
            category,
            audio_url: audioUrl || null,
            created_by: user.id
          }]);

        if (error) throw error;
        toast.success('Prayer point added to library');
      }

      await fetchPrayerPoints();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving prayer point:', error);
      toast.error(error.message || 'Failed to save prayer point');
    }
  };

  const handleEdit = (point: PrayerPoint) => {
    setEditingPoint(point);
    setTitle(point.title);
    setContent(point.content);
    setCategory(point.category);
    setAudioUrl(point.audio_url || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prayer point?')) return;

    try {
      const { error } = await supabase
        .from('prayer_points')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Prayer point deleted');
      await fetchPrayerPoints();
    } catch (error: any) {
      console.error('Error deleting prayer point:', error);
      toast.error(error.message || 'Failed to delete prayer point');
    }
  };

  const handleRegenerateListeningPrayer = async () => {
    try {
      // This feature reorganizes the order of Listening Prayers
      // Note: Supabase doesn't have order management, so we just refetch
      toast.success("Listening Prayer library refreshed");
      await fetchPrayerPoints();
    } catch (error: any) {
      console.error('Error regenerating:', error);
      toast.error('Failed to refresh prayer library');
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory('Kingdom Focused');
    setAudioUrl("");
    setEditingPoint(null);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kingdom Focused': return 'bg-primary/10 text-primary border-primary/20';
      case 'Listening Prayer': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default: return 'bg-accent/10 text-accent-foreground border-accent/20';
    }
  };

  const filteredPoints = prayerPoints.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Prayer Point Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage reusable prayer points for building guided prayer sessions
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Add Prayer Point</span>
                <span className="md:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPoint ? 'Edit Prayer Point' : 'Add New Prayer Point'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Pray for Global Missions"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content / Instructions</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Prayer instructions or scripture text..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="audioUrl">Audio URL (Optional)</Label>
                  <Input
                    id="audioUrl"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a custom audio recording for this prayer point
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPoint ? 'Update' : 'Add'} Prayer Point
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
          <TabsList className="mb-6 w-full md:w-auto flex-wrap h-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex-1 md:flex-none">
                <span className="hidden md:inline">{cat}</span>
                <span className="md:hidden">{cat.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory}>
            {filteredPoints.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No prayer points in this category yet. Click "Add Prayer Point" to create one.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {selectedCategory === 'Listening Prayer' && (
                  <div className="mb-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleRegenerateListeningPrayer}
                      className="gap-2"
                    >
                      <Shuffle className="h-4 w-4" />
                      Reorganize Content
                    </Button>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPoints.map((point) => (
                    <Card key={point.id} className="shadow-medium hover:shadow-glow transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge className={getCategoryColor(point.category)} variant="outline">
                              {point.category}
                            </Badge>
                            <CardTitle className="text-lg mt-2">{point.title}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(point)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(point.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-3">
                          {point.content}
                        </p>
                        {point.audio_url && (
                          <div className="mt-3">
                            <audio controls className="w-full h-8">
                              <source src={point.audio_url} type="audio/mpeg" />
                            </audio>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PrayerLibrary;

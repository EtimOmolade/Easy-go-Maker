import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, Download, Upload } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BulkImportDialog } from "@/components/BulkImportDialog";


export default function PrayerLibraryAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<any[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<any>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Kingdom Focus",
    month: "June",
    day: 30,
    day_of_week: "Monday",
    intercession_number: 1,
  });

  useEffect(() => {
    fetchPrayers();
  }, [selectedCategory]);

  const fetchPrayers = async () => {
    try {
      // Fetch all prayers without filtering
      const { data, error } = await supabase
        .from('prayer_library')
        .select('*')
        .order('month', { ascending: true })
        .order('day', { ascending: true })
        .order('intercession_number', { ascending: true });

      if (error) throw error;
      setPrayers(data || []);
      
      // Apply filter for display
      if (selectedCategory === 'all') {
        setFilteredPrayers(data || []);
      } else {
        setFilteredPrayers((data || []).filter(p => p.category === selectedCategory));
      }
    } catch (error: any) {
      toast.error("Failed to load prayers");
      console.error(error);
    }
  };

  const handleGenerateProverbsPlan = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proverbs-plan', {
        body: { cycleNumber: 1, userId: user.id }
      });

      if (error) throw error;

      toast.success(`Generated ${data.count} days of Proverbs reading plan`);
      fetchPrayers();
    } catch (error: any) {
      toast.error("Failed to generate Proverbs plan");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const prayerData = {
        ...formData,
        created_by: user.id,
      };

      if (isEditing && currentPrayer) {
        const { error } = await supabase
          .from('prayer_library')
          .update(prayerData)
          .eq('id', currentPrayer.id);

        if (error) throw error;
        toast.success("Prayer updated successfully");
      } else {
        const { error } = await supabase
          .from('prayer_library')
          .insert([prayerData]);

        if (error) throw error;
        toast.success("Prayer added successfully");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchPrayers();
    } catch (error: any) {
      toast.error("Failed to save prayer");
      console.error(error);
    }
  };

  const handleEdit = (prayer: any) => {
    setCurrentPrayer(prayer);
    setFormData({
      title: prayer.title,
      content: prayer.content,
      category: prayer.category,
      month: prayer.month || "June",
      day: prayer.day || 30,
      day_of_week: prayer.day_of_week || "Monday",
      intercession_number: prayer.intercession_number || 1,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prayer?")) return;

    try {
      const { error } = await supabase
        .from('prayer_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Prayer deleted successfully");
      fetchPrayers();
    } catch (error: any) {
      toast.error("Failed to delete prayer");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "Kingdom Focus",
      month: "June",
      day: 30,
      day_of_week: "Monday",
      intercession_number: 1,
    });
    setIsEditing(false);
    setCurrentPrayer(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Kingdom Focus':
        return 'bg-primary/10 text-primary';
      case 'Listening Prayer':
        return 'bg-secondary/20 text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportJSON = (category: string) => {
    try {
      const filteredPrayers = prayers.filter(p => p.category === category);
      
      const exportData = {
        prayers: filteredPrayers,
        metadata: {
          category: category,
          exported_at: new Date().toISOString(),
          total_entries: filteredPrayers.length,
          format_version: "1.0"
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prayer-library-${category.toLowerCase().replace(' ', '_')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredPrayers.length} ${category} prayers as JSON`);
    } catch (error) {
      toast.error("Failed to export prayers");
      console.error(error);
    }
  };

  const handleExportCSV = (category: string) => {
    try {
      const filteredPrayers = prayers.filter(p => p.category === category);
      
      let headers: string[];
      let rows: string[][];

      if (category === 'Kingdom Focus') {
        headers = ['ID', 'Title', 'Category', 'Month', 'Day', 'Year', 'Day of Week', 'Intercession #', 'Content'];
        rows = filteredPrayers.map(p => [
          p.id,
          `"${(p.title || '').replace(/"/g, '""')}"`,
          p.category || '',
          p.month || '',
          p.day || '',
          p.year || '',
          p.day_of_week || '',
          p.intercession_number || '',
          `"${(p.content || '').replace(/"/g, '""')}"`
        ]);
      } else {
        headers = ['ID', 'Title', 'Category', 'Day Number', 'Chapter', 'Start Verse', 'End Verse', 'Reference', 'Content'];
        rows = filteredPrayers.map(p => [
          p.id,
          `"${(p.title || '').replace(/"/g, '""')}"`,
          p.category || '',
          p.day_number || '',
          p.chapter || '',
          p.start_verse || '',
          p.end_verse || '',
          p.reference_text || '',
          `"${(p.content || '').replace(/"/g, '""')}"`
        ]);
      }

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prayer-library-${category.toLowerCase().replace(' ', '_')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredPrayers.length} ${category} prayers as CSV`);
    } catch (error) {
      toast.error("Failed to export prayers");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AppHeader title="Prayer Library Management" showBack={true} backTo="/admin" />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Prayer Library Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage Kingdom Focus prayers and Listening Prayer content
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateProverbsPlan} disabled={isGenerating} size="default">
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">{isGenerating ? 'Generating...' : 'Regenerate Proverbs'}</span>
            </Button>
            <BulkImportDialog
              open={isBulkImportOpen}
              onOpenChange={setIsBulkImportOpen}
              onImportComplete={fetchPrayers}
              userId={user?.id || ''}
              prayers={prayers}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
            />
            <Button onClick={() => setIsBulkImportOpen(true)} variant="outline" size="default">
              <Upload className="h-4 w-4" />
              <Download className="h-4 w-4 -ml-2" />
              <span className="hidden sm:inline ml-2">Import/Export</span>
              <span className="sm:hidden ml-2">Data</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="default">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Add Prayer</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{isEditing ? 'Edit Prayer' : 'Add New Prayer'}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {isEditing ? 'Update the prayer details below' : 'Enter the details for the new prayer'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kingdom Focus">Kingdom Focus</SelectItem>
                        <SelectItem value="Listening Prayer">Listening Prayer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Month</Label>
                      <Select
                        value={formData.month}
                        onValueChange={(value) => setFormData({ ...formData, month: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="June">June</SelectItem>
                          <SelectItem value="July">July</SelectItem>
                          <SelectItem value="August">August</SelectItem>
                          <SelectItem value="September">September</SelectItem>
                          <SelectItem value="October">October</SelectItem>
                          <SelectItem value="November">November</SelectItem>
                          <SelectItem value="December">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Input
                        id="day"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.day}
                        onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select
                        value={formData.day_of_week}
                        onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intercession_number">Intercession #</Label>
                      <Input
                        id="intercession_number"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.intercession_number}
                        onChange={(e) => setFormData({ ...formData, intercession_number: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      rows={6}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Update Prayer' : 'Add Prayer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">All Prayers</TabsTrigger>
            <TabsTrigger value="Kingdom Focus">Kingdom Focus</TabsTrigger>
            <TabsTrigger value="Listening Prayer">Listening Prayer</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4 mt-6">
            {filteredPrayers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No prayers found</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Prayer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPrayers.map((prayer) => (
                  <Card key={prayer.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(prayer.category)}>
                                {prayer.category}
                              </Badge>
                              {prayer.month && (
                                <Badge variant="outline">
                                  {prayer.month} {prayer.day} - {prayer.day_of_week}
                                </Badge>
                              )}
                              {prayer.intercession_number && (
                                <Badge variant="secondary">
                                  Int. {prayer.intercession_number}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl text-foreground">{prayer.title}</CardTitle>
                          </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(prayer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(prayer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {prayer.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

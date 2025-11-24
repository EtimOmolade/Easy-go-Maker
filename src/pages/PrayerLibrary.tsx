import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PrayerPointCategory } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Upload, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { AppHeader } from "@/components/AppHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CATEGORIES: PrayerPointCategory[] = ['Kingdom Focus', 'Listening Prayer'];

interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by?: string;
  audio_url?: string;
  // Kingdom Focus specific fields (read-only in UI)
  month?: string;
  day?: number;
  year?: number;
  intercession_number?: number;
  // Listening Prayer specific fields (read-only in UI)
  cycle_number?: number;
  day_number?: number;
  chapter?: number;
  start_verse?: number;
  end_verse?: number;
  reference_text?: string;
  // Other metadata
  is_used?: boolean;
  is_placeholder?: boolean;
  read_count?: number;
  week_number?: number;
  day_of_week?: string;
}

const PrayerLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PrayerPoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Kingdom Focus');

  // Bulk selection state
  const [selectedPrayers, setSelectedPrayers] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>('Kingdom Focus');

  // Kingdom Focus schedule fields
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [intercessionNumber, setIntercessionNumber] = useState("");

  // Listening Prayer schedule fields
  const [cycleNumber, setCycleNumber] = useState("");
  const [dayNumber, setDayNumber] = useState("");
  const [chapter, setChapter] = useState("");
  const [startVerse, setStartVerse] = useState("");
  const [endVerse, setEndVerse] = useState("");
  const [referenceText, setReferenceText] = useState("");

  useEffect(() => {
    fetchPrayerPoints();
  }, []);

  const fetchPrayerPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_library')
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
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate Kingdom Focus schedule fields
    if (category === 'Kingdom Focus') {
      if (!month || !day || !year || !dayOfWeek || !intercessionNumber) {
        toast.error('All Kingdom Focus schedule fields are required for auto-generation');
        return;
      }
    }

    // Validate Listening Prayer schedule fields
    if (category === 'Listening Prayer') {
      if (!dayNumber || !chapter || !startVerse || !endVerse || !referenceText) {
        toast.error('All Listening Prayer schedule fields are required for auto-generation');
        return;
      }
    }

    try {
      if (editingPoint?.id) {
        // Update existing point - update editable fields and schedule metadata
        const updateData: any = {
          title,
          content,
          category
        };

        // Add Kingdom Focus schedule fields if provided
        if (category === 'Kingdom Focus') {
          if (month) updateData.month = month;
          if (day) updateData.day = parseInt(day);
          if (year) updateData.year = parseInt(year);
          if (dayOfWeek) updateData.day_of_week = dayOfWeek;
          if (intercessionNumber) updateData.intercession_number = parseInt(intercessionNumber);
        }

        // Add Listening Prayer schedule fields if provided
        if (category === 'Listening Prayer') {
          if (cycleNumber) updateData.cycle_number = parseInt(cycleNumber);
          if (dayNumber) updateData.day_number = parseInt(dayNumber);
          if (chapter) updateData.chapter = parseInt(chapter);
          if (startVerse) updateData.start_verse = parseInt(startVerse);
          if (endVerse) updateData.end_verse = parseInt(endVerse);
          if (referenceText) updateData.reference_text = referenceText;
        }

        const { error } = await supabase
          .from('prayer_library')
          .update(updateData)
          .eq('id', editingPoint.id);

        if (error) throw error;
        toast.success('Prayer point updated');
      } else {
        // Create new point with schedule metadata
        const insertData: any = {
          title,
          content,
          category,
          created_by: user.id
        };

        // Add Kingdom Focus schedule fields if provided
        if (category === 'Kingdom Focus') {
          if (month) insertData.month = month;
          if (day) insertData.day = parseInt(day);
          if (year) insertData.year = parseInt(year);
          if (dayOfWeek) insertData.day_of_week = dayOfWeek;
          if (intercessionNumber) insertData.intercession_number = parseInt(intercessionNumber);
        }

        // Add Listening Prayer schedule fields if provided
        if (category === 'Listening Prayer') {
          if (cycleNumber) insertData.cycle_number = parseInt(cycleNumber);
          if (dayNumber) insertData.day_number = parseInt(dayNumber);
          if (chapter) insertData.chapter = parseInt(chapter);
          if (startVerse) insertData.start_verse = parseInt(startVerse);
          if (endVerse) insertData.end_verse = parseInt(endVerse);
          if (referenceText) insertData.reference_text = referenceText;
        }

        const { error } = await supabase
          .from('prayer_library')
          .insert([insertData]);

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

    // Populate Kingdom Focus schedule fields
    setMonth(point.month || "");
    setDay(point.day?.toString() || "");
    setYear(point.year?.toString() || new Date().getFullYear().toString());
    setDayOfWeek(point.day_of_week || "");
    setIntercessionNumber(point.intercession_number?.toString() || "");

    // Populate Listening Prayer schedule fields
    setCycleNumber(point.cycle_number?.toString() || "");
    setDayNumber(point.day_number?.toString() || "");
    setChapter(point.chapter?.toString() || "");
    setStartVerse(point.start_verse?.toString() || "");
    setEndVerse(point.end_verse?.toString() || "");
    setReferenceText(point.reference_text || "");

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prayer point? This may affect scheduled guidelines.')) return;

    try {
      const { error } = await supabase
        .from('prayer_library')
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

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory('Kingdom Focus');
    setEditingPoint(null);

    // Reset Kingdom Focus schedule fields
    setMonth("");
    setDay("");
    setYear(new Date().getFullYear().toString());
    setDayOfWeek("");
    setIntercessionNumber("");

    // Reset Listening Prayer schedule fields
    setCycleNumber("");
    setDayNumber("");
    setChapter("");
    setStartVerse("");
    setEndVerse("");
    setReferenceText("");
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedPrayers.size === filteredPoints.length) {
      // Deselect all
      setSelectedPrayers(new Set());
    } else {
      // Select all filtered prayers
      setSelectedPrayers(new Set(filteredPoints.map(p => p.id)));
    }
  };

  const handleSelectPrayer = (id: string) => {
    const newSelected = new Set(selectedPrayers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPrayers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedPrayers.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('prayer_library')
        .delete()
        .in('id', Array.from(selectedPrayers));

      if (error) throw error;

      toast.success(`${selectedPrayers.size} prayer points deleted`);
      setSelectedPrayers(new Set());
      setShowDeleteDialog(false);
      await fetchPrayerPoints();
    } catch (error: any) {
      console.error('Error deleting prayer points:', error);
      toast.error(error.message || 'Failed to delete prayer points');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection when category changes
  useEffect(() => {
    setSelectedPrayers(new Set());
  }, [selectedCategory]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kingdom Focus': return 'bg-primary/10 text-primary border-primary/20';
      case 'Listening Prayer': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default: return 'bg-accent/10 text-accent-foreground border-accent/20';
    }
  };

  const getScheduleInfo = (point: PrayerPoint): string | null => {
    // Kingdom Focus: Show date and intercession number
    if (point.category === 'Kingdom Focus' && point.month && point.day) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNum = parseInt(point.month);
      const monthName = (monthNum >= 1 && monthNum <= 12) ? monthNames[monthNum - 1] : point.month;
      const intercessionPart = point.intercession_number ? `, Intercession ${point.intercession_number}` : '';
      return `${monthName} ${point.day}${point.year ? `, ${point.year}` : ''}${intercessionPart}`;
    }

    // Listening Prayer: Show reference text or build from chapter/verses
    if (point.category === 'Listening Prayer') {
      if (point.reference_text) {
        return point.reference_text;
      }
      if (point.chapter && point.start_verse && point.end_verse) {
        return `Proverbs ${point.chapter}:${point.start_verse}-${point.end_verse}`;
      }
      if (point.day_number) {
        return `Day ${point.day_number}`;
      }
    }

    return null;
  };

  const filteredPoints = prayerPoints.filter(p => p.category === selectedCategory);

  const handleExportJSON = (category: string) => {
    const filtered = prayerPoints.filter(p => p.category === category);
    
    const exportData = filtered.map(p => {
      if (category === 'Kingdom Focus') {
        return {
          category: p.category,
          title: p.title,
          content: p.content,
          month: p.month,
          day: p.day,
          year: p.year,
          day_of_week: p.day_of_week,
          intercession_number: p.intercession_number,
        };
      } else {
        return {
          category: p.category,
          title: p.title,
          content: p.content,
          day_number: p.day_number,
          chapter: p.chapter,
          start_verse: p.start_verse,
          end_verse: p.end_verse,
          reference_text: p.reference_text,
        };
      }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase().replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filtered.length} ${category} prayers as JSON`);
  };

  const handleExportCSV = (category: string) => {
    const filtered = prayerPoints.filter(p => p.category === category);
    
    let headers: string;
    let rows: string[];
    
    const escapeCSV = (text: string) => {
      if (!text) return '';
      return `"${String(text).replace(/"/g, '""')}"`;
    };
    
    if (category === 'Kingdom Focus') {
      headers = 'category,title,content,month,day,year,day_of_week,intercession_number';
      rows = filtered.map(p => {
        return [
          escapeCSV(p.category),
          escapeCSV(p.title),
          escapeCSV(p.content),
          escapeCSV(p.month || ''),
          p.day || '',
          p.year || '',
          escapeCSV(p.day_of_week || ''),
          p.intercession_number || ''
        ].join(',');
      });
    } else {
      headers = 'category,title,content,day_number,chapter,start_verse,end_verse,reference_text';
      rows = filtered.map(p => {
        return [
          escapeCSV(p.category),
          escapeCSV(p.title),
          escapeCSV(p.content),
          p.day_number || '',
          p.chapter || '',
          p.start_verse || '',
          p.end_verse || '',
          escapeCSV(p.reference_text || '')
        ].join(',');
      });
    }
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase().replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filtered.length} ${category} prayers as CSV`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-hero">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-light/20 rounded-full blur-3xl"
          animate={{
            y: [0, 40, 0],
            x: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        <AppHeader title="Prayer Point Library" showBack={true} backTo="/admin" hideTitle={true} />

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="text-4xl font-heading font-bold text-white drop-shadow-lg">
                Prayer Point Library
              </h1>
              <p className="text-white/80 mt-1">
                Manage reusable prayer points for building guided prayer sessions
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkImportOpen(true)}
              size="default"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Bulk Import</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="default">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Add Prayer Point</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">
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

                {/* Kingdom Focus Schedule Fields */}
                {category === 'Kingdom Focus' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-sm">Schedule Information (Required for Auto-Generation)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">Month <span className="text-red-500">*</span></Label>
                        <Select value={month} onValueChange={setMonth} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="January">January</SelectItem>
                            <SelectItem value="February">February</SelectItem>
                            <SelectItem value="March">March</SelectItem>
                            <SelectItem value="April">April</SelectItem>
                            <SelectItem value="May">May</SelectItem>
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
                      <div>
                        <Label htmlFor="day">Day <span className="text-red-500">*</span></Label>
                        <Input
                          id="day"
                          type="number"
                          min="1"
                          max="31"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          placeholder="1-31"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="year">Year <span className="text-red-500">*</span></Label>
                        <Input
                          id="year"
                          type="number"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          placeholder="2025"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dayOfWeek">Day of Week <span className="text-red-500">*</span></Label>
                        <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="intercessionNumber">Intercession Number <span className="text-red-500">*</span></Label>
                        <Select value={intercessionNumber} onValueChange={setIntercessionNumber} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Listening Prayer Schedule Fields */}
                {category === 'Listening Prayer' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-sm">Schedule Information (Required for Auto-Generation)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cycleNumber">Cycle Number</Label>
                        <Input
                          id="cycleNumber"
                          type="number"
                          min="1"
                          value={cycleNumber}
                          onChange={(e) => setCycleNumber(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dayNumber">Day Number (1-91) <span className="text-red-500">*</span></Label>
                        <Input
                          id="dayNumber"
                          type="number"
                          min="1"
                          max="91"
                          value={dayNumber}
                          onChange={(e) => setDayNumber(e.target.value)}
                          placeholder="1-91"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="chapter">Chapter <span className="text-red-500">*</span></Label>
                        <Input
                          id="chapter"
                          type="number"
                          min="1"
                          max="31"
                          value={chapter}
                          onChange={(e) => setChapter(e.target.value)}
                          placeholder="1-31"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="startVerse">Start Verse <span className="text-red-500">*</span></Label>
                        <Input
                          id="startVerse"
                          type="number"
                          min="1"
                          value={startVerse}
                          onChange={(e) => setStartVerse(e.target.value)}
                          placeholder="1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endVerse">End Verse <span className="text-red-500">*</span></Label>
                        <Input
                          id="endVerse"
                          type="number"
                          min="1"
                          value={endVerse}
                          onChange={(e) => setEndVerse(e.target.value)}
                          placeholder="10"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="referenceText">Reference Text <span className="text-red-500">*</span></Label>
                        <Input
                          id="referenceText"
                          value={referenceText}
                          onChange={(e) => setReferenceText(e.target.value)}
                          placeholder="Proverbs 1:1-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

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
        </div>

        <BulkImportDialog
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
          onImportComplete={() => {
            fetchPrayerPoints();
            setBulkImportOpen(false);
          }}
          userId={user?.id || ''}
          prayers={prayerPoints}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
        />

        <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
          <TabsList className="mb-6 w-full md:w-auto flex-wrap h-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex-1 md:flex-none">
                <span className="hidden md:inline">{cat}</span>
                <span className="md:hidden">{cat.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Bulk Actions Bar */}
          {filteredPoints.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={selectedPrayers.size === filteredPoints.length && filteredPoints.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-white cursor-pointer">
                  {selectedPrayers.size === filteredPoints.length && filteredPoints.length > 0
                    ? `Deselect All (${filteredPoints.length})`
                    : `Select All (${filteredPoints.length})`}
                </label>
                {selectedPrayers.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPrayers.size} selected
                  </Badge>
                )}
              </div>
              {selectedPrayers.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedPrayers.size})
                </Button>
              )}
            </div>
          )}

          <TabsContent value={selectedCategory}>
            {filteredPoints.length === 0 ? (
              <Card className="shadow-large glass border-white/20">
                <CardContent className="py-12 text-center">
                  <p className="text-white/80">
                    No prayer points in this category yet. Click "Add Prayer Point" to create one.
                  </p>
                </CardContent>
              </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPoints.map((point) => (
                    <Card
                      key={point.id}
                      className={`shadow-large glass border-white/20 transition-all overflow-hidden relative ${
                        selectedPrayers.has(point.id) ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5" />
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={selectedPrayers.has(point.id)}
                              onCheckedChange={() => handleSelectPrayer(point.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                <Badge className={getCategoryColor(point.category)} variant="outline">
                                  {point.category}
                                </Badge>
                                {getScheduleInfo(point) && (
                                  <Badge variant="secondary" className="text-xs">
                                    {getScheduleInfo(point)}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg mt-2 text-white">{point.title}</CardTitle>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(point)}
                              className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(point.id)}
                              className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap line-clamp-3">
                          {point.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="glass border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Selected Prayer Points</AlertDialogTitle>
              <AlertDialogDescription className="text-white/80">
                Are you sure you want to delete {selectedPrayers.size} prayer point{selectedPrayers.size === 1 ? '' : 's'}?
                This action cannot be undone and may affect scheduled guidelines.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedPrayers.size} Prayer Point${selectedPrayers.size === 1 ? '' : 's'}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default PrayerLibrary;

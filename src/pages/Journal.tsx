import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, MILESTONES, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Search, Mic, Square, Upload, Headphones, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
  is_answered: boolean;
  is_shared: boolean;
  testimony_text?: string;
  audio_note?: string;
  audio_duration?: number;
  testimony_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string>("");
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [shareMenuEntry, setShareMenuEntry] = useState<JournalEntry | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [achievedMilestone, setAchievedMilestone] = useState(1);
  const [audioAction, setAudioAction] = useState<'keep' | 'replace' | 'delete' | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchEntries();
  }, [user]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  const fetchEntries = async () => {
    if (!user) return;

    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const userEntries = allEntries
      .filter((entry: any) => entry.user_id === user.id && !entry.title.startsWith('[PRAYER_TRACK]'))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEntries(userEntries);
    setLoading(false);
  };

  const checkAndUpdateMilestone = (currentStreak: number) => {
    const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
    const userProfile = profiles[user!.id] || {};
    const currentMilestone = userProfile.current_milestone || 0;
    const shownCelebrations = getFromStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, {} as any);
    const userCelebrations = shownCelebrations[user!.id] || [];

    // Find the highest milestone achieved based on streak
    let newMilestone = currentMilestone;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (currentStreak >= MILESTONES[i].streak_needed) {
        newMilestone = MILESTONES[i].level;
        break;
      }
    }

    // If new milestone and not shown before
    if (newMilestone > currentMilestone && !userCelebrations.includes(newMilestone)) {
      profiles[user!.id].current_milestone = newMilestone;
      if (!profiles[user!.id].milestone_unlocked_dates) {
        profiles[user!.id].milestone_unlocked_dates = {};
      }
      profiles[user!.id].milestone_unlocked_dates[newMilestone] = new Date().toISOString();
      setToStorage(STORAGE_KEYS.PROFILES, profiles);

      // Mark celebration as shown
      userCelebrations.push(newMilestone);
      shownCelebrations[user!.id] = userCelebrations;
      setToStorage(STORAGE_KEYS.SHOWN_CELEBRATIONS, shownCelebrations);

      // Show celebration
      setAchievedMilestone(newMilestone);
      setShowMilestoneModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);

      if (editingEntry) {
        // Update existing entry
        const entryIndex = allEntries.findIndex((e: any) => e.id === editingEntry.id);
        if (entryIndex !== -1) {
          allEntries[entryIndex] = { 
            ...allEntries[entryIndex], 
            title, 
            content,
            // Handle audio based on action
            ...(audioAction === 'delete' && { audio_note: undefined, audio_duration: undefined }),
            ...(audioAction === 'replace' && audioBlob && { 
              audio_note: await blobToBase64(audioBlob), 
              audio_duration: audioDuration 
            }),
          };
          setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
          toast.success("Entry updated successfully");
        }
      } else {
        // Create new entry
        const newEntry: any = {
          id: `entry-${Date.now()}`,
          user_id: user.id,
          title,
          content,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          is_answered: false,
          is_shared: false
        };

        // Add audio if recorded
        if (audioBlob) {
          newEntry.audio_note = await blobToBase64(audioBlob);
          newEntry.audio_duration = audioDuration;
        }

        allEntries.push(newEntry);
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
        toast.success("📝 Your new journal entry has been saved!");

        // Update streak tracking and check milestones
        const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {} as any);
        if (profiles[user.id]) {
          const currentStreak = profiles[user.id].streak_count || 0;
          const newStreak = currentStreak + 1;
          profiles[user.id].streak_count = newStreak;
          profiles[user.id].last_journal_date = new Date().toISOString().split('T')[0];
          setToStorage(STORAGE_KEYS.PROFILES, profiles);

          // Check for milestone achievement based on streak
          checkAndUpdateMilestone(newStreak);
        }
      }

      setTitle("");
      setContent("");
      setAudioBlob(null);
      setAudioDuration(0);
      setAudioPreview("");
      setAudioAction(null);
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Failed to save entry");
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Voice recording not supported on this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Check size (5MB limit)
        if (audioBlob.size > 5 * 1024 * 1024) {
          toast.error("Recording exceeds 5MB limit. Please record a shorter message.");
          return;
        }

        setAudioBlob(audioBlob);
        setAudioDuration(recordingTime);
        setAudioPreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 270) { // 4:30 warning
            toast.warning("30 seconds remaining!");
          }
          if (newTime >= 300) { // 5:00 max
            stopRecording();
            return 300;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioPreview("");
    setRecordingTime(0);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setAudioAction(entry.audio_note ? null : undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const filteredEntries = allEntries.filter((entry: any) => entry.id !== id);
    setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, filteredEntries);
    toast.success("Entry deleted");
    fetchEntries();
  };

  const toggleAnswered = async (entry: JournalEntry) => {
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const entryIndex = allEntries.findIndex((e: any) => e.id === entry.id);
    if (entryIndex !== -1) {
      allEntries[entryIndex].is_answered = !entry.is_answered;
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
      toast.success(entry.is_answered ? "Marked as unanswered" : "Marked as answered!");
      fetchEntries();
    }
  };

  const openShareMenu = (entry: JournalEntry) => {
    setShareMenuEntry(entry);
    setIsShareMenuOpen(true);
  };

  const handleShareToSocial = async (entry: JournalEntry) => {
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
          // Fallback to clipboard
          const text = `${entry.title}\n\n${entry.content}`;
          navigator.clipboard.writeText(text).then(() => {
            toast.success("Copied to clipboard!");
          });
        }
      }
    } else {
      // Desktop fallback to clipboard
      const text = `${entry.title}\n\n${entry.content}`;
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Copied to clipboard!");
      });
    }
    setIsShareMenuOpen(false);
  };

  const handleDownloadPDF = async (entry: JournalEntry) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Spirit Scribe Path", margin, yPos);
      yPos += 15;

      doc.setFontSize(14);
      const titleLines = doc.splitTextToSize(entry.title, maxWidth);
      doc.text(titleLines, margin, yPos);
      yPos += titleLines.length * 7 + 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date(entry.date).toLocaleDateString()}`, margin, yPos);
      yPos += 10;

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

      const filename = `journal-${entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${entry.date}.pdf`;
      doc.save(filename);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
    setIsShareMenuOpen(false);
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

      const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
      const newTestimony = {
        id: `testimony-${Date.now()}`,
        user_id: user.id,
        title: sharingEntry.title,
        content: fullTestimonyContent,
        date: new Date().toISOString().split('T')[0],
        approved: false,
        status: 'pending',
        profiles: { name: user.user_metadata?.name || 'Anonymous' }
      };
      testimonies.push(newTestimony);
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);

      // Mark journal entry as shared and set testimony status
      const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
      const entryIndex = allEntries.findIndex((e: any) => e.id === sharingEntry.id);
      if (entryIndex !== -1) {
        allEntries[entryIndex].is_shared = true;
        allEntries[entryIndex].testimony_text = testimonyText;
        allEntries[entryIndex].testimony_status = 'pending';
        setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
      }

      toast.success("Shared as testimony! Awaiting admin approval.");
      setIsTestimonyDialogOpen(false);
      setSharingEntry(null);
      setTestimonyText("God has answered my prayer");
      fetchEntries();
    } catch (error: any) {
      console.error("Error sharing testimony:", error);
      toast.error(error.message || "Failed to share testimony");
    }
  };

  const handleResubmitTestimony = (entry: JournalEntry) => {
    // Open edit dialog and reset testimony status
    const allEntries = getFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, [] as any[]);
    const entryIndex = allEntries.findIndex((e: any) => e.id === entry.id);
    if (entryIndex !== -1) {
      delete allEntries[entryIndex].testimony_status;
      delete allEntries[entryIndex].rejection_reason;
      allEntries[entryIndex].is_shared = false;
      setToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, allEntries);
    }
    openTestimonyDialog(entry);
    fetchEntries();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingEntry(null);
                setTitle("");
                setContent("");
                deleteRecording();
                setAudioAction(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => { 
                  setEditingEntry(null); 
                  setTitle(""); 
                  setContent("");
                  deleteRecording();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Existing audio notice */}
                  {editingEntry && editingEntry.audio_note && !audioAction && (
                    <Alert>
                      <Headphones className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>This entry has a voice note</span>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setAudioAction('keep')}>Keep</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setAudioAction('replace')}>Replace</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => setAudioAction('delete')}>Delete</Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {editingEntry && editingEntry.audio_note && audioAction === 'keep' && (
                    <div className="space-y-2">
                      <Label>Current Voice Note</Label>
                      <AudioPlayer audioBase64={editingEntry.audio_note} duration={editingEntry.audio_duration || 0} />
                    </div>
                  )}

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

                  {/* Voice Recording */}
                  {(!editingEntry || audioAction === 'replace' || !editingEntry.audio_note) && (
                    <div className="space-y-2">
                      <Label>Voice Note (Optional)</Label>
                      {!audioPreview && !isRecording && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={startRecording}
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          Record Voice Note
                        </Button>
                      )}

                      {isRecording && (
                        <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                            <span className="font-mono">{formatTime(recordingTime)}</span>
                            <span className="text-sm text-muted-foreground">Recording...</span>
                          </div>
                          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </Button>
                        </div>
                      )}

                      {audioPreview && audioBlob && (
                        <div className="space-y-2">
                          <audio src={audioPreview} controls className="w-full" />
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={deleteRecording} className="flex-1">
                              Delete
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={startRecording} className="flex-1">
                              Re-record
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="content">Written Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your prayer, reflection, or thoughts..."
                      rows={8}
                      required
                      disabled={isRecording}
                    />
                    {isRecording && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Content editing disabled while recording
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isRecording}>
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
                <Card 
                  key={entry.id} 
                  className={`shadow-medium hover:shadow-glow transition-shadow ${entry.audio_note ? 'border-l-4 border-l-accent' : ''}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{entry.title}</CardTitle>
                          {entry.audio_note && (
                            <Badge variant="secondary" className="text-xs">
                              <Headphones className="h-3 w-3 mr-1" />
                              Voice
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openShareMenu(entry)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share or Download</TooltipContent>
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
                  <CardContent className="space-y-4">
                    {/* Audio Player */}
                    {entry.audio_note && (
                      <AudioPlayer audioBase64={entry.audio_note} duration={entry.audio_duration || 0} />
                    )}

                    {/* Content */}
                    <p className="whitespace-pre-wrap text-foreground/90 break-words">
                      {entry.content}
                    </p>

                    {/* Status Badges */}
                    {entry.is_answered && (
                      <Alert className="bg-accent/10 border-accent">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        <AlertDescription className="flex items-center justify-between">
                          <span className="font-medium text-accent">✨ Prayer Answered</span>
                          {!entry.is_shared && entry.testimony_status !== 'rejected' && (
                            <Button size="sm" variant="outline" onClick={() => openTestimonyDialog(entry)}>
                              Share Testimony
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {entry.testimony_status === 'pending' && (
                      <Alert className="bg-yellow-500/10 border-yellow-500">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                          Testimony pending admin approval
                        </AlertDescription>
                      </Alert>
                    )}

                    {entry.testimony_status === 'approved' && (
                      <Alert className="bg-green-500/10 border-green-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                          📢 Testimony approved and published
                        </AlertDescription>
                      </Alert>
                    )}

                    {entry.testimony_status === 'rejected' && (
                      <Alert className="bg-destructive/10 border-destructive">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="space-y-2">
                          <div className="font-medium text-destructive">Testimony Rejected</div>
                          <div className="text-sm text-muted-foreground">
                            Reason: {entry.rejection_reason || 'No reason provided'}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleResubmitTestimony(entry)}>
                            Edit & Resubmit
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Share Menu Dialog */}
          <Dialog open={isShareMenuOpen} onOpenChange={setIsShareMenuOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share or Download</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => shareMenuEntry && handleShareToSocial(shareMenuEntry)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Share to Social Media
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => shareMenuEntry && handleDownloadPDF(shareMenuEntry)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Download as PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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

          {/* Milestone Achievement Modal */}
          <MilestoneAchievementModal 
            milestoneLevel={achievedMilestone}
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Journal;

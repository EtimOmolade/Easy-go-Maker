import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Search, Mic, Square, Share2, Download, AlertCircle, Heart, BookText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MilestoneAchievementModal } from "@/components/MilestoneAchievementModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { exportJournalToPDF, shareJournalEntry } from "@/utils/pdfExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JournalSkeleton } from "@/components/LoadingSkeleton";
import { haptics } from "@/utils/haptics";
import { useOfflineJournal } from "@/hooks/useOfflineJournal";
import { AppHeader } from "@/components/AppHeader";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
  is_answered: boolean;
  is_shared: boolean;
  testimony_text?: string;
  voice_note_url?: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string>("");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [achievedMilestone, setAchievedMilestone] = useState(1);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveEntry, updateEntry, fetchEntries: fetchEntriesOffline, deleteEntry: deleteEntryOffline, isOnline } = useOfflineJournal(user?.id);
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

    try {
      setLoading(true);
      const data = await fetchEntriesOffline();
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  const checkAndUpdateMilestone = async (currentStreak: number) => {
    if (!user) return;

    const MILESTONES = [1, 7, 21, 50, 100, 365, 545];
    
    // Find the highest milestone achieved
    let newMilestone = 0;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (currentStreak >= MILESTONES[i]) {
        newMilestone = MILESTONES[i];
        break;
      }
    }

    if (newMilestone > 0) {
      // Get current milestone from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const currentMilestone = profile?.streak_count || 0;

      // Show milestone modal if achieved and not current
      if (newMilestone > currentMilestone) {
        setAchievedMilestone(newMilestone);
        setShowMilestoneModal(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let voiceNoteUrl: string | undefined = undefined;

      // Upload audio if present and online
      if (audioBlob && isOnline) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-notes')
          .upload(fileName, audioBlob, {
            contentType: 'audio/webm',
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading audio:", uploadError);
          toast.error("Failed to upload audio");
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('voice-notes')
          .getPublicUrl(fileName);

        voiceNoteUrl = publicUrl;
      } else if (audioBlob && !isOnline) {
        toast.info("Audio will be uploaded when back online");
      }

      if (editingEntry) {
        // Update existing entry
        const updateData: any = {
          title,
          content,
          updated_at: new Date().toISOString(),
        };

        // Add voice note URL if audio was recorded
        if (voiceNoteUrl) {
          updateData.voice_note_url = voiceNoteUrl;
        }

        const success = await updateEntry(editingEntry.id!, updateData);
        if (success) {
          toast.success("Entry updated successfully");
        } else {
          throw new Error("Update failed");
        }
      } else {
        // Create new entry
        const insertData: any = {
          title,
          content,
          date: new Date().toISOString().split('T')[0],
          is_answered: false,
          is_shared: false,
        };

        // Add voice note URL if audio was recorded
        if (voiceNoteUrl) {
          insertData.voice_note_url = voiceNoteUrl;
        }

        const success = await saveEntry(insertData);
        if (success) {
          toast.success("📝 Your new journal entry has been saved!");

          // Get user's current streak if online
          if (isOnline) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("streak_count")
              .eq("id", user.id)
              .single();

            if (profile) {
              await checkAndUpdateMilestone(profile.streak_count || 0);
            }
          }
        } else {
          throw new Error("Save failed");
        }
      }

      setTitle("");
      setContent("");
      setAudioBlob(null);
      setAudioDuration(0);
      setAudioPreview("");
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Failed to save entry");
    }
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
        
        if (audioBlob.size > 5 * 1024 * 1024) {
          toast.error("Recording too large. Maximum size is 5MB.");
          return;
        }

        setAudioBlob(audioBlob);
        setAudioDuration(recordingTime);
        const url = URL.createObjectURL(audioBlob);
        setAudioPreview(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("🎙️ Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      toast.success("✅ Recording stopped");
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview("");
    }
    toast.info("🗑️ Recording deleted");
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const success = await deleteEntryOffline(id);
      if (success) {
        toast.success("Entry deleted");
        fetchEntries();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  const toggleAnswered = async (id: string, currentStatus: boolean) => {
    try {
      const success = await updateEntry(id, { is_answered: !currentStatus });
      if (success) {
        toast.success(!currentStatus ? "Marked as answered" : "Marked as unanswered");
        fetchEntries();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry");
    }
  };

  const handleShare = async (entry: JournalEntry) => {
    const success = await shareJournalEntry({
      title: entry.title,
      content: entry.content,
      date: entry.date
    });

    if (success) {
      toast.success(navigator.share ? "Shared successfully!" : "Copied to clipboard!");
    } else {
      toast.error("Failed to share entry");
    }
  };

  const handleDownloadPDF = (entry: JournalEntry) => {
    exportJournalToPDF({
      title: entry.title,
      content: entry.content,
      date: entry.date
    });
    toast.success("PDF downloaded!");
  };

  const handleShareAsTestimony = (entry: JournalEntry) => {
    // Pre-fill testimony form with journal entry content
    sessionStorage.setItem('prefillTestimony', JSON.stringify({
      content: `${entry.title}\n\n${entry.content}`,
      journalEntryId: entry.id
    }));

    navigate('/testimonies');
    toast.success('Redirecting to testimony submission...');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"
            animate={{
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
            }}
          />
        </div>
        <div className="relative z-10">
          <JournalSkeleton />
        </div>
      </div>
    );
  }

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

      <div className="container relative z-10 mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <AppHeader title="Prayer Journal" showBack={true} backTo="/dashboard" />
          
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-xl border-primary/20">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your entry a title..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your prayer or reflection here..."
                    rows={10}
                    required
                  />
                </div>
                
                {/* Voice Recording Section */}
                <div className="space-y-2">
                  <Label>Voice Note (Optional)</Label>
                  <div className="flex gap-2">
                    {!isRecording && !audioBlob && (
                      <Button type="button" onClick={startRecording} variant="outline" className="gap-2">
                        <Mic className="h-4 w-4" />
                        Start Recording
                      </Button>
                    )}
                    {isRecording && (
                      <Button type="button" onClick={stopRecording} variant="destructive" className="gap-2">
                        <Square className="h-4 w-4" />
                        Stop ({formatTime(recordingTime)})
                      </Button>
                    )}
                    {audioBlob && audioPreview && (
                      <>
                        <div className="flex-1">
                          <audio src={audioPreview} controls className="w-full" />
                        </div>
                        <Button type="button" onClick={deleteRecording} variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setTitle("");
                      setContent("");
                      setEditingEntry(null);
                      deleteRecording();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEntry ? "Update" : "Save"} Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Entries List */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-white/80">Loading your journal...</p>
          </motion.div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center py-12 glass border-white/20 shadow-large">
              <CardContent>
                <p className="text-white/80 mb-4">
                  {searchQuery ? "No entries found matching your search" : "No journal entries yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-gradient-secondary text-white">
                    <Plus className="h-4 w-4" />
                    Create Your First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-md border-white/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {entry.is_answered && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Answered
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{entry.content}</p>

                  {entry.voice_note_url && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Voice Note:</p>
                      <audio controls className="w-full">
                        <source src={entry.voice_note_url} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => toggleAnswered(entry.id, entry.is_answered)}
                            className="gap-1.5"
                          >
                            <CheckCircle className={`h-4 w-4 ${entry.is_answered ? 'text-green-500' : ''}`} />
                            <span className="text-xs">{entry.is_answered ? "Answered" : "Mark"}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {entry.is_answered ? "Mark as unanswered" : "Mark as answered"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {entry.is_answered && !entry.is_shared && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleShareAsTestimony(entry)}
                              className="border-green-500 text-green-600 hover:bg-green-50 gap-1.5"
                            >
                              <Heart className="h-4 w-4" />
                              <span className="text-xs">Testimony</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Share as Testimony
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1.5">
                          <Share2 className="h-4 w-4" />
                          <span className="text-xs">Share</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleShare(entry)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share to Social Media
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(entry)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download as PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      onClick={() => handleEdit(entry)}
                      className="gap-1.5"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-xs">Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDelete(entry.id)}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Milestone Modal */}
        <MilestoneAchievementModal
          isOpen={showMilestoneModal}
          onClose={() => setShowMilestoneModal(false)}
          milestoneLevel={achievedMilestone}
        />
      </div>
    </div>
  );
};

export default Journal;

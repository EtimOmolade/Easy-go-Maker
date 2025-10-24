import { useEffect, useState, useRef } from "react";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Search, Edit, Mic, Square, X as XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { submitTestimony, resubmitTestimony } from "@/utils/testimonyHelpers";
import { AudioPlayer } from "@/components/AudioPlayer";

interface Testimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  admin_note?: string;
  resubmitted_at?: string;
  audio_note?: string;
  audio_duration?: number;
  rejected_by?: string;
  rejected_at?: string;
  profiles: {
    name: string;
  };
}

const Testimonies = () => {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null);
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string>("");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const filteredTestimonies = testimonies.filter(testimony =>
    testimony.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimony.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyTestimonies = myTestimonies.filter(testimony =>
    testimony.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimony.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchTestimonies();
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

  const fetchTestimonies = async () => {
    if (!user) return;

    // Prototype mode: Fetch from localStorage
    const allTestimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const approvedTestimonies = allTestimonies
      .filter((t: any) => t.status === 'approved' || t.approved === true)
      .sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
    setTestimonies(approvedTestimonies);

    // Get user's own testimonies (all statuses)
    const userTestimonies = allTestimonies
      .filter((t: any) => t.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
    setMyTestimonies(userTestimonies);
    
    setLoading(false);
  };

  const handleEditTestimony = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setEditTitle(testimony.title);
    setEditContent(testimony.content);
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioPreview("");
  };

  const handleResubmitTestimony = async () => {
    if (!editingTestimony || !user) return;

    const audioNote = audioBlob ? await blobToBase64(audioBlob) : editingTestimony.audio_note;
    const duration = audioBlob ? audioDuration : editingTestimony.audio_duration;

    // Use helper function
    resubmitTestimony(editingTestimony.id, editTitle, editContent, audioNote, duration);
    
    toast.success("Testimony resubmitted for approval");
    setEditingTestimony(null);
    setEditTitle("");
    setEditContent("");
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioPreview("");
    setRecordingTime(0);
    fetchTestimonies();
  };

  const handleSubmitTestimony = async () => {
    if (!user || !submitTitle || !submitContent) return;

    const audioNote = audioBlob ? await blobToBase64(audioBlob) : undefined;
    const duration = audioBlob ? audioDuration : undefined;

    submitTestimony(user.id, submitTitle, submitContent, user.user_metadata?.name || 'Anonymous', audioNote, duration);
    
    toast.success("Testimony shared.");
    setIsSubmitDialogOpen(false);
    setSubmitTitle("");
    setSubmitContent("");
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioPreview("");
    setRecordingTime(0);
    fetchTestimonies();
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
          if (newTime >= 270) {
            toast.warning("30 seconds remaining!");
          }
          if (newTime >= 300) {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (testimony: Testimony) => {
    const status = testimony.status || 'pending';
    
    if (status === 'approved') {
      return <Badge className="bg-green-500">Approved</Badge>;
    } else if (status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Dashboard</TooltipContent>
          </Tooltip>

        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-accent" />
            <h1 className="text-3xl md:text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
              Testimonies
            </h1>
          </div>
          <Button onClick={() => setIsSubmitDialogOpen(true)}>
            <Sparkles className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share Testimony</span>
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">
          Stories of answered prayers and faith journeys from our community
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search testimonies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="community" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="community">Community Testimonies</TabsTrigger>
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="community">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading testimonies...</p>
              </div>
            ) : testimonies.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No testimonies yet. Be the first to share!</p>
                </CardContent>
              </Card>
            ) : filteredTestimonies.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No testimonies found matching your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredTestimonies.map((testimony) => (
                  <Card key={testimony.id} className="shadow-medium hover:shadow-glow transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {testimony.title}
                        <Badge className="bg-green-500 ml-auto">Approved</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">{testimony.profiles?.name}</span>
                        <span>•</span>
                        <span>{new Date(testimony.date).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {testimony.audio_note && (
                        <div className="mb-4">
                          <AudioPlayer audioBase64={testimony.audio_note} duration={testimony.audio_duration || 0} />
                        </div>
                      )}
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        {testimony.content.substring(0, 150)}
                        {testimony.content.length > 150 && '...'}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedTestimony(testimony)}
                      >
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-submissions">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your submissions...</p>
              </div>
            ) : myTestimonies.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't submitted any testimonies yet.</p>
                </CardContent>
              </Card>
            ) : filteredMyTestimonies.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No submissions found matching your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredMyTestimonies.map((testimony) => {
                  const status = testimony.status || 'pending';
                  const isRejected = status === 'rejected';
                  
                  return (
                    <Card key={testimony.id} className="shadow-medium hover:shadow-glow transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">{testimony.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span>{new Date(testimony.date).toLocaleDateString()}</span>
                              <span>•</span>
                              {getStatusBadge(testimony)}
                            </div>
                          </div>
                          {isRejected && (
                            <Button
                              size="sm"
                              onClick={() => handleEditTestimony(testimony)}
                            >
                              <Edit className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Edit & Resubmit</span>
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {testimony.audio_note && (
                          <div className="mb-4">
                            <AudioPlayer audioBase64={testimony.audio_note} duration={testimony.audio_duration || 0} />
                          </div>
                        )}
                        <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">
                          {testimony.content.substring(0, 150)}
                          {testimony.content.length > 150 && '...'}
                        </p>
                        {isRejected && testimony.rejection_reason && (
                          <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Rejected • {testimony.rejection_reason}
                            </p>
                            {testimony.admin_note && (
                              <p className="text-sm text-muted-foreground mt-2">Note: {testimony.admin_note}</p>
                            )}
                            {testimony.rejected_by && (
                              <p className="text-xs text-muted-foreground mt-2">
                                By {testimony.rejected_by} • {new Date(testimony.rejected_at || '').toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setSelectedTestimony(testimony)}
                        >
                          Read Full Content
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Submit Testimony Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={(open) => {
          setIsSubmitDialogOpen(open);
          if (!open) {
            setSubmitTitle("");
            setSubmitContent("");
            deleteRecording();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share Your Testimony</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submit-title">Title</Label>
                <Input
                  id="submit-title"
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  placeholder="Testimony title"
                />
              </div>

              {/* Voice Recording */}
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
                        <XIcon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { deleteRecording(); startRecording(); }} className="flex-1">
                        Re-record
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="submit-content">Content</Label>
                <Textarea
                  id="submit-content"
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  placeholder="Share your testimony..."
                  rows={10}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitDialogOpen(false);
                    setSubmitTitle("");
                    setSubmitContent("");
                    deleteRecording();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitTestimony} disabled={!submitTitle || !submitContent}>
                  Submit for Approval
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Read More Modal */}
        <Dialog open={!!selectedTestimony} onOpenChange={() => setSelectedTestimony(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl pr-8">{selectedTestimony?.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <span className="font-medium">{selectedTestimony?.profiles?.name}</span>
                <span>•</span>
                <span>{selectedTestimony && new Date(selectedTestimony.date).toLocaleDateString()}</span>
              </div>
            </DialogHeader>
            <div className="mt-4 overflow-hidden">
              {selectedTestimony?.audio_note && (
                <div className="mb-4">
                  <AudioPlayer audioBase64={selectedTestimony.audio_note} duration={selectedTestimony.audio_duration || 0} />
                </div>
              )}
              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed break-words overflow-wrap-anywhere">
                {selectedTestimony?.content}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit & Resubmit Modal */}
        <Dialog open={!!editingTestimony} onOpenChange={() => {
          setEditingTestimony(null);
          setEditTitle("");
          setEditContent("");
          deleteRecording();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit & Resubmit Testimony</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Testimony title"
                />
              </div>

              {/* Voice Recording */}
              <div className="space-y-2">
                <Label>Voice Note (Optional)</Label>
                {editingTestimony?.audio_note && !audioBlob && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground mb-2">Current voice note:</p>
                    <AudioPlayer audioBase64={editingTestimony.audio_note} duration={editingTestimony.audio_duration || 0} />
                  </div>
                )}
                
                {!audioPreview && !isRecording && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={startRecording}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {editingTestimony?.audio_note ? 'Replace Voice Note' : 'Record Voice Note'}
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
                        <XIcon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { deleteRecording(); startRecording(); }} className="flex-1">
                        Re-record
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Share your testimony..."
                  rows={10}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTestimony(null);
                    setEditTitle("");
                    setEditContent("");
                    deleteRecording();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleResubmitTestimony}>
                  Resubmit for Approval
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

export default Testimonies;

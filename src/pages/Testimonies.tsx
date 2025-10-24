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
import { ArrowLeft, Sparkles, Search, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { submitTestimony, resubmitTestimony } from "@/utils/testimonyHelpers";
import { Mic, Square, Upload, Headphones, X as XIcon } from "lucide-react";
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

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from("testimonies")
    //   .select("id, title, content, date, profiles(name)")
    //   .eq("approved", true)
    //   .order("date", { ascending: false });
    //
    // if (error) {
    //   console.error("Error fetching testimonies:", error);
    //   toast.error("Failed to load testimonies");
    // } else {
    //   setTestimonies(data || []);
    // }
    // setLoading(false);
  };

  const handleEditTestimony = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setEditTitle(testimony.title);
    setEditContent(testimony.content);
  };

  const handleResubmitTestimony = async () => {
    if (!editingTestimony || !user) return;

    // Prototype mode: Update in localStorage
    const allTestimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const testimonyIndex = allTestimonies.findIndex((t: any) => t.id === editingTestimony.id);
    
    if (testimonyIndex !== -1) {
      allTestimonies[testimonyIndex] = {
        ...allTestimonies[testimonyIndex],
        title: editTitle,
        content: editContent,
        status: 'pending',
        approved: false,
        rejection_reason: undefined,
        resubmitted_at: new Date().toISOString()
      };
      setToStorage(STORAGE_KEYS.TESTIMONIES, allTestimonies);
      toast.success("Testimony resubmitted for approval");
      setEditingTestimony(null);
      setEditTitle("");
      setEditContent("");
      fetchTestimonies();
    }

    // Backend integration - Supabase COMMENTED OUT
    // try {
    //   const { error } = await supabase
    //     .from('testimonies')
    //     .update({
    //       title: editTitle,
    //       content: editContent,
    //       status: 'pending',
    //       approved: false,
    //       rejection_reason: null,
    //       resubmitted_at: new Date().toISOString()
    //     })
    //     .eq('id', editingTestimony.id);
    //
    //   if (error) throw error;
    //
    //   toast.success("Testimony resubmitted for approval");
    //   setEditingTestimony(null);
    //   setEditTitle("");
    //   setEditContent("");
    //   fetchTestimonies();
    // } catch (error: any) {
    //   console.error('Error resubmitting testimony:', error);
    //   toast.error(error.message || 'Failed to resubmit testimony');
    // }
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
                Back to Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Dashboard</TooltipContent>
          </Tooltip>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            Testimonies
          </h1>
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
                      <CardTitle className="text-2xl">{testimony.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">{testimony.profiles?.name}</span>
                        <span>•</span>
                        <span>{new Date(testimony.date).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        {testimony.content.substring(0, 70)}
                        {testimony.content.length > 70 && '...'}
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
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                              <Edit className="h-4 w-4 mr-2" />
                              Edit & Resubmit
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">
                          {testimony.content.substring(0, 150)}
                          {testimony.content.length > 150 && '...'}
                        </p>
                        {isRejected && testimony.rejection_reason && (
                          <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{testimony.rejection_reason}</p>
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
        }}>
          <DialogContent className="max-w-3xl">
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

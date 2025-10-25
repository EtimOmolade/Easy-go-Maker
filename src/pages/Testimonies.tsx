import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Heart, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Testimony {
  id: string;
  user_id: string;
  alias: string;
  location?: string;
  content: string;
  related_series?: string;
  date: string;
  approved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  gratitude_count: number;
  profiles: {
    name: string;
  };
}

interface Guideline {
  id: string;
  title: string;
  week_number: number;
}

const Testimonies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>([]);
  const [alias, setAlias] = useState("Anonymous Seeker");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [relatedSeries, setRelatedSeries] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'my-testimonies'>('feed');

  useEffect(() => {
    fetchTestimonies();
    fetchGuidelines();
  }, [user]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [content]);

  const fetchGuidelines = async () => {
    const guidelinesData = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    setGuidelines(guidelinesData);
  };

  const fetchTestimonies = async () => {
    if (!user) return;

    const allTestimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    
    // Approved testimonies for public feed
    const approved = allTestimonies
      .filter((t: any) => t.approved && t.status === 'approved')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTestimonies(approved);

    // User's own testimonies (all statuses)
    const mine = allTestimonies
      .filter((t: any) => t.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setMyTestimonies(mine);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to share a testimony");
      return;
    }

    if (!consentChecked) {
      toast.error("Please agree to the consent statement");
      return;
    }

    if (wordCount < 100 || wordCount > 200) {
      toast.error("Testimony must be between 100-200 words");
      return;
    }

    try {
      // Prototype mode: Save to localStorage
      const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
      const newTestimony = {
        id: `testimony-${Date.now()}`,
        user_id: user.id,
        alias,
        location: location || undefined,
        content,
        related_series: relatedSeries || undefined,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        approved: false,
        status: 'pending',
        gratitude_count: 0,
        profiles: { name: user.user_metadata?.name || alias }
      };

      testimonies.push(newTestimony);
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);

      // Backend TODO: Log to secure database with:
      // - timestamp, consent_confirmed: true, user_id, alias, content, location, related_series
      console.log('[Backend Placeholder] Testimony submitted:', {
        timestamp: new Date().toISOString(),
        consent_confirmed: true,
        testimony_id: newTestimony.id
      });

      // Create admin notification
      const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});
      const adminUserIds = Object.keys(userRoles).filter(userId => userRoles[userId] === 'admin');
      
      const notifications = getFromStorage(STORAGE_KEYS.NOTIFICATIONS, [] as any[]);
      adminUserIds.forEach(adminId => {
        notifications.push({
          id: `notif-${Date.now()}-${adminId}`,
          userId: adminId,
          type: 'testimony',
          title: 'New Testimony Pending',
          message: `📝 New testimony from ${alias}`,
          messageId: newTestimony.id,
          icon: '📝',
          read: false,
          created_at: new Date().toISOString(),
          isAdminOnly: true
        });
      });
      setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

      toast.success("Thank you! Your story has been sent for review. We'll notify you once it's live.");

      // Reset form
      setAlias("Anonymous Seeker");
      setLocation("");
      setContent("");
      setRelatedSeries("");
      setConsentChecked(false);
      setActiveTab('my-testimonies');
      
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error submitting testimony:', error);
      toast.error('Failed to submit testimony');
    }
  };

  const handleGratitude = (testimonyId: string) => {
    const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const updated = testimonies.map((t: any) => 
      t.id === testimonyId 
        ? { ...t, gratitude_count: (t.gratitude_count || 0) + 1 }
        : t
    );
    setToStorage(STORAGE_KEYS.TESTIMONIES, updated);
    fetchTestimonies();
    toast.success("Thank God with them! 🙏");
  };

  const viewFullTestimony = (testimony: Testimony) => {
    setSelectedTestimony(testimony);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (testimony: Testimony) => {
    if (testimony.status === 'approved') {
      return <Badge className="bg-green-500 text-white">Approved</Badge>;
    } else if (testimony.status === 'rejected') {
      return <Badge variant="destructive">Rejected • {testimony.rejection_reason}</Badge>;
    } else {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-2">
                Stories of His Faithfulness
              </h1>
              <p className="text-sm md:text-base text-muted-foreground italic">
                "This is the Lord's doing; it is marvellous in our eyes." — Psalm 118:23
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => navigate("/dashboard")} size="icon" className="md:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Dashboard</TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="hidden md:flex">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Tabs - Mobile Scrollable */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max md:min-w-0">
              <Button
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                onClick={() => setActiveTab('feed')}
                className="flex-shrink-0"
              >
                <BookOpen className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Public Feed</span>
              </Button>
              <Button
                variant={activeTab === 'my-testimonies' ? 'default' : 'outline'}
                onClick={() => setActiveTab('my-testimonies')}
                className="flex-shrink-0"
              >
                <Heart className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">My Testimonies</span>
              </Button>
            </div>
          </div>

          {/* Share Testimony Form */}
          {activeTab === 'my-testimonies' && (
            <Card className="mb-8 shadow-medium">
              <CardHeader>
                <CardTitle>Share Your Testimony</CardTitle>
                <CardDescription>Share what God has done</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Alias */}
                  <div>
                    <Label htmlFor="alias">Alias *</Label>
                    <Input
                      id="alias"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="Anonymous Seeker"
                      required
                      maxLength={50}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                      maxLength={100}
                    />
                  </div>

                  {/* Related Prayer Series */}
                  <div>
                    <Label htmlFor="series">Related Prayer Series</Label>
                    <Select value={relatedSeries} onValueChange={setRelatedSeries}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a series (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {guidelines.map((g) => (
                          <SelectItem key={g.id} value={`Week ${g.week_number}: ${g.title}`}>
                            Week {g.week_number}: {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Testimony Text */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Your Testimony *</Label>
                      <span className={`text-sm ${wordCount < 100 || wordCount > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {wordCount} / 200 words
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your story of answered prayer (100-200 words)"
                      required
                      rows={6}
                      className="resize-none"
                    />
                    {(wordCount < 100 && wordCount > 0) && (
                      <p className="text-xs text-destructive mt-1">Minimum 100 words required</p>
                    )}
                    {wordCount > 200 && (
                      <p className="text-xs text-destructive mt-1">Maximum 200 words exceeded</p>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="consent"
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                    />
                    <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                      By submitting, I confirm this story is true to the best of my knowledge and that it doesn't reveal another person's private information. 
                      I grant M6V33 a non-exclusive right to display and lightly edit my testimony for clarity and encouragement.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!consentChecked || wordCount < 100 || wordCount > 200}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Submit for Review</span>
                    <span className="md:hidden">Submit</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* My Testimonies List */}
          {activeTab === 'my-testimonies' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold">My Submissions</h2>
              {myTestimonies.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    You haven't shared any testimonies yet.
                  </CardContent>
                </Card>
              ) : (
                myTestimonies.map((testimony) => (
                  <Card key={testimony.id} className="shadow-soft hover:shadow-medium transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{testimony.alias}</CardTitle>
                          {testimony.location && (
                            <CardDescription>{testimony.location}</CardDescription>
                          )}
                        </div>
                        {getStatusBadge(testimony)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80 mb-3">
                        {truncateText(testimony.content, 150)}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewFullTestimony(testimony)}
                            >
                              <BookOpen className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Read More</span>
                              <span className="md:hidden">Read</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Read full testimony</TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">
                          {new Date(testimony.date).toLocaleDateString()}
                        </span>
                      </div>
                      {testimony.rejection_reason && (
                        <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                          <p className="text-sm text-foreground/80 mt-1">{testimony.rejection_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Public Feed */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold">Community Testimonies</h2>
              {testimonies.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No testimonies have been shared yet. Be the first to share!
                  </CardContent>
                </Card>
              ) : (
                testimonies.map((testimony) => (
                  <Card key={testimony.id} className="shadow-soft hover:shadow-medium transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{testimony.alias}</CardTitle>
                          <CardDescription>
                            {testimony.location && `${testimony.location} • `}
                            {testimony.related_series || 'General Testimony'}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500 text-white hidden md:flex">Approved</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80 mb-4">
                        {truncateText(testimony.content, 150)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewFullTestimony(testimony)}
                            >
                              <BookOpen className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Read More</span>
                              <span className="md:hidden">Read</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Read full testimony</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGratitude(testimony.id)}
                            >
                              <Heart className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Thank God With Them ({testimony.gratitude_count})</span>
                              <span className="md:hidden">{testimony.gratitude_count}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Thank God with them</TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Legal Disclaimer */}
          <Card className="mt-8 border-muted">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> Testimonies reflect personal experiences and are not verified claims. 
                M6V33 does not offer medical, financial, or legal advice and is not responsible for outcomes mentioned. 
                All stories are reviewed for tone and privacy before publication.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Full Testimony Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedTestimony?.alias}</DialogTitle>
            </DialogHeader>
            {selectedTestimony && (
              <div className="space-y-4">
                {selectedTestimony.location && (
                  <p className="text-sm text-muted-foreground">{selectedTestimony.location}</p>
                )}
                {selectedTestimony.related_series && (
                  <Badge variant="outline">{selectedTestimony.related_series}</Badge>
                )}
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedTestimony.content}
                </p>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Shared on {new Date(selectedTestimony.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Testimonies;

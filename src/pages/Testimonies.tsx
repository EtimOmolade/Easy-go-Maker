import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Heart, BookOpen, Edit, Trash2 } from "lucide-react";
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
  status: string; // Change to string instead of literal union
  rejection_reason?: string;
  gratitude_count: number;
  journal_entry_id?: string;
  title?: string; // Add title field
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
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [journalEntryId, setJournalEntryId] = useState<string | null>(null);

  useEffect(() => {
    // Check for pre-filled data from journal
    const prefillData = sessionStorage.getItem('prefillTestimony');
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        setContent(data.content || '');
        setAlias(user?.user_metadata?.name || 'Anonymous Seeker');
        setJournalEntryId(data.journalEntryId || null);
        setActiveTab('my-testimonies');
        sessionStorage.removeItem('prefillTestimony');
        toast.success('Journal entry loaded! Please complete the remaining fields.');
      } catch (error) {
        console.error('Error parsing prefill data:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchTestimonies();
    fetchGuidelines();
  }, [user]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [content]);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from("guidelines")
        .select("id, title, month, day")
        .order("month", { ascending: true })
        .order("day", { ascending: true });

      if (error) throw error;
      setGuidelines((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching guidelines:", error);
    }
  };

  const fetchTestimonies = async () => {
    if (!user) return;

    try {
      // Fetch approved testimonies for public feed
      const { data: approvedData, error: approvedError } = await supabase
        .from("testimonies")
        .select(`
          *,
          profiles!testimonies_user_id_fkey (name)
        `)
        .eq("status", "approved")
        .order("date", { ascending: false });

      if (approvedError) throw approvedError;
      setTestimonies(approvedData || []);

      // Fetch user's own testimonies (all statuses)
      const { data: myData, error: myError } = await supabase
        .from("testimonies")
        .select(`
          *,
          profiles!testimonies_user_id_fkey (name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (myError) throw myError;
      setMyTestimonies(myData || []);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
      toast.error("Failed to load testimonies");
    }
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

    if (wordCount > 200) {
      toast.error("Testimony must be 200 words or less");
      return;
    }

    try {
      // Save testimony to Supabase
      const { data: newTestimony, error: testimonyError } = await supabase
        .from("testimonies")
        .insert([{
          user_id: user.id,
          title: `${alias}'s Testimony`, // Add title field
          alias,
          location: location || null,
          content,
          related_series: relatedSeries || null,
          date: new Date().toISOString(),
          status: 'pending',
          approved: false,
          gratitude_count: 0,
          journal_entry_id: journalEntryId || null
        }])
        .select()
        .single();

      if (testimonyError) throw testimonyError;

      // Note: Announcements are only created when admin approves the testimony
      // No announcement on submission - admins will see pending testimonies in admin panel

      // Update journal entry if this was shared from journal
      if (journalEntryId) {
        const { error: journalUpdateError } = await supabase
          .from("journal_entries")
          .update({
            is_shared: true
          })
          .eq("id", journalEntryId);

        if (journalUpdateError) console.error("Error updating journal entry:", journalUpdateError);
        setJournalEntryId(null);
      }

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

  const handleGratitude = async (testimonyId: string) => {
    if (!user) {
      toast.error("You must be logged in to celebrate testimonies");
      return;
    }

    try {
      // Check if user has already celebrated this testimony
      const { data: existingGratitude, error: checkError } = await supabase
        .from("testimony_gratitudes")
        .select("*")
        .eq("testimony_id", testimonyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingGratitude) {
        // User has already celebrated - remove celebration (toggle off)
        const { error: deleteError } = await supabase
          .from("testimony_gratitudes")
          .delete()
          .eq("testimony_id", testimonyId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        // Decrement gratitude count
        const { data: testimony } = await supabase
          .from("testimonies")
          .select("gratitude_count")
          .eq("id", testimonyId)
          .single();

        await supabase
          .from("testimonies")
          .update({ gratitude_count: Math.max(0, (testimony?.gratitude_count || 1) - 1) })
          .eq("id", testimonyId);

        toast.success("Celebration removed");
      } else {
        // User hasn't celebrated yet - add celebration (toggle on)
        const { error: insertError } = await supabase
          .from("testimony_gratitudes")
          .insert({
            testimony_id: testimonyId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        // Increment gratitude count
        const { data: testimony } = await supabase
          .from("testimonies")
          .select("gratitude_count")
          .eq("id", testimonyId)
          .single();

        await supabase
          .from("testimonies")
          .update({ gratitude_count: (testimony?.gratitude_count || 0) + 1 })
          .eq("id", testimonyId);

        toast.success("Thank God with them! 🙏");
      }

      await fetchTestimonies();
    } catch (error) {
      console.error("Error toggling gratitude:", error);
      toast.error("Failed to update celebration");
    }
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

  const handleEditTestimony = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setAlias(testimony.alias);
    setLocation(testimony.location || "");
    setContent(testimony.content);
    setRelatedSeries(testimony.related_series || "");
    setConsentChecked(true);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTestimony = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !editingTestimony) return;

    if (!consentChecked) {
      toast.error("Please agree to the consent statement");
      return;
    }

    if (wordCount > 200) {
      toast.error("Testimony must be 200 words or less");
      return;
    }

    try {
      // Update testimony in Supabase
      const { error: updateError } = await supabase
        .from("testimonies")
        .update({
          alias,
          location: location || null,
          content,
          related_series: relatedSeries || null,
          status: 'pending',
          approved: false,
          rejection_reason: null
        })
        .eq("id", editingTestimony.id);

      if (updateError) throw updateError;

      // Note: Announcements are only created when admin approves the testimony
      // No announcement on update - admins will see pending testimonies in admin panel

      toast.success("Testimony updated and sent for approval");

      setIsEditDialogOpen(false);
      setEditingTestimony(null);
      setAlias("Anonymous Seeker");
      setLocation("");
      setContent("");
      setRelatedSeries("");
      setConsentChecked(false);
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error updating testimony:', error);
      toast.error('Failed to update testimony');
    }
  };

  const handleDeleteTestimony = async (testimonyId: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("testimonies")
        .delete()
        .eq("id", testimonyId);

      if (deleteError) throw deleteError;

      toast.success("Testimony deleted");
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error deleting testimony:', error);
      toast.error('Failed to delete testimony');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 flex items-center gap-3">
              <Heart className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Stories of His Faithfulness
                </h1>
                <p className="text-sm md:text-base text-muted-foreground italic">
                  "This is the Lord's doing; it is marvellous in our eyes." — Psalm 118:23
                </p>
              </div>
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
                          <SelectItem key={g.id} value={`${g.title}`}>
                            {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Testimony Text */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Your Testimony *</Label>
                      <span className={`text-sm ${wordCount > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {wordCount} / 200 words
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your story of answered prayer (max 200 words)"
                      required
                      rows={6}
                      className="resize-none"
                    />
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
                      I grant Spirit Connect a non-exclusive right to display and lightly edit my testimony for clarity and encouragement.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!consentChecked || wordCount === 0 || wordCount > 200}
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
                       <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
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
                          {testimony.status !== 'approved' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTestimony(testimony)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="hidden md:inline ml-1">Edit</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit testimony</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTestimony(testimony.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden md:inline ml-1">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete testimony</TooltipContent>
                          </Tooltip>
                        </div>
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
                Spirit Connect does not offer medical, financial, or legal advice and is not responsible for outcomes mentioned.
                All stories are reviewed for tone and privacy before publication.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Testimony Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingTestimony(null);
            setAlias("Anonymous Seeker");
            setLocation("");
            setContent("");
            setRelatedSeries("");
            setConsentChecked(false);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Testimony</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTestimony} className="space-y-4">
              <div>
                <Label htmlFor="edit-alias">Alias *</Label>
                <Input
                  id="edit-alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Anonymous Seeker"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Location (optional)</Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="edit-series">Related Prayer Series</Label>
                <Select value={relatedSeries} onValueChange={setRelatedSeries}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {guidelines.map((g) => (
                      <SelectItem key={g.id} value={`${g.title}`}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="edit-content">Your Testimony *</Label>
                  <span className={`text-sm ${wordCount > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {wordCount} / 200 words
                  </span>
                </div>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your story of answered prayer (max 200 words)"
                  required
                  rows={6}
                  className="resize-none"
                />
                {wordCount > 200 && (
                  <p className="text-xs text-destructive mt-1">Maximum 200 words exceeded</p>
                )}
              </div>

              <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="edit-consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label htmlFor="edit-consent" className="text-sm leading-relaxed cursor-pointer">
                  By submitting, I confirm this story is true to the best of my knowledge and that it doesn't reveal another person's private information.
                  I grant Spirit Connect a non-exclusive right to display and lightly edit my testimony for clarity and encouragement.
                </label>
              </div>

              <Button
                type="submit"
                disabled={!consentChecked || wordCount === 0 || wordCount > 200}
                className="w-full"
              >
                Update & Resubmit for Approval
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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

import { useEffect, useState } from "react";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Check, X, Trash2, Megaphone, Shield, UserPlus, UserMinus, Clock, AlertTriangle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Testimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  approved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  resubmitted_at?: string;
  profiles: {
    name: string;
  };
}

interface EncouragementMessage {
  id: string;
  content: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  adminSince?: string;
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
}

interface Guideline {
  id: string;
  title: string;
  week_number: number;
  content: string;
  date_uploaded: string;
}

const Admin = () => {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [encouragementMessages, setEncouragementMessages] = useState<EncouragementMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEncouragementDialogOpen, setIsEncouragementDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [content, setContent] = useState("");
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [encouragementContent, setEncouragementContent] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<ProfileUser[]>([]);
  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [rejectingTestimony, setRejectingTestimony] = useState<Testimony | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonies();
    fetchEncouragementMessages();
    fetchGuidelines();
    fetchUsers();
  }, []);

  const fetchGuidelines = async () => {
    // Prototype mode: Fetch from localStorage
    const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, [] as any[]);
    const sortedGuidelines = guidelines.sort((a: any, b: any) => b.week_number - a.week_number);
    setGuidelines(sortedGuidelines);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from('guidelines')
    //   .select('*')
    //   .order('week_number', { ascending: false });
    //
    // if (error) {
    //   console.error('Error fetching guidelines:', error);
    //   toast.error('Failed to load guidelines');
    // } else {
    //   setGuidelines(data || []);
    // }
  };

  const fetchUsers = async () => {
    try {
      // Prototype mode: Fetch from localStorage
      const profiles = getFromStorage(STORAGE_KEYS.PROFILES, {});
      const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});

      // Convert profiles object to array
      const allProfiles = Object.keys(profiles).map(id => ({
        id,
        name: profiles[id].name || 'Unknown',
        email: profiles[id].email || ''
      }));
      setAllUsers(allProfiles);

      // Get admins
      const admins: AdminUser[] = Object.keys(userRoles)
        .filter(userId => userRoles[userId] === 'admin')
        .map(userId => ({
          id: userId,
          name: profiles[userId]?.name || 'Unknown',
          email: profiles[userId]?.email || '',
          isAdmin: true,
          adminSince: new Date().toISOString() // Prototype doesn't track this
        }));

      setAdminUsers(admins);

      // Backend integration - Supabase COMMENTED OUT
      // const { data: profiles, error: profilesError } = await supabase
      //   .from('profiles')
      //   .select('id, name, email');
      //
      // if (profilesError) throw profilesError;
      // setAllUsers(profiles || []);
      //
      // const { data: adminRoles, error: rolesError } = await supabase
      //   .from('user_roles')
      //   .select('user_id, created_at')
      //   .eq('role', 'admin')
      //   .order('created_at', { ascending: true });
      //
      // if (rolesError) throw rolesError;
      //
      // const admins: AdminUser[] = (adminRoles || []).map(role => {
      //   const profile = profiles?.find(p => p.id === role.user_id);
      //   return {
      //     id: role.user_id,
      //     name: profile?.name || 'Unknown',
      //     email: profile?.email || '',
      //     isAdmin: true,
      //     adminSince: role.created_at
      //   };
      // });
      //
      // setAdminUsers(admins);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchTestimonies = async () => {
    // Prototype mode: Fetch from localStorage
    const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const sortedTestimonies = testimonies.sort((a: any, b: any) =>
      new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()
    );
    setTestimonies(sortedTestimonies);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from('testimonies')
    //   .select('id, title, content, date, approved, profiles(name)')
    //   .order('date', { ascending: false });
    //
    // if (error) {
    //   console.error('Error fetching testimonies:', error);
    //   toast.error('Failed to load testimonies');
    // } else {
    //   setTestimonies(data || []);
    // }
  };

  const fetchEncouragementMessages = async () => {
    // Prototype mode: Fetch from localStorage
    const messages = getFromStorage(STORAGE_KEYS.ENCOURAGEMENT, [] as any[]);
    const sortedMessages = messages
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    setEncouragementMessages(sortedMessages);

    // Backend integration - Supabase COMMENTED OUT
    // const { data, error } = await supabase
    //   .from('encouragement_messages')
    //   .select('*')
    //   .order('created_at', { ascending: false })
    //   .limit(10);
    //
    // if (error) {
    //   console.error('Error fetching encouragement messages:', error);
    //   toast.error('Failed to load encouragement messages');
    // } else {
    //   setEncouragementMessages(data || []);
    // }
  };

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prototype mode: Update in localStorage
      const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, []);
      
      if (editingGuideline) {
        // Update existing guideline
        const guidelineIndex = guidelines.findIndex((g: any) => g.id === editingGuideline.id);
        if (guidelineIndex !== -1) {
          guidelines[guidelineIndex] = {
            ...guidelines[guidelineIndex],
            title,
            week_number: parseInt(weekNumber),
            content
          };
        }
        toast.success("Guideline updated successfully");
      } else {
        // Create new guideline
        const newGuideline = {
          id: `guideline-${Date.now()}`,
          title,
          week_number: parseInt(weekNumber),
          content,
          date_uploaded: new Date().toISOString()
        };
        guidelines.push(newGuideline);
        toast.success("📖 Guideline created!");
      }
      
      setToStorage(STORAGE_KEYS.GUIDELINES, guidelines);

      // Backend integration - Supabase COMMENTED OUT
      // if (editingGuideline) {
      //   const { error } = await supabase
      //     .from('guidelines')
      //     .update({
      //       title,
      //       week_number: parseInt(weekNumber),
      //       content
      //     })
      //     .eq('id', editingGuideline.id);
      //
      //   if (error) throw error;
      //   toast.success("Guideline updated successfully");
      // } else {
      //   const { error } = await supabase
      //     .from('guidelines')
      //     .insert({
      //       title,
      //       week_number: parseInt(weekNumber),
      //       content,
      //       date_uploaded: new Date().toISOString()
      //     });
      //
      //   if (error) throw error;
      //
      //   await supabase.from('encouragement_messages').insert({
      //     content: `📖 New Prayer Guideline Available!\n\nWeek ${weekNumber}: "${title}"\n\nStart your prayer journey for this week. Check the Guidelines page to see the full content and begin your daily prayers! 🙏`,
      //     created_at: new Date().toISOString()
      //   });
      //
      //   toast.success("📖 Guideline created and all users notified!");
      // }

      setTitle("");
      setWeekNumber("");
      setContent("");
      setEditingGuideline(null);
      setIsDialogOpen(false);
      await fetchGuidelines();
    } catch (error: any) {
      console.error('Error creating/updating guideline:', error);
      toast.error(error.message || 'Failed to save guideline');
    }
  };

  const handleEditGuideline = (guideline: Guideline) => {
    setEditingGuideline(guideline);
    setTitle(guideline.title);
    setWeekNumber(String(guideline.week_number));
    setContent(guideline.content);
    setIsDialogOpen(true);
  };

  const handleDeleteGuideline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guideline?")) return;

    try {
      // Prototype mode: Delete from localStorage
      const guidelines = getFromStorage(STORAGE_KEYS.GUIDELINES, []);
      const filtered = guidelines.filter((g: any) => g.id !== id);
      setToStorage(STORAGE_KEYS.GUIDELINES, filtered);
      toast.success("Guideline deleted");
      await fetchGuidelines();

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from('guidelines')
      //   .delete()
      //   .eq('id', id);
      //
      // if (error) throw error;
      // toast.success("Guideline deleted");
      // await fetchGuidelines();
    } catch (error: any) {
      console.error('Error deleting guideline:', error);
      toast.error(error.message || 'Failed to delete guideline');
    }
  };

  const handleCreateEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Prototype mode: Save to localStorage
      const messages = getFromStorage(STORAGE_KEYS.ENCOURAGEMENT, []);
      const newMessage = {
        id: `encourage-${Date.now()}`,
        content: encouragementContent,
        created_at: new Date().toISOString(),
        created_by: user.id
      };
      messages.push(newMessage);
      setToStorage(STORAGE_KEYS.ENCOURAGEMENT, messages);
      
      toast.success("✨ New daily encouragement posted!");
      setEncouragementContent("");
      setIsEncouragementDialogOpen(false);
      await fetchEncouragementMessages();

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from('encouragement_messages')
      //   .insert({
      //     content: encouragementContent,
      //     created_at: new Date().toISOString()
      //   });
      //
      // if (error) throw error;
      // toast.success("✨ New daily encouragement posted!");
      // setEncouragementContent("");
      // setIsEncouragementDialogOpen(false);
      // await fetchEncouragementMessages();
    } catch (error: any) {
      console.error('Error posting encouragement:', error);
      toast.error(error.message || 'Failed to post encouragement message');
    }
  };

  const handleDeleteEncouragement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this encouragement message?")) return;

    try {
      // Prototype mode: Delete from localStorage
      const messages = getFromStorage(STORAGE_KEYS.ENCOURAGEMENT, []);
      const filtered = messages.filter((m: any) => m.id !== id);
      setToStorage(STORAGE_KEYS.ENCOURAGEMENT, filtered);
      toast.success("Message deleted");
      await fetchEncouragementMessages();

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from('encouragement_messages')
      //   .delete()
      //   .eq('id', id);
      //
      // if (error) throw error;
      // toast.success("Message deleted");
      // await fetchEncouragementMessages();
    } catch (error: any) {
      console.error('Error deleting encouragement:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const handleApproveTestimony = async (id: string) => {
    // Prototype mode: Update in localStorage
    const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const testimonyIndex = testimonies.findIndex((t: any) => t.id === id);
    
    if (testimonyIndex !== -1) {
      testimonies[testimonyIndex].approved = true;
      testimonies[testimonyIndex].status = 'approved';
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
      toast.success("✨ Testimony approved!");
      await fetchTestimonies();
    }

    // Backend integration - Supabase COMMENTED OUT
    // try {
    //   const { data: testimony } = await supabase
    //     .from('testimonies')
    //     .select('title, profiles(name)')
    //     .eq('id', id)
    //     .single();
    //
    //   const { error } = await supabase
    //     .from('testimonies')
    //     .update({ approved: true, status: 'approved' })
    //     .eq('id', id);
    //
    //   if (error) throw error;
    //
    //   if (testimony) {
    //     await supabase.from('encouragement_messages').insert({
    //       content: `✨ New Testimony Shared!\n\n"${testimony.title}"\n\nA member of our community has shared an inspiring testimony. Visit the Testimonies page to read about how God is working in their life! 🙌`,
    //       created_at: new Date().toISOString()
    //     });
    //   }
    //
    //   toast.success("✨ Testimony approved and community notified!");
    //   await fetchTestimonies();
    // } catch (error: any) {
    //   console.error('Error approving testimony:', error);
    //   toast.error(error.message || 'Failed to approve testimony');
    // }
  };

  const handleRejectTestimony = async () => {
    if (!rejectingTestimony) return;

    const finalReason = rejectionReason === "Other (specify)" ? customReason : rejectionReason;
    
    if (!finalReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    // Prototype mode: Update in localStorage
    const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, [] as any[]);
    const testimonyIndex = testimonies.findIndex((t: any) => t.id === rejectingTestimony.id);
    
    if (testimonyIndex !== -1) {
      testimonies[testimonyIndex].approved = false;
      testimonies[testimonyIndex].status = 'rejected';
      testimonies[testimonyIndex].rejection_reason = finalReason;
      setToStorage(STORAGE_KEYS.TESTIMONIES, testimonies);
      toast.success("Testimony rejected");
      setRejectingTestimony(null);
      setRejectionReason("");
      setCustomReason("");
      await fetchTestimonies();
    }

    // Backend integration - Supabase COMMENTED OUT
    // try {
    //   const { error } = await supabase
    //     .from('testimonies')
    //     .update({ 
    //       approved: false, 
    //       status: 'rejected',
    //       rejection_reason: finalReason
    //     })
    //     .eq('id', rejectingTestimony.id);
    //
    //   if (error) throw error;
    //
    //   toast.success("Testimony rejected");
    //   setRejectingTestimony(null);
    //   setRejectionReason("");
    //   setCustomReason("");
    //   await fetchTestimonies();
    // } catch (error: any) {
    //   console.error('Error rejecting testimony:', error);
    //   toast.error(error.message || 'Failed to reject testimony');
    // }
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;

    try {
      // Prototype mode: Delete from localStorage
      const testimonies = getFromStorage(STORAGE_KEYS.TESTIMONIES, []);
      const filtered = testimonies.filter((t: any) => t.id !== id);
      setToStorage(STORAGE_KEYS.TESTIMONIES, filtered);
      toast.success("Testimony deleted");
      await fetchTestimonies();

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from('testimonies')
      //   .delete()
      //   .eq('id', id);
      //
      // if (error) throw error;
      // toast.success("Testimony deleted");
      // await fetchTestimonies();
    } catch (error: any) {
      console.error('Error deleting testimony:', error);
      toast.error(error.message || 'Failed to delete testimony');
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      const targetUser = allUsers.find(u => u.id === userId);

      // Prototype mode: Update in localStorage
      const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});
      
      if (userRoles[userId] === 'admin') {
        toast.error('User is already an admin');
        return;
      }

      userRoles[userId] = 'admin';
      setToStorage(STORAGE_KEYS.USER_ROLES, userRoles);

      toast.success(`${targetUser?.name || 'User'} has been promoted to admin`);
      setShowPromoteDialog(false);
      setSearchEmail("");
      await fetchUsers();

      // Backend integration - Supabase COMMENTED OUT
      // const { data: existingRole } = await supabase
      //   .from('user_roles')
      //   .select('role')
      //   .eq('user_id', userId)
      //   .eq('role', 'admin')
      //   .maybeSingle();
      //
      // if (existingRole) {
      //   toast.error('User is already an admin');
      //   return;
      // }
      //
      // const { error } = await supabase
      //   .from('user_roles')
      //   .update({ role: 'admin' })
      //   .eq('user_id', userId)
      //   .eq('role', 'user');
      //
      // if (error) throw error;
      // toast.success(`${targetUser?.name || 'User'} has been promoted to admin`);
      // setShowPromoteDialog(false);
      // setSearchEmail("");
      // await fetchUsers();
    } catch (error: any) {
      console.error('Error promoting user:', error);
      toast.error(error.message || 'Failed to promote user');
    }
  };

  const handleDemoteAdmin = async () => {
    if (!demoteTarget || !user) return;

    try {
      // Check precedence first
      if (!canDemote(demoteTarget)) {
        toast.error("Cannot demote this admin - they have precedence over you");
        setDemoteTarget(null);
        return;
      }

      // Prototype mode: Update in localStorage
      const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {});
      delete userRoles[demoteTarget.id];
      setToStorage(STORAGE_KEYS.USER_ROLES, userRoles);

      toast.success(`${demoteTarget.name} has been demoted to regular user`);
      setDemoteTarget(null);
      await fetchUsers();

      // Backend integration - Supabase COMMENTED OUT
      // const { error } = await supabase
      //   .from('user_roles')
      //   .update({ role: 'user' })
      //   .eq('user_id', demoteTarget.id)
      //   .eq('role', 'admin');
      //
      // if (error) throw error;
      // toast.success(`${demoteTarget.name} has been demoted to regular user`);
      // setDemoteTarget(null);
      // await fetchUsers();
    } catch (error: any) {
      console.error('Error demoting admin:', error);
      toast.error(error.message || 'Failed to demote admin');
      setDemoteTarget(null);
    }
  };

  const canDemote = (targetAdmin: AdminUser): boolean => {
    if (!user || !targetAdmin.adminSince) return false;
    if (targetAdmin.id === user.id) return false; // Cannot demote yourself

    const currentAdmin = adminUsers.find(a => a.id === user.id);
    if (!currentAdmin?.adminSince) return false;

    // Can only demote admins who became admin after you
    return new Date(targetAdmin.adminSince) >= new Date(currentAdmin.adminSince);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredNonAdmins = allUsers.filter(u => {
    // Filter out users who are already admins
    const isAlreadyAdmin = adminUsers.some(admin => admin.id === u.id);
    return !isAlreadyAdmin &&
      (u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
       u.name.toLowerCase().includes(searchEmail.toLowerCase()));
  });

  const pendingTestimonies = testimonies.filter((t) => !t.approved);
  const approvedTestimonies = testimonies.filter((t) => t.approved);

  return (
    <TooltipProvider>
      <div className="min-h-screen gradient-subtle">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Dashboard</TooltipContent>
          </Tooltip>

        <h1 className="text-4xl font-heading font-bold gradient-primary bg-clip-text text-transparent mb-8">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="guidelines" className="space-y-6">
            <div className="w-full md:overflow-visible overflow-x-auto">
              <TabsList className="inline-flex md:grid w-auto md:w-full min-w-full md:grid-cols-4">
                <TabsTrigger value="guidelines" className="whitespace-nowrap flex-shrink-0">
                  Prayer Guidelines
                </TabsTrigger>
                <TabsTrigger value="encouragement" className="whitespace-nowrap flex-shrink-0">
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="testimonies" className="whitespace-nowrap flex-shrink-0">
                  Testimonies
                  {pendingTestimonies.length > 0 && (
                    <span className="ml-2 bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
                      {pendingTestimonies.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users" className="whitespace-nowrap flex-shrink-0">
                  Admin Users
                </TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="guidelines">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Prayer Guidelines Management</CardTitle>
                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                      setEditingGuideline(null);
                      setTitle("");
                      setWeekNumber("");
                      setContent("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">New Guideline</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingGuideline ? 'Edit' : 'Create'} Prayer Guideline</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateGuideline} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Prayers for Peace" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="week">Week Number</Label>
                          <Input id="week" type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="1" required min="1" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter the prayer guideline content..." rows={12} required />
                        </div>
                        <Button type="submit" className="w-full">{editingGuideline ? 'Update' : 'Create'} Guideline</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {guidelines.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No guidelines yet. Create one to get started!</p>
                ) : (
                  guidelines.map((guideline) => (
                    <Card key={guideline.id} className="bg-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Week {guideline.week_number}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{guideline.title}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{guideline.content}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                              Uploaded {new Date(guideline.date_uploaded).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleEditGuideline(guideline)}>
                                  Edit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit guideline</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteGuideline(guideline.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete guideline</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encouragement">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-6 w-6 text-accent" />
                      Community Announcements
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Post announcements visible to all users on their dashboards. Announcements are also auto-posted when you create guidelines or approve testimonies. (Visible for 48 hours)
                    </p>
                  </div>
                  <Dialog open={isEncouragementDialogOpen} onOpenChange={setIsEncouragementDialogOpen}>
                    <DialogTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => {
                            setEncouragementContent("");
                            setIsEncouragementDialogOpen(true);
                          }}>
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">New Message</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Post a new encouragement message</TooltipContent>
                      </Tooltip>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Post Community Announcement</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateEncouragement} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="encouragement">Announcement</Label>
                          <Textarea id="encouragement" value={encouragementContent} onChange={(e) => setEncouragementContent(e.target.value)} placeholder="Write an encouraging message, teaching, or important announcement for the community..." rows={8} required />
                          <p className="text-xs text-muted-foreground">This announcement will appear on all user dashboards for 48 hours</p>
                        </div>
                        <Button type="submit" className="w-full">Post Announcement</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {encouragementMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No encouragement messages yet. Post one to inspire the community!</p>
                ) : (
                  encouragementMessages.map((message) => (
                    <Card key={message.id} className="bg-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4">
                          <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteEncouragement(message.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Posted {new Date(message.created_at).toLocaleDateString()} at {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonies">
            <div className="space-y-6">
              {pendingTestimonies.length > 0 && (
                <Card className="shadow-medium border-2 border-accent/20">
                  <CardHeader><CardTitle>Pending Approval ({pendingTestimonies.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {pendingTestimonies.map((testimony) => (
                      <Card key={testimony.id} className="bg-muted/50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 overflow-hidden">
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" onClick={() => handleApproveTestimony(testimony.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Approve testimony</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => {
                                      setRejectingTestimony(testimony);
                                      setRejectionReason("");
                                      setCustomReason("");
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reject testimony</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteTestimony(testimony.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete testimony</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap text-sm break-words overflow-y-auto max-h-[150px]">{testimony.content}</p></CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-medium">
                <CardHeader><CardTitle>Approved Testimonies ({approvedTestimonies.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {approvedTestimonies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No approved testimonies yet</p>
                  ) : (
                    approvedTestimonies.map((testimony) => (
                      <Card key={testimony.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 overflow-hidden">
                              <CardTitle className="text-lg">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteTestimony(testimony.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap text-sm break-words overflow-y-auto max-h-[150px]">{testimony.content}</p></CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-6 w-6 text-accent" />
                      Admin User Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Manage admin users and their permissions. Newer admins cannot demote older admins.
                    </p>
                  </div>
                  <Button onClick={() => setShowPromoteDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Promote User</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {adminUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No admins found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((admin, index) => (
                      <Card key={admin.id} className={index === 0 ? "border-2 border-accent/30" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{admin.name}</h4>
                                {index === 0 && (
                                  <Badge variant="default" className="bg-accent text-accent-foreground">
                                    Senior Admin
                                  </Badge>
                                )}
                                {admin.id === user?.id && (
                                  <Badge variant="secondary">You</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{admin.email}</p>

                              {admin.adminSince && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Admin since {formatDate(admin.adminSince)}
                                    <span className="ml-1">
                                      ({getDaysSince(admin.adminSince)} days ago)
                                    </span>
                                  </span>
                                </div>
                              )}

                              {!canDemote(admin) && admin.id !== user?.id && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Has precedence over you - cannot demote</span>
                                </div>
                              )}
                            </div>

                            {canDemote(admin) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDemoteTarget(admin)}
                                className="text-destructive hover:text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Demote
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Precedence Rules
                  </h5>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Admins are listed in order of seniority (oldest first)</li>
                    <li>You can only demote admins who became admin after you</li>
                    <li>You cannot demote yourself</li>
                    <li>Senior admins have permanent status from junior admins</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Promote User Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-email">Search by Name or Email</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  type="text"
                  placeholder="Search users..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {searchEmail && filteredNonAdmins.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <Label>Search Results ({filteredNonAdmins.length})</Label>
                {filteredNonAdmins.map((user) => (
                  <Card key={user.id} className="hover:bg-accent/5">
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePromoteUser(user.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Promote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchEmail && filteredNonAdmins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found matching "{searchEmail}"
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Demote Confirmation Dialog */}
      <AlertDialog open={!!demoteTarget} onOpenChange={() => setDemoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demote Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to demote <strong>{demoteTarget?.name}</strong> from admin to regular user?
              <br /><br />
              They will lose access to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Admin dashboard</li>
                <li>Content moderation</li>
                <li>User management</li>
                <li>Guideline management</li>
              </ul>
              <br />
              This action can be reversed by promoting them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemoteAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Demote Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Testimony Dialog */}
      <Dialog open={!!rejectingTestimony} onOpenChange={() => {
        setRejectingTestimony(null);
        setRejectionReason("");
        setCustomReason("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Testimony</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a reason for rejecting "{rejectingTestimony?.title}"
            </p>
            <div className="space-y-3">
              {[
                "Content doesn't align with guidelines",
                "Needs more detail",
                "Inappropriate content",
                "Duplicate",
                "Other (specify)"
              ].map((reason) => (
                <label key={reason} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
            {rejectionReason === "Other (specify)" && (
              <div>
                <Label htmlFor="custom-reason">Specify reason</Label>
                <Textarea
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingTestimony(null);
                  setRejectionReason("");
                  setCustomReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectTestimony}
                disabled={!rejectionReason || (rejectionReason === "Other (specify)" && !customReason)}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default Admin;

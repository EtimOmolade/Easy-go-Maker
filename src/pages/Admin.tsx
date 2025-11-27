
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Check, X, Trash2, Megaphone, Shield, UserPlus, UserMinus, Clock, AlertTriangle, Search, Edit, BookOpen, BarChart3, Users, Activity, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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
import { AudioPlayer } from "@/components/AudioPlayer";
import { AppHeader } from "@/components/AppHeader";

interface Testimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  approved: boolean;
  status: string; // Change from literal union to string
  rejection_reason?: string;
  admin_note?: string;
  rejected_by?: string;
  rejected_at?: string;
  resubmitted_at?: string;
  audio_note?: string;
  audio_duration?: number;
  alias?: string;
  location?: string;
  related_series?: string;
  gratitude_count?: number;
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
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const navigate = useNavigate();

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers7Days: 0,
    activeUsers30Days: 0,
    totalPrayers: 0,
    totalGuidelines: 0,
    totalTestimonies: 0,
    approvedTestimonies: 0,
    pendingTestimonies: 0,
    totalJournals: 0,
    totalAnnouncements: 0,
    avgStreakLength: 0,
    prayersByDay: [],
    voicePreferences: [],
    testimonyStats: []
  });

  useEffect(() => {
    fetchTestimonies();
    fetchEncouragementMessages();
    fetchGuidelines();
    fetchUsers();
    fetchAnalytics();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('guidelines')
        .select('*')
        .order('month', { ascending: false })
        .order('day', { ascending: false });

      if (error) {
        console.error('Error fetching guidelines:', error);
        toast.error('Failed to load guidelines');
      } else {
        setGuidelines(data || []);
      }
    } catch (error) {
      console.error('Error fetching guidelines:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers7 } = await supabase
        .from('daily_prayers')
        .select('user_id', { count: 'exact', head: true })
        .gte('completed_at', sevenDaysAgo.toISOString());

      // Active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers30 } = await supabase
        .from('daily_prayers')
        .select('user_id', { count: 'exact', head: true })
        .gte('completed_at', thirtyDaysAgo.toISOString());

      // Total prayers completed
      const { count: totalPrayers } = await supabase
        .from('daily_prayers')
        .select('*', { count: 'exact', head: true });

      // Total guidelines
      const { count: totalGuidelines } = await supabase
        .from('guidelines')
        .select('*', { count: 'exact', head: true });

      // Testimonies stats
      const { count: totalTestimonies } = await supabase
        .from('testimonies')
        .select('*', { count: 'exact', head: true });

      const { count: approvedTestimonies } = await supabase
        .from('testimonies')
        .select('*', { count: 'exact', head: true })
        .eq('approved', true);

      const { count: pendingTestimonies } = await supabase
        .from('testimonies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Total journal entries
      const { count: totalJournals } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true });

      // Total announcements
      const { count: totalAnnouncements } = await supabase
        .from('encouragement_messages')
        .select('*', { count: 'exact', head: true });

      // Average streak length
      const { data: profiles } = await supabase
        .from('profiles')
        .select('streak_count');
      const avgStreak = profiles?.length 
        ? profiles.reduce((sum, p) => sum + p.streak_count, 0) / profiles.length 
        : 0;

      // Prayers by day of week
      const { data: prayersByDay } = await supabase
        .from('daily_prayers')
        .select('day_of_week');
      
      const dayCount: Record<string, number> = {};
      prayersByDay?.forEach(p => {
        dayCount[p.day_of_week] = (dayCount[p.day_of_week] || 0) + 1;
      });

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const prayersByDayData = daysOfWeek.map(day => ({
        name: day.slice(0, 3),
        prayers: dayCount[day] || 0
      }));

      // Voice preferences
      const { data: voiceData } = await supabase
        .from('profiles')
        .select('voice_preference');
      
      const voiceCount: Record<string, number> = {};
      voiceData?.forEach(v => {
        const voice = v.voice_preference || 'sarah';
        voiceCount[voice] = (voiceCount[voice] || 0) + 1;
      });

      const voicePreferencesData = Object.entries(voiceCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Testimony status distribution
      const testimonyStatsData = [
        { name: 'Approved', value: approvedTestimonies || 0, color: '#22c55e' },
        { name: 'Pending', value: pendingTestimonies || 0, color: '#f59e0b' },
        { name: 'Other', value: (totalTestimonies || 0) - (approvedTestimonies || 0) - (pendingTestimonies || 0), color: '#64748b' }
      ];

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsers7Days: activeUsers7 || 0,
        activeUsers30Days: activeUsers30 || 0,
        totalPrayers: totalPrayers || 0,
        totalGuidelines: totalGuidelines || 0,
        totalTestimonies: totalTestimonies || 0,
        approvedTestimonies: approvedTestimonies || 0,
        pendingTestimonies: pendingTestimonies || 0,
        totalJournals: totalJournals || 0,
        totalAnnouncements: totalAnnouncements || 0,
        avgStreakLength: Math.round(avgStreak * 10) / 10,
        prayersByDay: prayersByDayData,
        voicePreferences: voicePreferencesData,
        testimonyStats: testimonyStatsData.filter(s => s.value > 0)
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const fetchUsers = async () => {
    try {
      // Backend integration - Supabase ACTIVATED
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;
      setAllUsers(profiles || []);

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: true });

      if (rolesError) throw rolesError;

      const admins: AdminUser[] = (adminRoles || []).map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.user_id,
          name: profile?.name || 'Unknown',
          email: profile?.email || '',
          isAdmin: true,
          adminSince: role.created_at
        };
      });

      setAdminUsers(admins);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchTestimonies = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonies')
        .select(`
          *,
          profiles!testimonies_user_id_fkey (name)
        `)
        .neq('status', 'rejected')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching testimonies:', error);
        toast.error('Failed to load testimonies');
      } else {
        setTestimonies(data || []);
      }
    } catch (error) {
      console.error('Error fetching testimonies:', error);
    }
  };

  const fetchEncouragementMessages = async () => {
    // Backend integration - Supabase ACTIVATED
    const { data, error } = await supabase
      .from('encouragement_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching encouragement messages:', error);
      toast.error('Failed to load encouragement messages');
    } else {
      setEncouragementMessages(data || []);
    }
  };

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGuideline) {
        // Update existing guideline
        const { error } = await supabase
          .from('guidelines')
          .update({
            title,
            content
          })
          .eq('id', editingGuideline.id);

        if (error) throw error;
        toast.success("Guideline updated successfully");
      } else {
        // Create new guideline - Note: This should probably be done via CreateGuideline page
        // But keeping this for quick admin access
        toast.info("Please use the Create Guideline page for proper guideline creation");
        navigate('/create-guideline');
        return;
      }

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
    // Navigate to CreateGuideline page with the guideline data for editing
    navigate('/create-guideline', { state: { guideline } });
  };

  const handleDeleteGuideline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guideline?")) return;

    try {
      const { error } = await supabase
        .from('guidelines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Guideline deleted");
      await fetchGuidelines();
    } catch (error: any) {
      console.error('Error deleting guideline:', error);
      toast.error(error.message || 'Failed to delete guideline');
    }
  };

  const handleCreateEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Backend integration - Supabase ACTIVATED
      const { error } = await supabase
        .from('encouragement_messages')
        .insert({
          content: encouragementContent,
          created_by: user.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("✨ New daily encouragement posted!");
      setEncouragementContent("");
      setIsEncouragementDialogOpen(false);
      await fetchEncouragementMessages();
    } catch (error: any) {
      console.error('Error posting encouragement:', error);
      toast.error(error.message || 'Failed to post encouragement message');
    }
  };

  const handleDeleteEncouragement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this encouragement message?")) return;

    try {
      // Backend integration - Supabase ACTIVATED
      const { error } = await supabase
        .from('encouragement_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Message deleted");
      await fetchEncouragementMessages();
    } catch (error: any) {
      console.error('Error deleting encouragement:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const handleApproveTestimony = async (id: string) => {
    try {
      // Get testimony details before updating
      const { data: testimony, error: fetchError } = await supabase
        .from('testimonies')
        .select('alias, title, content')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update testimony status to approved
      const { error: updateError } = await supabase
        .from('testimonies')
        .update({
          status: 'approved',
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create public announcement for approved testimony
      const alias = testimony?.alias || 'A member';
      const { error: announcementError } = await supabase
        .from('encouragement_messages')
        .insert([{
          content: `✨ New Testimony Approved!\n\n${alias} shared how God is working in their life. Visit the Testimonies page to read their story! 🙌`,
          type: 'testimony_approved',
          created_by: user?.id,
          created_at: new Date().toISOString()
        }]);

      if (announcementError) console.error('Error creating announcement:', announcementError);

      toast.success("✨ Testimony approved and posted to testimony page!");
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error approving testimony:', error);
      toast.error('Failed to approve testimony');
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

    try {
      // Update testimony status to rejected with reason
      const { error: updateError } = await supabase
        .from('testimonies')
        .update({
          status: 'rejected',
          approved: false,
          rejection_reason: finalReason,
          rejected_by: user?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', rejectingTestimony.id);

      if (updateError) throw updateError;

      toast.success(`Testimony rejected. User can see the rejection reason in their "My Testimonies" section.`);
      setRejectingTestimony(null);
      setRejectionReason("");
      setCustomReason("");
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error rejecting testimony:', error);
      toast.error('Failed to reject testimony');
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

  const handleEditTestimony = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setEditTitle(testimony.title);
    setEditContent(testimony.content);
  };

  const handleSaveTestimonyEdit = async () => {
    if (!editingTestimony || !user) return;

    try {
      const { error } = await supabase
        .from('testimonies')
        .update({
          title: editTitle,
          content: editContent,
          admin_note: `Edited by ${user.user_metadata?.name || 'Admin'} at ${new Date().toISOString()}`,
        })
        .eq('id', editingTestimony.id);

      if (error) throw error;

      toast.success("Testimony edited successfully");
      setEditingTestimony(null);
      setEditTitle("");
      setEditContent("");
      fetchTestimonies();
    } catch (error: any) {
      console.error('Error editing testimony:', error);
      toast.error(error.message || 'Failed to edit testimony');
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;

    try {
      const { error } = await supabase
        .from('testimonies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Testimony deleted");
      await fetchTestimonies();
    } catch (error: any) {
      console.error('Error deleting testimony:', error);
      toast.error(error.message || 'Failed to delete testimony');
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      const targetUser = allUsers.find(u => u.id === userId);

      // Backend integration - Supabase ACTIVATED
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        toast.error('User is already an admin');
        return;
      }

      // Try to update existing role first
      const { data: updated, error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId)
        .select();

      // If no rows were updated (user has no existing role), insert a new one
      if (!updateError && (!updated || updated.length === 0)) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      toast.success(`${targetUser?.name || 'User'} has been promoted to admin`);
      setShowPromoteDialog(false);
      setSearchEmail("");
      await fetchUsers();
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

      // Backend integration - Supabase ACTIVATED
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', demoteTarget.id)
        .eq('role', 'admin');

      if (error) throw error;
      toast.success(`${demoteTarget.name} has been demoted to regular user`);
      setDemoteTarget(null);
      await fetchUsers();
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

  // Filter: Only show pending testimonies (hide rejected ones from admin view)
  const pendingTestimonies = testimonies.filter((t) => t.status === 'pending');
  const approvedTestimonies = testimonies.filter((t) => t.approved);

  return (
    <TooltipProvider>
      <div className="min-h-screen relative overflow-hidden gradient-hero">
        {/* Static Background Gradient */}
        <div className="absolute inset-0 pointer-events-none" />

        <div className="max-w-6xl relative z-10 mx-auto p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <AppHeader showBack={true} backTo="/dashboard" />

            <Button onClick={() => navigate('/prayer-library')} className="text-white border-white/20 bg-white/10 hover:bg-white/20" variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Prayer Library</span>
              <span className="md:hidden">Library</span>
            </Button>
          </div>

        <div className="flex items-center gap-3 mb-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <Shield className="h-10 w-10 text-secondary" />
          </motion.div>
          <h1 className="text-4xl font-heading font-bold text-white drop-shadow-lg">
            Admin Dashboard
          </h1>
        </div>

        <Tabs defaultValue="guidelines" className="space-y-6">
            <div className="w-full md:overflow-visible overflow-x-auto">
              <TabsList className="inline-flex md:grid w-auto md:w-full min-w-full md:grid-cols-5">
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
                <TabsTrigger value="analytics" className="whitespace-nowrap flex-shrink-0">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="guidelines">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Prayer Guidelines Management</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Build structured, guided prayer sessions from your prayer library
                    </p>
                  </div>
                  <Button onClick={() => navigate('/create-guideline')}>
                    <Plus className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Build Guideline</span>
                    <span className="sm:hidden">New</span>
                  </Button>
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
                              {(guideline as any).day_of_week && (
                                <Badge variant="outline">{(guideline as any).day_of_week}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{guideline.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {(guideline as any).steps?.length || 0} prayer steps
                            </p>
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
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Megaphone className="h-6 w-6 text-primary" />
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
                            <span className="sm:hidden">New</span>
                            <span className="hidden sm:inline">New Message</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Post a new encouragement message</TooltipContent>
                      </Tooltip>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-xl border-primary/20">
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
                              <CardTitle className="text-lg text-foreground">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                              {testimony.resubmitted_at && (
                                <Badge variant="outline" className="mt-2">Resubmitted</Badge>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 flex-wrap max-w-[200px] justify-end">
                              <div className="grid grid-cols-2 gap-2 md:flex md:flex-row">
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
                                    <Button size="sm" variant="outline" onClick={() => handleEditTestimony(testimony)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit testimony</TooltipContent>
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
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {testimony.audio_note && (
                            <AudioPlayer audioBase64={testimony.audio_note} duration={testimony.audio_duration || 0} />
                          )}
                          <p className="whitespace-pre-wrap text-sm break-words overflow-y-auto max-h-[150px]">{testimony.content}</p>
                        </CardContent>
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
                              <CardTitle className="text-lg text-foreground">{testimony.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">By {testimony.profiles?.name} • {new Date(testimony.date).toLocaleDateString()}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteTestimony(testimony.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {testimony.audio_note && (
                            <AudioPlayer audioBase64={testimony.audio_note} duration={testimony.audio_duration || 0} />
                          )}
                          <p className="whitespace-pre-wrap text-sm break-words overflow-y-auto max-h-[150px]">{testimony.content}</p>
                        </CardContent>
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
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Shield className="h-6 w-6 text-primary" />
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
                                <div className="flex items-center gap-2 mt-2 text-sm text-secondary">
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

          {/* Analytics Tab Content */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.activeUsers7Days} active (7d)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Prayers</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalPrayers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prayers completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Streak</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avgStreakLength}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Days average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalJournals}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total entries
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Content Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{analytics.totalGuidelines}</div>
                    <p className="text-sm text-muted-foreground mt-1">Total guidelines created</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Testimonies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total</span>
                        <span className="text-xl font-bold">{analytics.totalTestimonies}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Approved</span>
                        <span className="text-lg font-semibold text-green-600">{analytics.approvedTestimonies}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-600">Pending</span>
                        <span className="text-lg font-semibold text-amber-600">{analytics.pendingTestimonies}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{analytics.totalAnnouncements}</div>
                    <p className="text-sm text-muted-foreground mt-1">Community messages sent</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prayers by Day of Week */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prayers by Day of Week</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    <ChartContainer
                      config={{
                        prayers: {
                          label: "Prayers",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[250px] sm:h-[300px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.prayersByDay} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="prayers" 
                            fill="hsl(var(--primary))"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Voice Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Voice Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    <ChartContainer
                      config={{
                        value: {
                          label: "Users",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[250px] sm:h-[300px] w-full mx-auto"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Pie
                            data={analytics.voicePreferences}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius="70%"
                            innerRadius="30%"
                            fill="hsl(var(--primary))"
                            dataKey="value"
                          >
                            {analytics.voicePreferences.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`hsl(var(--primary) / ${1 - index * 0.2})`}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* User Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Active Users (7 days)</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{analytics.activeUsers7Days}</span>
                        <span className="text-sm text-muted-foreground">
                          / {analytics.totalUsers} ({analytics.totalUsers > 0 ? Math.round((analytics.activeUsers7Days / analytics.totalUsers) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Active Users (30 days)</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{analytics.activeUsers30Days}</span>
                        <span className="text-sm text-muted-foreground">
                          / {analytics.totalUsers} ({analytics.totalUsers > 0 ? Math.round((analytics.activeUsers30Days / analytics.totalUsers) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Prayer Completion Rate</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {analytics.totalUsers > 0 ? Math.round((analytics.totalPrayers / analytics.totalUsers)) : 0}
                        </span>
                        <span className="text-sm text-muted-foreground">per user</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Promote User Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-xl border-primary/20">
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

      {/* Edit Testimony Dialog */}
      <Dialog open={!!editingTestimony} onOpenChange={() => {
        setEditingTestimony(null);
        setEditTitle("");
        setEditContent("");
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle>Edit Testimony (Admin)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-edit-title">Title</Label>
              <Input
                id="admin-edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Testimony title"
              />
            </div>
            <div>
              <Label htmlFor="admin-edit-content">Content</Label>
              <Textarea
                id="admin-edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit testimony content for clarity..."
                rows={12}
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
              <Button onClick={handleSaveTestimonyEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Testimony Dialog */}
      <Dialog open={!!rejectingTestimony} onOpenChange={() => {
        setRejectingTestimony(null);
        setRejectionReason("");
        setCustomReason("");
      }}>
        <DialogContent className="max-w-md bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-xl border-primary/20">
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

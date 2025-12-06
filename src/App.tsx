import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReminderSystem from "@/components/ReminderSystem";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DashboardSkeleton, JournalSkeleton, GuidelinesSkeleton } from "@/components/LoadingSkeleton";

// Eagerly loaded pages (public entry points)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyOTP from "./pages/VerifyOTP";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (protected routes)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const GuidelineDetails = lazy(() => import("./pages/GuidelineDetails"));
const GuidedPrayerSession = lazy(() => import("./pages/GuidedPrayerSession"));
const Journal = lazy(() => import("./pages/Journal"));
const Testimonies = lazy(() => import("./pages/Testimonies"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const PrayerLibrary = lazy(() => import("./pages/PrayerLibrary"));
const PrayerLibraryAdmin = lazy(() => import("./pages/PrayerLibraryAdmin"));
const CreateGuideline = lazy(() => import("./pages/CreateGuideline"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <FontSizeProvider>
        <OfflineProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <OfflineIndicator />
                <ReminderSystem />
                <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guidelines"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<GuidelinesSkeleton />}>
                    <Guidelines />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guideline/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<GuidelinesSkeleton />}>
                    <GuidelineDetails />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guided-session/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <GuidedPrayerSession />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<JournalSkeleton />}>
                    <Journal />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/testimonies"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<JournalSkeleton />}>
                    <Testimonies />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Admin />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prayer-library"
              element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <PrayerLibrary />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prayer-library-admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <PrayerLibraryAdmin />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-guideline"
              element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <CreateGuideline />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
        </OfflineProvider>
      </FontSizeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

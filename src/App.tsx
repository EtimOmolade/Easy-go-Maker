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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import Guidelines from "./pages/Guidelines";
import GuidelineDetails from "./pages/GuidelineDetails";
import GuidedPrayerSession from "./pages/GuidedPrayerSession";
import Journal from "./pages/Journal";
import Testimonies from "./pages/Testimonies";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import PrayerLibrary from "./pages/PrayerLibrary";
import PrayerLibraryAdmin from "./pages/PrayerLibraryAdmin";
import CreateGuideline from "./pages/CreateGuideline";
import NotFound from "./pages/NotFound";

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
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guidelines"
              element={
                <ProtectedRoute>
                  <Guidelines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guideline/:id"
              element={
                <ProtectedRoute>
                  <GuidelineDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guided-session/:id"
              element={
                <ProtectedRoute>
                  <GuidedPrayerSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <Journal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/testimonies"
              element={
                <ProtectedRoute>
                  <Testimonies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prayer-library"
              element={
                <ProtectedRoute requireAdmin>
                  <PrayerLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prayer-library-admin"
              element={
                <ProtectedRoute requireAdmin>
                  <PrayerLibraryAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-guideline"
              element={
                <ProtectedRoute requireAdmin>
                  <CreateGuideline />
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

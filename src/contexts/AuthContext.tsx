import React, { createContext, useContext, useEffect, useState } from "react";
// Backend integration - Supabase ACTIVATED
import { User, Session, supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { initializeMockData } from "@/data/mockData";
import { ensurePrayerLibraryInitialized } from "@/data/initializePrayerLibrary";

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAdmin: boolean;
  requiresOTP: boolean;
  pendingUser: User | null;
  verifiedDeviceToken: string | null;
  signOut: () => Promise<void>;
  signIn: (user: User) => void;
  setPendingAuth: (user: User | null, requiresOTP: boolean) => void;
  completeOTPVerification: (deviceToken?: string) => void;
  completeTrustedDeviceAuth: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [verifiedDeviceToken, setVerifiedDeviceToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Backend integration - Supabase ACTIVATED
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };


  useEffect(() => {
    // Initialize mock data for prototype (needed for localStorage-based features like milestones, etc.)
    initializeMockData();

    // Initialize prayer library with real client prayers
    ensurePrayerLibraryInitialized();

    // Backend integration - Supabase ACTIVATED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);

        // For PASSWORD_RECOVERY, set user immediately
        if (event === 'PASSWORD_RECOVERY') {
          setUser(session?.user ?? null);
          return;
        }

        // For SIGNED_IN - OAuth logins set user directly, password logins check 2FA
        if (event === 'SIGNED_IN') {
          // If there's no password (OAuth), authenticate immediately
          // Otherwise, Auth.tsx will handle 2FA check
          if (session?.user) {
            const currentUserId = session.user.id;
            const currentSession = session.user;
            
            // Check if user signed in with OAuth (no password)
            supabase.auth.getUser().then(({ data }) => {
              const hasPassword = data.user?.app_metadata?.provider === 'email';
              
              if (!hasPassword) {
                // OAuth login - set user directly
                setUser(currentSession);
                checkAdminStatus(currentUserId);
              }
              // Password login - Auth.tsx handles 2FA
            });
          }
          return;
        }

        // For TOKEN_REFRESHED, SIGNED_OUT, etc., update user normally
        setUser(session?.user ?? null);

        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  // SignIn handled automatically by Supabase onAuthStateChange listener
  const handleSignIn = (newUser: User) => {
    // Not needed anymore - Supabase handles this
    // Kept for backwards compatibility
    console.warn("handleSignIn is deprecated - Supabase handles authentication automatically");
  };

  // Set pending authentication state (used by Auth.tsx when 2FA is required)
  const setPendingAuth = (newPendingUser: User | null, needsOTP: boolean) => {
    setPendingUser(newPendingUser);
    setRequiresOTP(needsOTP);
  };

  // Complete OTP verification (called from VerifyOTP.tsx)
  const completeOTPVerification = (deviceToken?: string) => {
    if (pendingUser) {
      setUser(pendingUser);
      setPendingUser(null);
      setRequiresOTP(false);
      // Check admin status immediately after setting user
      checkAdminStatus(pendingUser.id);
      if (deviceToken) {
        setVerifiedDeviceToken(deviceToken);
        localStorage.setItem('device_trust_token', deviceToken);
      }
    }
  };

  // Complete authentication for trusted device (called from Auth.tsx)
  const completeTrustedDeviceAuth = (authUser: User) => {
    setUser(authUser);
    setPendingUser(null);
    setRequiresOTP(false);
    // Check admin status immediately after setting user
    checkAdminStatus(authUser.id);
  };

  const handleSignOut = async () => {
    try {
      // DON'T revoke device trust on logout
      // If user checked "Remember this device", it should persist across logouts
      // Only manual "Revoke device" button should remove trust

      // Backend integration - Supabase ACTIVATED
      await supabase.auth.signOut();

      // Clear session data but KEEP device_trust_token for next login
      localStorage.removeItem('POPUP_SHOWN');
      sessionStorage.removeItem('encouragement_popup_shown');
      // DON'T remove device_trust_token - user wants device remembered

      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setPendingUser(null);
      setRequiresOTP(false);
      setVerifiedDeviceToken(null);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        requiresOTP,
        pendingUser,
        verifiedDeviceToken,
        signOut: handleSignOut,
        signIn: handleSignIn,
        setPendingAuth,
        completeOTPVerification,
        completeTrustedDeviceAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

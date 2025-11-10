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

  useEffect(() => {
    // Initialize mock data for prototype (needed for localStorage-based features like milestones, etc.)
    initializeMockData();

    // Initialize prayer library with real client prayers
    ensurePrayerLibraryInitialized();

    // Backend integration - Supabase ACTIVATED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
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
      if (deviceToken) {
        setVerifiedDeviceToken(deviceToken);
        localStorage.setItem('device_trust_token', deviceToken);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      // Revoke current device trust on explicit logout
      const trustToken = localStorage.getItem('device_trust_token');
      if (trustToken && user) {
        await supabase
          .from('trusted_devices')
          .delete()
          .eq('trust_token', trustToken)
          .eq('user_id', user.id);
      }

      // Backend integration - Supabase ACTIVATED
      await supabase.auth.signOut();

      // Clear any prototype/localStorage data
      localStorage.removeItem('POPUP_SHOWN');
      sessionStorage.removeItem('encouragement_popup_shown');
      localStorage.removeItem('device_trust_token');

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
        completeOTPVerification
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

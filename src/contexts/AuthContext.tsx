import React, { createContext, useContext, useEffect, useState } from "react";
// Backend integration - Supabase ACTIVATED
import { User, Session, supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { initializeMockData } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signIn: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize mock data for prototype (needed for localStorage-based features like milestones, etc.)
    initializeMockData();

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

  const handleSignOut = async () => {
    try {
      // Backend integration - Supabase ACTIVATED
      await supabase.auth.signOut();

      // Clear any prototype/localStorage data
      localStorage.removeItem('POPUP_SHOWN');
      sessionStorage.removeItem('encouragement_popup_shown');

      setUser(null);
      setSession(null);
      setIsAdmin(false);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut: handleSignOut, signIn: handleSignIn }}>
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

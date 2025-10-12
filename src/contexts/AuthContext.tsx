import React, { createContext, useContext, useEffect, useState } from "react";
// Backend integration placeholder - Supabase imports commented out for prototype
// import { User, Session, supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { mockUsers, STORAGE_KEYS, initializeMockData, getFromStorage, setToStorage } from "@/data/mockData";

// Mock user type for prototype
interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize mock data
    initializeMockData();

    // Check for existing session in localStorage
    const currentUser = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    
    if (currentUser) {
      setUser(currentUser);
      setSession({ user: currentUser });
      
      // Check if admin based on email
      const isAdminUser = currentUser.email.endsWith('@admin.com');
      setIsAdmin(isAdminUser);
    }
    
    setLoading(false);

    // Backend integration: Uncomment when restoring Supabase
    /*
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
    */
  }, []);

  // Backend integration placeholder - commented for prototype
  /*
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
  */

  const handleSignOut = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.POPUP_SHOWN);
      
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      navigate("/auth");

      // Backend integration: Uncomment when restoring Supabase
      // await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut: handleSignOut }}>
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

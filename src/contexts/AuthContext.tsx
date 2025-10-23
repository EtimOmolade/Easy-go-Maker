import React, { createContext, useContext, useEffect, useState } from "react";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { User, Session, supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { mockUsers, STORAGE_KEYS, initializeMockData, getFromStorage, setToStorage } from "@/data/mockData";

// Prototype mode: Using mock User interface
interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

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
    // Initialize mock data for prototype
    initializeMockData();

    // Prototype mode: Check localStorage for current user
    const currentUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        setUser(currentUser);
        setSession({ user: currentUser });

        // Check if user is admin (mock admin check)
        const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES) || {};
        setIsAdmin(userRoles[currentUser.id] === 'admin');
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    setLoading(false);

    // Backend integration - Supabase COMMENTED OUT
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(
    //   (event, session) => {
    //     setSession(session);
    //     setUser(session?.user ?? null);
    //
    //     if (session?.user) {
    //       setTimeout(() => {
    //         checkAdminStatus(session.user.id);
    //       }, 0);
    //     } else {
    //       setIsAdmin(false);
    //     }
    //   }
    // );
    //
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    //   setUser(session?.user ?? null);
    //
    //   if (session?.user) {
    //     checkAdminStatus(session.user.id);
    //   }
    //   setLoading(false);
    // });
    //
    // return () => subscription.unsubscribe();
  }, []);

  // Backend integration - Supabase COMMENTED OUT
  // const checkAdminStatus = async (userId: string) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("user_roles")
  //       .select("role")
  //       .eq("user_id", userId)
  //       .eq("role", "admin")
  //       .maybeSingle();
  //
  //     if (!error && data) {
  //       setIsAdmin(true);
  //     } else {
  //       setIsAdmin(false);
  //     }
  //   } catch (error) {
  //     console.error("Error checking admin status:", error);
  //     setIsAdmin(false);
  //   }
  // };

  const handleSignIn = (newUser: User) => {
    setUser(newUser);
    setSession({ user: newUser });

    // Prototype mode: Check admin from localStorage
    const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES) || {};
    setIsAdmin(userRoles[newUser.id] === 'admin');

    // Backend integration - Supabase COMMENTED OUT
    // checkAdminStatus(newUser.id);
  };

  const handleSignOut = async () => {
    try {
      // Backend integration - Supabase COMMENTED OUT
      // await supabase.auth.signOut();

      // Prototype mode: Clear localStorage and sessionStorage
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.POPUP_SHOWN);
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

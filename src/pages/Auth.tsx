import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Backend integration - Supabase COMMENTED OUT (Prototype mode)
// import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { mockUsers, STORAGE_KEYS, setToStorage, getFromStorage } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }

    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSymbol) {
      return { valid: false, message: "Password must include at least one symbol (!@#$%^&*...)" };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prototype mode: Mock authentication with localStorage
      if (isLogin) {
        const users = getFromStorage(STORAGE_KEYS.USERS) || mockUsers;
        const foundUser = users.find((u: any) => u.email === email && u.password === password);

        if (!foundUser) {
          toast.error("Invalid email or password");
          setLoading(false);
          return;
        }

        const userForAuth = {
          id: foundUser.id,
          email: foundUser.email,
          user_metadata: { name: foundUser.name }
        };

        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userForAuth));
        signIn(userForAuth);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        // Signup: validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          toast.error(passwordValidation.message);
          setLoading(false);
          return;
        }

        const users = getFromStorage(STORAGE_KEYS.USERS) || mockUsers;
        const existingUser = users.find((u: any) => u.email === email);

        if (existingUser) {
          toast.error("Email already registered");
          setLoading(false);
          return;
        }

        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password,
          name,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        setToStorage(STORAGE_KEYS.USERS, users);

        // Check if email contains @admin to grant admin access
        const isAdminEmail = email.toLowerCase().includes('@admin');
        if (isAdminEmail) {
          const userRoles = getFromStorage(STORAGE_KEYS.USER_ROLES, {} as any);
          userRoles[newUser.id] = 'admin';
          setToStorage(STORAGE_KEYS.USER_ROLES, userRoles);
          toast.success("🛡️ Admin account created! You have full access.");
        }

        const userForAuth = {
          id: newUser.id,
          email: newUser.email,
          user_metadata: { name: newUser.name }
        };

        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userForAuth));
        signIn(userForAuth);

        if (!isAdminEmail) {
          toast.success("Account created! Welcome to Prayer Journal.");
        }
        navigate("/dashboard");
      }

      // Backend integration - Supabase COMMENTED OUT
      // if (isLogin) {
      //   const { error } = await supabase.auth.signInWithPassword({
      //     email,
      //     password,
      //   });
      //
      //   if (error) throw error;
      //   toast.success("Welcome back!");
      //   navigate("/dashboard");
      // } else {
      //   const passwordValidation = validatePassword(password);
      //   if (!passwordValidation.valid) {
      //     toast.error(passwordValidation.message);
      //     setLoading(false);
      //     return;
      //   }
      //
      //   const { error } = await supabase.auth.signUp({
      //     email,
      //     password,
      //     options: {
      //       data: { name },
      //       emailRedirectTo: `${window.location.origin}/dashboard`,
      //     },
      //   });
      //
      //   if (error) throw error;
      //   toast.success("Account created! Check your email to verify.");
      //   navigate("/dashboard");
      // }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Prototype mode: Google OAuth not available
    toast.info("Google sign-in will be available in production version");

    // Backend integration - Supabase COMMENTED OUT
    // try {
    //   const { error } = await supabase.auth.signInWithOAuth({
    //     provider: "google",
    //     options: {
    //       redirectTo: `${window.location.origin}/dashboard`,
    //     },
    //   });
    //
    //   if (error) throw error;
    // } catch (error: any) {
    //   toast.error(error.message || "Google sign-in not configured yet");
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading">Prayer Journal</CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back! Sign in to continue your journey" : "Begin your prayer journey today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Use an email with "@admin" (e.g., user@admin.com) to get admin access
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters and include a symbol (!@#$%^&*...)
                </p>
              )}
            </div>
            <Button type="submit" className="w-full text-primary-foreground" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"}</>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

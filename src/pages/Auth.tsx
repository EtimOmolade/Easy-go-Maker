import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Backend integration - Supabase ACTIVATED
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import { generateDeviceFingerprint } from "@/utils/deviceFingerprint";

const Auth = () => {
  const location = useLocation();
  const initialMode = location.state?.mode === 'signup' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, requiresOTP, setPendingAuth, completeTrustedDeviceAuth } = useAuth();

  useEffect(() => {
    // Only redirect if fully authenticated (not pending OTP)
    if (user && !requiresOTP) {
      navigate("/dashboard");
    }
  }, [user, requiresOTP, navigate]);

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
      // Backend integration - Supabase ACTIVATED
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has 2FA enabled
        if (data.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("two_factor_enabled")
            .eq("id", data.user.id)
            .single();

          if (profileData?.two_factor_enabled) {
            // Generate device fingerprint
            const fingerprint = generateDeviceFingerprint();

            // Check if this device is already trusted
            const { data: trustedDevice } = await supabase
              .from("trusted_devices")
              .select("*")
              .eq("user_id", data.user.id)
              .eq("device_fingerprint", fingerprint)
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (trustedDevice) {
              // Trusted device - update last_used_at and complete auth
              await supabase
                .from("trusted_devices")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", trustedDevice.id);

              // Manually complete auth (onAuthStateChange won't set user for SIGNED_IN events)
              completeTrustedDeviceAuth(data.user);

              toast.success("Welcome back!");
              // Navigation will happen via useEffect when user is set
            } else {
              // Not trusted - require OTP verification
              // DON'T sign out - keep the session but set pending state
              setPendingAuth(data.user, true);

              // Generate and send OTP (now has valid session)
              await supabase.functions.invoke("generate-otp");

              toast.success("Verification code sent to your email");
              navigate("/verify-otp", { state: { email: data.user.email, userId: data.user.id } });
            }
            return;
          } else {
            // No 2FA enabled - complete auth immediately
            // Manually set user (onAuthStateChange won't set user for SIGNED_IN events)
            completeTrustedDeviceAuth(data.user);
          }
        }

        toast.success("Welcome back!");
        // Navigation will happen via useEffect when user is set
      } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          toast.error(passwordValidation.message);
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;
        
        // Password signups get verification email as welcome message
        // No need to send separate welcome email
        
        toast.success("Account created! Please check your email to verify your account.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Backend integration - Supabase ACTIVATED
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google sign-in not configured yet");
    }
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
          <CardTitle className="text-3xl font-heading">SpiritConnect</CardTitle>
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
            
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

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

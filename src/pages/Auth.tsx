import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen, Eye, EyeOff, Sparkles } from "lucide-react";
import { generateDeviceFingerprint } from "@/utils/deviceFingerprint";
import logoText from "@/assets/logo-text.png";

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
  const { user, requiresOTP, setPendingAuth, completeTrustedDeviceAuth } = useAuth();

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

              // Manually complete auth
              completeTrustedDeviceAuth(data.user);

              toast.success("Welcome back!");
            } else {
              // Not trusted - require OTP verification
              setPendingAuth(data.user, true);

              // Generate and send OTP
              await supabase.functions.invoke("generate-otp");

              toast.success("Verification code sent to your email");
              navigate("/verify-otp", { state: { email: data.user.email, userId: data.user.id } });
            }
            return;
          } else {
            // No 2FA enabled - complete auth immediately
            completeTrustedDeviceAuth(data.user);
          }
        }

        toast.success("Welcome back!");
      } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          toast.error(passwordValidation.message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Static Background Gradient */}
      <div className="absolute inset-0 gradient-hero" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass shadow-large border-white/20 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Logo */}
            <motion.img
              src={logoText}
              alt="SpiritConnect"
              className="h-20 w-auto mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            />

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
            <CardTitle className="text-4xl font-heading text-foreground dark:text-foreground mb-2">
              SpiritConnect
            </CardTitle>
            <CardDescription className="text-base text-foreground/70 dark:text-foreground/80">
              {isLogin ? "Welcome back! Sign in to continue your journey" : "Begin your prayer journey today"}
            </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-white/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isLogin ? 1 : 8}
                    className="h-11 pr-10 bg-white/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters and include a symbol (!@#$%^&*...)
                  </p>
                )}
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary dark:text-secondary hover:text-primary-light dark:hover:text-secondary/80 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium bg-gradient-primary transition-all duration-300 relative overflow-hidden group"
                disabled={loading}
              >
                <span className="relative z-10">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                      Please wait
                    </>
                  ) : (
                    <>{isLogin ? "Sign In" : "Create Account"}</>
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-background px-2 text-muted-foreground dark:text-foreground/60">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-white/50 hover:bg-white/80 border-primary/20 hover:border-primary/40 transition-all"
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
              <span className="font-medium">Google</span>
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary dark:text-secondary hover:text-primary-light dark:hover:text-secondary/80 hover:underline transition-colors inline-flex items-center gap-1"
              >
                {isLogin ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    <span>Need an account? Sign up</span>
                  </>
                ) : (
                  <span>Already have an account? Sign in</span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  );
};

export default Auth;

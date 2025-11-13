import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen, Eye, EyeOff, Sparkles } from "lucide-react";
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
  const { user, requiresOTP, setPendingAuth, completeTrustedDeviceAuth } = useAuth();

  useEffect(() => {
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("two_factor_enabled")
            .eq("id", data.user.id)
            .single();

          if (profileData?.two_factor_enabled) {
            const fingerprint = generateDeviceFingerprint();
            const { data: trustedDevice } = await supabase
              .from("trusted_devices")
              .select("*")
              .eq("user_id", data.user.id)
              .eq("device_fingerprint", fingerprint)
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (trustedDevice) {
              await supabase
                .from("trusted_devices")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", trustedDevice.id);
              completeTrustedDeviceAuth(data.user);
              toast.success("Welcome back!");
            } else {
              setPendingAuth(data.user, true);
              await supabase.functions.invoke("generate-otp");
              toast.success("Verification code sent to your email");
              navigate("/verify-otp", { state: { email: data.user.email, userId: data.user.id } });
            }
            return;
          } else {
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
    <div className="min-h-screen grid md:grid-cols-2 relative overflow-hidden">
      {/* Left Side - Branding with Animated Background */}
      <div className="hidden md:flex relative bg-gradient-to-br from-primary via-primary-light to-accent items-center justify-center p-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="p-8 glass rounded-full shadow-glow-gold">
              <BookOpen className="h-24 w-24 text-white animate-pulse-glow" />
            </div>
          </div>
          <h1 className="text-5xl font-heading font-bold text-white mb-6 text-glow-gold">
            SpiritConnect
          </h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Your sacred space for prayer, reflection, and spiritual growth
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="text-center">
              <div className="text-4xl mb-2">📿</div>
              <p className="text-sm">Guided Prayers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-sm">Prayer Journal</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-sm">Track Growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-4 md:p-12 bg-gradient-subtle">
        <div className="w-full max-w-md">
          <Card className="shadow-large border-2 border-primary/10 rounded-3xl overflow-hidden">
            {/* Mobile Branding Header */}
            <div className="md:hidden text-center pt-8 pb-6 bg-gradient-primary">
              <div className="flex justify-center mb-4">
                <div className="p-4 glass rounded-full">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-white">
                SpiritConnect
              </h2>
            </div>

            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
                  {isLogin ? "Welcome Back" : "Begin Your Journey"}
                </h2>
                <p className="text-muted-foreground">
                  {isLogin ? "Sign in to continue your prayer journey" : "Create your free account today"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={isLogin ? 1 : 8}
                      className="h-12 rounded-xl border-2 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 8 characters with at least one symbol
                    </p>
                  )}
                </div>
                
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>{isLogin ? "Sign In" : "Create Account"}</>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2"
                onClick={handleGoogleSignIn}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="font-medium">Google</span>
              </Button>

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary-light font-medium transition-colors"
                >
                  {isLogin ? "Need an account? Sign up →" : "Already have an account? Sign in →"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;

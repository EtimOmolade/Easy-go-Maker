import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, RefreshCw, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { generateDeviceFingerprint, getDeviceName, generateTrustToken } from "@/utils/deviceFingerprint";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const email = location.state?.email;
  const userId = location.state?.userId;
  const { completeOTPVerification } = useAuth();

  useEffect(() => {
    // If no email or userId provided, redirect back to auth
    if (!email || !userId) {
      toast.error("Session expired. Please log in again.");
      navigate("/auth");
    }
  }, [email, userId, navigate]);

  const handleVerify = async (otpValue?: string) => {
    // Use passed value or state value
    const codeToVerify = otpValue || otp;

    if (codeToVerify.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (!userId) {
      toast.error("Session expired. Please login again.");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Get OTP record from database (session still exists, so RLS works)
      const { data: otpRecord, error: otpError } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (otpError) {
        console.error("Database error:", otpError);
        throw new Error("Failed to retrieve verification code");
      }

      if (!otpRecord) {
        throw new Error("No verification code found. Please request a new code.");
      }

      // Check if OTP has expired
      if (new Date(otpRecord.otp_expires_at) < new Date()) {
        await supabase.from("user_2fa").delete().eq("user_id", userId);
        throw new Error("Verification code has expired. Please request a new code.");
      }

      // Hash the provided OTP to compare
      const encoder = new TextEncoder();
      const data = encoder.encode(codeToVerify);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedOtp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Verify OTP matches
      if (otpRecord.otp_code !== hashedOtp) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      // Mark OTP as verified
      await supabase
        .from("user_2fa")
        .update({ is_verified: true })
        .eq("user_id", userId);

      // Handle device trust if requested
      let deviceToken: string | undefined;
      if (rememberDevice) {
        const fingerprint = generateDeviceFingerprint();
        const deviceName = getDeviceName();
        deviceToken = generateTrustToken();

        // Insert trusted device
        await supabase
          .from("trusted_devices")
          .insert({
            user_id: userId,
            device_fingerprint: fingerprint,
            trust_token: deviceToken,
            device_name: deviceName,
            user_agent: navigator.userAgent,
          });
      }

      toast.success("Verification successful!");

      // Complete OTP verification in AuthContext (user already has session)
      completeOTPVerification(deviceToken);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Invalid verification code");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      toast.error("Session expired. Please login again.");
      navigate("/auth");
      return;
    }

    setResending(true);

    try {
      // Call generate-otp (session still exists)
      const { error } = await supabase.functions.invoke("generate-otp");

      if (error) throw error;

      toast.success("New verification code sent!");
      setOtp("");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      // Auto-submit when all 6 digits are entered
      // Pass the value directly to avoid state update race condition
      setTimeout(() => {
        handleVerify(value);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero">
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass shadow-large border-white/20 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Icon */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-secondary/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative p-4 bg-gradient-primary rounded-full shadow-glow-primary">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-heading text-primary">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-base text-foreground/70 mt-2">
                Enter the 6-digit code sent to<br />
                <span className="font-medium text-primary">{email}</span>
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="relative">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleChange}
                  disabled={loading}
                  className="gap-3"
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-14 w-12 text-xl font-bold border-2 border-primary/30 bg-white/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg backdrop-blur-sm"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </motion.div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Clock className="h-4 w-4" />
                <span>Code expires in 5 minutes</span>
              </motion.div>
            </motion.div>

            {/* Remember Device */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/10"
            >
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                className="mt-0.5"
              />
              <label
                htmlFor="remember-device"
                className="text-sm font-medium leading-relaxed cursor-pointer flex-1"
              >
                Remember this device for 30 days
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  You won't need to enter a code on this device for the next 30 days
                </p>
              </label>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button
                onClick={() => handleVerify()}
                className="w-full h-11 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 relative overflow-hidden group"
                disabled={loading || otp.length !== 6}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleResend}
                  variant="outline"
                  className="h-11 bg-white/50 border-primary/20 hover:border-primary/40 hover:bg-white/80 transition-all"
                  disabled={resending || loading}
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    supabase.auth.signOut();
                    navigate("/auth");
                  }}
                  variant="ghost"
                  className="h-11 hover:bg-primary/10 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </motion.div>
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

export default VerifyOTP;

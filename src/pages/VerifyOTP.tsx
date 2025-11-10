import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <InputOTP maxLength={6} value={otp} onChange={handleChange} disabled={loading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <p className="text-sm text-muted-foreground text-center">
              Code expires in 5 minutes
            </p>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <Checkbox 
              id="remember-device" 
              checked={rememberDevice}
              onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
            />
            <label
              htmlFor="remember-device"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Remember this device for 30 days
            </label>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => handleVerify()}
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            <Button
              onClick={handleResend}
              variant="ghost"
              className="w-full"
              disabled={resending || loading}
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>

            <Button
              onClick={() => {
                supabase.auth.signOut();
                navigate("/auth");
              }}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOTP;

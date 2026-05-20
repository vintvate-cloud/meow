import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, getAdditionalUserInfo } from "firebase/auth";
import emailjs from '@emailjs/browser';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const { signup, loginWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === "email") {
      setLoading(true);
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(generatedOtp);
      
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: email,
            otp: generatedOtp,
            passcode: generatedOtp,
            time: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        toast({ title: "OTP Sent!", description: "Please check your email for the verification code." });
        setStep("otp");
      } catch (error: any) {
        toast({
          title: "Failed to send OTP",
          description: error.text || error.message || "An error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === "otp") {
      if (otp !== sentOtp) {
        toast({
          title: "Invalid OTP",
          description: "The verification code you entered is incorrect.",
          variant: "destructive"
        });
        return;
      }
      toast({ title: "Email verified!", description: "Please enter your details to finish." });
      setStep("details");
      return;
    }

    if (step === "details") {
      setLoading(true);
      try {
        const userCredential = await signup(email, password);
        await updateProfile(userCredential.user, { displayName: name });
        toast({ title: "Account created!", description: "Welcome to Meow." });
        const queryParams = new URLSearchParams(window.location.search);
        const redirect = queryParams.get("redirect");
        setLocation(redirect ? `/onboarding?redirect=${encodeURIComponent(redirect)}` : "/onboarding");
      } catch (error: any) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const details = getAdditionalUserInfo(result);
      const queryParams = new URLSearchParams(window.location.search);
      const redirect = queryParams.get("redirect");
      if (details?.isNewUser) {
        setLocation(redirect ? `/onboarding?redirect=${encodeURIComponent(redirect)}` : "/onboarding");
      } else {
        setLocation(redirect || "/");
      }
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans">
      {/* Navbar overlay */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <img src="/meow logo.png" alt="MEOW" className="h-12 md:h-16 w-auto object-contain" />
        </Link>
      </div>

      {/* Left side */}
      <div className="w-full md:w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen" style={{ backgroundColor: '#2856E8' }}>
        <div className="relative z-10 w-full max-w-md text-center md:text-left pt-16">
          <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-none tracking-tighter text-white">
            Your events<br />start here.
          </h1>
        </div>


      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-white dark:bg-card dark:text-card-foreground flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>Create your account</h2>
            <p className="text-gray-500 font-medium">Join thousands of creators hosting events on Meow.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-4">
              {step === "email" && (
                <Input
                  type="email"
                  placeholder="Email address"
                  className="rounded-xl h-14 px-4 text-base bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}

              {step === "otp" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter the 6-digit code sent to {email}
                  </p>
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    className="rounded-xl h-14 px-4 text-center text-2xl tracking-widest bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change email or resend code
                  </button>
                </div>
              )}

              {step === "details" && (
                <>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Great! Now tell us a bit about yourself.
                  </p>
                  <Input
                    type="text"
                    placeholder="Full name"
                    className="rounded-xl h-14 px-4 text-base bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Create password"
                    className="rounded-xl h-14 px-4 text-base bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-14 text-lg font-bold shadow-xl border-none transition-transform hover:scale-[1.02] mt-4"
              style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}
              disabled={loading}
            >
              {loading 
                ? "Please wait..." 
                : step === "email" 
                  ? "Continue" 
                  : step === "otp" 
                    ? "Verify Code" 
                    : "Create account"}
            </Button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-border"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-border"></div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full h-14 text-base font-bold border-2 border-gray-200 dark:border-border hover:bg-gray-50 dark:bg-muted"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <SiGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <p className="text-center text-xs text-gray-400 font-medium px-4">
            By signing up you agree to our Terms and Privacy Policy.
          </p>

          <div className="text-center pt-2">
            <p className="font-medium text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold cursor-pointer" style={{ color: '#2856E8' }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


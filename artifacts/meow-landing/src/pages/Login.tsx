import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getAdditionalUserInfo } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
      const queryParams = new URLSearchParams(window.location.search);
      const redirect = queryParams.get("redirect");
      setLocation(redirect || "/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    <div className="h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden bg-white dark:bg-card dark:text-card-foreground">
      {/* Navbar overlay */}
      <div className="absolute top-8 left-8 z-50 flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <img src="/meowlogo2.png" alt="MEOW" className="h-16 md:h-24 w-auto object-contain" />
        </Link>
      </div>

      {/* Left side */}
      <div className="hidden md:flex w-full md:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 h-full" style={{ backgroundColor: '#D9FF00' }}>
        <div className="relative z-10 w-full max-w-md text-left">
          <h1 className="text-[clamp(3.5rem,6vw,5.5rem)] font-black leading-none tracking-tighter" style={{ color: "var(--foreground)" }}>
            Welcome back.
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-white dark:bg-card dark:text-card-foreground flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>Log in to Meow</h2>
            <p className="text-gray-500 font-medium">Enter your details to access your account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                className="rounded-xl h-14 px-4 text-base bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                className="rounded-xl h-14 px-4 text-base bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold cursor-pointer" style={{ color: '#2856E8' }}>Forgot password?</span>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-14 text-lg font-bold shadow-xl border-none transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: '#111827', color: '#D9FF00' }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="relative flex items-center py-4">
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

          <div className="text-center pt-6">
            <p className="font-medium text-gray-500">
              Don't have an account?{" "}
              <Link href="/signup" className="font-bold cursor-pointer" style={{ color: '#2856E8' }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


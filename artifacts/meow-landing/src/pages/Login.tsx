import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
      setLocation("/");
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
      await loginWithGoogle();
      setLocation("/");
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
        <Link href="/" className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity" style={{ color: '#111827' }}>
          Back to home
        </Link>
      </div>

      {/* Left side */}
      <div className="w-full md:w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen" style={{ backgroundColor: '#D9FF00' }}>
        <div className="relative z-10 w-full max-w-md text-center md:text-left pt-16">
          <h1 className="text-[clamp(3rem,6vw,6rem)] font-black leading-none italic tracking-tighter" style={{ color: '#111827' }}>
            Welcome back.
          </h1>
        </div>

        {/* Floating decorations */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-1/4 w-48 p-4 rounded-3xl shadow-xl hidden md:block" style={{ backgroundColor: '#E8C8EC' }}
        >
          <div className="h-4 w-1/2 bg-black/20 rounded-full mb-3"></div>
          <div className="h-3 w-3/4 bg-black/10 rounded-full mb-2"></div>
          <div className="h-3 w-2/3 bg-black/10 rounded-full"></div>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tight" style={{ color: '#111827' }}>Log in to Meow</h2>
            <p className="text-gray-500 font-medium">Enter your details to access your account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                className="rounded-xl h-14 px-4 text-base bg-gray-50 border-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                className="rounded-xl h-14 px-4 text-base bg-gray-50 border-gray-200"
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
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full h-14 text-base font-bold border-2 border-gray-200 hover:bg-gray-50"
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


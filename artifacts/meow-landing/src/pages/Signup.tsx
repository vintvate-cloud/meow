import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGoogle } from "react-icons/si";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans">
      {/* Navbar overlay */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
        <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
          MEOW
        </Link>
        <Link href="/" className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity text-white md:text-navy">
          <span className="hidden md:inline" style={{ color: '#111827' }}>Back to home</span>
          <span className="md:hidden text-white">Back to home</span>
        </Link>
      </div>

      {/* Left side */}
      <div className="w-full md:w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen" style={{ backgroundColor: '#2856E8' }}>
        <div className="relative z-10 w-full max-w-md text-center md:text-left pt-16">
          <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-none tracking-tighter text-white">
            Your events<br/>start here.
          </h1>
        </div>
        
        {/* Floating decorations */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-1/3 w-56 p-4 rounded-3xl shadow-2xl hidden md:block" style={{ backgroundColor: '#F3F0E8' }}
        >
          <div className="flex gap-2 mb-4">
             <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#79001B' }}></div>
             <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#E8C8EC' }}></div>
             <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#00B7FF' }}></div>
          </div>
          <div className="h-4 w-full bg-black/10 rounded-full mb-2"></div>
          <div className="h-4 w-2/3 bg-black/10 rounded-full"></div>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tight" style={{ color: '#111827' }}>Create your account</h2>
            <p className="text-gray-500 font-medium">Join thousands of creators hosting events on Meow.</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <Input 
                type="text" 
                placeholder="Full name" 
                className="rounded-xl h-14 px-4 text-base bg-gray-50 border-gray-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input 
                type="email" 
                placeholder="Email address" 
                className="rounded-xl h-14 px-4 text-base bg-gray-50 border-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                type="password" 
                placeholder="Create password" 
                className="rounded-xl h-14 px-4 text-base bg-gray-50 border-gray-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full rounded-full h-14 text-lg font-bold shadow-xl border-none transition-transform hover:scale-[1.02] mt-4" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
              Create account
            </Button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <Button variant="outline" className="w-full rounded-full h-14 text-base font-bold border-2 border-gray-200 hover:bg-gray-50">
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

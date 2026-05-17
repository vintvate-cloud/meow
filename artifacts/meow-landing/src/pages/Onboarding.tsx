import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, Moon, Sun } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const handleComplete = () => {
    // In a real app, you would save this preference to Firestore here
    setLocation("/");
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-[#101828] text-white' : 'bg-[#F3F0E8] text-[#101828]'}`}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-block p-4 rounded-3xl bg-gradient-to-tr from-[#D9FF3F] to-[#2457FF] mb-4 shadow-lg">
            <img src="/meow logo.png" alt="MEOW" className="h-12 w-auto object-contain mix-blend-overlay brightness-200" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
            Welcome to MEOW, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9FF3F] to-[#2457FF]">
              {user?.displayName?.split(" ")[0] || "Creator"}
            </span>.
          </h1>
          <p className={`text-lg font-medium max-w-lg mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Let's customize your experience before you dive into the network.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-2xl space-y-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-black mb-2">Choose your vibe</h2>
            <p className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Application Theme</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Theme Card */}
            <button 
              onClick={() => setTheme('light')}
              className={`relative p-6 rounded-[32px] border-2 text-left transition-all overflow-hidden ${
                theme === 'light' 
                  ? 'border-[#2457FF] shadow-lg scale-105' 
                  : `border-transparent opacity-70 hover:opacity-100 hover:scale-105 ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`
              }`}
            >
              <div className="absolute top-0 right-0 p-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-[#2457FF] text-white' : 'border-2 border-gray-300'}`}>
                  {theme === 'light' && <Check className="w-4 h-4" />}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-6">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-2">Minimal Light</h3>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clean, bright, and perfect for daytime browsing.</p>
            </button>

            {/* Dark Theme Card */}
            <button 
              onClick={() => setTheme('dark')}
              className={`relative p-6 rounded-[32px] border-2 text-left transition-all overflow-hidden ${
                theme === 'dark' 
                  ? 'border-[#D9FF3F] shadow-lg shadow-[#D9FF3F]/10 scale-105 bg-[#1A2333]' 
                  : `border-transparent opacity-70 hover:opacity-100 hover:scale-105 ${theme === 'light' ? 'bg-[#101828] text-white' : 'bg-white/5 text-white'}`
              }`}
            >
              <div className="absolute top-0 right-0 p-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#D9FF3F] text-[#101828]' : 'border-2 border-gray-600'}`}>
                  {theme === 'dark' && <Check className="w-4 h-4" />}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-2">Midnight Dark</h3>
              <p className="text-sm font-medium text-gray-400">Deep, immersive, and easy on the eyes at night.</p>
            </button>
          </div>

          <div className="pt-12 text-center">
            <Button 
              onClick={handleComplete}
              className={`h-16 px-12 rounded-full text-xl font-black border-none shadow-xl transition-all hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-[#D9FF3F] text-[#101828] hover:bg-[#c2e638]' 
                  : 'bg-[#101828] text-white hover:bg-black'
              }`}
            >
              Enter Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

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
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState("");
  
  const handleNextStep = () => {
    setStep(2);
  };

  const handleComplete = () => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // In a real app, you would save this preference and create the event to Firestore here
    setLocation("/");
  };

  return (
    <div className={`h-screen overflow-hidden w-full flex flex-col font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-[#101828] text-white' : 'bg-[#F3F0E8] text-[#101828]'}`}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        
        {step === 1 && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10 space-y-2"
            >
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome, {user?.displayName?.split(" ")[0] || "Creator"}.
              </h1>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Please configure your workspace environment.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Theme Card */}
                <button 
                  onClick={() => setTheme('light')}
                  className={`relative p-5 rounded-2xl border transition-all overflow-hidden ${
                    theme === 'light' 
                      ? 'border-[#111827] shadow-sm bg-white scale-[1.02]' 
                      : `border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01] ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-full ${theme === 'light' ? 'bg-[#111827] text-white' : 'bg-black/10 text-[#111827]'}`}>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${theme === 'light' ? 'bg-[#111827] border-[#111827] text-white' : 'border-gray-400'}`}>
                      {theme === 'light' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 text-left ${theme === 'dark' ? 'text-white' : 'text-[#111827]'}`}>Light Mode</h3>
                  <p className={`text-xs font-medium text-left ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clean and minimal</p>
                </button>

                {/* Dark Theme Card */}
                <button 
                  onClick={() => setTheme('dark')}
                  className={`relative p-5 rounded-2xl border transition-all overflow-hidden ${
                    theme === 'dark' 
                      ? 'border-white shadow-sm bg-[#1A2333] scale-[1.02]' 
                      : `border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01] ${theme === 'light' ? 'bg-[#101828] text-white' : 'bg-white/5'}`
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white text-[#111827]' : 'bg-white/10 text-white'}`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white border-white text-[#111827]' : 'border-gray-500'}`}>
                      {theme === 'dark' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 text-left ${theme === 'light' ? 'text-white' : 'text-white'}`}>Dark Mode</h3>
                  <p className={`text-xs font-medium text-left ${theme === 'light' ? 'text-gray-400' : 'text-gray-400'}`}>Sleek and immersive</p>
                </button>
              </div>

              <div className="pt-6 text-center">
                <Button 
                  onClick={handleNextStep}
                  className={`h-12 px-10 rounded-full text-sm font-bold border-none transition-transform hover:scale-[1.02] ${
                    theme === 'dark' 
                      ? 'bg-white text-[#101828] hover:bg-gray-100' 
                      : 'bg-[#101828] text-white hover:bg-black'
                  }`}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md text-center"
          >
            <div className="mb-10 space-y-2">
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Name your first event.
              </h1>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                You can always change this later.
              </p>
            </div>
            
            <div className="space-y-8">
              <input 
                type="text" 
                placeholder="E.g. Sunday Coffee Mixer" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className={`w-full bg-transparent border-b-2 text-center text-xl pb-3 outline-none transition-colors ${theme === 'dark' ? 'border-gray-700 focus:border-white text-white placeholder-gray-600' : 'border-gray-300 focus:border-[#111827] text-[#111827] placeholder-gray-400'}`}
              />
              
              <div className="pt-6 flex flex-col items-center gap-4">
                <Button 
                  onClick={handleComplete}
                  className={`h-12 px-10 w-full rounded-full text-sm font-bold border-none transition-transform hover:scale-[1.02] ${
                    theme === 'dark' 
                      ? 'bg-white text-[#101828] hover:bg-gray-100' 
                      : 'bg-[#101828] text-white hover:bg-black'
                  }`}
                >
                  {eventName ? "Create Event" : "Create Later"}
                </Button>
                <button onClick={handleComplete} className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-black'} transition-colors`}>
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

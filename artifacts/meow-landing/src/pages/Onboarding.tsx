import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, Moon, Sun, Camera, User } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(user?.photoURL || null);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);
  
  const handleNextStep = () => {
    setStep(2);
  };

  const handleStep2Complete = () => {
    setStep(3);
  };

  const handleStep2Skip = () => {
    setEventName("");
    setStep(3);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleComplete = () => {
    localStorage.setItem('theme', theme);
    // In a real app, you would save this preference and create the event to Firestore here
    setLocation("/");
  };

  return (
    <div className="h-screen overflow-hidden w-full flex flex-col font-sans transition-colors duration-500 bg-background text-foreground">
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
                {/* Light Theme Card - Always looks Light */}
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`relative p-5 rounded-2xl border transition-all overflow-hidden ${
                    theme === 'light' 
                      ? 'border-[#111827] shadow-sm bg-white scale-[1.02]' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01] bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-full bg-[#111827] text-white">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${theme === 'light' ? 'bg-[#111827] border-[#111827] text-white' : 'border-gray-400'}`}>
                      {theme === 'light' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-left text-[#111827]">Light Mode</h3>
                  <p className="text-xs font-medium text-left text-gray-500">Clean and minimal</p>
                </button>

                {/* Dark Theme Card - Always looks Deep Black */}
                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`relative p-5 rounded-2xl border transition-all overflow-hidden ${
                    theme === 'dark' 
                      ? 'border-white shadow-sm bg-[#0A0A0A] scale-[1.02]' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01] bg-black/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-full bg-white/10 text-white">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${theme === 'dark' ? 'border-white text-white' : 'border-gray-500'}`}>
                      {theme === 'dark' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-left text-white">Dark Mode</h3>
                  <p className="text-xs font-medium text-left text-gray-400">Sleek and immersive</p>
                </button>
              </div>

              <div className="pt-6 text-center">
                <Button 
                  onClick={handleNextStep}
                  className="h-12 px-10 rounded-full text-sm font-bold transition-all hover:scale-[1.02] bg-foreground text-background hover:opacity-90 shadow-lg"
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
                className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-2xl pb-3 outline-none transition-colors text-foreground placeholder-muted-foreground"
              />
              
              <div className="pt-6 flex flex-col items-center gap-4">
                <Button 
                  onClick={handleStep2Complete}
                  disabled={!eventName.trim()}
                  className="h-12 px-10 w-full rounded-full text-sm font-bold transition-all hover:scale-[1.02] bg-foreground text-background hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 shadow-lg"
                >
                  Create Event
                </Button>
                <button 
                  onClick={handleStep2Skip} 
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md text-center"
          >
            <div className="mb-10 space-y-2">
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Complete your profile.
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                Tell attendees a bit about yourself.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-28 h-28 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden group cursor-pointer transition-all hover:bg-muted shadow-sm">
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        // In a real app, upload to Firebase Storage here
                        // For now, create a local object URL to preview
                        setProfilePicUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-4 font-bold uppercase tracking-widest">Profile picture (optional)</p>
              </div>

              <div className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-xl pb-3 outline-none transition-colors text-foreground placeholder-muted-foreground"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Date of Birth" 
                    onFocus={(e) => e.target.type = 'date'}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-base pb-3 pt-2 outline-none transition-colors text-foreground placeholder-muted-foreground"
                  />
                  <input 
                    type="text" 
                    placeholder="Profession" 
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-base pb-3 pt-2 outline-none transition-colors text-foreground placeholder-muted-foreground"
                  />
                </div>
                
                <textarea 
                  placeholder="Short bio (optional)" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-base pb-3 pt-4 outline-none transition-colors text-foreground placeholder-muted-foreground resize-none h-16"
                />
              </div>
              
              <div className="pt-8">
                <Button 
                  onClick={handleComplete}
                  disabled={!displayName.trim()}
                  className="h-12 px-10 w-full rounded-full text-sm font-bold transition-all hover:scale-[1.02] bg-foreground text-background hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 shadow-lg"
                >
                  Finish Onboarding
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

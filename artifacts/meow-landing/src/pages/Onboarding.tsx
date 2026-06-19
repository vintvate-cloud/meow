import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, Moon, Sun, Camera, User, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_IMAGES, formatAvatarUrlForStorage } from "@/lib/avatars";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useForceLightTheme } from "@/hooks/use-theme-force";

export default function Onboarding() {
  useForceLightTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string>(() => {
    return AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)];
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Calibrating event engines...");

  useEffect(() => {
    if (step !== 4) return;

    const messages = [
      "Calibrating event engines...",
      "Gathering community kittens...",
      "Unleashing the MEOW power...",
      "Welcome aboard, Creator!"
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setLoadingMessage(messages[messageIndex]);
      }
    }, 600);

    const progressInterval = setInterval(() => {
      setLoadingPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          setTimeout(() => {
            const queryParams = new URLSearchParams(window.location.search);
            const redirect = queryParams.get("redirect");
            setLocation(redirect || "/");
          }, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [step, setLocation]);

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

  const handleComplete = async () => {
    if (user) {
      try {
        await updateProfile(user, {
          displayName: displayName,
          photoURL: formatAvatarUrlForStorage(profilePicUrl)
        });

        // Create an initial profile in Firestore
        const defaultUsername = user.email ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") : `user-${user.uid.substring(0, 5)}`;
        const profileRef = doc(db, "profiles", defaultUsername);
        
        const docSnap = await getDoc(profileRef);
        if (!docSnap.exists()) {
          await setDoc(profileRef, {
            userId: user.uid,
            displayName: displayName,
            photoURL: formatAvatarUrlForStorage(profilePicUrl),
            bio: bio,
            username: defaultUsername,
            dob: dob,
            profession: profession,
            theme: "light",
            accentColor: "#8129D9",
            borderStyle: "rounded-xl",
            createdAt: serverTimestamp()
          });
          localStorage.setItem("user-username", defaultUsername);
        }

        // Save bio/profession/dob locally
        if (bio) localStorage.setItem("user-bio", bio);
        if (profession) localStorage.setItem("user-profession", profession);
        if (dob) localStorage.setItem("user-dob", dob);

        // Create initial event if provided
        if (eventName.trim()) {
          await addDoc(collection(db, "events"), {
            title: eventName,
            description: "Welcome to my first event!",
            date: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 16), // 7 days from now
            location: "Online",
            color: "#D9FF00",
            isPublic: true,
            userId: user.uid,
            userName: displayName,
            createdAt: serverTimestamp(),
            rsvpCount: 0
          });
        }
      } catch (error) {
        console.error("Failed to update profile or create event during onboarding", error);
      }
    }

    localStorage.setItem('theme', theme);
    // Trigger animated loading step before entering dashboard
    setStep(4);
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
                <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                  <DialogTrigger asChild>
                    <div className="relative w-28 h-28 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden group cursor-pointer transition-all hover:bg-muted shadow-sm">
                      <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl bg-background/95 backdrop-blur-3xl border-border/50 rounded-[2rem] p-6 sm:p-12 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
                    <DialogHeader className="mb-6 sm:mb-8">
                      <DialogTitle className="text-center font-serif text-3xl sm:text-5xl tracking-tight text-foreground">Select Your Avatar</DialogTitle>
                      <p className="text-center text-sm sm:text-base text-muted-foreground mt-3 font-medium">Choose a profile picture that represents you.</p>
                    </DialogHeader>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 sm:gap-8 p-4 sm:p-6 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {AVATAR_IMAGES.map((avatar, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setProfilePicUrl(avatar);
                            setIsAvatarModalOpen(false);
                          }}
                          className={`group relative w-full aspect-square rounded-full overflow-hidden transition-all duration-300 ease-out focus:outline-none ${
                            profilePicUrl === avatar 
                              ? 'ring-4 ring-foreground ring-offset-4 ring-offset-background scale-110 shadow-2xl z-10' 
                              : 'ring-1 ring-border/50 hover:ring-2 hover:ring-foreground/50 hover:scale-105 hover:shadow-xl bg-muted/20'
                          }`}
                        >
                          <img 
                            src={avatar} 
                            alt={`Avatar ${i}`} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                          {profilePicUrl === avatar && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300">
                              <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground mt-4 font-bold uppercase tracking-widest">Profile picture</p>
              </div>

              <div className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-xl pb-3 outline-none transition-colors text-foreground placeholder-muted-foreground"
                />

                <div className="grid grid-cols-2 gap-6 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-base pb-3 pt-2 outline-none transition-colors text-foreground flex items-center justify-center gap-2 hover:border-foreground/50"
                      >
                        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className={dob ? "text-foreground font-medium" : "text-muted-foreground font-medium"}>
                          {dob ? format(new Date(dob + "T12:00:00"), "PPP") : "Date of Birth"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0A0A0A] border border-gray-150 dark:border-border rounded-3xl shadow-2xl" align="center">
                      <Calendar
                        mode="single"
                        selected={dob ? new Date(dob + "T12:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setDob(`${yyyy}-${mm}-${dd}`);
                          } else {
                            setDob("");
                          }
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1940, 0)}
                        endMonth={new Date()}
                        className="bg-white dark:bg-[#0A0A0A]"
                      />
                    </PopoverContent>
                  </Popover>

                  <input 
                    type="text" 
                    placeholder="Profession" 
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-center text-base pb-3 pt-2 outline-none transition-colors text-foreground placeholder-muted-foreground font-medium"
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

        {step === 4 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center flex flex-col items-center justify-center space-y-8"
          >
            {/* Animated Mascot/Logo container with thick brutalist borders */}
            <motion.div 
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.05, 0.95, 1.05, 1]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              className="relative w-32 h-32 rounded-full border-4 border-foreground bg-primary flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
            >
              <img src={profilePicUrl} alt="Mascot" className="w-24 h-24 object-cover rounded-full" />
              
              {/* Spinning badges */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute -inset-3 border-2 border-dashed border-foreground rounded-full pointer-events-none"
              />
            </motion.div>

            {/* Title / Status message */}
            <div className="space-y-3">
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-3xl font-black tracking-tight text-foreground uppercase"
              >
                Setting Up Profile
              </motion.h2>
              
              <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessage}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="text-lg font-bold text-muted-foreground"
                  >
                    {loadingMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Brutalist Progress Bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-8 border-4 border-foreground bg-white dark:bg-card rounded-full overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <motion.div 
                  className="h-full bg-secondary border-r-4 border-foreground"
                  style={{ width: `${loadingPercentage}%` }}
                  transition={{ ease: "easeOut" }}
                />
                
                {/* Center text overlay */}
                <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-foreground mix-blend-difference">
                  {loadingPercentage}%
                </div>
              </div>
              
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground px-2">
                <span>Init</span>
                <span>Ready</span>
              </div>
            </div>

            {/* Extra floating status tags for that tech/brutalist look */}
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="px-3 py-1 border-2 border-foreground bg-[#D9FF00] text-black font-black text-xs uppercase rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Firebase Connected
              </span>
              <span className="px-3 py-1 border-2 border-foreground bg-[#2856E8] text-white font-black text-xs uppercase rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Theme Applied
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

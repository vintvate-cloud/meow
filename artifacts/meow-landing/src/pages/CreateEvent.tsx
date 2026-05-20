import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Calendar, MapPin, Type, Image as ImageIcon, Plus, Users, Globe, Lock, Check, Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


const THEMES = [
  {
    id: "cream-cozy",
    name: "Cream Cozy",
    bg: "#FAF8F5",
    text: "#101828",
    accent: "#8129D9",
    starburst: "#8129D9"
  },
  {
    id: "sleek-midnight",
    name: "Sleek Midnight",
    bg: "#0A0A0A",
    text: "#FFFFFF",
    accent: "#D9FF00",
    starburst: "#D9FF00"
  },
  {
    id: "retro-mint",
    name: "Retro Mint",
    bg: "#E6F0EA",
    text: "#1E3B27",
    accent: "#1E3B27",
    starburst: "#1E3B27"
  },
  {
    id: "burgundy-velvet",
    name: "Burgundy Velvet",
    bg: "#1C0A0E",
    text: "#FAF8F5",
    accent: "#D4AF37",
    starburst: "#79001B"
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    bg: "#030F12",
    text: "#00F0FF",
    accent: "#FF007F",
    starburst: "#00F0FF"
  },
  {
    id: "royal-lavender",
    name: "Royal Lavender",
    bg: "#F0EBF7",
    text: "#2A1B4E",
    accent: "#58268C",
    starburst: "#8B5CF6"
  }
];

export default function CreateEvent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [proposedUsername, setProposedUsername] = useState("");
  const [claimingLink, setClaimingLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "profiles"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const pData = snap.docs[0].data();
          setProfile(pData);
        }
      } catch (e) {
        console.error("Failed to check profile in CreateEvent", e);
      } finally {
        setFetchingProfile(false);
      }
    };
    checkProfile();
  }, [user]);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const cleanUsername = proposedUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (!cleanUsername) {
      setIsAvailable(null);
      setCheckingAvailability(false);
      return;
    }

    setCheckingAvailability(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const profileRef = doc(db, "profiles", cleanUsername);
        const docSnap = await getDoc(profileRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId === user?.uid) {
            setIsAvailable(true);
          } else {
            setIsAvailable(false);
          }
        } else {
          setIsAvailable(true);
        }
      } catch (err) {
        console.error("Error checking username availability:", err);
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [proposedUsername, user]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    theme: "cream-cozy",
    creativeUrl: "",
    isPublic: true,
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || cloudName === "your_cloudinary_cloud_name") {
        cloudName = "dih7y95sc";
      }
      if (!uploadPreset || uploadPreset === "your_cloudinary_upload_preset") {
        uploadPreset = "linkhub_unsigned";
      }

      formDataUpload.append("upload_preset", uploadPreset);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Cloudinary upload failed");
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, creativeUrl: data.secure_url }));
      toast({
        title: "Creative uploaded!",
        description: "Your custom cover is ready.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const [customFields, setCustomFields] = useState<any[]>([]);

  const addField = () => {
    setCustomFields([...customFields, { label: "", placeholder: "", required: false }]);
  };

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const currentThemeObj = THEMES.find(t => t.id === formData.theme) || THEMES[0];
      const docRef = await addDoc(collection(db, "events"), {
        ...formData,
        color: currentThemeObj.accent,
        customFields,
        userId: user.uid,
        userName: user.displayName,
        createdAt: serverTimestamp(),
        rsvpCount: 0,
      });

      toast({
        title: "Event created!",
        description: "Your event page is live.",
      });
      setLocation(`/e/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] dark:bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8129D9]" />
      </div>
    );
  }

  if (!profile || !profile.username) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] dark:bg-[#0A0A0A] p-6 md:p-12 font-sans flex items-center justify-center">
        <div className="max-w-3xl mx-auto w-full">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 font-bold text-gray-500 hover:text-navy mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card max-w-md w-full p-8 rounded-[40px] shadow-xl border border-gray-100 dark:border-border text-center space-y-6 mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-[#8129D9]/10 text-[#8129D9] flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight font-serif text-[#101828] dark:text-white">Make your unique link</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Create a custom link to easily share all your upcoming and past events with others.
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              setErrorMsg("");
              setClaimingLink(true);
              try {
                const uClean = proposedUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
                if (!uClean) throw new Error("Username cannot be empty.");

                const profileRef = doc(db, "profiles", uClean);
                const docSnap = await getDoc(profileRef);
                if (docSnap.exists()) {
                  throw new Error("This username link is already claimed by another creator.");
                }

                // Create the profile document
                const newProfile = {
                  userId: user.uid,
                  displayName: user.displayName || "Creator",
                  photoURL: user.photoURL || "",
                  bio: "",
                  username: uClean,
                  dob: "",
                  profession: "",
                  socials: {
                    twitter: { connected: false, username: "" },
                    instagram: { connected: false, username: "" },
                    discord: { connected: false, username: "" },
                    github: { connected: false, username: "" },
                  },
                  theme: "light",
                  accentColor: "lime",
                  borderStyle: "standard",
                  createdAt: serverTimestamp()
                };

                await setDoc(profileRef, newProfile);
                localStorage.setItem("user-username", uClean);
                setProfile(newProfile);
                
                toast({
                  title: "Link claimed! 🎉",
                  description: `Your profile is now live at /p/${uClean}`,
                });
              } catch (err: any) {
                setErrorMsg(err.message);
              } finally {
                setClaimingLink(false);
              }
            }} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Creator Username</label>
                <div className="flex rounded-2xl overflow-hidden border border-gray-250 dark:border-border h-12 focus-within:ring-2 focus-within:ring-[#8129D9]/50 relative items-center bg-white dark:bg-card">
                  <span className="bg-gray-50 dark:bg-muted text-gray-400 text-xs font-semibold px-3 flex items-center border-r border-gray-100 dark:border-border select-none h-full">
                    {window.location.host}/p/
                  </span>
                  <Input
                    value={proposedUsername}
                    onChange={(e) => setProposedUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    className="border-none rounded-none focus-visible:ring-0 flex-1 font-semibold text-xs h-full bg-white dark:bg-card pr-10"
                    placeholder="username"
                    required
                  />
                  <div className="absolute right-3 flex items-center justify-center">
                    {checkingAvailability && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#8129D9] border-t-transparent" />
                    )}
                    {!checkingAvailability && isAvailable === true && (
                      <Check className="w-4 h-4 text-green-500 stroke-[3px]" />
                    )}
                    {!checkingAvailability && isAvailable === false && (
                      <span className="text-red-500 font-bold text-sm">✕</span>
                    )}
                  </div>
                </div>
                {proposedUsername && !checkingAvailability && isAvailable !== null && (
                  <p className={`text-xs font-bold pl-1 ${isAvailable ? "text-green-600" : "text-red-500"}`}>
                    {isAvailable ? "✓ Link is available!" : "✗ Link is already taken by another creator."}
                  </p>
                )}
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={claimingLink || !proposedUsername.trim() || checkingAvailability || isAvailable === false}
                className="w-full h-12 rounded-full font-bold bg-[#8129D9] hover:bg-[#7020C4] text-white transition-all shadow-md mt-2 disabled:opacity-50"
              >
                {claimingLink ? "Claiming Link..." : "Claim Link & Proceed"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentThemeObj = THEMES.find(t => t.id === formData.theme) || THEMES[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] p-6 md:p-12 font-sans transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <header className="mb-10 text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-[#101828] dark:text-white">Create an Event</h1>
          <p className="text-sm font-medium text-gray-400 mt-2">Fill in the details to launch your event page with premium styling.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: FORM */}
          <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-7">
            {/* Theme Selection */}
            <div className="bg-white dark:bg-[#121212] p-8 rounded-[32px] shadow-sm border border-black/5 dark:border-white/[0.04]">
              <h2 className="text-xl font-black mb-2 flex items-center gap-2 font-serif text-[#101828] dark:text-white">
                <ImageIcon className="w-5 h-5 text-[#8129D9]" /> Choose Page Theme
              </h2>
              <p className="text-gray-400 font-medium text-xs mb-6">Select a hand-crafted visual theme for your event page.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {THEMES.map((theme) => {
                  const isSelected = formData.theme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: theme.id })}
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-300 ${
                        isSelected 
                          ? 'border-[#8129D9] ring-2 ring-[#8129D9]/20 shadow-md scale-[1.02]' 
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                      style={{ backgroundColor: theme.bg }}
                    >
                      <span 
                        className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full border border-white dark:border-black shadow-sm"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <span 
                        className="text-xs font-bold block"
                        style={{ color: theme.text }}
                      >
                        {theme.name}
                      </span>
                      <span className="text-[10px] opacity-60 block mt-1" style={{ color: theme.text }}>
                        {theme.id.replace("-", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Creative Cover */}
            <div className="bg-white dark:bg-[#121212] p-8 rounded-[32px] shadow-sm border border-black/5 dark:border-white/[0.04] space-y-6">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2 font-serif text-[#101828] dark:text-white">
                  <ImageIcon className="w-5 h-5 text-[#8129D9]" /> Event Cover Creative
                </h2>
                <p className="text-gray-400 font-medium text-xs mt-1">
                  Upload a custom square design or select a preset to make your page look premium.
                </p>
              </div>

              {/* File Upload Zone */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                  Upload Custom Image
                </label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#8129D9] dark:hover:border-[#8129D9] rounded-2xl p-6 text-center cursor-pointer transition-colors duration-300 group bg-gray-50/50 dark:bg-white/[0.01]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                  />
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#8129D9]/5 dark:bg-[#8129D9]/10 flex items-center justify-center text-[#8129D9] group-hover:scale-110 transition-transform">
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-[#8129D9] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    {uploading ? (
                      <span className="text-xs font-bold text-gray-400 animate-pulse">Uploading design...</span>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          Click to upload square creative
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Supports PNG, JPG up to 5MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Preset Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                  Select a Premium Pattern Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { name: "Minimal Art", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop" },
                    { name: "Cozy Gathering", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop" },
                    { name: "Tech & Geek", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop" },
                    { name: "Retro Beats", url: "https://images.unsplash.com/photo-1539625319135-8d6f7a785dd6?w=800&auto=format&fit=crop" },
                    { name: "Neon Cyber", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop" }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, creativeUrl: preset.url })}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        formData.creativeUrl === preset.url 
                          ? 'border-[#8129D9] scale-[1.05] shadow-md' 
                          : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-end p-1.5">
                        <span className="text-[9px] font-bold text-white leading-tight">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL Input */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                    Or Enter Custom Image URL
                  </label>
                  {formData.creativeUrl && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, creativeUrl: "" })}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear Cover Image
                    </button>
                  )}
                </div>
                <Input
                  placeholder="https://example.com/your-square-artwork.jpg"
                  className="h-12 rounded-xl text-xs border-gray-200 dark:border-white/10"
                  value={formData.creativeUrl}
                  onChange={(e) => setFormData({ ...formData, creativeUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-[#121212] p-8 rounded-[32px] shadow-sm border border-black/5 dark:border-white/[0.04] space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2 font-serif text-[#101828] dark:text-white">
                <Type className="w-5 h-5 text-[#8129D9]" /> Event Details
              </h2>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                  Event Title
                </label>
                <Input
                  placeholder="Design Drink & Draw"
                  className="h-14 rounded-2xl text-lg font-bold border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9]"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                    Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-14 rounded-2xl font-semibold border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9]"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                    Location
                  </label>
                  <Input
                    placeholder="Brooklyn, NY"
                    className="h-14 rounded-2xl font-semibold border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9]"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">Description</label>
                <Textarea
                  placeholder="What's the plan? Give your guests some details..."
                  className="min-h-[120px] rounded-2xl font-medium border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9] p-4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-6 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2 cursor-pointer select-none">
                    {formData.isPublic ? <Globe className="w-4 h-4 text-blue-500" /> : <Lock className="w-4 h-4 text-gray-400" />}
                    {formData.isPublic ? "Public Event" : "Private Event"}
                  </Label>
                  <p className="text-xs text-gray-400 font-medium">
                    {formData.isPublic 
                      ? "Visible on the Explore page for everyone." 
                      : "Only people with the link can view this event."}
                  </p>
                </div>
                <Switch 
                  checked={formData.isPublic} 
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })} 
                />
              </div>
            </div>

            {/* RSVP Form Builder */}
            <div className="bg-white dark:bg-[#121212] p-8 rounded-[32px] shadow-sm border border-black/5 dark:border-white/[0.04] space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2 font-serif text-[#101828] dark:text-white">
                    <Users className="w-5 h-5 text-[#8129D9]" /> RSVP Form Questions
                  </h2>
                  <p className="text-gray-400 font-medium text-xs mt-1">Ask guests for extra info (e.g. dietary choice, socials).</p>
                </div>
                <Button 
                  type="button" 
                  onClick={addField} 
                  variant="outline" 
                  className="rounded-full font-bold border-2 border-dashed border-[#8129D9]/30 hover:border-[#8129D9] hover:bg-[#8129D9]/5 text-[#8129D9] transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-gray-50/50 dark:bg-white/[0.01] border border-black/5 dark:border-white/[0.04] space-y-4 relative group transition-all hover:border-[#8129D9]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Question #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Question Prompt</label>
                        <Input
                          placeholder="e.g. Any food allergies?"
                          className="h-12 rounded-xl border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9]"
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Placeholder Answer</label>
                        <Input
                          placeholder="e.g. Peanut allergy, none, etc."
                          className="h-12 rounded-xl border-gray-200 dark:border-white/10 focus-visible:ring-[#8129D9]/30 focus-visible:border-[#8129D9]"
                          value={field.placeholder}
                          onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-black/[0.03] dark:border-white/[0.02]">
                      <Switch
                        id={`required-switch-${index}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(index, 'required', checked)}
                      />
                      <Label htmlFor={`required-switch-${index}`} className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                        Make this question required
                      </Label>
                    </div>
                  </div>
                ))}
                
                {customFields.length === 0 && (
                  <div className="p-8 text-center text-gray-400 font-bold italic border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl bg-gray-50/30 dark:bg-white/[0.005]">
                    Only asking for email by default. Add questions above if you need extra details.
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full text-lg font-bold bg-[#8129D9] hover:bg-[#7020C4] text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.99] border-none"
            >
              {loading ? "Launching..." : "Launch Event Page"}
            </Button>
          </form>

          {/* RIGHT COLUMN: REAL-TIME PREVIEW */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Page Preview</span>
              <span className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded-full">Synchronized</span>
            </div>

            <div 
              className="w-full rounded-[32px] overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl relative min-h-[580px] p-6 transition-all duration-300 flex flex-col justify-between"
              style={{ backgroundColor: currentThemeObj.bg, color: currentThemeObj.text }}
            >
              {/* Dynamic Conic Ray Pattern inside the preview */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-30 z-0">
                <div className="absolute w-[200%] h-[200%]" style={{
                  background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${currentThemeObj.starburst}18 10deg, transparent 11deg)`
                }} />
                <div className="absolute inset-0" style={{
                  background: `radial-gradient(circle_at_center, transparent 30%, ${currentThemeObj.bg} 85%)`
                }} />
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-6">
                {/* Back Button Placeholder */}
                <div className="flex items-center gap-1.5 opacity-40 text-[10px] font-bold">
                  <ArrowLeft className="w-3 h-3" /> BACK
                </div>

                {/* Poster Box */}
                <div 
                  className="w-full aspect-square rounded-[24px] border border-black/5 dark:border-white/5 flex items-center justify-center relative overflow-hidden transition-all duration-500 shadow-md"
                  style={{ backgroundColor: currentThemeObj.accent }}
                >
                  {formData.creativeUrl ? (
                    <img src={formData.creativeUrl} alt="Event Cover" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 opacity-15 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                      <span className="text-7xl font-black text-white mix-blend-overlay drop-shadow-md">
                        {formData.title?.[0]?.toUpperCase() || "E"}
                      </span>
                    </>
                  )}
                </div>

                {/* Info block */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-black leading-tight tracking-tight animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
                    {formData.title || "Untitled Event"}
                  </h1>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D9FF00] to-[#2457FF] flex items-center justify-center font-bold text-white text-xs shadow-inner" style={{ background: `linear-gradient(to top right, ${currentThemeObj.accent}, #2457FF)` }}>
                      {user?.displayName?.[0]?.toUpperCase() || "H"}
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider opacity-50 font-bold">Presented by</div>
                      <div className="font-bold text-xs">{user?.displayName || "Community"}</div>
                    </div>
                  </div>
                </div>

                {/* Time & Location details block */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
                      <Calendar className="w-4 h-4 opacity-50" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Date</div>
                      <div className="text-[10px] font-bold leading-tight">
                        {formData.date ? new Date(formData.date).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' }) : "Not set"}
                      </div>
                      <div className="text-[8px] opacity-60">
                        {formData.date ? new Date(formData.date).toLocaleTimeString([], { timeStyle: 'short' }) : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
                      <MapPin className="w-4 h-4 opacity-50" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Location</div>
                      <div className="text-[10px] font-bold leading-tight truncate max-w-[120px]">
                        {formData.location || "TBD"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP Mockup Box */}
              <div className="relative z-10 mt-6 bg-white/5 dark:bg-white/[0.03] backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/10 p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold opacity-60">Mockup RSVP Form</span>
                  <span className="text-[8px] font-bold opacity-40">1 guest pending</span>
                </div>

                <div className="space-y-2">
                  <Input 
                    disabled 
                    placeholder="guest@example.com" 
                    className="h-9 text-[10px] rounded-lg bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10" 
                  />
                  {customFields.map((field, idx) => (
                    <Input 
                      key={idx}
                      disabled 
                      placeholder={`${field.label || `Question #${idx+1}`} ${field.required ? '*' : ''}`} 
                      className="h-9 text-[10px] rounded-lg bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10" 
                    />
                  ))}
                </div>

                <Button 
                  disabled 
                  className="w-full h-9 rounded-lg text-[10px] font-bold transition-all text-white border-none shadow-sm"
                  style={{ backgroundColor: currentThemeObj.accent }}
                >
                  Request to Join
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

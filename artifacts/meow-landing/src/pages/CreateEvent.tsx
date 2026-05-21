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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground" />
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
            <div className="w-16 h-16 rounded-full bg-foreground/10 text-foreground flex items-center justify-center mx-auto">
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
                <div className="flex rounded-2xl overflow-hidden border border-gray-250 dark:border-border h-12 focus-within:ring-2 focus-within:ring-foreground/30 relative items-center bg-white dark:bg-card">
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
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent" />
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
                className="w-full h-12 rounded-full font-bold bg-foreground hover:bg-foreground/90 text-background transition-all shadow-md mt-2 disabled:opacity-50"
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
    <div 
      className="min-h-screen font-sans relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black pb-24 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: currentThemeObj.bg, color: currentThemeObj.text }}
    >
      {/* Dynamic Starburst/Ray Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${currentThemeObj.starburst}22 10deg, transparent 11deg)`
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle_at_center, transparent 20%, ${currentThemeObj.bg} 70%)`
        }} />
      </div>

      {/* Top Bar with Back & Themes */}
      <div className="relative z-20 px-6 py-6 md:px-12 md:py-8 max-w-[1100px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-bold opacity-60 hover:opacity-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full border border-black/5 dark:border-white/5">
          {THEMES.map((theme) => {
            const isSelected = formData.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setFormData({ ...formData, theme: theme.id })}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  isSelected ? 'scale-110 shadow-md' : 'hover:scale-105 opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: theme.bg, borderColor: isSelected ? theme.accent : 'transparent' }}
                title={theme.name}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content mimicking EventDetails */}
      <form onSubmit={handleSubmit} className="max-w-[1100px] mx-auto px-6 pt-4 md:pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Event Poster Box */}
            <div 
              className="w-full aspect-square rounded-[24px] border border-current/10 flex items-center justify-center relative overflow-hidden transition-all duration-500 shadow-xl group cursor-pointer"
              style={{ backgroundColor: currentThemeObj.accent }}
            >
              {formData.creativeUrl ? (
                <img src={formData.creativeUrl} alt="Event Cover" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                  <span className="text-[140px] font-black text-white mix-blend-overlay drop-shadow-md">
                    {formData.title?.[0]?.toUpperCase() || "E"}
                  </span>
                </>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20">
                {uploading ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-white mb-2" />
                    <span className="text-white font-bold text-sm">Upload Cover</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-30"
              />
            </div>
            {formData.creativeUrl && (
              <div className="flex justify-end mt-[-1rem]">
                 <button type="button" onClick={() => setFormData({...formData, creativeUrl: ''})} className="text-xs font-bold opacity-60 hover:opacity-100 transition-colors">Remove Cover</button>
              </div>
            )}

            {/* Presented By Mock */}
            <div className="flex items-center justify-between pt-2 opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-inner overflow-hidden" style={{ background: `linear-gradient(to top right, ${currentThemeObj.accent}, #2457FF)` }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || "H"
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Presented by</div>
                  <div className="font-bold text-sm text-current">{user?.displayName || "Community"}</div>
                </div>
              </div>
            </div>

            {/* Tagline / Subtitle (using description excerpt) */}
            <p className="text-sm font-medium leading-relaxed pt-2 opacity-80">
              {formData.description ? formData.description.slice(0, 120) + '...' : "Join us for an amazing experience..."}
            </p>

            {/* Hosted By Mock */}
            <div className="pt-6">
               <h3 className="text-xs font-bold mb-4 uppercase tracking-widest opacity-80">Hosted By</h3>
               <div className="flex items-center gap-3 inline-flex opacity-90">
                  <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center text-xs font-bold border border-current/20 shadow-sm overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                    ) : (
                      user?.displayName?.[0]?.toUpperCase() || "H"
                    )}
                  </div>
                  <span className="text-sm font-bold opacity-95">{user?.displayName || "A Community Member"}</span>
               </div>
            </div>

            <div className="pt-8 border-t border-current/10 space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <Label className="text-sm font-bold flex items-center gap-2 cursor-pointer select-none">
                     {formData.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                     {formData.isPublic ? "Public Event" : "Private Event"}
                   </Label>
                   <p className="text-[10px] opacity-60 font-bold mt-1 uppercase tracking-widest">
                     {formData.isPublic ? "Visible on Explore page" : "Direct link only"}
                   </p>
                 </div>
                 <Switch 
                   checked={formData.isPublic} 
                   onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })} 
                 />
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10 pt-2 lg:pl-6">
            
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event Title..."
              className="w-full bg-transparent border-none text-4xl md:text-[3.5rem] font-bold leading-[1.05] tracking-tight placeholder-current/40 outline-none p-0 focus:ring-0 text-current"
              style={{ fontFamily: "Inter, sans-serif" }}
              required
            />

            {/* Info rows */}
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="w-12 h-14 rounded-xl bg-current/5 border border-current/10 flex flex-col items-center justify-center overflow-hidden shadow-sm relative focus-within:ring-2 focus-within:ring-current/20 transition-all">
                   <div className="text-[9px] uppercase tracking-wider font-bold opacity-60 w-full text-center py-1 border-b border-current/10">
                     {formData.date ? new Date(formData.date).toLocaleString('en-US', { month: 'short' }) : "Mon"}
                   </div>
                   <div className="text-lg font-bold leading-none pt-1 pb-1">
                     {formData.date ? new Date(formData.date).getDate() : "DD"}
                   </div>
                   <input
                     type="datetime-local"
                     value={formData.date}
                     onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     required
                   />
                </div>
                <div className="pt-1">
                  <div className="font-bold text-lg text-current">
                    {formData.date ? new Date(formData.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : "Select Date & Time"}
                  </div>
                  <div className="opacity-60 font-medium text-sm mt-1 text-current">
                    {formData.date ? new Date(formData.date).toLocaleTimeString([], { timeStyle: 'short' }) : "Time not set"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-current/5 border border-current/10 flex items-center justify-center shadow-sm shrink-0">
                   <MapPin className="w-5 h-5 opacity-60" />
                </div>
                <div className="pt-1 flex-1">
                  <input
                    placeholder="Enter location (e.g. Brooklyn, NY)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-transparent border-none outline-none font-bold text-lg focus:ring-0 p-0 text-current placeholder-current/40 leading-none"
                    required
                  />
                  <div className="opacity-60 font-medium text-sm mt-2">Check map for details</div>
                </div>
              </div>
            </div>

            {/* Fake Registration Card with RSVP Builder inside */}
            <div className="pt-4">
               <div className="bg-current/5 backdrop-blur-2xl rounded-[20px] border border-current/10 overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-current/10 bg-current/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold opacity-60">Registration Form Editor</h3>
                    <button type="button" onClick={addField} className="text-xs font-bold bg-current/10 px-3 py-1.5 rounded-full hover:bg-current/20 transition-colors flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      {/* Default Email Field (Non-editable) */}
                      <div className="space-y-1.5 text-left opacity-60 pointer-events-none">
                        <label className="text-xs font-bold pl-1">Email Address <span className="text-red-500">*</span></label>
                        <div className="h-12 rounded-xl bg-current/5 border border-current/10 flex items-center px-3 text-sm font-medium">guest@example.com</div>
                      </div>

                      {/* Custom Fields Builder */}
                      {customFields.map((field, index) => (
                        <div key={index} className="flex gap-3 items-start relative group">
                          <div className="flex-1 space-y-2 bg-current/5 border border-current/10 p-3 rounded-xl">
                            <input
                              placeholder="Question (e.g. Any food allergies?)"
                              value={field.label}
                              onChange={(e) => updateField(index, 'label', e.target.value)}
                              className="w-full bg-transparent border-b border-current/20 text-sm font-bold pb-1 outline-none focus:border-current placeholder-current/40 transition-colors"
                              required
                            />
                            <div className="flex justify-between items-center pt-1">
                              <label className="flex items-center gap-2 text-xs font-bold opacity-80 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={field.required} 
                                  onChange={(e) => updateField(index, 'required', e.target.checked)}
                                  className="rounded bg-current/20 border-transparent focus:ring-0 text-current"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeField(index)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors self-start" title="Remove">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02] mt-2 shadow-xl border-none"
                      style={{ backgroundColor: currentThemeObj.text, color: currentThemeObj.bg }}
                    >
                      {loading ? "Publishing Event..." : "Publish Event"}
                    </Button>
                  </div>
               </div>
            </div>

            {/* About Section */}
            <div className="pt-8">
               <h3 className="text-sm font-bold mb-4 uppercase tracking-widest opacity-80">About Event</h3>
               <textarea
                 placeholder="What's the plan? Give your guests some details..."
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 className="w-full bg-current/5 border border-current/10 outline-none p-5 rounded-2xl min-h-[200px] font-medium placeholder-current/40 focus:ring-2 focus:ring-current/20 transition-all text-current resize-none text-[15px] leading-relaxed"
               />
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}

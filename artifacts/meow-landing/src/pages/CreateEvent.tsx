import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Calendar, MapPin, Type, Image as ImageIcon, Plus, Users, Globe, Lock, Check, Trash2, Upload, X, ChevronRight, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { parseAvatarUrlFromStorage } from "@/lib/avatars";
import { FastAverageColor } from 'fast-average-color';


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
    id: "luma-aura",
    name: "Luma Aura",
    bg: "#0d0a14",
    text: "#FFFFFF",
    accent: "#FFFFFF",
    starburst: "#8129D9",
    bgGradient: "radial-gradient(circle at 15% 50%, rgba(129, 41, 217, 0.25), transparent 25%), radial-gradient(circle at 85% 30%, rgba(217, 41, 100, 0.2), transparent 25%)"
  },
  {
    id: "glass-aurora",
    name: "Glass Aurora",
    bg: "#ffffff",
    text: "#101828",
    accent: "#101828",
    starburst: "#00F0FF",
    bgGradient: "linear-gradient(135deg, rgba(230, 240, 255, 1) 0%, rgba(255, 230, 240, 1) 100%)"
  },
  {
    id: "obsidian-mesh",
    name: "Obsidian Mesh",
    bg: "#050505",
    text: "#FFFFFF",
    accent: "#FFFFFF",
    starburst: "#333333",
    bgGradient: "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.5) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.5) 0, transparent 50%)"
  },
  {
    id: "ethereal-blur",
    name: "Ethereal Blur",
    bg: "#f3f4f6",
    text: "#111827",
    accent: "#4f46e5",
    starburst: "#4f46e5",
    bgGradient: "radial-gradient(circle at 50% -20%, #e0e7ff 0%, #f3f4f6 80%)"
  },
  {
    id: "sunset-mirage",
    name: "Sunset Mirage",
    bg: "#1a0b12",
    text: "#FFFFFF",
    accent: "#FF7B00",
    starburst: "#FF3300",
    bgGradient: "radial-gradient(circle at 100% 0%, rgba(255, 123, 0, 0.3) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(255, 51, 0, 0.3) 0%, transparent 40%)"
  },
  {
    id: "oceanic-deep",
    name: "Oceanic Deep",
    bg: "#020813",
    text: "#E0F2FE",
    accent: "#38BDF8",
    starburst: "#0369A1",
    bgGradient: "radial-gradient(circle at 50% 50%, rgba(3, 105, 161, 0.2) 0%, transparent 60%), linear-gradient(180deg, #020813 0%, #082f49 100%)"
  },
  {
    id: "emerald-oasis",
    name: "Emerald Oasis",
    bg: "#022c22",
    text: "#F0FDF4",
    accent: "#34D399",
    starburst: "#059669",
    bgGradient: "radial-gradient(ellipse at top left, rgba(5, 150, 105, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.2) 0%, transparent 50%)"
  },
  {
    id: "peachy-clean",
    name: "Peachy Clean",
    bg: "#fff5f0",
    text: "#431407",
    accent: "#EA580C",
    starburst: "#F97316",
    bgGradient: "linear-gradient(120deg, #fff5f0 0%, #ffedd5 100%)"
  }
];

function PollOptionsBuilder({
  title,
  options,
  setOptions,
  placeholder
}: {
  title: string;
  options: string[];
  setOptions: (opts: string[]) => void;
  placeholder: string;
}) {
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  return (
    <div className="space-y-2 bg-current/5 border border-current/10 p-4 rounded-2xl">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold uppercase tracking-wider opacity-85">{title}</label>
        <button
          type="button"
          onClick={addOption}
          className="text-[10px] font-bold bg-current/10 px-2 py-1.5 rounded-full hover:bg-current/25 transition-colors"
        >
          + Add Option
        </button>
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              placeholder={`${placeholder} #${idx + 1}`}
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              className="h-9 rounded-xl bg-white dark:bg-black/40 text-xs font-semibold text-foreground"
            />
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="p-2 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors shrink-0"
              title="Remove Option"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-[10px] opacity-40 italic">No options added. This poll will be disabled.</p>
        )}
      </div>
    </div>
  );
}

export default function CreateEvent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

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
    endDate: "",
    location: "",
    theme: "cream-cozy",
    creativeUrl: "",
    coHosts: [] as string[],
    isPublic: true,
    isPreLaunch: false,
    city: "",
    audienceType: "",
    tentativeDate: "",
    targetInterest: 100,
    showHypeMeter: true,
    showPolls: true,
    showSuggestions: true,
    showReferral: true,
    showTicker: true,
    showComments: true,
    dateOptions: [] as string[],
    venueOptions: [] as string[],
    artistsOptions: [] as string[],
    foodOptions: [] as string[],
    themeOptions: [] as string[],
    timingOptions: [] as string[],
    ticketLimit: "" as string | number,
    upiQrCodeUrl: "",
    ticketPrice: "" as string | number,
  });

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const docRef = doc(db, "events", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              ...formData,
              title: data.title || "",
              description: data.description || "",
              date: data.date || "",
              endDate: data.endDate || "",
              location: data.location || "",
              theme: data.theme || "cream-cozy",
              creativeUrl: data.creativeUrl || "",
              coHosts: data.coHosts || [],
              isPublic: data.isPublic !== undefined ? data.isPublic : true,
              isPreLaunch: data.isPreLaunch || false,
              city: data.city || "",
              audienceType: data.audienceType || "",
              tentativeDate: data.tentativeDate || "",
              targetInterest: data.targetInterest || 100,
              showHypeMeter: data.showHypeMeter !== false,
              showPolls: data.showPolls !== false,
              showSuggestions: data.showSuggestions !== false,
              showReferral: data.showReferral !== false,
              showTicker: data.showTicker !== false,
              showComments: data.showComments !== false,
              dateOptions: data.dateOptions || [],
              venueOptions: data.venueOptions || [],
              artistsOptions: data.artistsOptions || [],
              foodOptions: data.foodOptions || [],
              themeOptions: data.themeOptions || [],
              timingOptions: data.timingOptions || [],
              ticketLimit: data.ticketLimit || "",
              ticketPrice: data.ticketPrice || "",
              upiQrCodeUrl: data.upiQrCodeUrl || "",
            });
            if (data.customFields) setCustomFields(data.customFields);
          }
        } catch (error) {
          console.error("Error fetching event to edit:", error);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  const [coHostInput, setCoHostInput] = useState("");
  const [hostSearchResults, setHostSearchResults] = useState<any[]>([]);
  const [isSearchingHosts, setIsSearchingHosts] = useState(false);

  useEffect(() => {
    const searchHosts = async () => {
      const searchTerm = coHostInput.trim().toLowerCase();
      if (!searchTerm) {
        setHostSearchResults([]);
        setIsSearchingHosts(false);
        return;
      }
      
      setIsSearchingHosts(true);
      try {
        const q = query(
          collection(db, "profiles"),
          where("username", ">=", searchTerm),
          where("username", "<=", searchTerm + "\uf8ff")
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(doc => doc.data());
        // Filter out already selected co-hosts and self
        const filtered = results.filter(
          p => !formData.coHosts.includes(p.username) && p.userId !== user?.uid
        ).slice(0, 5); // Limit to top 5 matches
        
        setHostSearchResults(filtered);
      } catch (err) {
        console.error("Error searching hosts:", err);
      } finally {
        setIsSearchingHosts(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchHosts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [coHostInput, formData.coHosts, user]);

  const [uploading, setUploading] = useState(false);
  const [extractedColor, setExtractedColor] = useState<{hex: string, isDark: boolean} | null>(null);
  const [autoColorMatch, setAutoColorMatch] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Extract average color robustly
    const fac = new FastAverageColor();
    const imageUrl = URL.createObjectURL(file);
    fac.getColorAsync(imageUrl)
      .then(color => {
        setExtractedColor({ hex: color.hex, isDark: color.isDark });
        URL.revokeObjectURL(imageUrl);
      })
      .catch(e => {
        console.error("Color extraction failed:", e);
      });

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

  const [uploadingUpi, setUploadingUpi] = useState(false);

  const handleUpiQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingUpi(true);
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
      setFormData(prev => ({ ...prev, upiQrCodeUrl: data.secure_url }));
      toast({
        title: "UPI QR uploaded!",
        description: "Your QR code is ready.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingUpi(false);
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
      const finalColor = autoColorMatch && extractedColor ? extractedColor.hex : currentThemeObj.accent;
      const finalTheme = autoColorMatch && extractedColor ? "dynamic" : formData.theme;
      const finalIsDark = autoColorMatch && extractedColor ? extractedColor.isDark : false;
      
      if (id) {
        await updateDoc(doc(db, "events", id), {
          ...formData,
          theme: finalTheme,
          coHosts: formData.coHosts,
          color: finalColor,
          isDark: finalIsDark,
          customFields,
        });
        toast({
          title: "Event updated!",
          description: "Your changes have been saved.",
        });
        setLocation(`/manage/${id}`);
      } else {
        const docRef = await addDoc(collection(db, "events"), {
          ...formData,
          theme: finalTheme,
          coHosts: formData.coHosts,
          color: finalColor,
          isDark: finalIsDark,
          customFields,
          userId: user.uid,
          userName: user.displayName,
          createdAt: serverTimestamp(),
          rsvpCount: 0,
          coHostPermissions: {},
        });

        toast({
          title: "Event created!",
          description: "Your event page is live.",
        });
        setLocation(`/e/${docRef.id}`);
      }
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

  if (fetchingProfile || initialLoading) {
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
  
  // Apply Spotify-style dynamic color theme if toggle is on
  const previewBg = autoColorMatch && extractedColor ? extractedColor.hex : currentThemeObj.bg;
  const previewText = autoColorMatch && extractedColor ? (extractedColor.isDark ? "#FFFFFF" : "#111827") : currentThemeObj.text;
  const previewAccent = autoColorMatch && extractedColor ? (extractedColor.isDark ? "#FFFFFF" : "#111827") : currentThemeObj.accent;
  const previewStarburst = autoColorMatch && extractedColor ? extractedColor.hex : currentThemeObj.starburst;
  const previewBgGradient = autoColorMatch && extractedColor ? undefined : currentThemeObj.bgGradient;

  return (
    <div 
      className="min-h-screen font-sans relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black pb-24 overflow-hidden transition-all duration-700"
      style={{ 
        backgroundColor: previewBg, 
        backgroundImage: previewBgGradient || 'none',
        color: previewText 
      }}
    >
      {/* Dynamic Starburst/Ray Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40 mix-blend-screen">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${previewStarburst}22 10deg, transparent 11deg)`,
          animation: "spin 60s linear infinite"
        }} />
        {!previewBgGradient && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle_at_center, transparent 20%, ${previewBg} 70%)`
          }} />
        )}
      </div>

      {/* Top Bar with Back & Themes */}
      <div className="relative z-20 px-6 py-6 md:px-12 md:py-8 max-w-[1100px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-bold opacity-60 hover:opacity-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        {/* Mobile Theme Layout (first 5 + arrow) */}
        <div className="md:hidden flex items-center gap-2 sm:gap-3 p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-black/5 dark:border-white/5 w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-max pr-1">
            {/* Always visible 5 themes */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {THEMES.slice(0, 5).map((theme) => {
                const isSelected = formData.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: theme.id })}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${
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

            <AnimatePresence>
              {showAllThemes && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.8 }}
                  className="flex items-center gap-2 sm:gap-3 overflow-hidden origin-left shrink-0"
                >
                  {THEMES.slice(5).map((theme) => {
                    const isSelected = formData.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: theme.id })}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${
                          isSelected ? 'scale-110 shadow-md' : 'hover:scale-105 opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: theme.bg, borderColor: isSelected ? theme.accent : 'transparent' }}
                        title={theme.name}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Arrow */}
            <button
              onClick={() => setShowAllThemes(!showAllThemes)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 text-foreground transition-all duration-500 hover:bg-black/20 dark:hover:bg-white/20 shrink-0"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showAllThemes ? "rotate-180" : "rotate-0"}`} />
            </button>
          </div>
        </div>

        {/* Desktop Theme Layout (Original All Visible) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-black/5 dark:border-white/5">
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
              style={{ backgroundColor: previewAccent }}
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
              
              <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity backdrop-blur-sm z-20 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
                 <button type="button" onClick={() => {
                   setFormData({...formData, creativeUrl: ''});
                   setExtractedColor(null);
                 }} className="text-xs font-bold opacity-60 hover:opacity-100 transition-colors">Remove Cover</button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-2xl bg-current/5 border border-current/10">
              <div className="flex items-center gap-3">
                {extractedColor ? (
                  <div className="w-8 h-8 rounded-full border-2 border-current/20 shadow-sm transition-colors duration-500" style={{ backgroundColor: autoColorMatch ? extractedColor.hex : 'transparent' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-current/20 shadow-sm flex items-center justify-center opacity-30">
                    <span className="text-[10px]">🎨</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">Dynamic Color Match</p>
                  <p className="text-xs font-medium opacity-60">Match theme to cover image</p>
                </div>
              </div>
              <Switch 
                checked={autoColorMatch}
                onCheckedChange={setAutoColorMatch}
              />
            </div>

            {/* Presented By Mock */}
            <div className="flex items-center justify-between pt-2 opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-inner overflow-hidden" style={{ background: `linear-gradient(to top right, ${previewAccent}, #2457FF)` }}>
                  {user?.photoURL ? (
                    <img src={parseAvatarUrlFromStorage(user.photoURL)} alt={user.displayName || ""} className="w-full h-full object-cover" />
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
                      <img src={parseAvatarUrlFromStorage(user.photoURL)} alt={user.displayName || ""} className="w-full h-full object-cover" />
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

               <div className="flex items-center justify-between border-t border-current/10 pt-4">
                 <div>
                   <Label className="text-sm font-bold flex items-center gap-2 cursor-pointer select-none text-purple-600 dark:text-purple-400">
                     <Sparkles className="w-4 h-4 animate-pulse" />
                     Validation Mode (Pre-launch)
                   </Label>
                   <p className="text-[10px] opacity-60 font-bold mt-1 uppercase tracking-widest">
                     Gauge demand before launch
                   </p>
                 </div>
                 <Switch 
                   checked={formData.isPreLaunch} 
                   onCheckedChange={(checked) => setFormData({ ...formData, isPreLaunch: checked })} 
                 />
               </div>

               <div className="pt-4 border-t border-current/10 space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Ticketing & Payments</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Ticket Price (₹)</label>
                     <Input 
                       type="number"
                       placeholder="Free if empty"
                       value={formData.ticketPrice}
                       onChange={e => setFormData({...formData, ticketPrice: e.target.value})}
                       className="h-10 bg-current/5 border-current/10 rounded-xl font-bold"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Ticket Limit</label>
                     <Input 
                       type="number"
                       placeholder="Unlimited if empty"
                       value={formData.ticketLimit}
                       onChange={e => setFormData({...formData, ticketLimit: e.target.value})}
                       className="h-10 bg-current/5 border-current/10 rounded-xl font-bold"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2 mt-4">
                   <label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Host UPI QR Code</label>
                   {formData.upiQrCodeUrl ? (
                     <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-current/20">
                       <img src={formData.upiQrCodeUrl} className="w-full h-full object-cover" alt="UPI QR" />
                       <button type="button" onClick={() => setFormData({...formData, upiQrCodeUrl: ""})} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3"/></button>
                     </div>
                   ) : (
                     <div className="relative">
                       <input type="file" accept="image/*" onChange={handleUpiQrUpload} disabled={uploadingUpi} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                       <Button type="button" disabled={uploadingUpi} variant="outline" className="w-full bg-current/5 border-current/10 h-10 rounded-xl font-bold text-xs">
                         {uploadingUpi ? "Uploading..." : "Upload Payment QR"}
                       </Button>
                     </div>
                   )}
                   <p className="text-[10px] opacity-60 font-medium">Attendees will upload screenshots of their payment to this QR code for verification.</p>
                 </div>
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
              {!formData.isPreLaunch ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="flex items-start gap-5 flex-1 w-full">
                      <div className="w-12 h-14 rounded-xl bg-current/5 border border-current/10 flex flex-col items-center justify-center overflow-hidden shadow-sm relative focus-within:ring-2 focus-within:ring-current/20 transition-all shrink-0">
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
                           onClick={(e) => {
                             try {
                               if ('showPicker' in HTMLInputElement.prototype) {
                                 (e.target as HTMLInputElement).showPicker();
                               }
                             } catch (err) {}
                           }}
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                           required={!formData.isPreLaunch}
                         />
                      </div>
                      <div className="pt-1 flex-1">
                        <div className="font-bold text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Start</div>
                        <div className="font-bold text-base text-current leading-tight">
                          {formData.date ? new Date(formData.date).toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' }) : "Select Start"}
                        </div>
                        <div className="opacity-60 font-medium text-xs mt-1 text-current">
                          {formData.date ? new Date(formData.date).toLocaleTimeString([], { timeStyle: 'short' }) : "Time"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-5 flex-1 w-full">
                      <div className="w-12 h-14 rounded-xl bg-current/5 border border-current/10 flex flex-col items-center justify-center overflow-hidden shadow-sm relative focus-within:ring-2 focus-within:ring-current/20 transition-all shrink-0">
                         <div className="text-[9px] uppercase tracking-wider font-bold opacity-60 w-full text-center py-1 border-b border-current/10">
                           {formData.endDate ? new Date(formData.endDate).toLocaleString('en-US', { month: 'short' }) : "Mon"}
                         </div>
                         <div className="text-lg font-bold leading-none pt-1 pb-1">
                           {formData.endDate ? new Date(formData.endDate).getDate() : "DD"}
                         </div>
                         <input
                           type="datetime-local"
                           value={formData.endDate}
                           onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                           onClick={(e) => {
                             try {
                               if ('showPicker' in HTMLInputElement.prototype) {
                                 (e.target as HTMLInputElement).showPicker();
                               }
                             } catch (err) {}
                           }}
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                         />
                      </div>
                      <div className="pt-1 flex-1">
                        <div className="font-bold text-[10px] uppercase tracking-wider opacity-60 mb-0.5">End (Optional)</div>
                        <div className="font-bold text-base text-current leading-tight">
                          {formData.endDate ? new Date(formData.endDate).toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' }) : "Select End"}
                        </div>
                        <div className="opacity-60 font-medium text-xs mt-1 text-current">
                          {formData.endDate ? new Date(formData.endDate).toLocaleTimeString([], { timeStyle: 'short' }) : "Time"}
                        </div>
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
                        required={!formData.isPreLaunch}
                      />
                      <div className="opacity-60 font-medium text-sm mt-2">Check map for details</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* PRE-LAUNCH VALIDATION FIELDS */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-current/5 border border-current/10 flex items-center justify-center shadow-sm shrink-0">
                       <MapPin className="w-5 h-5 opacity-60 text-purple-500" />
                    </div>
                    <div className="pt-1 flex-1">
                      <input
                        placeholder="Enter Target City (e.g. New York, SF)"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value, location: e.target.value })}
                        className="w-full bg-transparent border-none outline-none font-bold text-lg focus:ring-0 p-0 text-current placeholder-current/40 leading-none"
                        required={formData.isPreLaunch}
                      />
                      <div className="opacity-60 font-medium text-sm mt-2">What city will host this event?</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-current/5 border border-current/10 flex items-center justify-center shadow-sm shrink-0">
                       <Calendar className="w-5 h-5 opacity-60 text-purple-500" />
                    </div>
                    <div className="pt-1 flex-1">
                      <input
                        placeholder="Tentative Date/Month (e.g. Late Oct 2026)"
                        value={formData.tentativeDate}
                        onChange={(e) => setFormData({ ...formData, tentativeDate: e.target.value, date: e.target.value })}
                        className="w-full bg-transparent border-none outline-none font-bold text-lg focus:ring-0 p-0 text-current placeholder-current/40 leading-none"
                        required={formData.isPreLaunch}
                      />
                      <div className="opacity-60 font-medium text-sm mt-2">Tentative date or season for the event</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 bg-current/5 border border-current/10 p-3.5 rounded-2xl text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Audience Type</label>
                      <input
                        placeholder="e.g. Tech Professionals"
                        value={formData.audienceType}
                        onChange={(e) => setFormData({ ...formData, audienceType: e.target.value })}
                        className="w-full bg-transparent border-none outline-none font-bold text-sm focus:ring-0 p-0 text-current placeholder-current/40 mt-1"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 bg-current/5 border border-current/10 p-3.5 rounded-2xl text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Target Interest (Goal)</label>
                      <input
                        type="number"
                        value={formData.targetInterest}
                        onChange={(e) => setFormData({ ...formData, targetInterest: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent border-none outline-none font-bold text-sm focus:ring-0 p-0 text-current mt-1"
                        min="1"
                        required={formData.isPreLaunch}
                      />
                    </div>
                  </div>

                  {/* Pre-launch feature visibility switches */}
                  <div className="space-y-4 pt-2">
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Feature Visibility Controls
                      </label>
                      <p className="text-[9px] opacity-65 font-medium mt-0.5">Choose which validation features to share publicly. Admin can always view all sections.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Hype Progress</span>
                          <span className="text-[9px] opacity-50 block font-medium">Goal progress tracker</span>
                        </div>
                        <Switch 
                          checked={formData.showHypeMeter} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showHypeMeter: checked })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Community Polls</span>
                          <span className="text-[9px] opacity-50 block font-medium">Visitor custom voting</span>
                        </div>
                        <Switch 
                          checked={formData.showPolls} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showPolls: checked })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Suggestions Form</span>
                          <span className="text-[9px] opacity-50 block font-medium">Date/venue/price input</span>
                        </div>
                        <Switch 
                          checked={formData.showSuggestions} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showSuggestions: checked })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Referral Engine</span>
                          <span className="text-[9px] opacity-50 block font-medium">Share loop & rewards</span>
                        </div>
                        <Switch 
                          checked={formData.showReferral} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showReferral: checked })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Activity Ticker</span>
                          <span className="text-[9px] opacity-50 block font-medium">Live ticker feed</span>
                        </div>
                        <Switch 
                          checked={formData.showTicker} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showTicker: checked })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-current/5 border border-current/10 text-left">
                        <div className="pr-2">
                          <span className="text-xs font-bold block">Hype Feed</span>
                          <span className="text-[9px] opacity-50 block font-medium">Comments and notes</span>
                        </div>
                        <Switch 
                          checked={formData.showComments} 
                          onCheckedChange={(checked) => setFormData({ ...formData, showComments: checked })} 
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-current/5 border border-current/10 flex items-center justify-center shadow-sm shrink-0">
                   <Users className="w-5 h-5 opacity-60" />
                </div>
                <div className="pt-1 flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.coHosts.map((host, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-current/10 rounded-full text-xs font-bold text-current border border-current/10">
                        @{host}
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, coHosts: prev.coHosts.filter((_, i) => i !== idx) }))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      placeholder={formData.coHosts.length === 0 ? "Search for a host..." : "Add another..."}
                      value={coHostInput}
                      onChange={(e) => setCoHostInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const val = coHostInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
                          if (val && !formData.coHosts.includes(val)) {
                            setFormData(prev => ({ ...prev, coHosts: [...prev.coHosts, val] }));
                          }
                          setCoHostInput("");
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none font-bold text-lg focus:ring-0 p-0 text-current placeholder-current/40 leading-none"
                    />
                    
                    {/* Search Results Dropdown */}
                    {(hostSearchResults.length > 0 || isSearchingHosts) && coHostInput.trim() && (
                      <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                        {isSearchingHosts ? (
                          <div className="p-3 text-xs font-bold text-gray-400 text-center">Searching...</div>
                        ) : hostSearchResults.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto">
                            {hostSearchResults.map((host) => (
                              <div 
                                key={host.username}
                                onClick={() => {
                                  if (!formData.coHosts.includes(host.username)) {
                                    setFormData(prev => ({ ...prev, coHosts: [...prev.coHosts, host.username] }));
                                  }
                                  setCoHostInput("");
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-black/5 dark:border-white/5 last:border-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold text-xs overflow-hidden text-gray-500">
                                  {host.photoURL ? (
                                    <img src={parseAvatarUrlFromStorage(host.photoURL)} alt={host.username} className="w-full h-full object-cover" />
                                  ) : (
                                    host.username[0].toUpperCase()
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{host.displayName || host.username}</span>
                                  <span className="text-[10px] font-bold text-gray-400">@{host.username}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="opacity-60 font-medium text-sm mt-2">Optional. Adds event to their profile. Type to search or press Enter.</div>
                </div>
              </div>


            {formData.isPreLaunch && (
              <div className="space-y-6 pt-4 text-left">
                <div className="bg-current/5 backdrop-blur-2xl rounded-[20px] border border-current/10 overflow-hidden shadow-xl p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold opacity-80 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-4 h-4" /> Community Polls Creator
                    </h3>
                    <p className="text-xs font-semibold opacity-60 mt-1">Let visitors vote on these options on the pre-launch landing page.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PollOptionsBuilder 
                      title="Date Options" 
                      options={formData.dateOptions} 
                      setOptions={(opts) => setFormData({ ...formData, dateOptions: opts })} 
                      placeholder="e.g. Oct 12th" 
                    />
                    <PollOptionsBuilder 
                      title="Venue Options" 
                      options={formData.venueOptions} 
                      setOptions={(opts) => setFormData({ ...formData, venueOptions: opts })} 
                      placeholder="e.g. Rooftop Lounge" 
                    />
                    <PollOptionsBuilder 
                      title="Artist / Speaker Options" 
                      options={formData.artistsOptions} 
                      setOptions={(opts) => setFormData({ ...formData, artistsOptions: opts })} 
                      placeholder="e.g. DJ Shadow" 
                    />
                    <PollOptionsBuilder 
                      title="Food & Drink Options" 
                      options={formData.foodOptions} 
                      setOptions={(opts) => setFormData({ ...formData, foodOptions: opts })} 
                      placeholder="e.g. Pizza & Drinks" 
                    />
                    <PollOptionsBuilder 
                      title="Theme Options" 
                      options={formData.themeOptions} 
                      setOptions={(opts) => setFormData({ ...formData, themeOptions: opts })} 
                      placeholder="e.g. Retro Arcade" 
                    />
                    <PollOptionsBuilder 
                      title="Timing Options" 
                      options={formData.timingOptions} 
                      setOptions={(opts) => setFormData({ ...formData, timingOptions: opts })} 
                      placeholder="e.g. Evening (7-10 PM)" 
                    />
                  </div>
                </div>
              </div>
            )}

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
                      {loading ? (id ? "Saving Changes..." : (formData.isPreLaunch ? "Launching Campaign..." : "Publishing Event...")) : (id ? "Save Changes" : (formData.isPreLaunch ? "Launch Pre-Launch Campaign 🚀" : "Publish Event"))}
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

import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, arrayUnion, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Share2, CheckCircle2, Download, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { Sun, Moon, Lock } from "lucide-react";
import { parseAvatarUrlFromStorage } from "@/lib/avatars";

const THEMES_MAP: Record<string, { bg: string, text: string, accent: string, starburst: string }> = {
  "cream-cozy": { bg: "#FAF8F5", text: "#101828", accent: "#8129D9", starburst: "#8129D9" },
  "sleek-midnight": { bg: "#0A0A0A", text: "#FFFFFF", accent: "#D9FF00", starburst: "#D9FF00" },
  "retro-mint": { bg: "#E6F0EA", text: "#1E3B27", accent: "#1E3B27", starburst: "#1E3B27" },
  "burgundy-velvet": { bg: "#1C0A0E", text: "#FAF8F5", accent: "#D4AF37", starburst: "#79001B" },
  "cyberpunk-neon": { bg: "#030F12", text: "#00F0FF", accent: "#FF007F", starburst: "#00F0FF" },
  "royal-lavender": { bg: "#F0EBF7", text: "#2A1B4E", accent: "#58268C", starburst: "#8B5CF6" }
};

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpId, setRsvpId] = useState("");
  const [email, setEmail] = useState("");
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [coHostProfiles, setCoHostProfiles] = useState<any[]>([]);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast({ title: "Event not found", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, toast]);

  useEffect(() => {
    // Initialize custom responses state when event loads
    if (event?.customFields) {
      const initial: Record<string, string> = {};
      event.customFields.forEach((field: any) => {
        initial[field.label] = "";
      });
      setCustomResponses(initial);
    }
    
    // Fetch host and co-host profiles
    const fetchProfiles = async () => {
      if (!event?.userId) return;
      try {
        const q = query(collection(db, "profiles"), where("userId", "==", event.userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHostProfile(snap.docs[0].data());
        }

        if (event.coHosts && event.coHosts.length > 0) {
          const chunks = [];
          for (let i = 0; i < event.coHosts.length; i += 10) {
            chunks.push(event.coHosts.slice(i, i + 10));
          }
          const allCoHosts = [];
          for (const chunk of chunks) {
            const coHostQ = query(collection(db, "profiles"), where("username", "in", chunk));
            const coHostSnap = await getDocs(coHostQ);
            allCoHosts.push(...coHostSnap.docs.map(d => d.data()));
          }
          setCoHostProfiles(allCoHosts);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };
    fetchProfiles();
  }, [event]);

  useEffect(() => {
    const checkRsvpStatus = async () => {
      if (!id || !user?.email) return;
      try {
        const q = query(collection(db, "events", id, "rsvps"), where("email", "==", user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setRsvpDone(true);
          const rsvpData = snap.docs[0].data();
          if (rsvpData.confirmationSent || rsvpData.checkedIn) {
            setIsApproved(true);
          }
        }
      } catch (err) {
        console.error("Error checking RSVP status", err);
      }
    };
    checkRsvpStatus();
  }, [id, user]);


  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !email) return;
    setRsvpLoading(true);

    try {
      // 1. Add to RSVPs collection
      const rsvpDoc = await addDoc(collection(db, "events", id, "rsvps"), {
        email,
        userId: user?.uid || null,
        displayName: user?.displayName || null,
        photoURL: user?.photoURL || null,
        customResponses,
        createdAt: serverTimestamp(),
        checkedIn: false,
        confirmationSent: false
      });

      setRsvpId(rsvpDoc.id);


      // 2. Increment count and add to attendeeEmails on event doc
      await updateDoc(doc(db, "events", id), {
        rsvpCount: increment(1),
        attendeeEmails: arrayUnion(email)
      });

      setRsvpDone(true);
      toast({ title: "You're on the list!", description: "See you there." });
    } catch (error: any) {
      toast({ title: "RSVP failed", description: error.message, variant: "destructive" });
    } finally {
      setRsvpLoading(false);
    }
  };


  // Setup email from user context if available
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const themeColors = (() => {
    if (event?.theme && THEMES_MAP[event.theme]) {
      return THEMES_MAP[event.theme];
    }
    const color = event?.color || '#D9FF00';
    return {
      bg: isDark ? "#0A0A0A" : "#F3F0E8",
      text: isDark ? "#FFFFFF" : "#111827",
      accent: color,
      starburst: color
    };
  })();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <>
      <div 
        className="min-h-screen font-sans relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black pb-24 overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: themeColors.bg, color: themeColors.text }}
      >
      {/* Dynamic Starburst/Ray Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${themeColors.starburst}22 10deg, transparent 11deg)`
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle_at_center, transparent 20%, ${themeColors.bg} 70%)`
        }} />
      </div>

      {/* Back Button Only (No Navbar) */}
      <div className="relative z-10 px-6 py-6 md:px-12 md:py-8 max-w-[1100px] mx-auto">
        <button
          onClick={() => {
            // Safe fallback if history is empty
            if (window.history.state && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/dashboard";
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 pt-10 md:pt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Event Poster Placeholder */}
            <div className="w-full aspect-square rounded-[24px] border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden flex items-center justify-center transition-all duration-500" style={{ backgroundColor: themeColors.accent }}>
               {event.creativeUrl ? (
                 <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
               ) : (
                 <>
                   <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                   <span className="text-[140px] font-black text-white mix-blend-overlay drop-shadow-md">{event.title?.[0]?.toUpperCase()}</span>
                 </>
               )}
            </div>

            {/* Presented By */}
            <div className="flex items-center justify-between pt-2">
              <Link href={hostProfile?.username ? `/p/${hostProfile.username}` : "#"}>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D9FF00] to-[#2457FF] flex items-center justify-center font-bold text-white text-sm shadow-inner overflow-hidden" style={{ background: `linear-gradient(to top right, ${themeColors.accent}, #2457FF)` }}>
                    {hostProfile?.photoURL ? (
                      <img src={parseAvatarUrlFromStorage(hostProfile.photoURL)} alt={hostProfile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      (hostProfile?.displayName || event.userName || "H")?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Presented by</div>
                    <div className="font-bold text-sm" style={{ color: themeColors.text }}>{hostProfile?.displayName || event.userName || "Community"}</div>
                  </div>
                </div>
              </Link>
              <button className="px-5 py-2 rounded-full bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-xs font-bold transition-all border border-gray-200 dark:border-white/5 shadow-sm" style={{ color: themeColors.text }}>
                Subscribe
              </button>
            </div>

            {/* Tagline */}
            <p className="text-sm font-medium leading-relaxed pt-2 opacity-80" style={{ color: themeColors.text }}>
              {event.description?.slice(0, 120) || "Join us for an amazing experience."}...
            </p>

            {/* Hosted By section */}
            <div className="pt-6">
               <h3 className="text-xs font-bold mb-4 uppercase tracking-widest opacity-80" style={{ color: themeColors.text }}>Hosted By</h3>
               <div className="flex flex-wrap items-center gap-6">
                 <Link href={hostProfile?.username ? `/p/${hostProfile.username}` : "#"}>
                   <div className="flex items-center gap-3 inline-flex cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-white/20 shadow-sm overflow-hidden" style={{ color: themeColors.text }}>
                        {hostProfile?.photoURL ? (
                          <img src={parseAvatarUrlFromStorage(hostProfile.photoURL)} alt={hostProfile.displayName} className="w-full h-full object-cover" />
                        ) : (
                          (hostProfile?.displayName || event.userName || "A")?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-bold opacity-95" style={{ color: themeColors.text }}>{hostProfile?.displayName || event.userName || "A Community Member"}</span>
                   </div>
                 </Link>
                 
                 {coHostProfiles.map((coHost, idx) => (
                   <Link key={idx} href={`/p/${coHost.username}`}>
                     <div className="flex items-center gap-3 inline-flex cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-white/20 shadow-sm overflow-hidden" style={{ color: themeColors.text }}>
                          {coHost.photoURL ? (
                            <img src={parseAvatarUrlFromStorage(coHost.photoURL)} alt={coHost.displayName} className="w-full h-full object-cover" />
                          ) : (
                            coHost.displayName?.[0]?.toUpperCase() || coHost.username?.[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-bold opacity-95" style={{ color: themeColors.text }}>{coHost.displayName || coHost.username}</span>
                     </div>
                   </Link>
                 ))}
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10 pt-2 lg:pl-6">
            <h1 className="text-4xl md:text-[3.5rem] font-bold tracking-tight leading-[1.05]" style={{ fontFamily: "Inter, sans-serif", color: themeColors.text }}>
              {event.title}
            </h1>

            {/* Info rows */}
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="w-12 h-14 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                   <div className="text-[9px] uppercase tracking-wider font-bold opacity-60 w-full text-center py-1 border-b border-black/5 dark:border-white/5">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</div>
                   <div className="text-lg font-bold leading-none pt-1 pb-1" style={{ color: themeColors.text }}>{new Date(event.date).getDate()}</div>
                </div>
                <div className="pt-1">
                  <div className="font-bold text-lg" style={{ color: themeColors.text }}>{new Date(event.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>{new Date(event.date).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
                   <MapPin className="w-5 h-5 opacity-60" style={{ color: themeColors.text }} />
                </div>
                <div className="pt-1">
                  {isApproved || user?.uid === event.userId ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-lg hover:underline hover:opacity-80 transition-all cursor-pointer block"
                      style={{ color: themeColors.text }}
                    >
                      {event.location}
                    </a>
                  ) : (
                    <div className="font-bold text-lg" style={{ color: themeColors.text }}>
                      Location revealed upon approval
                    </div>
                  )}
                  <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>
                    {isApproved || user?.uid === event.userId ? "Click to open in Google Maps" : "RSVP to get the exact location"}
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="pt-4">
               <AnimatePresence mode="wait">
                 {!user ? (
                   <motion.div
                     key="auth-required"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl"
                   >
                      <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/10 dark:bg-white/[0.02]">
                        <h3 className="text-sm font-bold opacity-60" style={{ color: themeColors.text }}>Registration</h3>
                      </div>
                      
                      <div className="p-6 space-y-6 text-center">
                         <div className="flex flex-col items-center gap-3 bg-amber-500/10 dark:bg-amber-500/20 p-5 rounded-2xl border border-amber-500/25 max-w-sm mx-auto shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                               <Lock className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                               <div className="text-sm font-bold text-amber-800 dark:text-amber-300">Login Required to RSVP</div>
                               <div className="text-xs font-semibold opacity-80 leading-relaxed" style={{ color: themeColors.text }}>
                                  You must be signed in to request to join this event and receive your ticket.
                               </div>
                            </div>
                         </div>

                         <div className="pt-2">
                           <Link href={`/login?redirect=${encodeURIComponent(`/e/${event.id}`)}`}>
                             <Button
                               className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md border-none text-white"
                               style={{ backgroundColor: themeColors.accent }}
                             >
                               Login to RSVP
                             </Button>
                           </Link>
                         </div>
                      </div>
                   </motion.div>
                 ) : !rsvpDone ? (
                   <motion.div
                     key="form"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl"
                   >
                      <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/10 dark:bg-white/[0.02]">
                        <h3 className="text-sm font-bold opacity-60" style={{ color: themeColors.text }}>Registration</h3>
                      </div>
                      
                      <div className="p-6 space-y-6">
                         <div className="flex items-start gap-3 bg-white/10 dark:bg-white/[0.03] p-4 rounded-xl border border-black/5 dark:border-white/5">
                            <div className="p-1.5 bg-white/20 dark:bg-white/10 rounded-lg mt-0.5 border border-black/5 dark:border-transparent shadow-sm">
                               <Users className="w-4 h-4 opacity-60" style={{ color: themeColors.text }} />
                            </div>
                            <div>
                               <div className="text-sm font-bold" style={{ color: themeColors.text }}>Approval Required</div>
                               <div className="text-xs opacity-60 mt-1" style={{ color: themeColors.text }}>Your registration is subject to host approval.</div>
                            </div>
                         </div>

                         <div className="text-sm font-medium opacity-85" style={{ color: themeColors.text }}>
                            Welcome, {user?.displayName?.split(" ")[0] || "Guest"}! To join the event, please register below.
                         </div>

                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 flex items-center justify-center text-xs font-bold border border-black/5 dark:border-white/20 shadow-sm" style={{ color: themeColors.text }}>
                               {user?.displayName?.[0] || email?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="text-sm">
                               <span className="font-bold mr-2" style={{ color: themeColors.text }}>{user?.displayName || "Guest"}</span>
                               <span className="opacity-60" style={{ color: themeColors.text }}>{user?.email || email}</span>
                            </div>
                         </div>

                         <form onSubmit={handleRSVP} className="space-y-4 pt-2">
                           {(!user || !user.email) && (
                             <div className="space-y-1.5 text-left">
                               <label className="text-xs font-bold opacity-80 pl-1" style={{ color: themeColors.text }}>
                                 Email Address <span className="text-red-500">*</span>
                               </label>
                               <Input
                                 placeholder="Enter your email"
                                 className="h-12 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                               />
                             </div>
                           )}
                           
                           {event.customFields?.map((field: any, idx: number) => (
                              <div key={idx} className="space-y-1.5 text-left">
                                <label className="text-xs font-bold opacity-80 pl-1" style={{ color: themeColors.text }}>
                                  {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                  placeholder={field.placeholder || "Your answer"}
                                  className="h-12 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                                  value={customResponses[field.label] || ""}
                                  onChange={(e) => setCustomResponses({ ...customResponses, [field.label]: e.target.value })}
                                  required={field.required}
                                />
                              </div>
                           ))}

                            <Button
                              disabled={rsvpLoading}
                              className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02] mt-2 shadow-md border-none text-white"
                              style={{ backgroundColor: themeColors.accent }}
                            >
                              {rsvpLoading ? "Processing..." : "Request to Join"}
                            </Button>
                         </form>
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-2xl p-8 rounded-[20px] border border-gray-200 dark:border-white/10 text-center space-y-6 shadow-xl dark:shadow-2xl"
                    >
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-[#111827] dark:text-white border border-gray-200 dark:border-white/20 shadow-sm">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#111827] dark:text-white">You're registered!</h3>

                      <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-xl space-y-2 border border-gray-100 dark:border-white/5">
                        <p className="text-[#111827] dark:text-white font-semibold text-sm">
                          {isApproved ? "Approved & Confirmed" : "Pending Approval"}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                          {isApproved 
                            ? "You're on the guest list! Your ticket has been emailed to you."
                            : "The host will review your request. You'll receive a ticket via email once confirmed."}
                        </p>
                      </div>

                      {isApproved && event.photosLink && (
                        <div className="pt-2">
                          <a href={event.photosLink} target="_blank" rel="noopener noreferrer">
                            <Button
                              className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md border-none text-white flex items-center justify-center gap-2"
                              style={{ backgroundColor: themeColors.accent }}
                            >
                              <Download className="w-4 h-4" /> View Event Photos
                            </Button>
                          </a>
                        </div>
                      )}
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* About Section */}
            <div className="pt-8">
               <h3 className="text-sm font-bold text-[#111827] dark:text-white mb-4 uppercase tracking-widest opacity-80">About Event</h3>
               <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-wrap text-[15px]">
                 {event.description || "No description provided."}
               </div>
            </div>

          </div>
        </div>
      </div>
      </div>
    </>
  );
}

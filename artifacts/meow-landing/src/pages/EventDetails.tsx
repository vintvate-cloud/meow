import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Share2, CheckCircle2, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { Sun, Moon } from "lucide-react";

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
  }, [event]);


  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !email) return;
    setRsvpLoading(true);

    try {
      // 1. Add to RSVPs collection
      const rsvpDoc = await addDoc(collection(db, "events", id, "rsvps"), {
        email,
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-[#0A0A0A] font-sans text-[#111827] dark:text-white relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black pb-24 overflow-hidden transition-colors duration-300">
      {/* Dynamic Starburst/Ray Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${event.color || '#D9FF00'}22 10deg, transparent 11deg)`
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#F3F0E8_70%)] dark:bg-[radial-gradient(circle_at_center,transparent_20%,#0A0A0A_70%)]" />
      </div>

      {/* Minimal Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-[#111827] dark:text-white font-bold opacity-80 hover:opacity-100 transition-opacity">
             <img src="/meowlogo2.png" alt="MEOW" className="h-6 w-auto dark:brightness-0 dark:invert transition-all" />
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500 dark:text-gray-400 ml-4">
            <Link href="/" className="text-[#111827] dark:text-white">Events</Link>
            <span className="hover:text-[#111827] dark:hover:text-white cursor-pointer transition-colors">Calendars</span>
            <span className="hover:text-[#111827] dark:hover:text-white cursor-pointer transition-colors">Discover</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold text-gray-500 dark:text-gray-300">
          <Link href="/create-event" className="hidden md:block hover:text-[#111827] dark:hover:text-white transition-colors">Create Event</Link>
          <button onClick={toggleTheme} className="hover:text-[#111827] dark:hover:text-white transition-colors" title="Toggle Theme">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 flex items-center justify-center text-[#111827] dark:text-white shadow-sm">
            {user?.displayName?.[0] || "U"}
          </div>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 pt-10 md:pt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Event Poster Placeholder */}
            <div className="w-full aspect-square rounded-[24px] border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: event.color || '#2457FF' }}>
               <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
               <span className="text-[140px] font-black text-white mix-blend-overlay drop-shadow-md">{event.title?.[0]?.toUpperCase()}</span>
            </div>

            {/* Presented By */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D9FF00] to-[#2457FF] flex items-center justify-center font-bold text-[#111827] dark:text-[#0A0A0A] text-sm shadow-inner">
                  {(event.userName || "H")?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Presented by</div>
                  <div className="font-bold text-[#111827] dark:text-white text-sm">{event.userName || "Community"}</div>
                </div>
              </div>
              <button className="px-5 py-2 rounded-full bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-[#111827] dark:text-white text-xs font-bold transition-all border border-gray-200 dark:border-white/5 shadow-sm">
                Subscribe
              </button>
            </div>

            {/* Tagline */}
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-relaxed pt-2">
              {event.description?.slice(0, 120) || "Join us for an amazing experience."}...
            </p>

            {/* Hosted By section */}
            <div className="pt-6">
               <h3 className="text-xs font-bold text-[#111827] dark:text-white mb-4 uppercase tracking-widest opacity-80">Hosted By</h3>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-xs font-bold text-[#111827] dark:text-white border border-gray-200 dark:border-white/20 shadow-sm">
                    {(event.userName || "A")?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{event.userName || "A Community Member"}</span>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10 pt-2 lg:pl-6">
            <h1 className="text-4xl md:text-[3.5rem] font-bold tracking-tight text-[#111827] dark:text-white leading-[1.05]" style={{ fontFamily: "Inter, sans-serif" }}>
              {event.title}
            </h1>

            {/* Info rows */}
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="w-12 h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                   <div className="text-[9px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/10 w-full text-center py-1 border-b border-gray-100 dark:border-transparent">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</div>
                   <div className="text-lg font-bold text-[#111827] dark:text-white leading-none pt-1 pb-1">{new Date(event.date).getDate()}</div>
                </div>
                <div className="pt-1">
                  <div className="font-bold text-lg text-[#111827] dark:text-white">{new Date(event.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">{new Date(event.date).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                   <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="pt-1">
                  <div className="font-bold text-lg text-[#111827] dark:text-white">{event.location}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Check map for details</div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="pt-4">
               <AnimatePresence mode="wait">
                 {!rsvpDone ? (
                   <motion.div
                     key="form"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[20px] border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl"
                   >
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300">Registration</h3>
                      </div>
                      
                      <div className="p-6 space-y-6">
                         <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="p-1.5 bg-white dark:bg-white/10 rounded-lg mt-0.5 border border-gray-100 dark:border-transparent shadow-sm">
                               <Users className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-[#111827] dark:text-white">Approval Required</div>
                               <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your registration is subject to host approval.</div>
                            </div>
                         </div>

                         <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            Welcome, {user?.displayName?.split(" ")[0] || "Guest"}! To join the event, please register below.
                         </div>

                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-xs font-bold text-[#111827] dark:text-white border border-gray-200 dark:border-white/20 shadow-sm">
                               {user?.displayName?.[0] || email?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="text-sm">
                               <span className="font-bold text-[#111827] dark:text-white mr-2">{user?.displayName || "Guest"}</span>
                               <span className="text-gray-500 dark:text-gray-400">{user?.email || email}</span>
                            </div>
                         </div>

                         <form onSubmit={handleRSVP} className="space-y-4 pt-2">
                           {(!user || !user.email) && (
                             <Input
                               placeholder="Enter your email"
                               className="h-12 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               required
                             />
                           )}
                           
                           {event.customFields?.map((field: any, idx: number) => (
                              <Input
                                key={idx}
                                placeholder={field.placeholder}
                                className="h-12 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                                value={customResponses[field.label] || ""}
                                onChange={(e) => setCustomResponses({ ...customResponses, [field.label]: e.target.value })}
                                required={field.required}
                              />
                           ))}

                           <Button
                             disabled={rsvpLoading}
                             className="w-full h-12 rounded-xl font-bold text-white dark:text-black transition-transform hover:scale-[1.02] bg-[#111827] dark:bg-white hover:bg-black dark:hover:bg-gray-200 mt-2 shadow-md"
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
                         Pending Approval
                       </p>
                       <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                         The host will review your request. You'll receive a ticket via email once confirmed.
                       </p>
                     </div>
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
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, arrayUnion, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Share2, CheckCircle2, Download, ArrowLeft, Sparkles, MessageSquare, Send, Heart, Trophy, Flame, HelpCircle, Check, ExternalLink, Camera, Image as ImageIcon, User, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { Sun, Moon, Lock } from "lucide-react";
import { parseAvatarUrlFromStorage } from "@/lib/avatars";

import { getThemeColors } from "@/lib/theme-colors";

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
  const isAdmin = user && event && (user.uid === event.userId || event.coHosts?.includes(localStorage.getItem("user-username")?.toLowerCase().trim() || ""));
  const [isDark, setIsDark] = useState(false);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [coHostProfiles, setCoHostProfiles] = useState<any[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAttendees, setApprovedAttendees] = useState<any[]>([]);

  // Validation Campaign states
  const [interestLevel, setInterestLevel] = useState<"interested" | "maybe" | "not-interested" | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const [allRSVPs, setAllRSVPs] = useState<any[]>([]);
  const [pollVotes, setPollVotes] = useState<Record<string, Record<string, number>>>({});
  const [userVoted, setUserVoted] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackFormData, setFeedbackFormData] = useState({
    suggestedDate: "",
    suggestedVenue: "",
    suggestedPrice: "",
    improvements: ""
  });

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
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          console.error("Error fetching event:", error);
        }
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
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          console.error("Error fetching profiles:", error);
        }
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
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          console.error("Error checking RSVP status", err);
        }
      }
    };
    checkRsvpStatus();
  }, [id, user]);

  useEffect(() => {
    if (!id || !isApproved) return;
    const fetchApproved = async () => {
      try {
        const snap = await getDocs(collection(db, "events", id, "rsvps"));
        const list = snap.docs
          .map(doc => doc.data())
          .filter((r: any) => r.confirmationSent || r.checkedIn);
        setApprovedAttendees(list);
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          console.error("Error fetching approved attendees for gallery", err);
        }
      }
    };
    fetchApproved();
  }, [id, isApproved]);

  // Real-time listener for validation campaign RSVPs and votes
  useEffect(() => {
    if (!id) return;

    // Listen to RSVPs subcollection in real time
    const unsubscribeRSVPs = onSnapshot(
      collection(db, "events", id, "rsvps"),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllRSVPs(list);
        
        // Aggregate votes
        const counts: Record<string, Record<string, number>> = {
          date: {},
          venue: {},
          artist: {},
          food: {},
          theme: {},
          timing: {}
        };
        list.forEach(r => {
          if (r.votes) {
            Object.entries(r.votes).forEach(([category, selection]) => {
              if (selection && typeof selection === 'string') {
                if (!counts[category]) counts[category] = {};
                counts[category][selection] = (counts[category][selection] || 0) + 1;
              }
            });
          }
        });
        setPollVotes(counts);

        // Find current user's RSVP status and referrals
        if (user) {
          const userRsvp = list.find(r => r.userId === user.uid || r.email === user.email);
          if (userRsvp) {
            setRsvpDone(true);
            setRsvpId(userRsvp.id);
            setInterestLevel(userRsvp.interestLevel || "interested");
            if (userRsvp.votes) setUserVoted(userRsvp.votes);
            setUserReferralCount(userRsvp.referralCount || 0);
          }
        } else if (email) {
          const guestRsvp = list.find(r => r.email === email);
          if (guestRsvp) {
            setRsvpDone(true);
            setRsvpId(guestRsvp.id);
            setInterestLevel(guestRsvp.interestLevel || "interested");
            if (guestRsvp.votes) setUserVoted(guestRsvp.votes);
            setUserReferralCount(guestRsvp.referralCount || 0);
          }
        }
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.error("Real-time RSVPs error", err);
        }
      }
    );

    // Listen to Comments subcollection in real time
    const unsubscribeComments = onSnapshot(
      collection(db, "events", id, "comments"),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Sort descending by createdAt
        list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setComments(list);
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.error("Real-time comments error", err);
        }
      }
    );

    return () => {
      unsubscribeRSVPs();
      unsubscribeComments();
    };
  }, [id, user, email]);

  const remainingTickets = event?.ticketLimit ? Math.max(0, parseInt(event.ticketLimit) - allRSVPs.filter(r => r.status !== 'rejected' && r.status !== 'cancelled').length) : null;

  // Extract ref from search parameter and increment views once per session
  useEffect(() => {
    if (!id || !event) return;

    // Handle Referral tracking
    const searchParams = new URLSearchParams(window.location.search);
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferredBy(refParam);
      sessionStorage.setItem(`ref-${id}`, refParam);
    } else {
      const storedRef = sessionStorage.getItem(`ref-${id}`);
      if (storedRef) {
        setReferredBy(storedRef);
      }
    }

    // Handle Views Incrementing
    const sessionKey = `viewed-${id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "true");
      updateDoc(doc(db, "events", id), {
        views: increment(1)
      }).catch((e: any) => {
        if (e?.code !== 'permission-denied') {
          console.error("Failed to increment views", e);
        }
      });
    }
  }, [id, event]);

  // Handle Interest & Suggestions submit
  const handleValidationSubmit = async (selectedInterest: "interested" | "maybe" | "not-interested") => {
    if (!id) return;
    if (!user) {
      toast({ title: "Login required", description: "Redirecting to login page...", variant: "destructive" });
      window.location.href = `/login?redirect=${encodeURIComponent(`/e/${id}`)}`;
      return;
    }
    setSubmittingFeedback(true);

    try {
      const emailToUse = user.email || `${user.uid}@meow.com`;
      // 1. Add to RSVPs (acts as interest submissions)
      const rsvpData = {
        email: emailToUse,
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Guest",
        photoURL: user.photoURL || null,
        interestLevel: selectedInterest,
        suggestedDate: feedbackFormData.suggestedDate,
        suggestedVenue: feedbackFormData.suggestedVenue,
        suggestedPrice: feedbackFormData.suggestedPrice,
        improvements: feedbackFormData.improvements,
        referrer: referredBy || null,
        referralCount: 0,
        createdAt: serverTimestamp(),
        votes: userVoted
      };

      const docRef = await addDoc(collection(db, "events", id, "rsvps"), rsvpData);
      setRsvpId(docRef.id);
      setInterestLevel(selectedInterest);
      setRsvpDone(true);

      // 2. Increment parent counts
      const updatePayload: Record<string, any> = {
        rsvpCount: increment(selectedInterest === "interested" ? 1 : 0),
        validationCount: increment(1)
      };

      if (selectedInterest === "interested") {
        updatePayload.interestedCount = increment(1);
      } else if (selectedInterest === "maybe") {
        updatePayload.maybeCount = increment(1);
      } else {
        updatePayload.notInterestedCount = increment(1);
      }

      await updateDoc(doc(db, "events", id), updatePayload);

      // 3. Update referrer's count if applicable
      if (referredBy) {
        // Query the referrer's RSVP doc
        const refQuery = query(
          collection(db, "events", id, "rsvps"),
          where("displayName", "==", referredBy)
        );
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty) {
          const refDocRef = doc(db, "events", id, "rsvps", refSnap.docs[0].id);
          await updateDoc(refDocRef, {
            referralCount: increment(1)
          });
        }
      }

      toast({
        title: "Interest Registered! 🎉",
        description: "Thank you for shaping this event. Cast your votes in the polls below!"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newCommentText.trim()) return;

    try {
      await addDoc(collection(db, "events", id, "comments"), {
        userId: user?.uid || null,
        displayName: user?.displayName || email.split("@")[0] || "Guest",
        photoURL: user?.photoURL || null,
        text: newCommentText.trim(),
        createdAt: serverTimestamp()
      });
      setNewCommentText("");
      toast({ title: "Comment shared!" });
    } catch (err: any) {
      toast({ title: "Comment failed", description: err.message, variant: "destructive" });
    }
  };

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

  const themeColors = getThemeColors(event?.theme || "cream-cozy", event, isDark);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <>
      <div 
        className="min-h-screen font-sans relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black pb-24 overflow-hidden transition-all duration-700"
        style={{ 
          backgroundColor: themeColors.bg, 
          backgroundImage: (themeColors as any).bgGradient || "none",
          color: themeColors.text 
        }}
      >
      {/* Dynamic Starburst/Ray Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40 mix-blend-screen">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${themeColors.starburst}22 10deg, transparent 11deg)`,
          animation: "spin 60s linear infinite"
        }} />
        {!(themeColors as any).bgGradient && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle_at_center, transparent 20%, ${themeColors.bg} 70%)`
          }} />
        )}
      </div>

      {/* Back Button Only (No Navbar) */}
      <div className="relative z-10 px-4 pt-4 pb-0 md:px-12 md:py-8 max-w-[1100px] mx-auto">
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

      <div className="max-w-[1100px] mx-auto px-4 pt-6 md:px-6 md:pt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 lg:gap-16">
          
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

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 md:space-y-10 pt-0 md:pt-2 lg:pl-6">
            <div>
              <h1 className="text-3xl md:text-[3.5rem] font-bold tracking-tight leading-[1.05]" style={{ fontFamily: "Inter, sans-serif", color: themeColors.text }}>
                {event.title}
              </h1>
            </div>

            {/* Info rows */}
            <div className="space-y-6">
              {!event.isPreLaunch ? (
                <>
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
                    <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
                       <MapPin className="w-5 h-5 opacity-60" style={{ color: themeColors.text }} />
                    </div>
                    <div className="pt-1 flex-1">
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

                  {/* TICKET & PRICING ROW */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-5 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
                         <Ticket className="w-5 h-5 opacity-60" style={{ color: themeColors.text }} />
                      </div>
                      <div className="pt-1 flex-1">
                        <div className="font-bold text-lg" style={{ color: themeColors.text }}>
                          {event.ticketPrice ? `₹${event.ticketPrice}` : "Free Registration"}
                        </div>
                        <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>
                          {event.ticketLimit ? `Capacity: ${event.ticketLimit} attendees` : "Open to all"}
                        </div>
                      </div>
                    </div>
                    {remainingTickets !== null && (
                      <div className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-black/5 dark:border-white/10 ${remainingTickets > 0 ? 'bg-white/30 dark:bg-white/10 backdrop-blur-sm' : 'bg-red-500/10 text-red-500 border-red-500/20'}`} style={{ color: remainingTickets > 0 ? themeColors.text : undefined }}>
                        {remainingTickets > 0 ? `${remainingTickets} Tickets Left` : 'Sold Out'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* PRE-LAUNCH INFO ROWS */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
                       <MapPin className="w-5 h-5 opacity-60 text-purple-500" style={{ color: themeColors.text }} />
                    </div>
                    <div className="pt-1">
                      <div className="font-bold text-lg" style={{ color: themeColors.text }}>
                        Target City: {event.city || event.location}
                      </div>
                      <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>
                        Help us choose the best venue!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
                       <Calendar className="w-5 h-5 opacity-60 text-purple-500" style={{ color: themeColors.text }} />
                    </div>
                    <div className="pt-1">
                      <div className="font-bold text-lg" style={{ color: themeColors.text }}>
                        Tentative Timeline: {event.tentativeDate || "To Be Decided"}
                      </div>
                      <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>
                        Vote for your preferred dates below.
                      </div>
                    </div>
                  </div>

                  {event.audienceType && (
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
                         <Users className="w-5 h-5 opacity-60 text-purple-500" style={{ color: themeColors.text }} />
                      </div>
                      <div className="pt-1">
                        <div className="font-bold text-lg" style={{ color: themeColors.text }}>
                          Target Audience: {event.audienceType}
                        </div>
                        <div className="opacity-60 font-medium text-sm mt-1" style={{ color: themeColors.text }}>
                          Designed for this community.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>            {/* Registration & Validation Campaign Cards */}
            <div className="pt-4 space-y-6">
              {!event.isPreLaunch ? (
                <AnimatePresence mode="wait">
                  {!rsvpDone ? (
                    <motion.div
                      key="register-btn"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl p-6 md:p-10 text-center"
                    >
                      <h3 className="text-2xl md:text-3xl font-black mb-2" style={{ color: themeColors.text }}>Ready to join?</h3>
                      <p className="text-sm md:text-base opacity-70 mb-8 font-medium" style={{ color: themeColors.text }}>
                        Secure your spot and get your ticket for {event.title}.
                      </p>
                      <Link href={`/register/${event.id}`}>
                        <Button
                          className="w-full h-14 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-xl border-none text-white"
                          style={{ backgroundColor: themeColors.accent }}
                        >
                          Register Now
                        </Button>
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                       key="done"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="bg-[#111827] dark:bg-black p-8 rounded-[24px] border border-white/10 text-center space-y-6 shadow-xl relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                       <div className="flex justify-center relative z-10">
                         <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm backdrop-blur-sm">
                           <CheckCircle2 className="w-8 h-8" />
                         </div>
                       </div>
                       <h3 className="text-2xl font-bold text-white relative z-10">You're registered!</h3>

                       <div className="bg-white/5 p-5 rounded-xl space-y-2 border border-white/10 relative z-10 text-left">
                         <p className="text-white font-semibold text-sm flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full shrink-0 ${isApproved ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                           {isApproved ? "Approved & Confirmed" : "Pending Approval"}
                         </p>
                         <p className="text-xs font-medium text-white/70 leading-relaxed">
                           {isApproved 
                             ? "You're on the guest list! Your ticket has been emailed to you."
                             : "The host will review your request. You'll receive a ticket via email once confirmed."}
                         </p>
                       </div>

                       {isApproved && event.photosLink && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="p-6 rounded-[24px] border border-black/10 dark:border-white/10 shadow-xl space-y-5 text-left relative overflow-hidden bg-cover bg-center"
                            style={{
                              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(15,15,25,0.95) 100%), url(${event.creativeUrl || ""})`,
                              boxShadow: `0 10px 30px -10px ${themeColors.accent}33`
                            }}
                          >
                            {/* Theme glow indicator */}
                            <div 
                              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-40 animate-pulse"
                              style={{ backgroundColor: themeColors.accent }}
                            />

                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Gallery Unlocked
                              </span>
                              <span className="text-[10px] font-extrabold opacity-60 text-white uppercase tracking-wider">
                                {approvedAttendees.length > 0 ? `${approvedAttendees.length} Guests Joined` : "Exclusive Access"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xl font-black tracking-tight text-white font-serif">Relive the Magic</h4>
                              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                Access the official gallery and download high-resolution captures shared by the organizers.
                              </p>
                            </div>

                            {/* Memory stats */}
                            <div className="grid grid-cols-3 gap-2.5 py-1 text-center">
                              <div className="bg-white/5 border border-white/5 p-2 rounded-xl">
                                <span className="block text-sm font-black text-white">4K</span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Quality</span>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-2 rounded-xl">
                                <span className="block text-sm font-black text-white">Photo/Vid</span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Format</span>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-2 rounded-xl">
                                <span className="block text-sm font-black text-white">Live</span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Status</span>
                              </div>
                            </div>

                            {/* Attendee Avatar Stack */}
                            {approvedAttendees.length > 0 && (
                              <div className="flex items-center gap-3 pt-1">
                                <div className="flex -space-x-2.5 overflow-hidden">
                                  {approvedAttendees.slice(0, 5).map((att, idx) => (
                                    <div 
                                      key={idx} 
                                      className="w-7 h-7 rounded-full bg-[#1A1A1A] border-2 border-[#000] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-white"
                                    >
                                      {att.photoURL ? (
                                        <img src={parseAvatarUrlFromStorage(att.photoURL)} alt={att.displayName || att.email} className="w-full h-full object-cover" />
                                      ) : (
                                        (att.displayName || att.email || "G")[0].toUpperCase()
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-[10px] font-medium text-gray-400">
                                  Access shared with you and{" "}
                                  <span className="text-white font-bold">
                                    {approvedAttendees.length} other{approvedAttendees.length > 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="pt-1">
                              <a href={event.photosLink} target="_blank" rel="noopener noreferrer" className="block">
                                <Button
                                  className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.01] text-white border-none shadow-lg flex items-center justify-center gap-2 group relative overflow-hidden"
                                  style={{ 
                                    backgroundColor: themeColors.accent,
                                    boxShadow: `0 4px 20px ${themeColors.accent}4d`
                                  }}
                                >
                                  {/* Button reflection effect */}
                                  <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-20deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                                  <Sparkles className="w-4 h-4 animate-spin-slow text-white" />
                                  Open Event Gallery
                                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </Button>
                              </a>
                            </div>
                          </motion.div>
                       )}
                     </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                /* PRE-LAUNCH INTEREST VALIDATION HUB */
                <div className="space-y-6">
                  {/* Hype Meter Card */}
                  {((event.showHypeMeter !== false) || isAdmin) && (
                    <div className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl p-6 rounded-[24px] border border-current/10 shadow-xl space-y-4 text-left relative overflow-hidden">
                      {event.showHypeMeter === false && isAdmin && (
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold tracking-widest uppercase border border-purple-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin Only
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-orange-500 animate-bounce" /> Hype Meter
                          </h3>
                          <p className="text-xs font-semibold opacity-80 mt-1">
                            Goal: {event.targetInterest || 100} interested attendees
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black">{allRSVPs.filter(r => r.interestLevel === 'interested' || r.interestLevel === 'maybe').length}</span>
                          <span className="text-xs font-bold opacity-60"> / {event.targetInterest || 100}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {(() => {
                        const interestedAndMaybe = allRSVPs.filter(r => r.interestLevel === 'interested' || r.interestLevel === 'maybe').length;
                        const target = event.targetInterest || 100;
                        const pct = Math.min(100, Math.round((interestedAndMaybe / target) * 100));
                        return (
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-current/5 rounded-full overflow-hidden border border-current/10">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-right">
                              {pct}% towards launch checkpoint
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Interest submission deck */}
                  {!rsvpDone ? (
                    <div className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl p-6 rounded-[24px] border border-current/10 shadow-xl text-left space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-4 h-4" /> Shape this Event
                        </h3>
                        <p className="text-xs font-semibold opacity-70">Are you interested in attending? Register your interest and give preferences below.</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(["interested", "maybe", "not-interested"] as const).map((level) => {
                          const isSel = interestLevel === level;
                          let colorClass = "bg-current/5 hover:bg-current/10 text-current";
                          let emoji = "🔥";
                          let label = "Interested";

                          if (level === "maybe") {
                            emoji = "🤔";
                            label = "Maybe";
                          } else if (level === "not-interested") {
                            emoji = "😴";
                            label = "Not Interested";
                          }

                          if (isSel) {
                            if (level === "interested") colorClass = "bg-orange-500 text-white font-bold scale-105 border-orange-500";
                            else if (level === "maybe") colorClass = "bg-yellow-500 text-black font-bold scale-105 border-yellow-500";
                            else colorClass = "bg-gray-500 text-white font-bold scale-105 border-gray-500";
                          }

                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => {
                                if (!user) {
                                  toast({ title: "Login required", description: "Redirecting you to the login page to submit interest...", variant: "destructive" });
                                  window.location.href = `/login?redirect=${encodeURIComponent(`/e/${event.id}`)}`;
                                  return;
                                }
                                setInterestLevel(level);
                              }}
                              className={`h-16 rounded-xl border border-current/10 flex flex-col items-center justify-center gap-1 transition-all ${colorClass}`}
                            >
                              <span className="text-lg">{emoji}</span>
                              <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {interestLevel && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          onSubmit={(e) => handleValidationSubmit(interestLevel)}
                          className="space-y-4 border-t border-current/10 pt-4"
                        >
                          {((event.showSuggestions !== false) || isAdmin) && (
                            <div className="space-y-4 pt-1">
                              {event.showSuggestions === false && isAdmin && (
                                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Lock className="w-3 h-3" /> Suggestions Form is private (Admin Only)
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold pl-1">Suggest a Date / Timeline</label>
                                <Input
                                  placeholder="e.g. October 15th, or weekends only"
                                  value={feedbackFormData.suggestedDate}
                                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, suggestedDate: e.target.value })}
                                  className="h-10 rounded-xl bg-white dark:bg-black/30 border-current/10 focus:border-current text-foreground"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold pl-1">Suggest a Venue or Neighborhood</label>
                                <Input
                                  placeholder="e.g. Brooklyn Rooftop, SOMA gallery"
                                  value={feedbackFormData.suggestedVenue}
                                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, suggestedVenue: e.target.value })}
                                  className="h-10 rounded-xl bg-white dark:bg-black/30 border-current/10 focus:border-current text-foreground"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold pl-1">Target pricing you'd pay ($)</label>
                                <select
                                  value={feedbackFormData.suggestedPrice}
                                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, suggestedPrice: e.target.value })}
                                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-black/30 border border-current/10 focus:border-current text-xs font-bold text-foreground outline-none"
                                >
                                  <option value="">Select range...</option>
                                  <option value="Free">Free / Complimentary</option>
                                  <option value="$10 - $20">$10 - $20</option>
                                  <option value="$20 - $35">$20 - $35</option>
                                  <option value="$35 - $50">$35 - $50</option>
                                  <option value="$50 - $100">$50 - $100</option>
                                  <option value="$100+">$100+</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold pl-1">What would make this event a success?</label>
                                <textarea
                                  placeholder="Suggestions, specific artists, catering requests..."
                                  value={feedbackFormData.improvements}
                                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, improvements: e.target.value })}
                                  className="w-full h-16 rounded-xl bg-white dark:bg-black/30 border border-current/10 focus:border-current text-xs font-medium p-3 outline-none resize-none text-foreground"
                                />
                              </div>
                            </div>
                          )}

                          <Button
                            type="submit"
                            disabled={submittingFeedback}
                            className="w-full h-11 rounded-xl font-bold text-xs uppercase bg-purple-600 dark:bg-purple-500 hover:opacity-90 transition-all text-white border-none shadow-md"
                          >
                            {submittingFeedback ? "Submitting..." : "Confirm & Send Feedback"}
                          </Button>
                        </motion.form>
                      )}
                    </div>
                  ) : (
                    /* VERIFIED INTEREST & REFERRALS loops */
                    <div className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl p-6 rounded-[24px] border border-current/10 shadow-xl text-left space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                          <Check className="w-5 h-5 stroke-[3px]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">Interest Level: <span className="capitalize text-emerald-500">{interestLevel}</span></h3>
                          <p className="text-[10px] font-semibold opacity-60">You have registered. Help shape this event below!</p>
                        </div>
                      </div>

                      {/* Viral referrals system */}
                      {((event.showReferral !== false) || isAdmin) && (
                        <div className="bg-current/5 border border-current/10 p-4 rounded-xl space-y-3.5 relative overflow-hidden">
                          {event.showReferral === false && isAdmin && (
                            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold tracking-widest uppercase border border-purple-500/20 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Admin Only
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-yellow-500" /> Share & Unlock Rewards
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                              {userReferralCount} Referrals
                            </span>
                          </div>

                          {/* Referral badges */}
                          {(() => {
                            let badge = "📣 Hype Starter";
                            let nextGoal = 1;
                            let badgeColor = "text-blue-500 bg-blue-500/10";
                            if (userReferralCount >= 5) {
                              badge = "👑 Hype Legend (VIP Candidate)";
                              nextGoal = 5;
                              badgeColor = "text-yellow-500 bg-yellow-500/10";
                            } else if (userReferralCount >= 3) {
                              badge = "🚀 Viral Accelerator";
                              nextGoal = 5;
                              badgeColor = "text-purple-500 bg-purple-500/10";
                            } else if (userReferralCount >= 1) {
                              badge = "✨ Community Spark";
                              nextGoal = 3;
                              badgeColor = "text-emerald-500 bg-emerald-500/10";
                            }
                            const pct = Math.min(100, Math.round((userReferralCount / nextGoal) * 100));

                            return (
                              <div className="space-y-3">
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${badgeColor} inline-block`}>
                                  Badge: {badge}
                                </div>
                                {userReferralCount < 5 && (
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full bg-current/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-current" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[9px] opacity-60 text-right font-medium">
                                      {userReferralCount} / {nextGoal} for next viral level
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Referral Link copy field */}
                          {(() => {
                            const dispName = user?.displayName || (allRSVPs.find(r => r.userId === user?.uid)?.displayName) || 'guest';
                            const referralLink = `${window.location.origin}/e/${id}?ref=${encodeURIComponent(dispName)}`;
                            return (
                              <div className="space-y-1.5 pt-2">
                                <label className="text-[9px] font-bold opacity-60 uppercase">Your Referral Link</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={referralLink}
                                    readOnly
                                    className="h-9 flex-1 bg-white dark:bg-black/30 text-[10px] font-medium border border-current/10 rounded-xl px-2.5 outline-none select-all text-foreground"
                                  />
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText(referralLink);
                                      toast({ title: "Referral URL copied!" });
                                    }}
                                    size="sm"
                                    className="h-9 rounded-xl text-[10px] font-bold px-3 shrink-0"
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Community Polls Section */}
                  {rsvpDone && ((event.showPolls !== false) || isAdmin) && (
                    <div className="space-y-4 relative">
                      {event.showPolls === false && isAdmin && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> Community Polls are private (Admin Only)
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Community Polls</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {(() => {
                          const renderPoll = (category: string, title: string, options: string[]) => {
                            if (!options || options.filter(Boolean).length === 0) return null;
                            const activeOpts = options.filter(Boolean);
                            
                            const categoryVotes = pollVotes[category] || {};
                            const totalCategoryVotes = Object.values(categoryVotes).reduce((a, b) => a + b, 0);
                            const votedOption = userVoted[category];

                            const handleVote = async (option: string) => {
                              if (!rsvpDone) {
                                toast({ title: "Register interest first!", description: "Please submit interest before voting.", variant: "destructive" });
                                return;
                              }
                              const newVotes = { ...userVoted, [category]: option };
                              setUserVoted(newVotes);

                              try {
                                if (rsvpId) {
                                  const rsvpRef = doc(db, "events", id!, "rsvps", rsvpId);
                                  await updateDoc(rsvpRef, {
                                    votes: newVotes
                                  });
                                  toast({ title: "Vote cast!", description: `Recorded: ${option}` });
                                }
                              } catch (err: any) {
                                toast({ title: "Failed to record vote", description: err.message, variant: "destructive" });
                              }
                            };

                            return (
                              <div key={category} className="bg-white/10 dark:bg-white/[0.04] p-5 rounded-2xl border border-current/10 space-y-3.5 text-left">
                                <h4 className="text-xs font-bold uppercase tracking-wider opacity-85 flex items-center gap-1.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-purple-500" /> {title}
                                </h4>
                                <div className="space-y-2">
                                  {activeOpts.map((opt) => {
                                    const voteCount = categoryVotes[opt] || 0;
                                    const percentage = totalCategoryVotes > 0 ? Math.round((voteCount / totalCategoryVotes) * 100) : 0;
                                    const isSelected = votedOption === opt;
                                    
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleVote(opt)}
                                        disabled={!!votedOption}
                                        className={`w-full relative h-11 rounded-xl border border-current/10 overflow-hidden flex items-center justify-between px-4 transition-all ${
                                          isSelected ? 'ring-2 ring-current font-bold' : votedOption ? 'opacity-70 cursor-not-allowed' : 'hover:bg-current/5'
                                        }`}
                                      >
                                        {votedOption && (
                                          <div 
                                            className="absolute inset-y-0 left-0 bg-current/10 transition-all duration-500" 
                                            style={{ width: `${percentage}%` }}
                                          />
                                        )}
                                        <span className="relative z-10 text-xs font-semibold">{opt}</span>
                                        {votedOption && (
                                          <span className="relative z-10 text-[10px] font-bold opacity-60">
                                            {percentage}% ({voteCount})
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <>
                              {renderPoll("date", "Preferred Dates", event.dateOptions)}
                              {renderPoll("venue", "Preferred Venues", event.venueOptions)}
                              {renderPoll("artist", "Preferred Artists / Speakers", event.artistsOptions)}
                              {renderPoll("food", "Preferred Food & Drinks", event.foodOptions)}
                              {renderPoll("theme", "Preferred Themes", event.themeOptions)}
                              {renderPoll("timing", "Preferred Timings", event.timingOptions)}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Activity Ticker Feed */}
                  {((event.showTicker !== false) || isAdmin) && (
                    <div className="bg-white/10 dark:bg-white/[0.04] p-5 rounded-[24px] border border-current/10 text-left space-y-3.5 shadow-md relative overflow-hidden">
                      {event.showTicker === false && isAdmin && (
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold tracking-widest uppercase border border-purple-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin Only
                        </div>
                      )}
                      <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-500" /> Recent Activity
                      </h3>
                    
                    {(() => {
                      const tickerItems: any[] = [];
                      allRSVPs.slice(0, 5).forEach(r => {
                        tickerItems.push({
                          time: r.createdAt?.toDate ? r.createdAt.toDate() : new Date(),
                          text: `${r.displayName} marked ${r.interestLevel || 'interested'}`
                        });
                      });
                      comments.slice(0, 5).forEach(c => {
                        tickerItems.push({
                          time: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(),
                          text: `${c.displayName} commented "${c.text.slice(0, 20)}..."`
                        });
                      });
                      tickerItems.sort((a, b) => b.time.getTime() - a.time.getTime());
                      const items = tickerItems.slice(0, 4);

                      if (items.length === 0) {
                        return <p className="text-[10px] opacity-40 italic text-center">Be the first to join the campaign!</p>;
                      }

                      return (
                        <div className="space-y-2 relative">
                          <div className="absolute top-1 bottom-1 left-2 w-px bg-current/10" />
                          {items.map((it, idx) => (
                            <div key={idx} className="flex gap-3.5 items-start pl-1 relative">
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-background shrink-0 mt-1 z-10" />
                              <div className="flex-1">
                                <p className="text-xs font-medium opacity-90 leading-tight">{it.text}</p>
                                <p className="text-[9px] opacity-40 font-bold uppercase mt-0.5">{new Date(it.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  )}

                  {/* Community Comment Feed */}
                  {((event.showComments !== false) || isAdmin) && (
                    <div className="bg-white/10 dark:bg-white/[0.04] p-5 rounded-[24px] border border-current/10 text-left space-y-4 shadow-md relative overflow-hidden">
                      {event.showComments === false && isAdmin && (
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold tracking-widest uppercase border border-purple-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin Only
                        </div>
                      )}
                      <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-purple-500" /> Hype Feed
                      </h3>

                    {/* Comment post input */}
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                      <input
                        placeholder={rsvpDone ? "Share suggestions or express hype..." : "Join validation campaign to comment"}
                        disabled={!rsvpDone}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="h-10 flex-1 bg-white dark:bg-black/30 border border-current/10 rounded-xl px-3 outline-none text-xs font-semibold text-foreground"
                      />
                      <Button
                        type="submit"
                        disabled={!rsvpDone || !newCommentText.trim()}
                        className="h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </form>

                    {/* Comments stream */}
                    <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5 items-start bg-current/5 border border-current/5 p-3 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-current/10 flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0">
                            {c.photoURL ? (
                              <img src={parseAvatarUrlFromStorage(c.photoURL)} alt={c.displayName} className="w-full h-full object-cover" />
                            ) : (
                              c.displayName[0]
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold truncate">{c.displayName}</span>
                              <span className="text-[8px] opacity-40 font-bold">
                                {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : ""}
                              </span>
                            </div>
                            <p className="text-xs font-medium opacity-80 mt-1 leading-normal break-words">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-[10px] opacity-40 italic text-center py-4">No comments shared yet.</p>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>

            {/* About Section */}
            <div className="pt-8">
               <h3 className="text-sm font-bold text-current opacity-70 mb-4 uppercase tracking-widest">About Event</h3>
               <div className="prose prose-lg dark:prose-invert leading-relaxed font-semibold whitespace-pre-wrap text-[16px] text-current opacity-90">
                 {event.description || "No description provided."}
               </div>
             </div>

            {/* Compact Attendees Preview at the bottom */}
            <div className="pt-8 flex items-center gap-3">
              <div className="flex -space-x-3">
                {Array.from({ length: Math.min(3, event.rsvpCount || allRSVPs.length || 0) }).map((_, i) => {
                  const rsvp = allRSVPs[i];
                  const avatarUrl = rsvp?.userId === user?.uid && user?.photoURL ? user.photoURL : rsvp?.avatar;
                  return (
                    <div key={i} className="w-8 h-8 rounded-full border-2 overflow-hidden bg-white/20 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ borderColor: themeColors.bg, color: themeColors.text }}>
                      {avatarUrl ? (
                        <img src={parseAvatarUrlFromStorage(avatarUrl)} alt="Attendee" className="w-full h-full object-cover" />
                      ) : (
                        rsvp?.name?.[0]?.toUpperCase() || rsvp?.email?.[0]?.toUpperCase() || <User className="w-4 h-4 opacity-70" />
                      )}
                    </div>
                  );
                })}
                {(event.rsvpCount || allRSVPs.length || 0) === 0 && (
                   <div className="w-8 h-8 rounded-full border-2 bg-white/20 dark:bg-white/10 flex items-center justify-center text-xs font-bold shadow-sm" style={{ borderColor: themeColors.bg, color: themeColors.text }}>
                    <User className="w-4 h-4 opacity-70" />
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold opacity-80" style={{ color: themeColors.text }}>
                {(event.rsvpCount || allRSVPs.length || 0) > 3 
                  ? `+ ${(event.rsvpCount || allRSVPs.length || 0) - 3} attending` 
                  : (event.rsvpCount || allRSVPs.length || 0) > 0 
                    ? "attending" 
                    : "Be the first to RSVP!"
                }
              </div>
            </div>

            {/* Map & Host Section at the bottom */}
            {!event.isPreLaunch && event.location && (
              <div className="pt-10 space-y-6">
                <div className="w-full h-[250px] rounded-[24px] overflow-hidden border border-black/5 dark:border-white/10 shadow-sm relative">
                  {/* Embedded Google Maps via free embed URL */}
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, filter: isDark ? 'invert(90%) hue-rotate(180deg) contrast(100%)' : 'none' }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  />
                </div>

                <div className="bg-white/5 dark:bg-white/[0.02] rounded-[24px] border border-black/5 dark:border-white/10 p-6 md:p-8 backdrop-blur-md">
                   <h3 className="text-sm font-bold mb-6 uppercase tracking-widest opacity-80" style={{ color: themeColors.text }}>Hosted By</h3>
                   <div className="flex flex-wrap items-center gap-6">
                     <Link href={hostProfile?.username ? `/p/${hostProfile.username}` : "#"}>
                       <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-sm font-bold border border-gray-200 dark:border-white/20 shadow-sm overflow-hidden" style={{ color: themeColors.text }}>
                            {hostProfile?.photoURL ? (
                              <img src={parseAvatarUrlFromStorage(hostProfile.photoURL)} alt={hostProfile.displayName} className="w-full h-full object-cover" />
                            ) : (
                              (hostProfile?.displayName || event.userName || "A")?.[0]?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-base font-bold opacity-95 block" style={{ color: themeColors.text }}>{hostProfile?.displayName || event.userName || "A Community Member"}</span>
                            <span className="text-xs font-medium opacity-60" style={{ color: themeColors.text }}>Main Host</span>
                          </div>
                       </div>
                     </Link>
                     
                     {coHostProfiles.map((coHost, idx) => (
                       <Link key={idx} href={`/p/${coHost.username}`}>
                         <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-sm font-bold border border-gray-200 dark:border-white/20 shadow-sm overflow-hidden" style={{ color: themeColors.text }}>
                              {coHost.photoURL ? (
                                <img src={parseAvatarUrlFromStorage(coHost.photoURL)} alt={coHost.displayName} className="w-full h-full object-cover" />
                              ) : (
                                coHost.displayName?.[0]?.toUpperCase() || coHost.username?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="text-base font-bold opacity-95 block" style={{ color: themeColors.text }}>{coHost.displayName || coHost.username}</span>
                              <span className="text-xs font-medium opacity-60" style={{ color: themeColors.text }}>Co-Host</span>
                            </div>
                         </div>
                       </Link>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

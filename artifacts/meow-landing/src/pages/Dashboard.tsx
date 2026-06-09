import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { parseAvatarUrlFromStorage, formatAvatarUrlForStorage, AVATAR_IMAGES } from "@/lib/avatars";
import { PhonePreview } from "@/components/PhonePreview";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ChevronRight,
  Users,
  Eye,
  Trash2,
  Settings,
  Share2,
  Camera,
  Check,
  Pencil,
  Calendar,
  MapPin,
  Sparkles,
  ExternalLink,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hostingEvents, setHostingEvents] = useState<any[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'hosting' | 'attending'>('hosting');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time editable profile states
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string>(parseAvatarUrlFromStorage(user?.photoURL || null));
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [socials, setSocials] = useState({
    twitter: { connected: false, username: "" },
    instagram: { connected: false, username: "" },
    discord: { connected: false, username: "" },
    github: { connected: false, username: "" },
  });

  // Appearance Preview States (loaded from settings local storage)
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark" | "system">("light");
  const [previewAccent, setPreviewAccent] = useState<"lime" | "blue" | "lavender" | "burgundy" | "purple">("lime");
  const [previewBorder, setPreviewBorder] = useState<"standard" | "brutalist">("standard");

  // Dialog & Modal Controls
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [activeQRDialog, setActiveQRDialog] = useState<string | null>(null);

  // Profile Save Status
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "profiles"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const profileData = snap.docs[0].data();
          if (profileData.username) setUsername(profileData.username);
          if (profileData.bio) setBio(profileData.bio);
          if (profileData.socials) setSocials(profileData.socials);
          if (profileData.theme) setPreviewTheme(profileData.theme);
          if (profileData.accentColor) setPreviewAccent(profileData.accentColor);
          if (profileData.borderStyle) setPreviewBorder(profileData.borderStyle);
          if (profileData.displayName) setDisplayName(profileData.displayName);
        }
      } catch (e) {
        console.error("Failed to fetch creator profile from Firestore", e);
      }
    };

    if (user) {
      setDisplayName(user.displayName || "Creator");
      if (user.photoURL) {
        setProfilePicUrl(parseAvatarUrlFromStorage(user.photoURL));
      }
      loadProfile();
    }

    const storedBio = localStorage.getItem("user-bio");
    if (storedBio) setBio(storedBio);

    const storedUsername = localStorage.getItem("user-username");
    if (storedUsername) setUsername(storedUsername);

    const storedSocials = localStorage.getItem("user-socials");
    if (storedSocials) {
      try {
        setSocials(JSON.parse(storedSocials));
      } catch (e) {
        console.error("Failed to parse socials", e);
      }
    }

    // Load appearance preferences for Phone Preview
    const storedTheme = localStorage.getItem("theme") as any;
    if (storedTheme) setPreviewTheme(storedTheme);

    const storedAccent = localStorage.getItem("accent-color") as any;
    if (storedAccent) setPreviewAccent(storedAccent);

    const storedBorder = localStorage.getItem("border-style") as any;
    if (storedBorder) setPreviewBorder(storedBorder);
  }, [user]);

  // Fetch hosted and attended events
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch Hosting Events
        const hostingQ = query(
          collection(db, "events"),
          where("userId", "==", user.uid)
        );
        const hostingSnap = await getDocs(hostingQ);
        const hostingData = hostingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Co-Hosting Events
        const storedUsername = localStorage.getItem("user-username");
        if (storedUsername) {
          const coHostingQ = query(
            collection(db, "events"),
            where("coHosts", "array-contains", storedUsername.toLowerCase().trim())
          );
          const coHostingSnap = await getDocs(coHostingQ);
          coHostingSnap.docs.forEach(docSnap => {
            if (!hostingData.find(e => e.id === docSnap.id)) {
              hostingData.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
        }

        hostingData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setHostingEvents(hostingData);

        // Fetch Attending Events
        if (user.email) {
          const attendingQ = query(
            collection(db, "events"),
            where("attendeeEmails", "array-contains", user.email)
          );
          const attendingSnap = await getDocs(attendingQ);
          const attendingData = [];
          
          for (const docSnap of attendingSnap.docs) {
            const eventData = { id: docSnap.id, ...docSnap.data() } as any;
            const rsvpQ = query(
              collection(db, "events", docSnap.id, "rsvps"),
              where("email", "==", user.email)
            );
            const rsvpSnap = await getDocs(rsvpQ);
            if (!rsvpSnap.empty) {
              const rsvpData = rsvpSnap.docs[0].data();
              eventData.rsvpStatus = rsvpData.confirmationSent ? "Approved" : "Pending Approval";
            } else {
              eventData.rsvpStatus = "Pending Approval";
            }
            attendingData.push(eventData);
          }
          attendingData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setAttendingEvents(attendingData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Toggle event visibility/publishing in Firestore
  const handleToggleVisibility = async (eventId: string, currentStatus: boolean) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        isPublic: !currentStatus
      });
      
      setHostingEvents(prev =>
        prev.map(e => (e.id === eventId ? { ...e, isPublic: !currentStatus } : e))
      );

      toast({
        title: !currentStatus ? "Event published! 🌐" : "Event set to private 🔒",
        description: !currentStatus ? "It is now visible on the explore page and your profile." : "It is now hidden from the public hub.",
      });
    } catch (error: any) {
      toast({
        title: "Visibility update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event? This action is permanent and cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        setHostingEvents(prev => prev.filter(e => e.id !== eventId));
        toast({
          title: "Event deleted 🗑️",
          description: "The event has been permanently removed.",
        });
      } catch (error: any) {
        toast({
          title: "Failed to delete event",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const uClean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
      if (!uClean) throw new Error("Username URL cannot be empty or contain invalid characters.");

      const profileRef = doc(db, "profiles", uClean);
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
        throw new Error("Username is already taken by another creator.");
      }

      const oldUsername = localStorage.getItem("user-username");
      if (oldUsername && oldUsername.toLowerCase().trim() !== uClean) {
        try {
          await deleteDoc(doc(db, "profiles", oldUsername.toLowerCase().trim()));
        } catch (e) {
          console.error("Could not delete old profile doc", e);
        }
      }

      if (user) {
        const { updateProfile: fbUpdateProfile } = await import("firebase/auth");
        await fbUpdateProfile(user, {
          displayName: displayName,
          photoURL: formatAvatarUrlForStorage(profilePicUrl)
        });
      }

      await setDoc(profileRef, {
        userId: user.uid,
        displayName: displayName,
        photoURL: formatAvatarUrlForStorage(profilePicUrl),
        bio: bio,
        username: uClean,
        socials: socials,
        theme: previewTheme,
        accentColor: previewAccent,
        borderStyle: previewBorder,
        updatedAt: serverTimestamp()
      });

      localStorage.setItem("user-bio", bio);
      localStorage.setItem("user-username", uClean);
      localStorage.setItem("user-socials", JSON.stringify(socials));

      toast({
        title: "Profile Updated ✨",
        description: "Your bio details and social connections are now live.",
      });
      setIsEditProfileOpen(false);
    } catch (e: any) {
      toast({
        title: "Failed to save profile",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShareEvent = (eventId: string, title: string) => {
    const url = `${window.location.origin}/e/${eventId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied! 📋",
      description: `URL for "${title}" copied to clipboard.`,
    });
  };

  // Filter events by search query
  const filteredAttending = attendingEvents.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHosting = hostingEvents.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0A] transition-colors duration-300">
        
        {/* Main Dashboard Area */}
        <div className="flex-1 w-full p-4 sm:p-8 md:p-12 pb-32 md:pb-16 max-w-7xl mx-auto space-y-8">
          
          {/* Header Block */}
          <header className="flex items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                My Events Hub
              </h1>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
                {activeTab === 'hosting' 
                  ? `Hosting ${hostingEvents.length} events` 
                  : `Attending ${attendingEvents.length} events`
                }
              </p>
            </div>
          </header>


          {/* Add Event Button (signature purple pill) */}
          <div className="flex justify-end">
            <Link href="/create-event">
              <button className="px-8 py-3 rounded-full bg-foreground text-background hover:opacity-90 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02]">
                <Plus className="w-5 h-5 stroke-[2.5px]" />
                Create New Event
              </button>
            </Link>
          </div>

          {/* Controls: Tab Switcher & Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pt-2 border-t border-gray-100 dark:border-[#222]">
            {/* Tab Pill Selector */}
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-full p-1 self-start relative">
              <button 
                onClick={() => setActiveTab('hosting')} 
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${activeTab === 'hosting' ? 'text-foreground' : 'text-gray-400 hover:text-foreground'}`}
              >
                {activeTab === 'hosting' && (
                  <motion.div layoutId="active-tab" className="absolute inset-0 bg-white dark:bg-[#1A1A1A] rounded-full shadow-sm -z-10" />
                )}
                Hosting
              </button>
              <button 
                onClick={() => setActiveTab('attending')} 
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${activeTab === 'attending' ? 'text-foreground' : 'text-gray-400 hover:text-foreground'}`}
              >
                {activeTab === 'attending' && (
                  <motion.div layoutId="active-tab" className="absolute inset-0 bg-white dark:bg-[#1A1A1A] rounded-full shadow-sm -z-10" />
                )}
                Attending
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-full h-10 pl-10 pr-4 w-full outline-none text-xs font-medium transition-all placeholder-muted-foreground focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>

          {/* Event Listing */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 p-5 rounded-[24px] shadow-sm flex flex-col justify-between gap-5 h-[160px] animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-[16px] bg-gray-200 dark:bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-full w-3/4" />
                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-1/2" />
                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-2/3" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                      <div className="h-8 bg-gray-200 dark:bg-white/5 rounded-xl w-24" />
                      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-xl w-32" />
                    </div>
                  </div>
                ))}
                  </div>
                </motion.div>
              ) : activeTab === 'hosting' ? (
                <motion.div key="hosting" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 10}} transition={{duration: 0.2}}>
                  {filteredHosting.length === 0 ? (
                <EmptyState 
                  message="You aren't hosting any events." 
                  actionText="Start your first event" 
                  actionHref="/create-event" 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredHosting.map((event, i) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 p-5 rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-black/10 dark:hover:border-white/10 group overflow-hidden"
                    >
                      {/* Subtle Background Glow */}
                      <div 
                        className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.08]" 
                        style={{ backgroundColor: event.color || '#D9FF00' }} 
                      />

                      <div className="flex items-start gap-4 relative z-10">
                        {/* Event Color Accent Block */}
                        <div 
                          className="w-16 h-16 rounded-[16px] flex flex-col items-center justify-center shrink-0 overflow-hidden relative shadow-inner group-hover:shadow-lg transition-shadow duration-300" 
                          style={{ backgroundColor: event.color || '#D9FF00' }}
                        >
                          {event.creativeUrl ? (
                            <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                          ) : (
                            <span className="text-[20px] font-black text-black group-hover:scale-110 transition-transform duration-500">🐾</span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 flex-1">
                          {event.isPreLaunch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 uppercase mb-1.5 border border-purple-500/20">
                              <Sparkles className="w-2.5 h-2.5" /> Pre-Launch
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-base font-black text-foreground line-clamp-2 leading-tight mb-1 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">{event.title}</h4>
                            <Link href={`/e/${event.id}`}>
                              <button className="text-gray-400 hover:text-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" title="View live page">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </Link>
                          </div>
                          
                          <div className="space-y-1.5 mt-2">
                            <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 opacity-60" /> {event.isPreLaunch ? event.tentativeDate : new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {event.location && (
                              <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" /> {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
 
                      {/* Tool Actions & Switch Visibility */}
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-auto relative z-10">
                        {/* Guests Button (Prominent Action) */}
                        <Link href={`/manage/${event.id}`}>
                          <button className="flex items-center gap-2 px-3.5 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 group/btn">
                            <Users className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                            {event.isPreLaunch ? 'Signups' : 'Guests'} 
                            <span className="opacity-70 font-semibold text-[10px]">({event.isPreLaunch ? event.interestedCount || 0 : event.rsvpCount || 0})</span>
                          </button>
                        </Link>

                        {/* Secondary Event Controls */}
                        <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-white/5 rounded-xl p-1 border border-black/5 dark:border-white/5">
                          <button
                            onClick={() => handleShareEvent(event.id, event.title)}
                            className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-foreground transition-all hover:shadow-sm active:scale-95"
                            title="Copy link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveQRDialog(event.id)}
                            className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-foreground transition-all hover:shadow-sm active:scale-95"
                            title="View QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <Link href={`/manage/${event.id}`}>
                            <button
                              className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-foreground transition-all hover:shadow-sm active:scale-95"
                              title="Manage event settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <Link href={`/edit-event/${event.id}`}>
                            <button
                              className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-foreground transition-all hover:shadow-sm active:scale-95"
                              title="Edit event details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 mx-1"></div>
                          <div className="px-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all" title="Toggle visibility">
                            <Switch
                              checked={event.isPublic !== false}
                              onCheckedChange={() => handleToggleVisibility(event.id, event.isPublic !== false)}
                              className="scale-75 origin-center"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
                </motion.div>
              ) : (
                <motion.div key="attending" initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -10}} transition={{duration: 0.2}}>
                  {filteredAttending.length === 0 ? (
                <EmptyState 
                  message="You aren't attending any events yet." 
                  actionText="Discover events" 
                  actionHref="/explore" 
                />
              ) : (
                <div className="relative pl-6 ml-2 sm:ml-4 border-l-2 border-gray-100 dark:border-white/5 space-y-6 pt-2 pb-6">
                  {filteredAttending.map((event, i) => (
                    <motion.div 
                      key={event.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative group"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-3 h-3 rounded-full bg-white dark:bg-[#0A0A0A] border-[2.5px] border-[#101828] dark:border-white/40 shadow-sm z-10 ring-4 ring-[#FAF9F6] dark:ring-[#0A0A0A] transition-all duration-300 group-hover:scale-125 group-hover:bg-[#101828] dark:group-hover:bg-white group-hover:border-white dark:group-hover:border-[#0A0A0A]"></div>
                      
                      <div 
                        onClick={() => setLocation(`/e/${event.id}`)}
                        className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 p-4 sm:p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                          {/* Event Color Accent Block */}
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner group-hover:shadow-md transition-shadow" 
                            style={{ backgroundColor: event.color || '#D9FF00' }}
                          >
                            {event.creativeUrl ? (
                              <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                            ) : (
                              <span className="text-black font-black text-sm drop-shadow-sm group-hover:scale-110 transition-transform duration-300">🎫</span>
                            )}
                          </div>

                          {/* Title & Info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-bold text-foreground truncate group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">{event.title}</h4>
                            <p className="text-[11px] font-semibold text-gray-400 mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {event.isPreLaunch ? event.tentativeDate : new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="truncate max-w-[150px]">{event.location || "Online"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Ticket Badge */}
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-none border-gray-50 dark:border-white/5">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            event.rsvpStatus === 'Approved' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            {event.rsvpStatus}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:translate-x-1 group-hover:text-foreground transition-all duration-300" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>



        {/* QR Code Dialog Modal */}
        <Dialog open={activeQRDialog !== null} onOpenChange={(open) => !open && setActiveQRDialog(null)}>
          <DialogContent className="sm:max-w-sm bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            {activeQRDialog && (
              <>
                <DialogHeader className="mb-4 text-center">
                  <DialogTitle className="font-bold text-xl">Event QR Code</DialogTitle>
                  <DialogDescription className="text-gray-400">Share this QR code with attendees to let them scan and RSVP.</DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mt-2 flex items-center justify-center">
                  <QRCodeSVG 
                    value={`${window.location.origin}/e/${activeQRDialog}`}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-xs font-semibold mt-4 text-foreground text-center select-all">
                  {window.location.origin}/e/{activeQRDialog}
                </p>
                <Button 
                  onClick={() => setActiveQRDialog(null)}
                  className="w-full mt-6 rounded-full"
                >
                  Close
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}

function EmptyState({ message, actionText, actionHref }: { message: string, actionText: string, actionHref: string }) {
  return (
    <div className="p-12 bg-white dark:bg-[#121212] rounded-3xl border border-dashed border-gray-200 dark:border-[#222] text-center space-y-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400">{message}</p>
      <Link href={actionHref}>
        <Button className="rounded-full bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold text-xs py-2 px-5">
          {actionText}
        </Button>
      </Link>
    </div>
  );
}

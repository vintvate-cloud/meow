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
        
        {/* Left Column: Admin Interface */}
        <div className="flex-1 w-full lg:w-[60%] border-r border-gray-150 dark:border-[#222] p-4 sm:p-8 md:p-12 pb-32 md:pb-16 max-w-4xl mx-auto space-y-8">
          
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

          {/* User Profile Card (Linktree Header Style) */}
          <div className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-full border-2 border-gray-100 dark:border-gray-800 object-cover shrink-0 overflow-hidden bg-muted">
                <img src={profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground font-serif">{displayName || "Anonymous Creator"}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">meow.link/{username}</p>
                {bio && <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md line-clamp-2 leading-relaxed">{bio}</p>}
              </div>
            </div>

            <Button 
              onClick={() => setIsEditProfileOpen(true)}
              variant="outline" 
              className="rounded-full h-9 px-4 text-xs font-semibold border-gray-200 hover:bg-muted"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Profile Header
            </Button>
          </div>

          {/* Add Event Button (signature purple pill) */}
          <div className="flex flex-col items-center">
            <Link href="/create-event" className="w-full">
              <button className="w-full py-4 rounded-full bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01]">
                <Plus className="w-5 h-5 stroke-[2.5px]" />
                Add Event
              </button>
            </Link>
          </div>

          {/* Controls: Tab Switcher & Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pt-2 border-t border-gray-100 dark:border-[#222]">
            {/* Tab Pill Selector */}
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-full p-1 self-start">
              <button 
                onClick={() => setActiveTab('hosting')} 
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${activeTab === 'hosting' ? 'bg-white dark:bg-[#1A1A1A] text-foreground shadow-sm' : 'text-gray-400 hover:text-foreground'}`}
              >
                Hosting
              </button>
              <button 
                onClick={() => setActiveTab('attending')} 
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${activeTab === 'attending' ? 'bg-white dark:bg-[#1A1A1A] text-foreground shadow-sm' : 'text-gray-400 hover:text-foreground'}`}
              >
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
                className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-full h-10 pl-10 pr-4 w-full outline-none text-xs font-medium transition-all placeholder-muted-foreground focus:ring-2 focus:ring-[#8129D9]/25"
              />
            </div>
          </div>

          {/* Event Listing */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs font-semibold text-gray-400 animate-pulse">
                Loading events...
              </div>
            ) : activeTab === 'hosting' ? (
              filteredHosting.length === 0 ? (
                <EmptyState 
                  message="You aren't hosting any events." 
                  actionText="Start your first event" 
                  actionHref="/create-event" 
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredHosting.map(event => (
                    <div 
                      key={event.id} 
                      className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Event Color Accent Block */}
                        <div 
                          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 overflow-hidden relative" 
                          style={{ backgroundColor: event.color || '#D9FF00' }}
                        >
                          {event.creativeUrl ? (
                            <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span className="text-[14px] font-black text-black">🐾</span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground truncate">{event.title}</h4>
                            <Link href={`/e/${event.id}`}>
                              <button className="text-gray-400 hover:text-foreground">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                          
                          <p className="text-[10px] font-medium text-gray-400 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Tool Actions & Switch Visibility */}
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-100 dark:border-[#222] pt-3 md:pt-0">
                        {/* Clicks/RSVP statistics count */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 pr-2 border-r border-gray-100 dark:border-[#222]">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{event.rsvpCount || 0}</span>
                          <span className="text-[10px] text-gray-400 font-normal">RSVPs</span>
                        </div>

                        {/* Event controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShareEvent(event.id, event.title)}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-foreground"
                            title="Copy link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveQRDialog(event.id)}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-foreground"
                            title="View QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <Link href={`/manage/${event.id}`}>
                            <button
                              className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-foreground"
                              title="Manage settings"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"
                            title="Delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Switch visibility toggle */}
                        <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-[#222]">
                          <Switch
                            checked={event.isPublic !== false}
                            onCheckedChange={() => handleToggleVisibility(event.id, event.isPublic !== false)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredAttending.length === 0 ? (
                <EmptyState 
                  message="You aren't attending any events yet." 
                  actionText="Discover events" 
                  actionHref="/explore" 
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAttending.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => setLocation(`/e/${event.id}`)}
                      className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Event Color Accent Block */}
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative" 
                          style={{ backgroundColor: event.color || '#D9FF00' }}
                        >
                          {event.creativeUrl ? (
                            <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span className="text-black font-black text-sm">🎫</span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{event.title}</h4>
                          <p className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1.5">
                            <span>{new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{event.location || "Online"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Ticket Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                          event.rsvpStatus === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {event.rsvpStatus}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Live Phone Mockup Preview (Sticky, visible on Desktop) */}
        <div className="hidden lg:flex lg:w-[40%] bg-white dark:bg-[#080808] justify-center items-start pt-12 sticky top-0 h-screen overflow-y-auto border-l border-gray-100 dark:border-[#222]">
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#8129D9] animate-pulse" /> Live Landing Preview
            </p>
            <PhonePreview
              displayName={displayName}
              profilePicUrl={profilePicUrl}
              bio={bio}
              socials={socials}
              events={hostingEvents}
              theme={previewTheme}
              accentColor={previewAccent}
              borderStyle={previewBorder}
              username={username}
            />
          </div>
        </div>

        {/* Mobile Floating Preview Button */}
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => setShowMobilePreview(true)}
            className="bg-[#101828] text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-white/10 dark:border-black/10 transition-all hover:scale-105"
          >
            <Eye className="w-4 h-4" /> Preview Live Hub
          </button>
        </div>

        {/* Mobile Preview Dialog overlay */}
        <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border-none rounded-3xl p-6 shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4 text-center">
              <DialogTitle className="font-bold text-xl">My Public Profile</DialogTitle>
              <DialogDescription className="text-gray-400">This is how your event landing page looks on mobile devices.</DialogDescription>
            </DialogHeader>
            <PhonePreview
              displayName={displayName}
              profilePicUrl={profilePicUrl}
              bio={bio}
              socials={socials}
              events={hostingEvents}
              theme={previewTheme}
              accentColor={previewAccent}
              borderStyle={previewBorder}
              username={username}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Profile Modal Dialog */}
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-xl bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 sm:p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold text-2xl text-foreground font-serif">Edit Profile Header</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Customize your display name, creator username, and bio for your public landing page.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSaveProfile} className="space-y-5 mt-4">
              {/* Profile Pic Upload Selector */}
              <div className="flex flex-col items-center justify-center py-4 border-b border-gray-100 dark:border-[#222]">
                <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                  <DialogTrigger asChild>
                    <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden group cursor-pointer border-2 border-[#8129D9] hover:opacity-90 shadow-sm transition-all">
                      <img src={profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-center font-serif text-xl font-bold">Select Cat Avatar</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-2 max-h-[40vh] overflow-y-auto">
                      {AVATAR_IMAGES.map((avatar, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setProfilePicUrl(avatar);
                            setIsAvatarModalOpen(false);
                          }}
                          className={`relative aspect-square rounded-full overflow-hidden border ${
                            profilePicUrl === avatar 
                              ? 'ring-2 ring-[#8129D9] ring-offset-2 scale-105' 
                              : 'border-transparent hover:scale-105 transition-transform'
                          }`}
                        >
                          <img src={avatar} alt={`Cat ${i}`} className="w-full h-full object-cover" />
                          {profilePicUrl === avatar && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Change Profile Pic</span>
              </div>

              {/* Form details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username URL</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-border h-11 focus-within:ring-2 focus-within:ring-[#8129D9]/50">
                    <span className="bg-gray-50 dark:bg-muted text-gray-400 text-xs font-semibold px-3 flex items-center border-r border-gray-100 dark:border-border select-none">
                      {window.location.host}/p/
                    </span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className="border-none rounded-none focus-visible:ring-0 flex-1 font-semibold text-xs h-full"
                      placeholder="username"
                      required
                    />
                  </div>
                  {username && (
                    <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-1">
                      <span>Your profile:</span>
                      <a href={`/p/${username}`} target="_blank" rel="noreferrer" className="text-[#8129D9] hover:underline flex items-center gap-0.5">
                        {window.location.origin}/p/{username} <ChevronRight className="w-3 h-3 text-[#8129D9]" />
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bio Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-gray-200 dark:border-[#222] bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8129D9]/25 h-16 resize-none"
                  placeholder="A short tagline or description for your landing page..."
                />
              </div>

              {/* Social Connections */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#222]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Connect Channels</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-16">Twitter:</span>
                    <Input 
                      placeholder="@username"
                      value={socials.twitter.username}
                      onChange={(e) => setSocials({
                        ...socials,
                        twitter: { connected: !!e.target.value, username: e.target.value }
                      })}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-16">Instagram:</span>
                    <Input 
                      placeholder="@username"
                      value={socials.instagram.username}
                      onChange={(e) => setSocials({
                        ...socials,
                        instagram: { connected: !!e.target.value, username: e.target.value }
                      })}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-16">Discord:</span>
                    <Input 
                      placeholder="guild_invite"
                      value={socials.discord.username}
                      onChange={(e) => setSocials({
                        ...socials,
                        discord: { connected: !!e.target.value, username: e.target.value }
                      })}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-16">GitHub:</span>
                    <Input 
                      placeholder="username"
                      value={socials.github.username}
                      onChange={(e) => setSocials({
                        ...socials,
                        github: { connected: !!e.target.value, username: e.target.value }
                      })}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingProfile}
                  className="rounded-full bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
                <p className="text-xs font-semibold mt-4 text-[#8129D9] dark:text-[#E8C8EC] text-center select-all">
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

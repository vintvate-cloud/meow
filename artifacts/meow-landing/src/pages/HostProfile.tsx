import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, MapPin, Users, ArrowUpRight, Share2, Compass, Home } from "lucide-react";
import { parseAvatarUrlFromStorage } from "@/lib/avatars";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function HostProfile() {
  const { username } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndEvents = async () => {
      if (!username) return;
      try {
        const uClean = username.toLowerCase().trim();
        const profileRef = doc(db, "profiles", uClean);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setProfile(profileData);

          // Fetch all public events for this creator
          const eventsQ = query(
            collection(db, "events"),
            where("userId", "==", profileData.userId),
            where("isPublic", "==", true)
          );
          const eventsSnap = await getDocs(eventsQ);
          const eventsList = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Also fetch co-hosted events
          const coHostingQ = query(
            collection(db, "events"),
            where("coHosts", "array-contains", profileData.username),
            where("isPublic", "==", true)
          );
          const coHostingSnap = await getDocs(coHostingQ);
          coHostingSnap.docs.forEach(docSnap => {
            if (!eventsList.find(e => e.id === docSnap.id)) {
              eventsList.push({ id: docSnap.id, ...docSnap.data() });
            }
          });

          // Sort by date desc
          eventsList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setEvents(eventsList);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error loading creator profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndEvents();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl animate-bounce">🐾</span>
          <p className="text-sm font-semibold text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0A0A0A] px-6 text-center">
        <Compass className="w-12 h-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 dark:text-gray-100 mb-2">
          Profile Not Found
        </h1>
        <p className="text-xs text-gray-400 max-w-xs mb-6">
          The link you entered doesn't point to an active creator. Check the username or discover other events.
        </p>
        <Link href="/explore">
          <button className="px-5 h-10 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-95 shadow-sm transition-opacity">
            Explore Events
          </button>
        </Link>
      </div>
    );
  }

  // Theme settings mapping
  const getThemeStyles = () => {
    const isDark = profile.theme === "dark";
    if (isDark) {
      return {
        bg: "bg-[#0A0A0A] text-gray-100",
        cardBg: "bg-[#121212] border-gray-800",
        subtext: "text-gray-400",
        accentGlow: "from-[#2856E8]/10 via-[#8B5CF6]/5 to-transparent",
        cardBorder: "border-white/[0.04]",
        cardText: "text-white",
        avatarBorder: "border-gray-800",
        pillsBg: "bg-white/5 text-gray-300",
        pastCardBg: "bg-[#161616]/40 opacity-70",
      };
    }

    // Default Linktree cream theme
    return {
      bg: "bg-[#FAF8F5] text-[#101828]",
      cardBg: "bg-white border-[#101828]/10",
      subtext: "text-gray-600",
      accentGlow: "from-[#2856E8]/5 via-[#8B5CF6]/5 to-transparent",
      cardBorder: "border-black/5",
      cardText: "text-[#101828]",
      avatarBorder: "border-white",
      pillsBg: "bg-black/[0.03] text-gray-600",
      pastCardBg: "bg-black/[0.01] opacity-70 border-dashed",
    };
  };

  const styles = getThemeStyles();

  // Accent styling definitions
  const getColors = () => {
    switch (profile.accentColor) {
      case "lime":
        return { primary: "#D9FF00", text: "#101828", badge: "bg-[#D9FF00] text-black" };
      case "blue":
        return { primary: "#2856E8", text: "#FFFFFF", badge: "bg-[#2856E8] text-white" };
      case "lavender":
        return { primary: "#E8C8EC", text: "#101828", badge: "bg-[#E8C8EC] text-black" };
      case "burgundy":
        return { primary: "#79001B", text: "#FFFFFF", badge: "bg-[#79001B] text-white" };
      case "purple":
        return { primary: "#58268C", text: "#FFFFFF", badge: "bg-[#58268C] text-white" };
      default:
        return { primary: "#D9FF00", text: "#101828", badge: "bg-[#D9FF00] text-black" };
    }
  };

  const colors = getColors();

  // Filter events into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter((e) => {
    try {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d >= now;
    } catch (_) {
      return true;
    }
  });

  const pastEvents = events.filter((e) => {
    try {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d < now;
    } catch (_) {
      return false;
    }
  });

  // Sort upcoming chronologically, past reverse chronologically
  upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Profile link copied! 🔗" });
  };

  const avatar = parseAvatarUrlFromStorage(profile.photoURL);

  return (
    <div className={`min-h-screen ${styles.bg} relative transition-colors duration-300 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}>
      {/* Background ambient radial gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-b ${styles.accentGlow} blur-3xl`} />
        <div className="absolute top-[40%] right-[-100px] w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-12 flex flex-col items-center">
        
        {/* Floating actions */}
        <div className="w-full flex justify-between items-center mb-8">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </button>
          </Link>
          <button
            onClick={handleShareProfile}
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10 w-full">
          <div className={`w-24 h-24 rounded-full border-4 ${styles.avatarBorder} shadow-lg overflow-hidden relative bg-muted flex items-center justify-center`}>
            {avatar ? (
              <img src={avatar} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold uppercase">{profile.displayName?.[0] || "M"}</span>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">{profile.displayName || "Anonymous"}</h1>
            <p className="text-xs font-bold text-gray-400 tracking-wider">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className={`text-xs font-medium max-w-md leading-relaxed ${styles.subtext}`}>
              {profile.bio}
            </p>
          )}

          {/* Socials connections */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {profile.socials?.twitter?.connected && profile.socials.twitter.username && (
              <a
                href={`https://twitter.com/${profile.socials.twitter.username.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {profile.socials?.instagram?.connected && profile.socials.instagram.username && (
              <a
                href={`https://instagram.com/${profile.socials.instagram.username.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}
            {profile.socials?.discord?.connected && profile.socials.discord.username && (
              <span className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-all shadow-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.95,54.65,1,77.53a105.9,105.9,0,0,0,32,16.29,80.12,80.12,0,0,0,6.66-10.84,68.25,68.25,0,0,1-10.51-5c.88-.65,1.72-1.34,2.53-2a75.76,75.76,0,0,0,51.84,0c.81.71,1.65,1.4,2.53,2a68.25,68.25,0,0,1-10.51,5,80.12,80.12,0,0,0,6.66,10.84,105.9,105.9,0,0,0,32-16.29C129.83,48.24,123.63,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
              </span>
            )}
            {profile.socials?.github?.connected && profile.socials.github.username && (
              <a
                href={`https://github.com/${profile.socials.github.username}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Theme Dividers */}
        <div className="w-full border-t border-black/[0.04] dark:border-white/[0.04] mb-8"></div>

        {/* Main Content Area */}
        <div className="w-full space-y-10">
          
          {/* Upcoming Events */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" style={{ color: colors.primary }} /> Upcoming Events
            </h2>
            {upcomingEvents.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-6 bg-white/20 dark:bg-white/[0.01]">
                <p className="text-xs text-gray-400 italic">No upcoming events scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/e/${event.id}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className={`p-5 rounded-2xl border ${styles.cardBorder} ${styles.cardBg} shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Event Thumbnail */}
                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-serif font-black text-lg relative overflow-hidden" style={{ backgroundColor: event.color || "#2856E8" }}>
                          {event.creativeUrl ? (
                            <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                              {event.title?.[0]?.toUpperCase() || "E"}
                            </>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold leading-tight">{event.title}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {new Date(event.date).toLocaleDateString([], { month: "short", day: "numeric", weekday: "short" })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {event.location.split(',')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-black/[0.03] dark:bg-white/5 px-2 py-0.5 rounded-md">
                          <Users className="w-3.5 h-3.5" />
                          {event.rsvpCount || 0} attending
                        </span>
                        <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Past Events */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-gray-400" /> Past Events
            </h2>
            {pastEvents.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-6 bg-white/20 dark:bg-white/[0.01]">
                <p className="text-xs text-gray-400 italic">No past events recorded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pastEvents.map((event) => (
                  <Link key={event.id} href={`/e/${event.id}`}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      className={`p-5 rounded-2xl border ${styles.cardBorder} ${styles.pastCardBg} cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Event Thumbnail */}
                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-serif font-black text-lg relative overflow-hidden opacity-60" style={{ backgroundColor: event.color || "#2856E8" }}>
                          {event.creativeUrl ? (
                            <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                              {event.title?.[0]?.toUpperCase() || "E"}
                            </>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold leading-tight text-gray-500 dark:text-gray-400">{event.title}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {new Date(event.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.rsvpCount || 0} attended
                        </span>
                        <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

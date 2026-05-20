import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, ArrowUpRight, Plus, X, CheckCircle2, Calendar, Sparkles, Compass } from "lucide-react";
import { AppLayout } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

function formatEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    }
  } catch (_) {}
  return dateStr;
}

function formatEventTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch (_) {}
  return "";
}

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "communities">("events");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#2856E8");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const q = query(collection(db, "events"), where("isPublic", "==", true));
        const querySnapshot = await getDocs(q);
        const eventData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        eventData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching public events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchPublicEvents();
  }, []);

  const fetchCommunities = async () => {
    try {
      const q = query(collection(db, "communities"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCommunities(data);
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    setCreating(true);

    try {
      await addDoc(collection(db, "communities"), {
        title: newTitle,
        description: newDesc,
        color: newColor,
        ownerId: user.uid,
        ownerName: user.displayName || "Unknown",
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      toast({ title: "Community Created!", description: "Welcome to your new group." });
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      fetchCommunities();
    } catch (error: any) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleJoin = async (communityId: string, currentMembers: string[]) => {
    if (!user) {
      toast({ title: "Login required", description: "You must be logged in to join communities.", variant: "destructive" });
      return;
    }

    const isMember = currentMembers.includes(user.uid);
    try {
      await updateDoc(doc(db, "communities", communityId), {
        members: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      fetchCommunities();
      toast({ title: isMember ? "Left Community" : "Joined Community!" });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not update membership.", variant: "destructive" });
    }
  };

  const filteredEvents = events.filter(e =>
    (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredCommunities = communities.filter(c =>
    (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative min-h-full"
      >
        {/* Ambient Gradient Glow backgrounds */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-gradient-to-b from-[#2856E8]/10 via-[#8B5CF6]/5 to-transparent blur-3xl dark:from-[#2856E8]/5" />
          <div className="absolute top-[40%] right-[-100px] w-80 h-80 rounded-full bg-[#D9FF00]/5 blur-3xl pointer-events-none" />
        </div>

        {/* Content wrapper */}
        <div className="relative px-4 sm:px-8 md:px-12 pt-8 md:pt-12 pb-24 md:pb-12 max-w-6xl mx-auto w-full">
          
          {/* Header */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Compass className="w-4 h-4 text-primary" /> Explore
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-gray-900 dark:text-gray-100">
                Discover MEOW
              </h1>
              <p className="text-xs font-semibold text-gray-400">
                Browse public events and join creator communities.
              </p>
            </div>

            {/* Switch Tabs & Action */}
            <div className="flex items-center gap-3">
              <div className="inline-flex p-1 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5">
                {(["events", "communities"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      activeTab === tab
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div
                        layoutId="explore-tab-pill"
                        className="absolute inset-0 bg-white dark:bg-[#222] rounded-lg shadow-sm border border-black/5"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 capitalize">{tab}</span>
                  </button>
                ))}
              </div>

              {activeTab === "communities" && user && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-xl text-xs font-semibold h-9 px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> New community
                </Button>
              )}
            </div>
          </header>

          {/* Search bar */}
          <div className="relative max-w-md mb-8 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-gray-100 transition-colors" />
            <input
              type="text"
              placeholder={activeTab === "events" ? "Search public events..." : "Search communities..."}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 text-xs font-semibold placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 dark:focus:border-white/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "events" ? (
                loadingEvents ? (
                  <ExploreSkeleton type="events" />
                ) : filteredEvents.length === 0 ? (
                  <EmptyState
                    title="No public events found"
                    description={search ? "Try searching for another keyword or location." : "Events will show up here once hosts make them public."}
                  />
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  >
                    {filteredEvents.map((event, idx) => (
                      <ExploreCard key={event.id} event={event} index={idx} />
                    ))}
                  </motion.div>
                )
              ) : loadingCommunities ? (
                <ExploreSkeleton type="communities" />
              ) : filteredCommunities.length === 0 ? (
                <EmptyState
                  title="No communities found"
                  description={search ? "Try searching for another title or description." : "Create the first community to get people together!"}
                  action={user ? (
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 rounded-xl text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create community
                    </Button>
                  ) : undefined}
                />
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {filteredCommunities.map((comm, idx) => (
                    <CommunityCard
                      key={comm.id}
                      comm={comm}
                      index={idx}
                      isMember={user ? (comm.members || []).includes(user.uid) : false}
                      onToggleJoin={() => toggleJoin(comm.id, comm.members || [])}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Create Community Dialog Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
            >
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-black/5 dark:border-white/5 shadow-2xl p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Create community</h2>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Host meetings, forums, or hobby groups.</p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Community name</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Design Enthusiasts"
                      className="h-10 rounded-xl border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this community about?"
                      className="w-full h-20 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] text-xs font-medium p-3 outline-none focus:ring-1 focus:ring-primary/10 focus:border-primary/20 dark:focus:border-white/20 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accent color</label>
                    <div className="flex gap-2">
                      {["#2856E8", "#8B5CF6", "#FF3F80", "#00B7FF", "#D9FF00", "#101828"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            newColor === color
                              ? "ring-2 ring-offset-2 ring-black dark:ring-white scale-105"
                              : "hover:scale-105 opacity-80"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full h-10 rounded-xl text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 border-none mt-2 shadow-sm"
                  >
                    {creating ? "Launching..." : "Launch community"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

function ExploreSkeleton({ type }: { type: "events" | "communities" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] animate-pulse border border-black/5 dark:border-white/5 ${
            type === "events" ? "h-64" : "h-40"
          }`}
        />
      ))}
    </div>
  );
}

function EventCover({ event, children }: { event: any; children?: React.ReactNode }) {
  const color = event.color || "#2856E8";
  return (
    <div className="relative overflow-hidden aspect-[16/10] w-full bg-slate-900">
      {event.creativeUrl ? (
        <img src={event.creativeUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}aa 50%, #101828 100%)`,
          }}
        />
      )}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

function ExploreCard({ event, index }: { event: any; index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
      }}
      className="h-full"
    >
      <Link href={`/e/${event.id}`}>
        <article className="group h-full flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          
          <EventCover event={event}>
            {event.date && (
              <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/35 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                {formatEventDate(event.date)}
              </div>
            )}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex w-7 h-7 rounded-full bg-white/90 dark:bg-[#111]/90 items-center justify-center text-gray-900 dark:text-gray-100 shadow-sm">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </EventCover>

          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
              {event.title || "Untitled Event"}
            </h3>

            {event.date && (
              <p className="mt-1 text-[10px] font-semibold text-gray-400">
                {formatEventTime(event.date)}
              </p>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-[16px]" />

            {/* Info and location */}
            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-4 mt-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {event.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-[10px] font-semibold text-gray-400 truncate">
                  {event.userName || "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-gray-400">
                {event.location && (
                  <span className="text-[10px] font-semibold flex items-center gap-1 max-w-[100px] truncate">
                    <MapPin className="w-3 h-3 stroke-[2.5px] opacity-70" />
                    <span className="truncate">{event.location.split(',')[0]}</span>
                  </span>
                )}
                <span className="text-[10px] font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.rsvpCount || 0}
                </span>
              </div>
            </div>

          </div>
        </article>
      </Link>
    </motion.div>
  );
}

function CommunityCard({
  comm,
  index,
  isMember,
  onToggleJoin,
}: {
  comm: any;
  index: number;
  isMember: boolean;
  onToggleJoin: () => void;
}) {
  const accent = comm.color || "#2856E8";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
      }}
      className="h-full"
    >
      <article className="group h-full flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        
        {/* Color accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: accent }}
        />

        <div className="flex items-start justify-between gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {comm.title?.[0]?.toUpperCase() || "C"}
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-gray-400">
            <Users className="w-3 h-3" />
            {(comm.members || []).length}
          </span>
        </div>

        <div className="mt-4 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {comm.title || "Untitled Community"}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {comm.description || "A community on MEOW."}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3">
          <p className="text-[10px] text-gray-400 truncate">
            by {comm.ownerName || "Unknown"}
          </p>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleJoin();
            }}
            className={`rounded-xl px-3 h-7 text-[10px] font-bold border-none transition-all shrink-0 ${
              isMember
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            }`}
          >
            {isMember ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Joined
              </>
            ) : (
              "Join"
            )}
          </Button>
        </div>
      </article>
    </motion.div>
  );
}

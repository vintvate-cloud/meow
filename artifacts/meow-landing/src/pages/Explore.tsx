import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, ArrowRight, Plus, X, CheckCircle2 } from "lucide-react";
import { TopNavbar, BottomNavbar } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [search, setSearch] = useState("");
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'events' | 'communities'>('events');

  // New Community Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#D9FF3F");
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
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-background font-sans flex flex-col pb-20 md:pb-0">
      <TopNavbar />
      <BottomNavbar />

      <main className="flex-1 p-6 md:p-12 w-full max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#101828] dark:text-foreground">
                Explore
              </h1>
              <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
                Discover new events and communities around you.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'events' ? "Search events..." : "Search communities..."}
                  className="bg-white dark:bg-card dark:text-card-foreground border border-gray-100 dark:border-border rounded-2xl h-12 pl-12 pr-6 w-full outline-none focus:ring-2 focus:ring-[#D9FF3F] transition-all font-medium text-[#101828] dark:text-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {activeTab === 'communities' && user && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-12 rounded-2xl px-6 font-bold border-none text-white bg-[#101828] hover:bg-black transition-all flex items-center shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Tribe
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Minimal Toggle Tabs */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-border mb-8 pb-1">
          <button 
            onClick={() => setActiveTab('events')}
            className={`pb-3 text-lg font-black transition-colors relative ${activeTab === 'events' ? 'text-[#101828] dark:text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Events
            {activeTab === 'events' && (
              <motion.div layoutId="underline" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-[#101828] rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('communities')}
            className={`pb-3 text-lg font-black transition-colors relative ${activeTab === 'communities' ? 'text-[#101828] dark:text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Communities
            {activeTab === 'communities' && (
              <motion.div layoutId="underline" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-[#101828] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'events' ? (
              // EVENTS GRID
              loadingEvents ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[380px] bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-4 shadow-sm border border-gray-100 dark:border-border">
                      <div className="w-full h-40 bg-gray-50 dark:bg-muted rounded-[24px] animate-pulse mb-6"></div>
                      <div className="px-4 space-y-4">
                        <div className="h-6 bg-gray-50 dark:bg-muted rounded-lg w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-50 dark:bg-muted rounded-md w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-20 text-center shadow-sm border border-gray-100 dark:border-border">
                  <div className="text-[#101828] dark:text-foreground font-black text-2xl mb-2">No events found.</div>
                  <p className="text-gray-500 font-medium">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, idx) => (
                    <ExploreCard key={event.id} event={event} index={idx} />
                  ))}
                </div>
              )
            ) : (
              // COMMUNITIES GRID
              loadingCommunities ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[280px] bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-4 shadow-sm border border-gray-100 dark:border-border animate-pulse"></div>
                  ))}
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-20 text-center shadow-sm border border-gray-100 dark:border-border">
                  <div className="text-[#101828] dark:text-foreground font-black text-2xl mb-2">No communities found.</div>
                  <p className="text-gray-500 font-medium">Be the first to start a tribe!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunities.map((comm, idx) => {
                    const isMember = user ? (comm.members || []).includes(user.uid) : false;
                    
                    return (
                      <motion.div
                        key={comm.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                        className="group h-full"
                      >
                        <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-border h-full flex flex-col relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: comm.color || '#101828' }}></div>
                          
                          <div className="flex items-start justify-between mt-2">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-sm" style={{ backgroundColor: comm.color || '#101828' }}>
                              {comm.title?.[0]?.toUpperCase() || 'C'}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-muted px-3 py-1 rounded-full">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-bold text-gray-500">{(comm.members || []).length}</span>
                            </div>
                          </div>

                          <div className="mt-5 flex-1">
                            <h3 className="text-xl font-black tracking-tight text-[#101828] dark:text-foreground mb-1 leading-tight">
                              {comm.title || 'Untitled Community'}
                            </h3>
                            <p className="text-gray-500 font-medium line-clamp-2 text-sm leading-relaxed">
                              {comm.description || "A community on MEOW."}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="text-[10px] font-bold uppercase text-gray-400">
                              By {comm.ownerName || 'Unknown'}
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => toggleJoin(comm.id, comm.members || [])}
                              className={`rounded-full px-4 font-bold h-8 border-none transition-all ${
                                isMember 
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                                  : 'bg-[#101828] text-white hover:bg-gray-800'
                              }`}
                            >
                              {isMember ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Joined</>
                              ) : (
                                'Join'
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Create Community Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
            >
              <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] shadow-2xl p-8 border border-gray-100 dark:border-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-[#101828] dark:text-foreground">Create a Tribe</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 dark:bg-muted flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCommunity} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Community Name</label>
                    <Input 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Midnight Cyber Hackers"
                      className="h-12 rounded-xl border-gray-200 dark:border-border bg-gray-50 dark:bg-muted font-bold px-4"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Description</label>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this collective about?"
                      className="w-full h-24 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted font-medium text-sm p-4 outline-none focus:border-[#101828] focus:ring-1 focus:ring-[#101828] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Theme Color</label>
                    <div className="flex gap-3">
                      {['#101828', '#2856E8', '#8B5CF6', '#FF3F80', '#00B7FF', '#D9FF3F'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-10 h-10 rounded-full border-4 transition-transform ${newColor === color ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="w-full h-12 rounded-xl font-bold text-white border-none mt-2 transition-all"
                    style={{ backgroundColor: '#101828' }}
                  >
                    {creating ? "Creating..." : "Launch Community"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExploreCard({ event, index }: { event: any, index: number }) {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${event.color} 0%, #101828 150%)`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="group h-full"
    >
      <Link href={`/e/${event.id}`}>
        <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-border h-full flex flex-col relative overflow-hidden cursor-pointer">
          <div 
            className="h-44 rounded-[24px] relative overflow-hidden mb-3" 
            style={gradientStyle}
          >
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-1 rounded-xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-[9px] font-bold uppercase tracking-wider">{new Date(event.date).toLocaleDateString([], { month: 'short' })}</span>
              <span className="text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
            </div>
          </div>

          <div className="px-4 pb-4 flex-1 flex flex-col">
            <h3 className="text-lg font-black tracking-tight text-[#101828] dark:text-foreground mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
              {event.title || 'Untitled Event'}
            </h3>
            
            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-gray-500 bg-gray-50 dark:bg-muted p-2 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-card dark:text-card-foreground shadow-sm flex items-center justify-center shrink-0">
                  <MapPin className="w-3 h-3 text-[#101828] dark:text-foreground" />
                </div>
                <span className="text-xs font-bold truncate">{event.location}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 bg-gray-50 dark:bg-muted p-2 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-card dark:text-card-foreground shadow-sm flex items-center justify-center shrink-0">
                  <Users className="w-3 h-3 text-[#101828] dark:text-foreground" />
                </div>
                <span className="text-xs font-bold">{event.rsvpCount || 0} RSVPs</span>
              </div>
              
              <div className="pt-3 mt-1 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-gray-500">{event.userName?.[0]?.toUpperCase() || 'A'}</span>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Host</div>
                    <div className="text-xs font-bold text-[#101828] dark:text-foreground truncate max-w-[100px]">{event.userName || 'Anonymous'}</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#101828] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

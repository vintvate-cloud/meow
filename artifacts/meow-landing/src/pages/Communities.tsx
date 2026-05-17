import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, where } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Plus, Globe, ArrowLeft, Heart, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Communities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Community Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#D9FF3F");
  const [creating, setCreating] = useState(false);

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
      setLoading(false);
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
      const commRef = await addDoc(collection(db, "communities"), {
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
      fetchCommunities(); // Optimistically update or re-fetch
      toast({ title: isMember ? "Left Community" : "Joined Community!" });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not update membership.", variant: "destructive" });
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-background font-sans pb-20">
      {/* Hero Header */}
      <div className="bg-[#101828] relative overflow-hidden">
        {/* Navigation / Back Button */}
        <div className="absolute top-6 left-6 md:top-8 md:left-12 z-30">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors backdrop-blur-md">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-bold">Dashboard</span>
            </button>
          </Link>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-gradient-to-b from-[#8B5CF6]/20 to-transparent blur-[120px] rounded-full rotate-12"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[100%] bg-gradient-to-t from-[#FF3F80]/10 to-transparent blur-[100px] rounded-full -rotate-12"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Users className="w-4 h-4 text-[#FF3F80]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Tribes & Collectives</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white mb-6">
              Find your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3F80] to-[#8B5CF6]">People.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 font-medium mb-12 max-w-xl">
              Join hyper-local groups, digital collectives, and creative tribes.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl relative z-20">
              <div className="relative flex-1 w-full bg-[#1A2333]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 flex items-center shadow-lg">
                <Search className="w-6 h-6 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  className="w-full h-14 bg-transparent border-none px-4 text-lg font-medium text-white placeholder-gray-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {user && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-[72px] rounded-[32px] px-8 font-black border-none text-white bg-[#FF3F80] hover:bg-[#FF3F80]/90 shadow-[0_0_40px_rgba(255,63,128,0.3)] transition-all flex items-center shrink-0 w-full md:w-auto"
                >
                  <Plus className="w-5 h-5 mr-2" /> Start a Community
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[300px] bg-white dark:bg-card dark:text-card-foreground rounded-[40px] p-4 shadow-sm border border-white/60 animate-pulse"></div>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-24 text-center shadow-sm border border-white">
            <div className="w-20 h-20 bg-gray-50 dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <div className="text-[#101828] dark:text-foreground font-black text-3xl mb-3 tracking-tight">No tribes found.</div>
            <p className="text-gray-500 font-medium text-lg">Be the first to start a community for this topic!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCommunities.map((comm, idx) => {
              const isMember = user ? (comm.members || []).includes(user.uid) : false;
              
              return (
                <motion.div
                  key={comm.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
                  className="group h-full"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-[40px] p-6 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 border border-white h-full flex flex-col relative overflow-hidden">
                    {/* Color bar top */}
                    <div className="absolute top-0 left-0 right-0 h-3" style={{ backgroundColor: comm.color || '#101828' }}></div>
                    
                    <div className="flex items-start justify-between mt-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md transform group-hover:scale-105 transition-transform" style={{ backgroundColor: comm.color || '#101828' }}>
                        {comm.title[0]?.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-muted px-3 py-1.5 rounded-full border border-gray-100 dark:border-border">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-black text-gray-500">{(comm.members || []).length} Members</span>
                      </div>
                    </div>

                    <div className="mt-6 flex-1">
                      <h3 className="text-2xl font-black tracking-tight text-[#101828] dark:text-foreground mb-2 leading-tight">
                        {comm.title}
                      </h3>
                      <p className="text-gray-500 font-medium line-clamp-3 text-sm leading-relaxed">
                        {comm.description || "A community on MEOW."}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-border flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        By {comm.ownerName || 'Unknown'}
                      </div>
                      <Button 
                        onClick={() => toggleJoin(comm.id, comm.members || [])}
                        className={`rounded-full px-6 font-bold h-10 border-none transition-all ${
                          isMember 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-[#101828] text-white hover:bg-black'
                        }`}
                      >
                        {isMember ? (
                          <><CheckCircle2 className="w-4 h-4 mr-1" /> Joined</>
                        ) : (
                          'Join Tribe'
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
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
              className="fixed top-[10%] left-0 right-0 max-w-xl mx-auto z-50 px-4"
            >
              <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[40px] shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-border">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black tracking-tight text-[#101828] dark:text-foreground">Create a Tribe</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-muted flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCommunity} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Community Name</label>
                    <Input 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Midnight Cyber Hackers"
                      className="h-16 rounded-2xl border-2 bg-gray-50/50 font-bold text-lg px-6"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Description</label>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this collective about?"
                      className="w-full h-32 rounded-2xl border-2 border-gray-200 dark:border-border bg-gray-50/50 font-medium text-base p-6 outline-none focus:border-[#FF3F80] focus:ring-1 focus:ring-[#FF3F80] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Tribe Color</label>
                    <div className="flex gap-4">
                      {['#FF3F80', '#8B5CF6', '#2856E8', '#00B7FF', '#D9FF3F', '#101828'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-12 h-12 rounded-full border-4 transition-transform ${newColor === color ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="w-full h-16 rounded-[24px] font-black text-lg text-white border-none mt-4 shadow-xl shadow-[#FF3F80]/20 hover:shadow-[#FF3F80]/40 transition-all"
                    style={{ backgroundColor: '#FF3F80' }}
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

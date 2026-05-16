import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Users, ArrowRight, Globe } from "lucide-react";

export default function Explore() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        // Fetch all public events
        const q = query(
          collection(db, "events"),
          where("isPublic", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const eventData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Manual sort by createdAt as Firestore needs composite index for where + orderBy
        eventData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching public events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F0E8] font-sans pb-20">
      {/* Hero Header */}
      <div className="bg-[#101828] text-white pt-24 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-[#2457FF] opacity-10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[30%] h-full bg-[#D9FF3F] opacity-5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] flex items-center justify-center text-[#101828]">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-[#D9FF3F]">Discover MEOW</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8">
              Explore the <span className="text-[#D9FF3F]">Community.</span>
            </h1>
            <div className="relative max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search events by name or city..."
                className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 pl-16 pr-8 text-lg font-medium outline-none focus:border-[#D9FF3F] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] bg-white/50 backdrop-blur-sm rounded-[40px] animate-pulse border border-white"></div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center shadow-sm border border-gray-100">
            <div className="text-gray-300 font-black text-2xl mb-2 italic">Nothing found yet.</div>
            <p className="text-gray-400 font-medium">Try searching for something else or check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, idx) => (
              <ExploreCard key={event.id} event={event} index={idx} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-20 text-center">
        <Link href="/create-event">
          <p className="text-sm font-black opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
            WANT TO HOST YOUR OWN? <span className="text-[#101828]">CREATE AN EVENT</span>
          </p>
        </Link>
      </div>
    </div>
  );
}

function ExploreCard({ event, index }: { event: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/e/${event.id}`}>
        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full flex flex-col">
          {/* Visual Header */}
          <div className="h-40 relative overflow-hidden" style={{ backgroundColor: event.color }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <div className="absolute top-5 left-5 w-32 h-32 rounded-full border-4 border-white"></div>
              <div className="absolute bottom-5 right-5 w-48 h-48 rounded-[40px] rotate-45 border-4 border-white"></div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</div>
                <div className="text-sm font-black text-[#101828]">
                  {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#101828]" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex-1 flex flex-col">
            <h3 className="text-2xl font-black tracking-tight text-[#101828] mb-4 group-hover:text-[#2457FF] transition-colors line-clamp-2">
              {event.title}
            </h3>
            
            <div className="space-y-3 mt-auto">
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-bold truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <Users className="w-4 h-4" />
                <span className="text-sm font-bold">{event.rsvpCount || 0} Attending</span>
              </div>
              
              <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                  {event.userName?.[0] || 'M'}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  By {event.userName || 'Anonymous'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

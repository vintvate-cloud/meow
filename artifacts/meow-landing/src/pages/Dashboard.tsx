import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  LogOut, 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Search,
  Bell,
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "events"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const eventData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const totalRsvps = events.reduce((acc, event) => acc + (event.rsvpCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F3F0E8] flex font-sans">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col p-4 z-20 transition-all">
        <div className="flex items-center gap-3 px-2 mb-12">
          <Link href="/" className="flex items-center">
            <img src="/meow logo.png" alt="MEOW" className="h-10 w-auto object-contain" />
          </Link>
          <span className="font-black text-2xl tracking-tighter hidden md:block">MEOW</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Events" active />
          <NavItem icon={<Users className="w-5 h-5" />} label="Communities" />
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-red-50 text-red-600 transition-colors group"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold hidden md:block">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight" style={{ color: '#111827' }}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'Creator'}!
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {events.length === 0 ? "You haven't created any events yet." : `You have ${events.length} active events.`}
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search events..." 
                className="bg-white border border-gray-100 rounded-full h-12 pl-12 pr-6 w-full outline-none focus:ring-2 focus:ring-[#D9FF00]"
              />
            </div>
            <Button className="w-12 h-12 rounded-full p-0 bg-white border border-gray-100 text-gray-400 hover:text-navy">
              <Bell className="w-5 h-5" />
            </Button>
            <Link href="/create-event">
              <Button className="rounded-full h-12 px-6 font-bold shadow-xl border-none hidden md:flex" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total RSVPs" value={totalRsvps.toLocaleString()} change="+0%" color="#2856E8" />
          <StatCard label="Active Events" value={events.length.toString()} change="+0%" color="#79001B" />
          <StatCard label="Member Growth" value="0" change="+0%" color="#00B7FF" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-black">Your Events</h2>
              <span className="text-sm font-bold text-gray-400 cursor-pointer hover:text-navy">View all</span>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center font-bold opacity-20">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="p-12 bg-white rounded-[40px] border-2 border-dashed border-gray-200 text-center space-y-4">
                  <p className="text-gray-400 font-bold">You don't have any events yet.</p>
                  <Link href="/create-event">
                    <Button variant="outline" className="rounded-full font-bold">Start your first one</Button>
                  </Link>
                </div>
              ) : (
                events.map(event => (
                  <EventCard 
                    key={event.id}
                    id={event.id}
                    title={event.title} 
                    date={new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                    rsvps={event.rsvpCount || 0} 
                    status="Active"
                    color={event.color}
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Quick Actions</h2>
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
              <Link href="/create-event">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold justify-start">
                  <Plus className="w-5 h-5 mr-3" /> Create new event
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold justify-start">
                <Users className="w-5 h-5 mr-3" /> Manage communities
              </Button>
              
              <div className="pt-4">
                <div className="bg-[#D9FF00]/10 p-6 rounded-2xl border border-[#D9FF00]/20">
                  <div className="font-black text-sm mb-2" style={{ color: '#111827' }}>PRO TIP</div>
                  <p className="text-sm font-medium opacity-70 mb-4">Sharing your link on Twitter increases visibility by 2x.</p>
                  <Button size="sm" className="rounded-full font-bold bg-[#111827] text-[#D9FF00]">Share Profile</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Link href="/create-event">
        <Button className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl md:hidden z-30" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
          <Plus className="w-8 h-8" />
        </Button>
      </Link>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all group ${active ? 'bg-[#D9FF00] text-navy' : 'hover:bg-gray-50 text-gray-400 hover:text-navy'}`}>
      <div className={active ? '' : 'group-hover:scale-110 transition-transform'}>{icon}</div>
      <span className={`font-bold hidden md:block ${active ? '' : ''}`}>{label}</span>
    </button>
  );
}

function StatCard({ label, value, change, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-5" style={{ backgroundColor: color }}></div>
      <div className="text-sm font-bold text-gray-400 mb-1">{label}</div>
      <div className="flex items-end gap-3">
        <div className="text-4xl font-black tracking-tight">{value}</div>
        <div className="text-xs font-black px-2 py-1 rounded-full bg-green-50 text-green-600 mb-1">{change}</div>
      </div>
    </div>
  );
}

function EventCard({ id, title, date, rsvps, status, color, dark = false }: any) {
  const [, setLocation] = useLocation();
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={() => setLocation(`/e/${id}`)}
      className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black" style={{ backgroundColor: color, color: dark ? 'white' : '#111827' }}>
          <div className="text-[10px] opacity-60 uppercase">{date.split(' ')[0]}</div>
          <div className="text-xl">{date.split(' ')[1]}</div>
        </div>
        <div>
          <h4 className="text-xl font-black group-hover:text-navy transition-colors flex items-center gap-2">
            {title} <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-40" />
          </h4>
          <div className="text-sm font-medium text-gray-400">{date}</div>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <div className="text-center">
          <div className="text-sm font-black">{rsvps}</div>
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">RSVPs</div>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-black ${status === 'Sold Out' ? 'bg-red-50 text-red-600' : 'bg-[#D9FF00]/20 text-navy'}`}>
          {status}
        </div>
      </div>
    </motion.div>
  );
}


import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TopNavbar, BottomNavbar } from "@/components/Navigation";
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
  ExternalLink,
  Globe
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [hostingEvents, setHostingEvents] = useState<any[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'attending' | 'hosting'>('attending');
  const [loading, setLoading] = useState(true);

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

  const totalRsvps = hostingEvents.reduce((acc, event) => acc + (event.rsvpCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-background flex flex-col font-sans">
      <TopNavbar />
      <BottomNavbar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 pb-32 md:pb-12 overflow-y-auto w-full max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="w-full flex justify-between items-center md:block">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                Hey, {user?.displayName?.split(' ')[0] || 'Creator'}!
              </h1>
              <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
                {hostingEvents.length === 0 ? "Let's build something." : `${hostingEvents.length} active events`}
              </p>
            </div>
            <div className="md:hidden">
              <button onClick={() => logout()} className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white dark:bg-card dark:text-card-foreground border border-gray-100 dark:border-border rounded-2xl h-12 pl-12 pr-6 w-full outline-none focus:ring-2 focus:ring-[#D9FF3F] transition-all"
              />
            </div>
            <Button className="w-12 h-12 rounded-2xl p-0 bg-white dark:bg-card dark:text-card-foreground border border-gray-100 dark:border-border text-gray-400 hover:text-[#101828] dark:text-foreground">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total RSVPs" value={totalRsvps.toLocaleString()} change="+0%" color="#2856E8" />
          <StatCard label="Active Events" value={hostingEvents.length.toString()} change="+0%" color="#79001B" />
          <StatCard label="Member Growth" value="0" change="+0%" color="#00B7FF" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-border pb-4">
              <div className="flex gap-6">
                <button 
                  onClick={() => setActiveTab('attending')} 
                  className={`text-2xl font-black transition-colors ${activeTab === 'attending' ? 'text-[#101828] dark:text-foreground' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  Attending
                </button>
                <button 
                  onClick={() => setActiveTab('hosting')} 
                  className={`text-2xl font-black transition-colors ${activeTab === 'hosting' ? 'text-[#101828] dark:text-foreground' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  Hosting
                </button>
              </div>
              <Link href="/explore">
                <span className="text-sm font-bold text-gray-400 cursor-pointer hover:text-[#101828] dark:text-foreground">Explore Events</span>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center font-bold opacity-20">Loading events...</div>
              ) : activeTab === 'attending' ? (
                attendingEvents.length === 0 ? (
                  <div className="p-12 bg-white dark:bg-card dark:text-card-foreground rounded-[40px] border-2 border-dashed border-gray-200 dark:border-border text-center space-y-4">
                    <p className="text-gray-400 font-bold">You aren't attending any events yet.</p>
                    <Link href="/explore">
                      <Button variant="outline" className="rounded-full font-bold">Discover Events</Button>
                    </Link>
                  </div>
                ) : (
                  attendingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      date={new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      rsvps={event.rsvpCount || 0}
                      status={event.rsvpStatus}
                      color={event.color}
                      isAttending
                    />
                  ))
                )
              ) : (
                hostingEvents.length === 0 ? (
                  <div className="p-12 bg-white dark:bg-card dark:text-card-foreground rounded-[40px] border-2 border-dashed border-gray-200 dark:border-border text-center space-y-4">
                    <p className="text-gray-400 font-bold">You haven't hosted any events yet.</p>
                    <Link href="/create-event">
                      <Button variant="outline" className="rounded-full font-bold">Start your first one</Button>
                    </Link>
                  </div>
                ) : (
                  hostingEvents.map(event => (
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
                )
              )}
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Quick Actions</h2>
            <div className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-border space-y-4">
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
                  <div className="font-black text-sm mb-2" style={{ color: "var(--foreground)" }}>PRO TIP</div>
                  <p className="text-sm font-medium opacity-70 mb-4">Sharing your link on Twitter increases visibility by 2x.</p>
                  <Button size="sm" className="rounded-full font-bold bg-[#111827] text-[#D9FF00]">Share Profile</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



function StatCard({ label, value, change, color }: any) {
  return (
    <div className="bg-white dark:bg-card dark:text-card-foreground p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-border relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-5" style={{ backgroundColor: color }}></div>
      <div className="text-sm font-bold text-gray-400 mb-1">{label}</div>
      <div className="flex items-end gap-3">
        <div className="text-4xl font-black tracking-tight">{value}</div>
        <div className="text-xs font-black px-2 py-1 rounded-full bg-green-50 text-green-600 mb-1">{change}</div>
      </div>
    </div>
  );
}

function EventCard({ id, title, date, rsvps, status, color, dark = false, isAttending = false }: any) {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={() => isAttending ? setLocation(`/e/${id}`) : setLocation(`/manage/${id}`)}

      className="bg-white dark:bg-card dark:text-card-foreground p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-border flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black" style={{ backgroundColor: color, color: dark ? 'white' : '#111827' }}>
          <div className="text-[10px] opacity-60 uppercase">{date.split(' ')[0]}</div>
          <div className="text-xl">{date.split(' ')[1]}</div>
        </div>
        <div>
          <h4 className="text-xl font-black group-hover:text-[#101828] dark:text-foreground transition-colors flex items-center gap-2">
            {title} <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-40" />
          </h4>
          <div className="text-sm font-medium text-gray-400">{date}</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {!isAttending && (
          <div className="text-center">
            <div className="text-sm font-black">{rsvps}</div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">RSVPs</div>
          </div>
        )}
        <div className={`px-4 py-2 rounded-full text-xs font-black ${
          status === 'Pending Approval' ? 'bg-orange-50 text-orange-600' : 
          status === 'Approved' ? 'bg-green-50 text-green-600' : 
          'bg-[#D9FF00]/20 text-[#101828] dark:text-foreground'
        }`}>
          {status}
        </div>
      </div>
    </motion.div>
  );
}


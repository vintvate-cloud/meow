import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Settings, LogOut, Plus, Moon, Sun, Bell, ChevronRight, QrCode, Paintbrush, HelpCircle } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { parseAvatarUrlFromStorage } from "@/lib/avatars";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function NavItem({ icon, label, active = false, isMobile = false, isNavbar = false, href }: { icon: any, label: string, active?: boolean, isMobile?: boolean, isNavbar?: boolean, href?: string }) {
  const content = (
    <>
      {isMobile ? (
        <div className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-foreground' : 'text-gray-400 dark:text-gray-500'}`}>
          <div className={active ? 'scale-110' : ''}>{icon}</div>
          <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </div>
      ) : isNavbar ? (
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-300 group ${active ? 'bg-black/5 dark:bg-white/10 text-foreground border border-black/5 dark:border-white/10 backdrop-blur-md shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-foreground border border-transparent'}`}>
          <div className={active ? '' : 'group-hover:scale-105 transition-transform opacity-70 group-hover:opacity-100'}>{icon}</div>
          <span className="hidden sm:inline font-medium text-sm tracking-wide">{label}</span>
        </div>
      ) : (
        <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all group ${active ? 'bg-gray-100 dark:bg-white/10 text-foreground font-semibold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-foreground'}`}>
          <div className={active ? 'text-foreground' : 'group-hover:scale-110 transition-transform'}>{icon}</div>
          <span className="font-medium text-sm">{label}</span>
        </div>
      )}
    </>
  );

  if (href) {
    return <Link href={href} className="w-full text-left"><button className="w-full text-left">{content}</button></Link>;
  }
  return <button className="w-full text-left">{content}</button>;
}


export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const avatarUrl = parseAvatarUrlFromStorage(user?.photoURL || null);

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

  const handleOpenScanner = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "events"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHostedEvents(data);
      setIsScannerModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const startScanner = (eventId: string) => {
    setIsScannerModalOpen(false);
    setLocation(`/scan/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0A] text-foreground flex flex-col transition-colors duration-300">
      
      {/* Universal Top Navbar */}
      <nav className="w-full bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/welcome">
            <span className="font-black text-lg md:text-xl tracking-tighter text-[#101828] dark:text-white flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              MEOW 🐾
            </span>
          </Link>
          
          {/* Main Nav Links */}
          <div className="flex items-center gap-1 md:gap-2">
            <NavItem icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />} label="Events" active={location === '/' || location === '/dashboard'} isNavbar href="/" />
            <NavItem icon={<Globe className="w-4 h-4" strokeWidth={1.5} />} label="Explore" active={location === '/explore'} isNavbar href="/explore" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handleOpenScanner}
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-foreground transition-all duration-300 hidden sm:flex backdrop-blur-md"
            title="QR Scanner"
          >
            <QrCode className="w-4 h-4" strokeWidth={1.5} />
          </button>
          
          <Link href="/create-event">
            <Button size="sm" className="rounded-full font-medium h-9 px-4 border border-black/10 dark:border-white/10 shadow-sm bg-white/50 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 backdrop-blur-xl text-foreground hidden sm:flex transition-all duration-300">
              <Plus className="w-4 h-4 md:mr-1.5" strokeWidth={2} />
              <span className="hidden md:inline tracking-wide">Create Event</span>
            </Button>
          </Link>
          
          {/* Mobile Create Event */}
          <Link href="/create-event" className="sm:hidden">
            <div className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl text-foreground flex items-center justify-center cursor-pointer shadow-sm hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300">
              <Plus className="w-4 h-4" strokeWidth={2} />
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-foreground transition-all duration-300 backdrop-blur-md"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          </button>
          
          <div className="h-6 w-px bg-black/10 dark:bg-white/10 mx-1 hidden md:block"></div>
          
          <Link href="/settings">
            <div className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition-all duration-300 shadow-sm ${location === '/settings' ? 'border-foreground scale-105' : 'border-transparent hover:border-black/20 dark:hover:border-white/20 hover:scale-105'}`}>
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </Link>

          <button
            onClick={() => logout()}
            className="p-2.5 rounded-full hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all duration-300 hidden md:flex backdrop-blur-md"
            title="Log out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col w-full mx-auto">
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* QR Scanner Selection Modal */}
      <Dialog open={isScannerModalOpen} onOpenChange={setIsScannerModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-foreground">Select Event to Scan</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Select which event you want to scan and confirm tickets for.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4 pr-1">
            {hostedEvents.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400 italic">No events found to scan.</p>
            ) : (
              hostedEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => startScanner(event.id)}
                  className="w-full text-left p-3.5 rounded-xl border border-gray-100 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  <span className="font-semibold text-sm truncate max-w-[240px] text-foreground">{event.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

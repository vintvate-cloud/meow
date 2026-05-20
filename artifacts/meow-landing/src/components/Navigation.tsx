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
        <div className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#8129D9] dark:text-[#E8C8EC]' : 'text-gray-400 dark:text-gray-500'}`}>
          <div className={active ? 'scale-110' : ''}>{icon}</div>
          <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </div>
      ) : isNavbar ? (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all group ${active ? 'bg-[#8129D9] text-white dark:bg-[#E8C8EC] dark:text-[#101828]' : 'hover:bg-gray-50 dark:bg-muted text-gray-500 hover:text-[#101828] dark:text-foreground'}`}>
          <div className={active ? '' : 'group-hover:scale-115 transition-transform'}>{icon}</div>
          <span className="font-semibold text-sm">{label}</span>
        </div>
      ) : (
        <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all group ${active ? 'bg-gray-100 dark:bg-white/10 text-foreground font-semibold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-foreground'}`}>
          <div className={active ? 'text-[#8129D9] dark:text-[#E8C8EC]' : 'group-hover:scale-110 transition-transform'}>{icon}</div>
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

export function TopNavbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);
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

  return (
    <nav className="hidden md:flex w-full bg-white dark:bg-[#0A0A0A] border-b border-gray-100 dark:border-[#222] items-center justify-between px-8 py-4 z-50 sticky top-0 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-xl tracking-tight text-[#101828] dark:text-white flex items-center gap-1.5">
            MEOW 🐾
          </span>
        </Link>

        <div className="flex items-center space-x-1">
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Dashboard" active={location === '/' || location === '/dashboard'} isNavbar href="/" />
          <NavItem icon={<Globe className="w-4 h-4" />} label="Explore" active={location === '/explore'} isNavbar href="/explore" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/create-event">
          <Button size="sm" className="rounded-full font-bold h-9 px-4 hidden md:flex border-none shadow-sm bg-[#8129D9] hover:bg-[#7020C4] text-white">
            <Plus className="w-4 h-4 mr-1" />
            Create Event
          </Button>
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-colors mr-2"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link href="/settings">
          <button className={`relative rounded-full overflow-hidden transition-all border-2 ${location === '/settings' ? 'border-[#8129D9] scale-105' : 'border-transparent hover:border-[#8129D9]/50 hover:scale-105'}`}>
            <img src={avatarUrl} alt="Profile" className="w-8 h-8 object-cover" />
          </button>
        </Link>
        <div className="h-6 w-px bg-gray-200 dark:bg-border mx-2"></div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors group"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold text-sm">Log out</span>
        </button>
      </div>
    </nav>
  );
}

export function BottomNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const avatarUrl = parseAvatarUrlFromStorage(user?.photoURL || null);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-100 dark:border-border px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-4">
      <NavItem icon={<Calendar className="w-5 h-5" />} label="My Events" active={location === '/' || location === '/dashboard'} isMobile href="/" />
      <NavItem icon={<Globe className="w-5 h-5" />} label="Explore" active={location === '/explore'} isMobile href="/explore" />
      <Link href="/create-event">
        <div className="w-12 h-12 rounded-full flex items-center justify-center -translate-y-4 shadow-xl border-4 border-white dark:border-background transition-transform active:scale-90 bg-[#8129D9] text-white">
          <Plus className="w-6 h-6 text-white" />
        </div>
      </Link>
      <Link href="/settings">
        <div className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${location === '/settings' ? 'text-[#8129D9]' : 'text-gray-400'}`}>
          <div className={`w-5 h-5 rounded-full overflow-hidden transition-transform ${location === '/settings' ? 'scale-110 ring-2 ring-[#8129D9] ring-offset-1 dark:ring-offset-card' : ''}`}>
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Settings</span>
        </div>
      </Link>
    </nav>
  );
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
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0A] text-foreground flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Desktop Left Sidebar (Clean Linktree Aesthetic) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 dark:border-[#222] bg-[#FAF9F6] dark:bg-[#0A0A0A] shrink-0 h-screen sticky top-0 z-40 p-6 justify-between">
        <div className="space-y-6">
          
          {/* Header Workspace Display */}
          <div className="flex items-center gap-3 px-1 py-2">
            <span className="font-black text-lg tracking-wider text-[#101828] dark:text-white">
              MEOW 🐾
            </span>
          </div>

          {/* User Profile Card Dropdown */}
          <Link href="/settings">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-all shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-800 object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{user?.displayName || "Creator"}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">Admin Hub</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase px-4 mb-2">My MEOW Hub</p>
            <NavItem icon={<Calendar className="w-4 h-4 stroke-[2px]" />} label="Events" active={location === '/' || location === '/dashboard'} href="/" />
            <NavItem icon={<Globe className="w-4 h-4 stroke-[2px]" />} label="Explore" active={location === '/explore'} href="/explore" />
            <NavItem icon={<Paintbrush className="w-4 h-4 stroke-[2px]" />} label="Appearance" active={location.includes('/settings') && location.includes('tab=appearance')} href="/settings?tab=appearance" />
          </div>

          {/* Tools / Integrations */}
          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase px-4 mb-2">Tools</p>
            <button 
              onClick={handleOpenScanner}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-foreground text-left transition-all"
            >
              <QrCode className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium text-sm">QR Ticket Scanner</span>
            </button>
            <NavItem icon={<Settings className="w-4 h-4 stroke-[2px]" />} label="Settings" active={location === '/settings'} href="/settings" />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#222]">
          {/* Create Event prominent pill */}
          <Link href="/create-event">
            <button className="w-full py-3 rounded-full bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01]">
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </Link>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-all"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-card border-b border-gray-100 dark:border-border sticky top-0 z-40">
        <Link href="/">
          <span className="font-black text-lg tracking-wider text-[#101828] dark:text-white">
            MEOW 🐾
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-muted"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavbar />

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

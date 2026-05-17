import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Users, BarChart3, Settings, LogOut, Plus } from "lucide-react";

export function NavItem({ icon, label, active = false, isMobile = false, isNavbar = false, href }: { icon: any, label: string, active?: boolean, isMobile?: boolean, isNavbar?: boolean, href?: string }) {
  const content = (
    <>
      {isMobile ? (
        <div className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#101828]' : 'text-gray-300'}`}>
          <div className={active ? 'scale-110' : ''}>{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
        </div>
      ) : isNavbar ? (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all group ${active ? 'bg-[#D9FF3F] text-[#101828]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#101828]'}`}>
          <div className={active ? '' : 'group-hover:scale-110 transition-transform'}>{icon}</div>
          <span className="font-bold text-sm">{label}</span>
        </div>
      ) : (
        <div className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all group ${active ? 'bg-[#D9FF3F] text-[#101828]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#101828]'}`}>
          <div className={active ? '' : 'group-hover:scale-110 transition-transform'}>{icon}</div>
          <span className="font-bold">{label}</span>
        </div>
      )}
    </>
  );

  if (href) {
    return <Link href={href}><button>{content}</button></Link>;
  }
  return <button>{content}</button>;
}

export function TopNavbar() {
  const { logout } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="hidden md:flex w-full bg-white border-b border-gray-100 items-center justify-between px-8 py-4 z-50 sticky top-0 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center">
          <img src="/meowlogo2.png" alt="MEOW Logo" className="h-10 w-auto object-contain hover:scale-105 transition-transform" />
        </Link>

        <div className="flex items-center space-x-1">
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Dashboard" active={location === '/' || location === '/dashboard'} isNavbar href="/" />
          <NavItem icon={<Globe className="w-4 h-4" />} label="Explore" active={location === '/explore'} isNavbar href="/explore" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/create-event">
          <Button size="sm" className="rounded-full font-bold h-9 px-4 hidden md:flex border-none shadow-sm" style={{ backgroundColor: '#101828', color: '#D9FF3F' }}>
            <Plus className="w-4 h-4 mr-1" />
            Create Event
          </Button>
        </Link>
        <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" active={location === '/settings'} isNavbar href="/settings" />
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 text-red-600 transition-colors group"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold text-sm">Log out</span>
        </button>
      </div>
    </nav>
  );
}

export function BottomNavbar() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <NavItem icon={<Calendar className="w-6 h-6" />} label="Dashboard" active={location === '/' || location === '/dashboard'} isMobile href="/" />
      <NavItem icon={<Globe className="w-6 h-6" />} label="Explore" active={location === '/explore'} isMobile href="/explore" />
      <Link href="/create-event">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center -translate-y-6 shadow-2xl border-4 border-[#F3F0E8] transition-transform active:scale-90" style={{ backgroundColor: '#101828' }}>
          <Plus className="w-8 h-8 text-[#D9FF3F]" />
        </div>
      </Link>
      <NavItem icon={<Settings className="w-6 h-6" />} label="Settings" active={location === '/settings'} isMobile href="/settings" />
    </nav>
  );
}

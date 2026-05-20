import { parseAvatarUrlFromStorage } from "@/lib/avatars";
import { Share2, Calendar, MapPin, Users, Globe, ArrowUpRight } from "lucide-react";

interface PhonePreviewProps {
  displayName: string;
  profilePicUrl: string;
  bio: string;
  socials: {
    twitter?: { connected: boolean; username: string };
    instagram?: { connected: boolean; username: string };
    discord?: { connected: boolean; username: string };
    github?: { connected: boolean; username: string };
  };
  events: Array<{
    id: string;
    title: string;
    date: string;
    location?: string;
    isPublic?: boolean;
    color?: string;
  }>;
  theme?: "light" | "dark" | "system";
  accentColor?: "lime" | "blue" | "lavender" | "burgundy" | "purple";
  borderStyle?: "standard" | "brutalist";
  username?: string;
}

export function PhonePreview({
  displayName,
  profilePicUrl,
  bio,
  socials,
  events,
  theme = "light",
  accentColor = "lime",
  borderStyle = "standard",
  username = "",
}: PhonePreviewProps) {
  const avatar = parseAvatarUrlFromStorage(profilePicUrl);
  const activeEvents = events.filter((e) => e.isPublic !== false);

  const now = new Date();
  const upcomingEvents = activeEvents.filter((e) => {
    try {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d >= now;
    } catch (_) {
      return true;
    }
  });

  const pastEvents = activeEvents.filter((e) => {
    try {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d < now;
    } catch (_) {
      return false;
    }
  });

  upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Accent styling definitions
  const getColors = () => {
    switch (accentColor) {
      case "lime":
        return {
          primary: "#D9FF00",
          text: "#101828",
          btnBg: "bg-[#D9FF00]",
          btnBorder: "border-[#101828]",
          btnText: "text-[#101828]",
        };
      case "blue":
        return {
          primary: "#2856E8",
          text: "#FFFFFF",
          btnBg: "bg-[#2856E8]",
          btnBorder: "border-[#2856E8]",
          btnText: "text-white",
        };
      case "lavender":
        return {
          primary: "#E8C8EC",
          text: "#101828",
          btnBg: "bg-[#E8C8EC]",
          btnBorder: "border-[#101828]",
          btnText: "text-[#101828]",
        };
      case "burgundy":
        return {
          primary: "#79001B",
          text: "#FFFFFF",
          btnBg: "bg-[#79001B]",
          btnBorder: "border-[#79001B]",
          btnText: "text-white",
        };
      case "purple":
        return {
          primary: "#58268C",
          text: "#FFFFFF",
          btnBg: "bg-[#58268C]",
          btnBorder: "border-[#58268C]",
          btnText: "text-white",
        };
      default:
        return {
          primary: "#D9FF00",
          text: "#101828",
          btnBg: "bg-[#D9FF00]",
          btnBorder: "border-[#101828]",
          btnText: "text-[#101828]",
        };
    }
  };

  const colors = getColors();

  // Handle preview page themes
  const getThemeStyles = () => {
    if (theme === "dark") {
      return {
        bg: "bg-[#0A0A0A]",
        text: "text-gray-100",
        subtext: "text-gray-400",
        cardBg: "bg-[#121212]",
        cardBorder: "border-gray-800",
        cardText: "text-white",
        btnBorder: "border-gray-800",
        btnText: "text-gray-200",
        accentText: "text-white",
      };
    }
    // Default Linktree-style organic/cozy cream theme
    return {
      bg: "bg-[#FAF8F5]",
      text: "text-[#101828]",
      subtext: "text-gray-600",
      cardBg: "bg-white",
      cardBorder: "border-[#101828]/10",
      cardText: "text-[#101828]",
      btnBorder: "border-[#101828]/15",
      btnText: "text-gray-800",
      accentText: "text-[#101828]",
    };
  };

  const style = getThemeStyles();

  // Check if button is brutalist or standard
  const getButtonClass = (eventColor?: string) => {
    const base = "w-full text-left p-3.5 transition-all relative flex flex-col justify-between items-start cursor-pointer group ";
    if (borderStyle === "brutalist") {
      return (
        base +
        "bg-white dark:bg-card border-2 border-foreground text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-xl"
      );
    }
    // Premium soft cards
    return (
      base +
      "bg-white dark:bg-[#1A1A1A] hover:bg-gray-50/50 dark:hover:bg-[#222] border border-black/5 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5"
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString([], { month: "short", day: "numeric", weekday: "short" }) + " • " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    } catch (_) {}
    return dateStr;
  };

  return (
    <div className="w-[310px] h-[610px] rounded-[45px] border-[10px] border-[#101828] dark:border-gray-800 bg-[#101828] relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col scale-90 sm:scale-100 origin-top">
      {/* Notch / Speaker */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#101828] rounded-b-2xl z-30 flex items-center justify-center">
        <div className="w-12 h-1 bg-gray-800 rounded-full mb-1"></div>
      </div>

      {/* Internal Phone Screen Container */}
      <div className={`flex-1 ${style.bg} pt-8 pb-4 px-4 flex flex-col h-full overflow-y-auto select-none relative z-10 scrollbar-none`}>
        {/* Top Header Mock URL bar */}
        <div className="flex items-center justify-between mt-1 mb-6 px-1 text-[11px] font-bold text-gray-400">
          <span className="truncate max-w-[150px]">meow.link/{username}</span>
          <div className="flex gap-2">
            <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Profile Info block */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-white dark:border-gray-800 shadow-md overflow-hidden relative bg-muted flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold uppercase">{displayName?.[0] || "M"}</span>
            )}
          </div>
          <div className="space-y-1">
            <h2 className={`font-serif text-lg font-bold ${style.text}`}>{displayName || "Anonymous Creator"}</h2>
            {bio ? (
              <p className={`text-[11px] font-medium max-w-[210px] mx-auto leading-relaxed ${style.subtext}`}>{bio}</p>
            ) : (
              <p className="text-[11px] text-gray-400 italic">No bio provided</p>
            )}
          </div>

          {/* Social Icons inside phone */}
          <div className="flex items-center justify-center gap-3.5 pt-1">
            {socials?.twitter?.connected && socials.twitter.username && (
              <a
                href={`https://twitter.com/${socials.twitter.username.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:scale-105 transition-transform ${style.text}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {socials?.instagram?.connected && socials.instagram.username && (
              <a
                href={`https://instagram.com/${socials.instagram.username.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:scale-105 transition-transform ${style.text}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}
            {socials?.discord?.connected && socials.discord.username && (
              <span className={`p-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:scale-105 transition-transform ${style.text}`}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.95,54.65,1,77.53a105.9,105.9,0,0,0,32,16.29,80.12,80.12,0,0,0,6.66-10.84,68.25,68.25,0,0,1-10.51-5c.88-.65,1.72-1.34,2.53-2a75.76,75.76,0,0,0,51.84,0c.81.71,1.65,1.4,2.53,2a68.25,68.25,0,0,1-10.51,5,80.12,80.12,0,0,0,6.66,10.84,105.9,105.9,0,0,0,32-16.29C129.83,48.24,123.63,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
              </span>
            )}
            {socials?.github?.connected && socials.github.username && (
              <a
                href={`https://github.com/${socials.github.username}`}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:scale-105 transition-transform ${style.text}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.04] dark:border-white/[0.04] mb-6"></div>

        {/* Public Events list */}
        <div className="flex-1 space-y-5">
          {/* Upcoming events */}
          <div className="space-y-2.5">
            <p className={`text-[9px] font-black uppercase tracking-wider pl-1 ${style.subtext}`}>Upcoming Events</p>
            {upcomingEvents.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-black/10 dark:border-white/10 p-3 bg-black/[0.01] dark:bg-white/[0.01]">
                <p className="text-[10px] text-gray-400 italic">No upcoming events listed.</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => window.open(`/e/${event.id}`, "_blank")}
                  className={getButtonClass(event.color)}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <h4 className="text-[11px] font-bold leading-tight line-clamp-1 group-hover:text-primary-foreground/90">{event.title}</h4>
                    <ArrowUpRight className="w-3 h-3 opacity-55 shrink-0 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 w-full text-[9px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 stroke-[2px] opacity-70" />
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past events */}
          <div className="space-y-2.5 opacity-85">
            <p className={`text-[9px] font-black uppercase tracking-wider pl-1 ${style.subtext}`}>Past Events</p>
            {pastEvents.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-black/10 dark:border-white/10 p-3 bg-black/[0.01] dark:bg-white/[0.01]">
                <p className="text-[10px] text-gray-400 italic">No past events recorded.</p>
              </div>
            ) : (
              pastEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => window.open(`/e/${event.id}`, "_blank")}
                  className={getButtonClass(event.color) + " opacity-75"}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <h4 className="text-[11px] font-bold leading-tight line-clamp-1 text-gray-400">{event.title}</h4>
                    <ArrowUpRight className="w-3 h-3 opacity-30 shrink-0" />
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 w-full text-[9px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 stroke-[2px] opacity-70" />
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer brand watermark */}
        <div className="text-center pt-8 pb-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="text-[#101828] dark:text-white font-extrabold text-[10px]">MEOW 🐾</span>
          </p>
        </div>
      </div>

      {/* Screen reflections / shine */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-tr from-transparent via-white/3 to-transparent"></div>
    </div>
  );
}

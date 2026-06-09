export const THEMES_MAP: Record<string, { bg: string, text: string, accent: string, starburst: string, bgGradient?: string }> = {
  "cream-cozy": { bg: "#FAF8F5", text: "#101828", accent: "#8129D9", starburst: "#8129D9" },
  "sleek-midnight": { bg: "#0A0A0A", text: "#FFFFFF", accent: "#D9FF00", starburst: "#D9FF00" },
  "luma-aura": { bg: "#0d0a14", text: "#FFFFFF", accent: "#FFFFFF", starburst: "#8129D9", bgGradient: "radial-gradient(circle at 15% 50%, rgba(129, 41, 217, 0.25), transparent 25%), radial-gradient(circle at 85% 30%, rgba(217, 41, 100, 0.2), transparent 25%)" },
  "glass-aurora": { bg: "#ffffff", text: "#101828", accent: "#101828", starburst: "#00F0FF", bgGradient: "linear-gradient(135deg, rgba(230, 240, 255, 1) 0%, rgba(255, 230, 240, 1) 100%)" },
  "obsidian-mesh": { bg: "#050505", text: "#FFFFFF", accent: "#FFFFFF", starburst: "#333333", bgGradient: "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.5) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.5) 0, transparent 50%)" },
  "ethereal-blur": { bg: "#f3f4f6", text: "#111827", accent: "#4f46e5", starburst: "#4f46e5", bgGradient: "radial-gradient(circle at 50% -20%, #e0e7ff 0%, #f3f4f6 80%)" },
  "sunset-mirage": { bg: "#1a0b12", text: "#FFFFFF", accent: "#FF7B00", starburst: "#FF3300", bgGradient: "radial-gradient(circle at 100% 0%, rgba(255, 123, 0, 0.3) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(255, 51, 0, 0.3) 0%, transparent 40%)" },
  "oceanic-deep": { bg: "#020813", text: "#E0F2FE", accent: "#38BDF8", starburst: "#0369A1", bgGradient: "radial-gradient(circle at 50% 50%, rgba(3, 105, 161, 0.2) 0%, transparent 60%), linear-gradient(180deg, #020813 0%, #082f49 100%)" },
  "emerald-oasis": { bg: "#022c22", text: "#F0FDF4", accent: "#34D399", starburst: "#059669", bgGradient: "radial-gradient(ellipse at top left, rgba(5, 150, 105, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.2) 0%, transparent 50%)" },
  "peachy-clean": { bg: "#fff5f0", text: "#431407", accent: "#EA580C", starburst: "#F97316", bgGradient: "linear-gradient(120deg, #fff5f0 0%, #ffedd5 100%)" }
};

export function getThemeColors(theme: string, eventDetails?: any, isDark: boolean = false) {
  const color = eventDetails?.color || '#D9FF00';
  let base = {
    bg: isDark ? "#0A0A0A" : "#F3F0E8",
    text: isDark ? "#FFFFFF" : "#111827",
    accent: color,
    starburst: color
  };

  if (theme === "dynamic") {
    base = {
      bg: color,
      text: eventDetails?.isDark ? "#FFFFFF" : "#111827",
      accent: eventDetails?.isDark ? "#FFFFFF" : "#111827",
      starburst: color
    };
  } else if (theme && THEMES_MAP[theme]) {
    base = { ...THEMES_MAP[theme] };
    if (eventDetails?.color) {
      base.accent = eventDetails.color;
      base.starburst = eventDetails.color;
    }
  }
  return base;
}

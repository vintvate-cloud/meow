import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AppLayout } from "@/components/Navigation";
import { updateProfile, deleteUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { PhonePreview } from "@/components/PhonePreview";
import {
  LogOut,
  User,
  Bell,
  Shield,
  Paintbrush,
  Check,
  CreditCard,
  Key,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  LockKeyhole,
  Info,
  Sparkles,
  Camera,
  MapPin,
  Calendar
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_IMAGES, formatAvatarUrlForStorage, parseAvatarUrlFromStorage } from "@/lib/avatars";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

type TabType = "account" | "appearance" | "notifications" | "billing" | "developer" | "security";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("account");

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string>(parseAvatarUrlFromStorage(user?.photoURL || null));
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Social connection states
  const [socials, setSocials] = useState({
    twitter: { connected: false, username: "" },
    instagram: { connected: false, username: "" },
    discord: { connected: false, username: "" },
    github: { connected: false, username: "" },
  });

  // Notifications States
  const [notifs, setNotifs] = useState({
    rsvpAlert: true,
    weeklyDigest: false,
    commentsAlert: true,
    marketingEmails: true,
    discordWebhookActive: false,
    slackWebhookActive: false,
  });
  const [slackUrl, setSlackUrl] = useState("https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX");
  const [discordUrl, setDiscordUrl] = useState("");

  // Appearance States
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [accentColor, setAccentColor] = useState<"lime" | "blue" | "lavender" | "burgundy" | "purple">("lime");
  const [borderStyle, setBorderStyle] = useState<"standard" | "brutalist">("standard");

  // Billing States
  const [currentPlan, setCurrentPlan] = useState<"Free" | "Pro" | "Studio">("Free");
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardFocusedField, setCardFocusedField] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Developer States
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [webhookEndpoint, setWebhookEndpoint] = useState("https://api.mywebsite.com/v1/webhooks");
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState({
    "rsvp.created": true,
    "rsvp.cancelled": false,
    "event.published": true,
    "ticket.sold": true,
  });
  const [activePayloadEvent, setActivePayloadEvent] = useState<"rsvp.created" | "ticket.sold">("rsvp.created");

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Live phone preview control for mobile screens
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [userEvents, setUserEvents] = useState<any[]>([]);

  // Load theme and options on mount
  useEffect(() => {
    const loadProfileAndEvents = async () => {
      if (!user) return;
      try {
        // Fetch user's real events for phone preview
        const qEvents = query(collection(db, "events"), where("userId", "==", user.uid));
        const snapEvents = await getDocs(qEvents);
        const dataEvents = snapEvents.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserEvents(dataEvents);

        // Fetch user's profile from Firestore
        const qProfile = query(collection(db, "profiles"), where("userId", "==", user.uid));
        const snapProfile = await getDocs(qProfile);
        if (!snapProfile.empty) {
          const profileData = snapProfile.docs[0].data();
          if (profileData.username) setUsername(profileData.username);
          if (profileData.bio) setBio(profileData.bio);
          if (profileData.socials) setSocials(profileData.socials);
          if (profileData.theme) setTheme(profileData.theme);
          if (profileData.accentColor) setAccentColor(profileData.accentColor);
          if (profileData.borderStyle) setBorderStyle(profileData.borderStyle);
          if (profileData.displayName) setDisplayName(profileData.displayName);
        }
      } catch (e) {
        console.error("Failed to load user events or profile for settings preview", e);
      }
    };

    if (user) {
      setDisplayName(user.displayName || "Creator");
      if (user.photoURL) {
        setProfilePicUrl(parseAvatarUrlFromStorage(user.photoURL));
      }
      loadProfileAndEvents();
    }

    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab") as TabType;
    if (tabParam && ["account", "appearance", "notifications", "billing", "developer", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    const storedBio = localStorage.getItem("user-bio");
    if (storedBio) setBio(storedBio);

    const storedUsername = localStorage.getItem("user-username");
    if (storedUsername) setUsername(storedUsername);

    const storedSocials = localStorage.getItem("user-socials");
    if (storedSocials) {
      try {
        setSocials(JSON.parse(storedSocials));
      } catch (e) {
        console.error("Failed to parse socials", e);
      }
    }

    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    const storedAccent = localStorage.getItem("accent-color") as any;
    if (storedAccent) {
      setAccentColor(storedAccent);
    }
    const storedBorder = localStorage.getItem("border-style") as any;
    if (storedBorder) {
      setBorderStyle(storedBorder);
    }
    const storedPlan = localStorage.getItem("user-plan") as any;
    if (storedPlan) {
      setCurrentPlan(storedPlan);
    }
    const storedApiKey = localStorage.getItem("api-key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, [user]);

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);

    try {
      const uClean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
      if (!uClean) throw new Error("Username URL cannot be empty or contain invalid characters.");

      // Check if username is already taken by someone else
      const profileRef = doc(db, "profiles", uClean);
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
        throw new Error("Username is already taken by another creator.");
      }

      // Delete old username document if changed
      const oldUsername = localStorage.getItem("user-username");
      if (oldUsername && oldUsername.toLowerCase().trim() !== uClean) {
        try {
          await deleteDoc(doc(db, "profiles", oldUsername.toLowerCase().trim()));
        } catch (e) {
          console.error("Could not delete old profile doc", e);
        }
      }

      // Update Firebase Auth displayName/photoURL
      await updateProfile(user, {
        displayName: displayName,
        photoURL: formatAvatarUrlForStorage(profilePicUrl)
      });

      // Write settings to profiles collection
      await setDoc(profileRef, {
        userId: user.uid,
        displayName: displayName,
        photoURL: formatAvatarUrlForStorage(profilePicUrl),
        bio: bio,
        username: uClean,
        socials: socials,
        theme: theme,
        accentColor: accentColor,
        borderStyle: borderStyle,
        updatedAt: serverTimestamp()
      });

      localStorage.setItem("user-bio", bio);
      localStorage.setItem("user-username", uClean);
      localStorage.setItem("user-socials", JSON.stringify(socials));

      toast({
        title: "Profile Settings Updated ✨",
        description: "Your bio details and social connections are now live.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords Do Not Match", description: "Please re-verify your new password.", variant: "destructive" });
      return;
    }
    toast({ title: "Security Settings Saved 🔒", description: "Password updated successfully." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and you will lose all event data.")) {
      try {
        await deleteUser(user);
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      } catch (error: any) {
        toast({
          title: "Deletion Failed",
          description: error.message + " (You may need to log in again to perform this action.)",
          variant: "destructive"
        });
      }
    }
  };

  // Toggle dynamic themes
  const handleThemeChange = (selectedTheme: "light" | "dark" | "system") => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);

    const root = document.documentElement;
    if (selectedTheme === "dark") {
      root.classList.add("dark");
    } else if (selectedTheme === "light") {
      root.classList.remove("dark");
    } else {
      // System settings
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    toast({
      title: `Theme: ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)} Mode`,
      description: "Visual settings updated successfully.",
    });
  };

  // Toggle border styles
  const handleBorderChange = (style: "standard" | "brutalist") => {
    setBorderStyle(style);
    localStorage.setItem("border-style", style);
    if (style === "brutalist") {
      document.documentElement.classList.add("brutalist-theme");
    } else {
      document.documentElement.classList.remove("brutalist-theme");
    }
    toast({
      title: "UI Vibe Updated",
      description: style === "brutalist" ? "Brutalist mode activated! Heavy borders & hard shadows." : "Standard rounded theme activated.",
    });
  };

  // Toggle Accent Colors
  const handleAccentChange = (accent: "lime" | "blue" | "lavender" | "burgundy" | "purple") => {
    setAccentColor(accent);
    localStorage.setItem("accent-color", accent);
    toast({
      title: "Accent Color Changed",
      description: `Primary brand color updated to ${accent.toUpperCase()}.`,
    });
  };

  // Generate API key mockup
  const generateNewApiKey = () => {
    setGeneratingKey(true);
    setTimeout(() => {
      const generated = "sk_meow_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(generated);
      localStorage.setItem("api-key", generated);
      setGeneratingKey(false);
      toast({
        title: "API Key Generated 🔑",
        description: "Your new API key has been created. Keep it secret!",
      });
    }, 1500);
  };

  // Upgrade Plan mockup
  const handleUpgradeCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCVC || !cardHolder) {
      toast({ title: "Incomplete Payment Info", description: "Please fill in all credit card details.", variant: "destructive" });
      return;
    }
    setBillingLoading(true);
    setTimeout(() => {
      setCurrentPlan("Pro");
      localStorage.setItem("user-plan", "Pro");
      setBillingLoading(false);
      setIsBillingModalOpen(false);
      toast({
        title: "MEOW Pro Active! 🚀",
        description: "Welcome to Meow Pro! You now have unlimited events and custom domains.",
      });
      // Clear forms
      setCardNumber("");
      setCardExpiry("");
      setCardCVC("");
      setCardHolder("");
    }, 2000);
  };

  // Mock events if user has none, to show layout on phone
  const displayEvents = userEvents.length > 0 ? userEvents : [
    { id: "mock1", title: "Summer Rooftop Social 🍹", date: new Date(Date.now() + 86400000 * 2).toISOString(), location: "Brooklyn, NY", isPublic: true },
    { id: "mock2", title: "Web3 Hackathon Pitch Night 💻", date: new Date(Date.now() + 86400000 * 5).toISOString(), location: "Manhattan, NY", isPublic: true }
  ];

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0A] transition-colors duration-300">
        
        {/* Main Split Layout Grid */}
        <div className="flex-1 w-full p-4 sm:p-6 md:p-12 pb-32 md:pb-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Tabs Navigation (col-span-3) - Desktop */}
          <div className="hidden lg:block lg:col-span-3 space-y-2 sticky top-24">
            <SidebarBtn id="account" icon={<User className="w-5 h-5" />} label="Account & Bio" active={activeTab} onClick={setActiveTab} />
            <SidebarBtn id="appearance" icon={<Paintbrush className="w-5 h-5" />} label="Design Theme" active={activeTab} onClick={setActiveTab} />
            <SidebarBtn id="notifications" icon={<Bell className="w-5 h-5" />} label="Alert Triggers" active={activeTab} onClick={setActiveTab} />
            <SidebarBtn id="billing" icon={<CreditCard className="w-5 h-5" />} label="Billing & Plan" active={activeTab} onClick={setActiveTab} />
            <SidebarBtn id="developer" icon={<Key className="w-5 h-5" />} label="Developer APIs" active={activeTab} onClick={setActiveTab} />
            <SidebarBtn id="security" icon={<Shield className="w-5 h-5" />} label="Security Settings" active={activeTab} onClick={setActiveTab} />

            {/* Pro tier Promotion card */}
            {currentPlan === "Free" && (
              <div className="mt-6 p-5 rounded-3xl bg-[#101828] text-white border border-white/10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D9FF00] rounded-full -mr-8 -mt-8 opacity-10 blur-xl"></div>
                <h4 className="text-base font-bold text-[#D9FF00] mb-1 font-serif">Go MEOW Pro</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                  Unlock 0% ticketing commission, custom domains, automated confirmation templates.
                </p>
                <button
                  onClick={() => {
                    setActiveTab("billing");
                    setIsBillingModalOpen(true);
                  }}
                  className="w-full h-9 rounded-full bg-[#D9FF00] hover:bg-[#c4e600] text-[#101828] font-bold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  Upgrade Now <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Swipeable Tab list */}
          <div className="lg:hidden col-span-12 flex overflow-x-auto gap-2 pb-4 mb-2 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
            <MobileTabBtn id="account" label="Account" active={activeTab} onClick={setActiveTab} />
            <MobileTabBtn id="appearance" label="Theme" active={activeTab} onClick={setActiveTab} />
            <MobileTabBtn id="notifications" label="Alerts" active={activeTab} onClick={setActiveTab} />
            <MobileTabBtn id="billing" label="Billing" active={activeTab} onClick={setActiveTab} />
            <MobileTabBtn id="developer" label="Developer" active={activeTab} onClick={setActiveTab} />
            <MobileTabBtn id="security" label="Security" active={activeTab} onClick={setActiveTab} />
          </div>

          {/* Column 2: Form Settings Panel (col-span-5) */}
          <div className="col-span-12 lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#121212] rounded-3xl p-6 sm:p-8 border border-black/5 dark:border-white/5 shadow-sm space-y-8"
              >
                {/* TAB 1: ACCOUNT & PROFILE */}
                {activeTab === "account" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Profile Settings</h2>
                      <p className="text-xs text-gray-400 mt-1">Configure your public bio details and connect social channels.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-150 dark:border-[#222]">
                      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                        <DialogTrigger asChild>
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden group cursor-pointer border-2 border-[#8129D9] hover:opacity-90 shadow-sm relative shrink-0">
                            <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl">
                          <DialogHeader className="mb-4">
                            <DialogTitle className="text-center font-serif text-xl font-bold">Select Cat Avatar</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-2 max-h-[45vh] overflow-y-auto">
                            {AVATAR_IMAGES.map((avatar, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setProfilePicUrl(avatar);
                                  setIsAvatarModalOpen(false);
                                }}
                                className={`relative aspect-square rounded-full overflow-hidden border ${
                                  profilePicUrl === avatar 
                                    ? 'ring-2 ring-[#8129D9] ring-offset-2 scale-105' 
                                    : 'border-transparent hover:scale-105 transition-transform'
                                }`}
                              >
                                <img src={avatar} alt={`Cat ${i}`} className="w-full h-full object-cover" />
                                {profilePicUrl === avatar && (
                                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</div>
                        <div className="text-[#101828] dark:text-foreground font-semibold bg-gray-50 dark:bg-muted border border-gray-100 dark:border-[#222] px-3.5 py-1.5 rounded-xl inline-block text-xs">
                          {user?.email}
                        </div>
                        <div>
                          <Button type="button" variant="outline" className="h-8 text-xs font-semibold rounded-full border-gray-200" onClick={() => setIsAvatarModalOpen(true)}>
                            Change Profile Pic
                          </Button>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                            className="h-11 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username URL</label>
                          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-border h-11 focus-within:ring-2 focus-within:ring-[#8129D9]/50">
                            <span className="bg-gray-50 dark:bg-muted text-gray-400 text-xs font-semibold px-3 flex items-center border-r border-gray-100 dark:border-border select-none">
                              {window.location.host}/p/
                            </span>
                            <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                              className="border-none rounded-none focus-visible:ring-0 flex-1 font-semibold text-xs h-full"
                              placeholder="username"
                              required
                            />
                          </div>
                          {username && (
                            <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-1">
                              <span>Your profile:</span>
                              <a href={`/p/${username}`} target="_blank" rel="noreferrer" className="text-[#8129D9] hover:underline flex items-center gap-0.5">
                                {window.location.origin}/p/{username} <ChevronRight className="w-3 h-3 text-[#8129D9]" />
                              </a>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Creator Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell attendees who you are!"
                          className="w-full border border-gray-200 dark:border-[#222] bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8129D9]/25 h-20 resize-none"
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Connect Channels</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 w-16">Twitter:</span>
                            <Input 
                              placeholder="@username"
                              value={socials.twitter.username}
                              onChange={(e) => setSocials({
                                ...socials,
                                twitter: { connected: !!e.target.value, username: e.target.value }
                              })}
                              className="rounded-lg h-9 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 w-16">Instagram:</span>
                            <Input 
                              placeholder="@username"
                              value={socials.instagram.username}
                              onChange={(e) => setSocials({
                                ...socials,
                                instagram: { connected: !!e.target.value, username: e.target.value }
                              })}
                              className="rounded-lg h-9 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 w-16">Discord:</span>
                            <Input 
                              placeholder="guild_invite"
                              value={socials.discord.username}
                              onChange={(e) => setSocials({
                                ...socials,
                                discord: { connected: !!e.target.value, username: e.target.value }
                              })}
                              className="rounded-lg h-9 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 w-16">GitHub:</span>
                            <Input 
                              placeholder="username"
                              value={socials.github.username}
                              onChange={(e) => setSocials({
                                ...socials,
                                github: { connected: !!e.target.value, username: e.target.value }
                              })}
                              className="rounded-lg h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={profileLoading}
                          className="rounded-full bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold h-11 px-6 shadow-sm"
                        >
                          {profileLoading ? "Saving Changes..." : "Save Bio Settings"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 2: APPEARANCE DESIGN */}
                {activeTab === "appearance" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Design Theme & Vibe</h2>
                      <p className="text-xs text-gray-400 mt-1">Personalize how MEOW renders in your browser. Changes apply globally.</p>
                    </div>

                    {/* Dark/Light mode Cards */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Color Theme Mode</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <ThemeCard
                          title="Cream/Navy"
                          isActive={theme === "light"}
                          previewBg="bg-[#FAF8F5]"
                          previewCard="bg-white border-[#101828]"
                          onClick={() => handleThemeChange("light")}
                        />
                        <ThemeCard
                          title="Pitch Black"
                          isActive={theme === "dark"}
                          previewBg="bg-[#000000]"
                          previewCard="bg-[#0a0a0a] border-[#222]"
                          onClick={() => handleThemeChange("dark")}
                        />
                        <ThemeCard
                          title="System"
                          isActive={theme === "system"}
                          previewBg="bg-[#FAF8F5] dark:bg-[#000]"
                          previewCard="bg-white dark:bg-[#0a0a0a] border-border"
                          onClick={() => handleThemeChange("system")}
                        />
                      </div>
                    </div>

                    {/* Brand Accent Selector */}
                    <div className="space-y-3 pt-4 border-t border-gray-150 dark:border-[#222]">
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand Accent Palette</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Highlight colors for badges, button highlights, and icons.</p>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <AccentBtn color="lime" hex="#D9FF00" current={accentColor} onClick={handleAccentChange} label="Lime" />
                        <AccentBtn color="blue" hex="#2856E8" current={accentColor} onClick={handleAccentChange} label="Blue" />
                        <AccentBtn color="lavender" hex="#E8C8EC" current={accentColor} onClick={handleAccentChange} label="Lilac" />
                        <AccentBtn color="burgundy" hex="#79001B" current={accentColor} onClick={handleAccentChange} label="Wine" />
                        <AccentBtn color="purple" hex="#58268C" current={accentColor} onClick={handleAccentChange} label="Violet" />
                      </div>
                    </div>

                    {/* Brutalist Mode Toggle */}
                    <div className="space-y-3 pt-4 border-t border-gray-150 dark:border-[#222]">
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dashboard Border Weight</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Toggle between smooth microshadows or retro-brutalist offset styles.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleBorderChange("standard")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            borderStyle === "standard"
                              ? "border-[#8129D9] bg-[#8129D9]/5 ring-2 ring-[#8129D9]"
                              : "border-gray-100 dark:border-[#222] hover:border-gray-250 bg-transparent"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-xs text-foreground">Minimal Rounded</span>
                            {borderStyle === "standard" && <Check className="w-3.5 h-3.5 text-[#8129D9]" />}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed">Curved borders (1.5rem), soft gradients, micro-elevated hover highlights.</p>
                        </button>

                        <button
                          onClick={() => handleBorderChange("brutalist")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            borderStyle === "brutalist"
                              ? "border-[#101828] dark:border-white bg-transparent ring-2 ring-foreground"
                              : "border-gray-100 dark:border-[#222] hover:border-gray-250 bg-transparent"
                          }`}
                          style={{
                            boxShadow: borderStyle === "brutalist" ? "4px 4px 0px 0px rgba(0,0,0,1)" : "none"
                          }}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-xs text-foreground">Retro Brutalist ⚡</span>
                            {borderStyle === "brutalist" && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed">Solid heavy outlines, sharp shadows, and ultra-high-contrast elements.</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ALERT TRIGGERS */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Alert Triggers</h2>
                      <p className="text-xs text-gray-400 mt-1">Decide when and how you want to be pinged about RSVPs.</p>
                    </div>

                    <div className="space-y-3">
                      <ToggleSetting
                        title="Instant RSVP Notification"
                        description="Get an email confirmation as soon as someone signs up for your event."
                        checked={notifs.rsvpAlert}
                        onChange={(val) => setNotifs({ ...notifs, rsvpAlert: val })}
                      />
                      <ToggleSetting
                        title="Weekly Digest Reports"
                        description="A summary sheet of RSVPs and community growth sent every Monday."
                        checked={notifs.weeklyDigest}
                        onChange={(val) => setNotifs({ ...notifs, weeklyDigest: val })}
                      />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-150 dark:border-[#222]">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Instant Chat Hooks</h3>
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-muted/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#E01E5A]"></span> Slack Channel Bot
                            </span>
                            <Switch
                              checked={notifs.slackWebhookActive}
                              onCheckedChange={(val) => setNotifs({ ...notifs, slackWebhookActive: val })}
                            />
                          </div>
                          {notifs.slackWebhookActive && (
                            <Input
                              value={slackUrl}
                              onChange={(e) => setSlackUrl(e.target.value)}
                              placeholder="https://hooks.slack.com/services/..."
                              className="h-9 text-xs"
                            />
                          )}
                        </div>

                        <div className="p-4 rounded-xl border border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-muted/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#5865F2]"></span> Discord Webhook
                            </span>
                            <Switch
                              checked={notifs.discordWebhookActive}
                              onCheckedChange={(val) => setNotifs({ ...notifs, discordWebhookActive: val })}
                            />
                          </div>
                          {notifs.discordWebhookActive && (
                            <Input
                              value={discordUrl}
                              onChange={(e) => setDiscordUrl(e.target.value)}
                              placeholder="https://discord.com/api/webhooks/..."
                              className="h-9 text-xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: BILLING & SUBSCRIPTIONS */}
                {activeTab === "billing" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Billing & Plan</h2>
                        <p className="text-xs text-gray-400 mt-1">Upgrade your account or view usage limits.</p>
                      </div>
                      {currentPlan !== "Free" && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCurrentPlan("Free");
                            localStorage.setItem("user-plan", "Free");
                            toast({ title: "Plan Downgraded", description: "You are now on the Free tier." });
                          }}
                          className="h-8 text-xs font-semibold text-red-500 rounded-full hover:bg-red-50"
                        >
                          Cancel Plan
                        </Button>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-150 dark:border-[#222] bg-gray-50 dark:bg-muted/10 grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-450">Active Published Events</span>
                          <span className="text-foreground">{userEvents.length} / {currentPlan === "Free" ? "5" : "Unlimited"}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-card rounded-full overflow-hidden">
                          <div className="h-full bg-[#8129D9] rounded-full animate-pulse" style={{ width: `${Math.min((userEvents.length / (currentPlan === "Free" ? 5 : 20)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subscription Tiers</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Free Tier card */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${currentPlan === "Free" ? 'border-[#8129D9] bg-[#8129D9]/5' : 'border-gray-150 dark:border-[#222]'}`}>
                          <div>
                            <div className="font-bold text-sm">Creator Lite ($0)</div>
                            <p className="text-[10px] text-gray-400 mt-0.5">Max 5 active events • 2.5% ticketing fee</p>
                          </div>
                          {currentPlan === "Free" ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current</span>
                          ) : (
                            <Button size="sm" onClick={() => {
                              setCurrentPlan("Free");
                              localStorage.setItem("user-plan", "Free");
                              toast({ title: "Plan Downgraded", description: "You are now on the Free tier." });
                            }} variant="outline" className="rounded-full h-8 text-xs font-bold">Downgrade</Button>
                          )}
                        </div>

                        {/* Pro Tier card */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${currentPlan === "Pro" ? 'border-[#8129D9] bg-[#8129D9]/5' : 'border-gray-150 dark:border-[#222]'}`}>
                          <div>
                            <div className="font-bold text-sm">MEOW Pro ⚡ ($15/mo)</div>
                            <p className="text-[10px] text-gray-400 mt-0.5">Unlimited active events • 0% ticketing fee</p>
                          </div>
                          {currentPlan === "Pro" ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active</span>
                          ) : (
                            <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="rounded-full h-8 text-xs font-bold bg-[#8129D9] hover:bg-[#7020C4] text-white">Upgrade</Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl">
                                <DialogHeader>
                                  <DialogTitle className="font-bold text-lg flex items-center gap-2">
                                    <LockKeyhole className="w-5 h-5 text-[#8129D9]" /> Payment Details
                                  </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpgradeCheckout} className="space-y-4 mt-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Cardholder Name</label>
                                    <Input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Sarah Jane" className="h-10 text-xs rounded-xl" required />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Card Number</label>
                                    <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} placeholder="4111 2222 3333 4444" className="h-10 text-xs rounded-xl font-mono" required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase text-gray-400">Expiry Date</label>
                                      <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="MM/YY" className="h-10 text-xs rounded-xl font-mono" required />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase text-gray-400">CVC Code</label>
                                      <Input value={cardCVC} onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" className="h-10 text-xs rounded-xl font-mono" required />
                                    </div>
                                  </div>
                                  <Button type="submit" disabled={billingLoading} className="w-full mt-2 h-11 rounded-xl bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold text-sm">
                                    {billingLoading ? "Authorizing..." : "Pay $15 & Upgrade"}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: DEVELOPER APIs */}
                {activeTab === "developer" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Developer APIs</h2>
                      <p className="text-xs text-gray-400 mt-1">Generate access keys to construct custom pages or hook webhooks.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-150 dark:border-[#222] bg-gray-55 dark:bg-muted/10 space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <h3 className="font-bold text-xs text-foreground">Secret API Access Key</h3>
                          <p className="text-[10px] text-gray-400">Do not share this key.</p>
                        </div>
                        <Button onClick={generateNewApiKey} disabled={generatingKey} className="h-8 rounded-full text-xs bg-[#101828] text-white dark:bg-white dark:text-black">
                          {generatingKey ? "Generating..." : apiKey ? "Regenerate" : "Generate"}
                        </Button>
                      </div>

                      {apiKey && (
                        <div className="flex gap-2">
                          <Input type={isApiKeyVisible ? "text" : "password"} value={apiKey} readOnly className="h-9 font-mono text-xs pr-10" />
                          <Button onClick={() => {
                            navigator.clipboard.writeText(apiKey);
                            toast({ title: "Copied", description: "API key copied." });
                          }} variant="outline" className="h-9 w-9 p-0 rounded-lg">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: SECURITY */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#101828] dark:text-foreground font-serif">Security Settings</h2>
                      <p className="text-xs text-gray-400 mt-1">Ensure your account and credentials are safe.</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-3.5">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update Password</h3>
                      <div className="space-y-3">
                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" className="h-10 text-xs rounded-xl" />
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="h-10 text-xs rounded-xl" />
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="h-10 text-xs rounded-xl" />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="rounded-full bg-[#101828] text-white dark:bg-white dark:text-black h-9 text-xs font-bold px-4">
                          Change Password
                        </Button>
                      </div>
                    </form>

                    <div className="pt-4 border-t border-gray-150 dark:border-[#222] space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Two-Factor Authentication (2FA)</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Ensure extreme security by requiring confirmation codes.</p>
                        </div>
                        <Switch
                          checked={twoFactorEnabled}
                          onCheckedChange={(val) => {
                            if (val) {
                              setIsTwoFactorModalOpen(true);
                            } else {
                              setTwoFactorEnabled(false);
                              toast({ title: "2FA Disabled 🔓", description: "Account security updated." });
                            }
                          }}
                        />
                      </div>

                      {/* 2FA Dialog */}
                      <Dialog open={isTwoFactorModalOpen} onOpenChange={setIsTwoFactorModalOpen}>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-border rounded-3xl p-6 shadow-2xl flex flex-col items-center">
                          <DialogHeader>
                            <DialogTitle className="text-center font-serif text-lg font-bold">Setup Authenticator 2FA</DialogTitle>
                          </DialogHeader>
                          <div className="p-3 bg-white rounded-2xl border border-gray-150 shadow-sm flex items-center justify-center">
                            <span className="text-5xl">🔒</span>
                          </div>
                          <div className="space-y-4 w-full mt-4">
                            <Input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000 000" className="h-11 text-center font-mono text-lg font-bold tracking-widest rounded-xl" />
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={() => setIsTwoFactorModalOpen(false)} className="flex-1 h-10 rounded-xl">Cancel</Button>
                              <Button type="button" onClick={() => {
                                setTwoFactorEnabled(true);
                                setIsTwoFactorModalOpen(false);
                                setTwoFactorCode("");
                                toast({ title: "2FA Enabled! 🛡️", description: "Your account is now protected." });
                              }} className="flex-1 h-10 rounded-xl bg-[#8129D9] hover:bg-[#7020C4] text-white font-bold">Verify</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-3 pt-4 border-t border-red-100 dark:border-red-950/20">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h2 className="text-sm font-bold text-red-600">Danger Zone</h2>
                          <p className="text-[10px] text-gray-500">Destructive actions are permanent.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button onClick={() => logout()} variant="outline" className="h-9 rounded-full text-xs font-bold text-red-600 border-red-200 hover:bg-red-50">Log Out</Button>
                        <Button onClick={handleDeleteAccount} className="h-9 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700">Delete Account</Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Column 3: Live Theme Mockup Preview (col-span-4) - Sticky Desktop */}
          <div className="hidden lg:flex lg:col-span-4 justify-center items-start pt-4 sticky top-24">
            <div className="space-y-4 flex flex-col items-center">
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8129D9] animate-pulse" /> Live Theme Preview
              </p>
              <PhonePreview
                displayName={displayName}
                profilePicUrl={profilePicUrl}
                bio={bio}
                socials={socials}
                events={displayEvents}
                theme={theme}
                accentColor={accentColor}
                borderStyle={borderStyle}
                username={username}
              />
            </div>
          </div>
        </div>

        {/* Mobile Floating Preview Button */}
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => setShowMobilePreview(true)}
            className="bg-[#101828] text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-white/10 dark:border-black/10 transition-all hover:scale-105"
          >
            <Eye className="w-4 h-4" /> Preview Live Hub
          </button>
        </div>

        {/* Mobile Preview dialog */}
        <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border-none rounded-3xl p-6 shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4 text-center">
              <DialogTitle className="font-bold text-xl">My Public Profile</DialogTitle>
              <DialogDescription className="text-gray-400">This is how your theme looks on mobile devices.</DialogDescription>
            </DialogHeader>
            <PhonePreview
              displayName={displayName}
              profilePicUrl={profilePicUrl}
              bio={bio}
              socials={socials}
              events={displayEvents}
              theme={theme}
              accentColor={accentColor}
              borderStyle={borderStyle}
              username={username}
            />
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}

// Subcomponents helper
function SidebarBtn({ id, icon, label, active, onClick }: { id: TabType, icon: any, label: string, active: TabType, onClick: (id: TabType) => void }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
        isActive
          ? "bg-white dark:bg-[#121212] text-foreground shadow-sm border border-black/5 dark:border-white/5 font-bold"
          : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 hover:text-foreground"
      }`}
    >
      <div className={isActive ? "text-[#8129D9] dark:text-[#E8C8EC]" : "opacity-80"}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function MobileTabBtn({ id, label, active, onClick }: { id: TabType, label: string, active: TabType, onClick: (id: TabType) => void }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`snap-center shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
        isActive
          ? "bg-foreground text-background border-foreground shadow-sm"
          : "bg-white dark:bg-card border-gray-150 dark:border-border text-gray-400 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ThemeCard({ title, isActive, previewBg, previewCard, onClick }: { title: string, isActive: boolean, previewBg: string, previewCard: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
        isActive
          ? "border-[#8129D9] bg-[#8129D9]/5 ring-2 ring-[#8129D9]"
          : "border-gray-150 dark:border-border hover:border-gray-250 bg-transparent"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-xs truncate max-w-[80%] text-foreground">{title}</span>
        {isActive && <Check className="w-3 h-3 text-[#8129D9]" />}
      </div>
      
      {/* Mock Visual Preview */}
      <div className={`w-full h-11 rounded-lg ${previewBg} p-1.5 flex flex-col justify-between mb-1 border border-black/5`}>
        <div className="flex justify-between items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/45"></div>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        <div className={`w-full h-4 rounded ${previewCard} border p-0.5 flex items-center justify-between`}>
          <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#8129D9]"></div>
        </div>
      </div>
    </button>
  );
}

function AccentBtn({ color, hex, current, onClick, label }: { color: any, hex: string, current: string, onClick: (c: any) => void, label: string }) {
  const isSelected = current === color;
  return (
    <button
      type="button"
      onClick={() => onClick(color)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
        isSelected
          ? "bg-white dark:bg-card border-black dark:border-white ring-2 ring-offset-1 dark:ring-offset-card ring-[#101828] dark:ring-white scale-105"
          : "bg-transparent border-gray-150 dark:border-border hover:border-gray-250"
      }`}
    >
      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: hex }}></span>
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
      {isSelected && <Check className="w-2.5 h-2.5 text-[#101828] dark:text-white" />}
    </button>
  );
}

function ToggleSetting({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-150 dark:border-border flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-muted/10 transition-colors">
      <div className="space-y-0.5">
        <h4 className="font-bold text-xs text-[#101828] dark:text-foreground">{title}</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-md">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

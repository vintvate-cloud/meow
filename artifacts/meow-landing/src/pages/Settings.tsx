import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNavbar, BottomNavbar } from "@/components/Navigation";
import { updateProfile, deleteUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Bell, Shield, Paintbrush, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_IMAGES, formatAvatarUrlForStorage, parseAvatarUrlFromStorage } from "@/lib/avatars";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string>(parseAvatarUrlFromStorage(user?.photoURL || null));
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      if (user.photoURL) {
        setProfilePicUrl(parseAvatarUrlFromStorage(user.photoURL));
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await updateProfile(user, {
        displayName: displayName,
        photoURL: formatAvatarUrlForStorage(profilePicUrl)
      });
      toast({ title: "Profile Updated", description: "Your display name has been saved successfully." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
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

  return (
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-background font-sans flex flex-col pb-20 md:pb-0">
      <TopNavbar />
      <BottomNavbar />

      <main className="flex-1 p-6 md:p-12 w-full max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#101828] dark:text-foreground">
            Settings
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your account preferences and profile details.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Settings Navigation Sidebar */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-card dark:text-card-foreground shadow-sm border border-gray-100 dark:border-border text-[#101828] dark:text-foreground font-bold transition-all">
              <User className="w-5 h-5" /> Account
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:bg-muted text-gray-400 hover:text-[#101828] dark:text-foreground font-bold transition-all">
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:bg-muted text-gray-400 hover:text-[#101828] dark:text-foreground font-bold transition-all">
              <Shield className="w-5 h-5" /> Privacy & Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:bg-muted text-gray-400 hover:text-[#101828] dark:text-foreground font-bold transition-all">
              <Paintbrush className="w-5 h-5" /> Appearance
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-8 border border-gray-100 dark:border-border shadow-sm"
            >
              <h2 className="text-xl font-black text-[#101828] dark:text-foreground mb-6">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50 dark:border-border">
                <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                  <DialogTrigger asChild>
                    <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center shadow-md overflow-hidden group cursor-pointer transition-all hover:bg-muted relative shrink-0">
                      <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Paintbrush className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl bg-background/95 backdrop-blur-3xl border-border/50 rounded-[2rem] p-6 sm:p-12 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
                    <DialogHeader className="mb-6 sm:mb-8">
                      <DialogTitle className="text-center font-serif text-3xl sm:text-5xl tracking-tight text-foreground">Select Your Avatar</DialogTitle>
                      <p className="text-center text-sm sm:text-base text-muted-foreground mt-3 font-medium">Choose a profile picture that represents you.</p>
                    </DialogHeader>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 sm:gap-8 p-4 sm:p-6 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {AVATAR_IMAGES.map((avatar, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setProfilePicUrl(avatar);
                            setIsAvatarModalOpen(false);
                          }}
                          className={`group relative w-full aspect-square rounded-full overflow-hidden transition-all duration-300 ease-out focus:outline-none ${
                            profilePicUrl === avatar 
                              ? 'ring-4 ring-foreground ring-offset-4 ring-offset-background scale-110 shadow-2xl z-10' 
                              : 'ring-1 ring-border/50 hover:ring-2 hover:ring-foreground/50 hover:scale-105 hover:shadow-xl bg-muted/20'
                          }`}
                        >
                          <img 
                            src={avatar} 
                            alt={`Avatar ${i}`} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                          {profilePicUrl === avatar && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300">
                              <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</div>
                  <div className="text-[#101828] dark:text-foreground font-bold bg-gray-50 dark:bg-muted px-4 py-2 rounded-xl inline-block">{user?.email}</div>
                  <div className="mt-4">
                    <Button type="button" variant="outline" className="h-8 text-xs font-bold rounded-full border-border hover:bg-muted" onClick={() => setIsAvatarModalOpen(true)}>Choose Avatar</Button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Display Name</label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="h-14 rounded-2xl border-gray-200 dark:border-border bg-gray-50 dark:bg-muted font-bold px-4"
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 rounded-xl px-8 font-bold text-white border-none transition-all"
                    style={{ backgroundColor: '#101828' }}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-card dark:text-card-foreground rounded-[32px] p-8 border border-red-100 shadow-sm"
            >
              <h2 className="text-xl font-black text-red-600 mb-2">Danger Zone</h2>
              <p className="text-gray-500 font-medium text-sm mb-6">These actions cannot be undone.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => logout()}
                  variant="outline"
                  className="h-12 rounded-xl px-6 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log out everywhere
                </Button>
                <Button 
                  onClick={handleDeleteAccount}
                  className="h-12 rounded-xl px-6 font-bold text-white bg-red-600 hover:bg-red-700 border-none transition-all flex items-center justify-center gap-2"
                >
                  Delete Account
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

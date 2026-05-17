import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNavbar, BottomNavbar } from "@/components/Navigation";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Bell, Shield, Paintbrush } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await updateProfile(user, {
        displayName: displayName
      });
      toast({ title: "Profile Updated", description: "Your display name has been saved successfully." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0E8] font-sans flex flex-col pb-20 md:pb-0">
      <TopNavbar />
      <BottomNavbar />

      <main className="flex-1 p-6 md:p-12 w-full max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#101828]">
            Settings
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your account preferences and profile details.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Settings Navigation Sidebar */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-100 text-[#101828] font-bold transition-all">
              <User className="w-5 h-5" /> Account
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-[#101828] font-bold transition-all">
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-[#101828] font-bold transition-all">
              <Shield className="w-5 h-5" /> Privacy & Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-[#101828] font-bold transition-all">
              <Paintbrush className="w-5 h-5" /> Appearance
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-black text-[#101828] mb-6">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#D9FF3F] to-[#2457FF] flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-2xl font-black text-[#101828]">{displayName?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</div>
                  <div className="text-[#101828] font-bold bg-gray-50 px-4 py-2 rounded-xl inline-block">{user?.email}</div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Display Name</label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="h-14 rounded-2xl border-gray-200 bg-gray-50 font-bold px-4"
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
              className="bg-white rounded-[32px] p-8 border border-red-100 shadow-sm"
            >
              <h2 className="text-xl font-black text-red-600 mb-2">Danger Zone</h2>
              <p className="text-gray-500 font-medium text-sm mb-6">These actions cannot be undone.</p>
              
              <Button 
                onClick={() => logout()}
                variant="outline"
                className="h-12 rounded-xl px-6 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log out everywhere
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

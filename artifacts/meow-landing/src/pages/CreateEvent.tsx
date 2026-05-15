import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Calendar, MapPin, Type, Image as ImageIcon } from "lucide-react";

const COLORS = ["#D9FF00", "#E8C8EC", "#2856E8", "#00B7FF", "#79001B", "#58268C"];

export default function CreateEvent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    color: COLORS[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "events"), {
        ...formData,
        userId: user.uid,
        userName: user.displayName,
        createdAt: serverTimestamp(),
        rsvpCount: 0,
      });

      toast({
        title: "Event created!",
        description: "Your event page is live.",
      });
      setLocation(`/e/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0E8] p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 font-bold text-gray-500 hover:text-navy mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        <header className="mb-12">
          <h1 className="text-5xl font-black tracking-tight" style={{ color: '#111827' }}>Create an Event</h1>
          <p className="text-xl font-medium text-gray-500 mt-2">Fill in the details to launch your event page.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vibe Selection */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Choose a vibe
            </h2>
            <div className="flex flex-wrap gap-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-14 h-14 rounded-2xl transition-all ${formData.color === c ? 'scale-110 ring-4 ring-navy ring-offset-2' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="space-y-2">
              <label className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Type className="w-4 h-4" /> Event Title
              </label>
              <Input
                placeholder="Design Drink & Draw"
                className="h-14 rounded-2xl text-xl font-bold border-2 focus-visible:ring-[#D9FF00]"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date & Time
                </label>
                <Input
                  type="datetime-local"
                  className="h-14 rounded-2xl font-bold border-2"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </label>
                <Input
                  placeholder="Brooklyn, NY"
                  className="h-14 rounded-2xl font-bold border-2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-black text-sm uppercase tracking-widest text-gray-400">Description</label>
              <Textarea
                placeholder="What's the plan? Give your guests some details..."
                className="min-h-[150px] rounded-2xl font-medium border-2 p-4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-20 rounded-[32px] text-2xl font-black shadow-2xl transition-transform hover:scale-[1.02] border-none"
            style={{ backgroundColor: '#111827', color: '#D9FF00' }}
          >
            {loading ? "Launching..." : "Launch Event Page"}
          </Button>
        </form>
      </div>
    </div>
  );
}

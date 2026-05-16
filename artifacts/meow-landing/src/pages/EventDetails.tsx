import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Share2, CheckCircle2, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";


export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpId, setRsvpId] = useState("");
  const [email, setEmail] = useState("");
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast({ title: "Event not found", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, toast]);

  useEffect(() => {
    // Initialize custom responses state when event loads
    if (event?.customFields) {
      const initial: Record<string, string> = {};
      event.customFields.forEach((field: any) => {
        initial[field.label] = "";
      });
      setCustomResponses(initial);
    }
  }, [event]);


  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !email) return;
    setRsvpLoading(true);

    try {
      // 1. Add to RSVPs collection
      const rsvpDoc = await addDoc(collection(db, "events", id, "rsvps"), {
        email,
        customResponses,
        createdAt: serverTimestamp(),
        checkedIn: false,
        confirmationSent: false
      });

      setRsvpId(rsvpDoc.id);


      // 2. Increment count on event doc
      await updateDoc(doc(db, "events", id), {
        rsvpCount: increment(1)
      });

      setRsvpDone(true);
      toast({ title: "You're on the list!", description: "See you there." });
    } catch (error: any) {
      toast({ title: "RSVP failed", description: error.message, variant: "destructive" });
    } finally {
      setRsvpLoading(false);
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <div className="min-h-screen bg-[#F3F0E8] font-sans">
      {/* Dynamic Header based on event color */}
      <div className="h-[40vh] w-full relative overflow-hidden" style={{ backgroundColor: event.color }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {/* Abstract pattern */}
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-8 border-white"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-[80px] rotate-45 border-8 border-white"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col justify-end">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-4xl"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-sm leading-[0.9]">
              {event.title}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex flex-wrap gap-8 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6" style={{ color: event.color }} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Date & Time</div>
                <div className="font-bold text-lg">{new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <MapPin className="w-6 h-6" style={{ color: event.color }} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Location</div>
                <div className="font-bold text-lg">{event.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" style={{ color: event.color }} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">RSVPs</div>
                <div className="font-bold text-lg">{event.rsvpCount || 0} Attending</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-3xl font-black">About the Event</h3>
            <p className="text-xl font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
              {event.description || "No description provided."}
            </p>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div>
                <div className="text-sm font-bold opacity-50">HOSTED BY</div>
                <div className="font-black text-xl">{event.userName || "A Community Member"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: RSVP Card */}
        <div className="relative">
          <div className="sticky top-32">
            <AnimatePresence mode="wait">
              {!rsvpDone ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 space-y-6"
                >
                  <h3 className="text-2xl font-black">Join the list</h3>
                  <p className="text-gray-500 font-medium">RSVP now to get location details and event updates.</p>

                  <form onSubmit={handleRSVP} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Email Address</label>
                      <Input
                        placeholder="Enter your email"
                        className="h-14 rounded-2xl border-2 font-bold"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {event.customFields?.map((field: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">{field.label}</label>
                        <Input
                          placeholder={field.placeholder}
                          className="h-14 rounded-2xl border-2 font-bold"
                          value={customResponses[field.label] || ""}
                          onChange={(e) => setCustomResponses({ ...customResponses, [field.label]: e.target.value })}
                          required={field.required}
                        />
                      </div>
                    ))}

                    <Button
                      disabled={rsvpLoading}
                      className="w-full h-14 rounded-2xl font-black text-lg shadow-xl border-none pt-1"
                      style={{ backgroundColor: '#111827', color: event.color }}
                    >
                      {rsvpLoading ? "Joining..." : "RSVP Now"}
                    </Button>
                  </form>


                  <div className="pt-4 flex justify-center">
                    <button className="flex items-center gap-2 text-sm font-black opacity-40 hover:opacity-100 transition-opacity">
                      <Share2 className="w-4 h-4" /> Share with friends
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-6 border-4 border-[#D9FF00]"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-[#D9FF00] rounded-full flex items-center justify-center text-[#111827]">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-navy leading-tight">You're on the list!</h3>

                  <div className="bg-[#F3F0E8] p-8 rounded-3xl space-y-4">
                    <p className="text-navy font-bold opacity-70 text-lg">
                      Your request is <span className="text-[#111827]">pending approval</span> from the host.
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      You'll receive an email with your unique QR code once the host confirms your attendance.
                    </p>
                  </div>

                  <Button
                    onClick={() => setRsvpDone(false)}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2 border-navy text-navy font-bold bg-transparent"
                  >
                    Got it
                  </Button>
                </motion.div>


              )}
            </AnimatePresence>

            <Link href="/">
              <p className="text-center mt-8 text-sm font-black opacity-30 hover:opacity-100 cursor-pointer">
                Powered by MEOW
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

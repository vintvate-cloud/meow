import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Ticket() {
  const { eventId, rsvpId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!eventId || !rsvpId) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        const rsvpDoc = await getDoc(doc(db, "events", eventId, "rsvps", rsvpId));

        if (eventDoc.exists() && rsvpDoc.exists()) {
          const rsvpData = rsvpDoc.data();
          if (rsvpData.confirmationSent) {
            setData({
              event: eventDoc.data(),
              rsvp: rsvpData,
              eventId,
              rsvpId
            });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [eventId, rsvpId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h1 className="text-4xl font-black">Ticket Pending</h1>
      <p className="text-gray-500 font-medium max-w-md">This ticket has not been approved by the host yet, or the link is invalid.</p>
      <Link href="/">
        <Button className="rounded-full font-bold">Back to Home</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F0E8] dark:bg-background p-6 md:p-12 flex flex-col items-center justify-center font-sans">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white dark:bg-card dark:text-card-foreground rounded-[48px] shadow-2xl overflow-hidden border-8 border-white"
      >
        {/* Header Color Strip */}
        <div className="h-32 w-full relative" style={{ backgroundColor: data.event.color }}>
          <div className="absolute -bottom-10 left-10 w-20 h-20 rounded-3xl bg-white dark:bg-card dark:text-card-foreground flex items-center justify-center shadow-lg">
            <img src="/meowlogo2.png" alt="MEOW" className="h-12 w-auto" />
          </div>
        </div>

        <div className="p-10 pt-16 space-y-8">
          <div>
            <h1 className="text-4xl font-black leading-tight">{data.event.title}</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Official Entry Ticket</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 opacity-30" />
              <div className="font-bold text-sm">{new Date(data.event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 opacity-30" />
              <div className="font-bold text-sm">{data.event.location}</div>
            </div>
          </div>

          <div className="bg-[#F3F0E8] dark:bg-background p-8 rounded-[40px] flex flex-col items-center space-y-6">
            <div className="bg-white dark:bg-card dark:text-card-foreground p-4 rounded-3xl shadow-sm">
              <QRCodeSVG
                value={JSON.stringify({ eventId: data.eventId, rsvpId: data.rsvpId })}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <div className="font-black text-xl">{data.rsvp.email}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Verified Attendee
              </div>
            </div>
          </div>

          <Button className="w-full h-16 rounded-[32px] font-black text-lg shadow-xl" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
            <Download className="w-5 h-5 mr-2" /> Save to Phone
          </Button>
        </div>

        {/* Ticket Notch Effect */}
        <div className="relative h-10 bg-white dark:bg-card dark:text-card-foreground border-t-4 border-dashed border-gray-100 dark:border-border">
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#F3F0E8] dark:bg-background"></div>
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#F3F0E8] dark:bg-background"></div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-muted text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            Meet • Engage • Organize • Welcome
          </p>
        </div>
      </motion.div>

      <p className="mt-8 text-sm font-bold opacity-30">Please have this QR ready at the entrance.</p>
    </div>
  );
}

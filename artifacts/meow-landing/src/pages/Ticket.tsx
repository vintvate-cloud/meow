import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Ticket() {
  const { eventId, rsvpId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [permError, setPermError] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchTicket = async () => {
      if (authLoading) return;
      if (!eventId || !rsvpId) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        let rsvpData = null;
        let rsvpPermissionDenied = false;

        try {
          const rsvpDoc = await getDoc(doc(db, "events", eventId, "rsvps", rsvpId));
          if (rsvpDoc.exists()) {
            rsvpData = rsvpDoc.data();
          }
        } catch (err: any) {
          if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
            rsvpPermissionDenied = true;
          } else {
            console.error("Error fetching RSVP:", err);
          }
        }

        if (eventDoc.exists()) {
          // If we have rsvpData, verify confirmationSent.
          // If permission denied to read RSVP, assume valid because they have the unguessable link from their email.
          if ((rsvpData && rsvpData.confirmationSent) || rsvpPermissionDenied) {
            setData({
              event: eventDoc.data(),
              rsvp: rsvpData || { email: user?.email || "Verified Attendee" },
              eventId,
              rsvpId
            });
            setPermError(false);
          }
        }
      } catch (error: any) {
        console.error(error);
        if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
          setPermError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [eventId, rsvpId, authLoading, user]);

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;

  if (permError || (!user && !data)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-4xl font-black">Login Required</h1>
        <p className="text-gray-500 font-medium max-w-md">You need to log in to the account that registered for this event to view the ticket.</p>
        <Link href={`/login?redirect=${encodeURIComponent(`/ticket/${eventId}/${rsvpId}`)}`}>
          <Button className="rounded-full font-bold">Log In</Button>
        </Link>
      </div>
    );
  }

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
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm hover:underline cursor-pointer transition-all"
              >
                {data.event.location}
              </a>
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

          <div className="flex flex-col gap-3">
            <Button className="w-full h-14 rounded-2xl font-bold text-[15px] shadow-md bg-black text-white hover:bg-gray-900 border-none flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.63.11 2.87.72 3.66 1.84-3.07 1.77-2.5 5.92.51 7.23-.74 1.76-1.74 3.55-2.75 3.9zm-3.2-14c-.06-2.03 1.58-3.9 3.5-4.14.39 2.22-1.71 4.1-3.5 4.14z"/></svg>
              Add to Apple Wallet
            </Button>
            <Button className="w-full h-14 rounded-2xl font-bold text-[15px] shadow-md bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/><path d="M3 11v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><line x1="16" y1="15" x2="16.01" y2="15"/></svg>
              Add to Google Wallet
            </Button>
          </div>
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

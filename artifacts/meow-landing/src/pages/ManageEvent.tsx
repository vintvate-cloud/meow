import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Send, 
  QrCode, 
  ExternalLink, 
  MoreHorizontal,
  Mail,
  CheckCircle,
  Clock
} from "lucide-react";

export default function ManageEvent() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
          
          const rsvpSnap = await getDocs(query(collection(db, "events", id, "rsvps"), orderBy("createdAt", "desc")));
          setAttendees(rsvpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const sendIndividualConfirmation = async (attendeeId: string) => {
    try {
      if (!id) throw new Error("Missing event ID");
      
      const rsvpRef = doc(db, "events", id, "rsvps", attendeeId);
      await updateDoc(rsvpRef, {
        confirmationSent: true
      });

      setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, confirmationSent: true } : a));
      
      toast({ 
        title: "Approved!", 
        description: "Guest has been confirmed and ticket generated.",
      });
    } catch (error: any) {
      console.error("Confirmation Error:", error);
      toast({ 
        title: "Action Failed", 
        description: error.message || "Could not approve guest. Check your Firebase Rules.",
        variant: "destructive" 
      });
    }
  };

  const sendConfirmations = async () => {
    const pending = attendees.filter(a => !a.confirmationSent);
    if (pending.length === 0) return;
    
    setSending(true);
    let successCount = 0;

    try {
      // Process all pending confirmations in parallel (Batch simulation)
      await Promise.all(pending.map(async (a) => {
        const rsvpRef = doc(db, "events", id!, "rsvps", a.id);
        await updateDoc(rsvpRef, { confirmationSent: true });
        successCount++;
      }));

      setAttendees(prev => prev.map(a => ({ ...a, confirmationSent: true })));
      
      toast({
        title: "Bulk Approval Complete",
        description: `Successfully approved ${successCount} guests at once.`,
      });
    } catch (error: any) {
      toast({ 
        title: "Bulk Action Partial Failure", 
        description: `Approved ${successCount} guests before an error occurred.`,
        variant: "destructive" 
      });
    } finally {
      setSending(false);
    }
  };



  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <div className="min-h-screen bg-[#F3F0E8] p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 font-bold text-gray-500 hover:text-navy mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: event.color }}>
                Active Event
              </span>
              <span className="text-sm font-bold text-gray-400">Created {event.createdAt?.toDate().toLocaleDateString()}</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight" style={{ color: '#111827' }}>{event.title}</h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link href={`/e/${id}`}>
              <Button variant="outline" className="rounded-full font-bold border-2 h-12 px-6">
                <ExternalLink className="w-4 h-4 mr-2" /> View Public Page
              </Button>
            </Link>
            <Link href={`/scan/${id}`}>
              <Button className="rounded-full font-bold h-12 px-6 shadow-lg border-none" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
                <QrCode className="w-4 h-4 mr-2" /> Scan Tickets
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Attendees */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Users className="w-6 h-6" /> Attendees
                  <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500 ml-2">
                    {attendees.length}
                  </span>
                </h2>
                <Button 
                  onClick={sendConfirmations}
                  disabled={sending || attendees.length === 0}
                  variant="outline" 
                  className="rounded-full font-bold border-2 h-10 px-4 text-sm"
                >
                  <Send className="w-4 h-4 mr-2" /> 
                  {sending ? "Sending..." : "Send Confirmations"}
                </Button>
              </div>
              
              <div className="divide-y divide-gray-50">
                {attendees.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="text-gray-300 font-bold italic">No RSVPs yet. Share your event link to get started!</div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/e/${id}`);
                        toast({ title: "Link copied!" });
                      }}
                      className="rounded-full font-bold"
                    >
                      Copy Event Link
                    </Button>
                  </div>
                ) : (
                  attendees.map((a) => (
                    <div key={a.id} className="p-6 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#F3F0E8] flex items-center justify-center font-black text-gray-400">
                          {a.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{a.email}</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(a.customResponses || {}).map(([label, value]: any) => (
                              <span key={label} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                {label}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {a.checkedIn ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" /> Checked In
                          </span>
                        ) : a.confirmationSent ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">
                              <Send className="w-4 h-4" /> Confirmed
                            </span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/ticket/${id}/${a.id}`);
                                toast({ title: "Ticket link copied!" });
                              }}
                              className="text-[10px] font-black text-gray-300 hover:text-navy uppercase tracking-widest"
                            >
                              Copy Ticket Link
                            </button>
                          </div>

                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => sendIndividualConfirmation(a.id)}
                            className="rounded-full font-bold border-2 text-xs"
                          >
                            Send Confirmation
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Settings */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-6">Event Performance</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">RSVP Conversion</span>
                    <span className="text-sm font-black">64%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D9FF00]" style={{ width: '64%' }}></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F3F0E8]/50">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Page Views</div>
                    <div className="text-2xl font-black">412</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F3F0E8]/50">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Unique Users</div>
                    <div className="text-2xl font-black">128</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] p-8 rounded-[40px] shadow-xl text-white">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" style={{ color: '#D9FF00' }} /> Communication
              </h3>
              <p className="text-sm opacity-60 mb-6 font-medium">Send updates, location pin, or last-minute changes to all your attendees at once.</p>
              <Button className="w-full rounded-2xl h-12 font-bold" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
                Broadcast Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from "firebase/firestore";
import emailjs from '@emailjs/browser';

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
  Clock,
  Globe,
  Lock,
  ChevronRight,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/Navigation";

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

      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error("Attendee not found");

      const rsvpRef = doc(db, "events", id, "rsvps", attendeeId);
      await updateDoc(rsvpRef, {
        confirmationSent: true
      });

      const ticketUrl = `${window.location.origin}/ticket/${id}/${attendeeId}`;
      
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TICKET_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: attendee.email,
            event_name: event.title,
            ticket_url: ticketUrl,
            otp: ticketUrl,
            passcode: event.title,
            time: event.date ? new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : ""
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (emailError: any) {
        console.error("Failed to send ticket email:", emailError);
        toast({
          title: "Approved, but email failed",
          description: "Attendee approved, but there was an error sending the ticket email.",
          variant: "destructive"
        });
      }

      setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, confirmationSent: true } : a));

      toast({
        title: "Approved!",
        description: "Guest has been confirmed and ticket has been emailed.",
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
      await Promise.all(pending.map(async (a) => {
        const rsvpRef = doc(db, "events", id!, "rsvps", a.id);
        await updateDoc(rsvpRef, { confirmationSent: true });

        const ticketUrl = `${window.location.origin}/ticket/${id}/${a.id}`;
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TICKET_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              to_email: a.email,
              event_name: event.title,
              ticket_url: ticketUrl,
              otp: ticketUrl,
              passcode: event.title,
              time: event.date ? new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : ""
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );
        } catch (err) {
          console.error(`Failed to send email to ${a.email}:`, err);
        }

        successCount++;
      }));

      setAttendees(prev => prev.map(a => ({ ...a, confirmationSent: true })));

      toast({
        title: "Bulk Approval Complete",
        description: `Successfully approved and emailed ${successCount} guests at once.`,
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

  const toggleVisibility = async (checked: boolean) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "events", id), { isPublic: checked });
      setEvent({ ...event, isPublic: checked });
      toast({
        title: checked ? "Event is now Public" : "Event is now Private",
        description: checked ? "It will show up on the Explore page." : "Only people with the link can access it."
      });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl animate-bounce">🐾</span>
            <p className="text-sm font-semibold text-gray-400">Loading details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-sm font-bold text-gray-500">Event not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">
        {/* Back Link */}
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white uppercase" style={{ backgroundColor: event.color || "#2856E8" }}>
                Active
              </span>
              <span className="text-xs text-gray-400 font-medium">Created {event.createdAt?.toDate().toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-gray-900 dark:text-gray-100">{event.title}</h1>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto">
            <Link href={`/e/${id}`} className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full rounded-xl text-xs font-semibold border-black/5 dark:border-white/10 h-10 px-4 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#222]">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View page
              </Button>
            </Link>
            <Link href={`/scan/${id}`} className="flex-1 md:flex-none">
              <Button className="w-full rounded-xl text-xs font-semibold h-10 px-4 shadow-sm bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                <QrCode className="w-3.5 h-3.5 mr-1.5" /> Scan tickets
              </Button>
            </Link>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column - Attendees */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/[0.04] dark:border-white/[0.04] flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Users className="w-4 h-4 text-gray-400" /> Guests
                  <span className="text-[10px] font-bold bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                    {attendees.length}
                  </span>
                </h2>
                {attendees.filter(a => !a.confirmationSent).length > 0 && (
                  <Button
                    onClick={sendConfirmations}
                    disabled={sending}
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-semibold text-xs border-black/5 dark:border-white/10 h-8 px-3"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    {sending ? "Approving..." : "Approve all pending"}
                  </Button>
                )}
              </div>

              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {attendees.length === 0 ? (
                  <div className="py-16 px-6 text-center space-y-4">
                    <p className="text-xs text-gray-400 italic">No RSVPs yet. Share your event link to get started!</p>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/e/${id}`);
                        toast({ title: "Link copied!" });
                      }}
                      size="sm"
                      className="rounded-xl font-semibold bg-black dark:bg-white text-white dark:text-black"
                    >
                      Copy event URL
                    </Button>
                  </div>
                ) : (
                  attendees.map((a) => (
                    <div key={a.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-[#222]/50 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400">
                          {a.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{a.email}</div>
                          {Object.keys(a.customResponses || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Object.entries(a.customResponses || {}).map(([label, value]: any) => (
                                <span key={label} className="text-[9px] font-medium bg-black/[0.03] dark:bg-white/5 border border-black/[0.02] dark:border-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg">
                                  {label}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto border-t sm:border-none pt-3 sm:pt-0">
                        {a.checkedIn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Checked In
                          </span>
                        ) : a.confirmationSent ? (
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-full">
                              <Send className="w-3 h-3" /> Approved
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/ticket/${id}/${a.id}`);
                                toast({ title: "Ticket link copied!" });
                              }}
                              className="text-[9px] font-bold text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors uppercase tracking-wider"
                            >
                              Copy ticket link
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendIndividualConfirmation(a.id)}
                            className="rounded-xl font-semibold text-xs border-black/5 dark:border-white/10 h-8 px-3.5 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50"
                          >
                            Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column - Settings & Performance */}
          <div className="space-y-6">
            
            {/* Conversion */}
            <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>RSVP Conversion</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">64%</span>
                  </div>
                  <div className="h-2 w-full bg-black/[0.04] dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D9FF00] dark:bg-[#D9FF00]" style={{ width: '64%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Page Views</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">412</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unique Users</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">128</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Broadcast */}
            <div className="bg-[#101828] text-white p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9FF00]/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D9FF00]" /> Broadcast
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Send announcements, location pins, or last-minute updates to all approved guests.</p>
              <Button className="w-full rounded-xl h-10 text-xs font-semibold bg-[#D9FF00] text-black hover:bg-[#D9FF00]/90 border-none shadow-sm">
                Write message
              </Button>
            </div>

            {/* Visibility Settings Card */}
            <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <Label className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    {event.isPublic ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                    Discoverability
                  </Label>
                  <p className="text-[10px] text-gray-400 font-medium leading-normal">
                    {event.isPublic ? "Public events appear on the explore page." : "Only people with the link can see this event."}
                  </p>
                </div>
                <Switch 
                  checked={event.isPublic} 
                  onCheckedChange={toggleVisibility} 
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

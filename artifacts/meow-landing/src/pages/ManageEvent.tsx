import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import { parseAvatarUrlFromStorage } from "@/lib/avatars";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Award,
  Zap,
  DollarSign,
  Calendar,
  MapPin,
  Check,
  Plus,
  AlertCircle,
  BarChart3,
  HelpCircle,
  Trophy,
  Flame,
  UserCheck,
  Heart
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/Navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ManageEvent() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [photosLink, setPhotosLink] = useState("");
  const [savingPhotos, setSavingPhotos] = useState(false);
  const { toast } = useToast();

  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
  const [launchDate, setLaunchDate] = useState("");
  const [launchLocation, setLaunchLocation] = useState("");
  const [launchPrice, setLaunchPrice] = useState(0);
  const [launchingEvent, setLaunchingEvent] = useState(false);

  // Aggregate poll votes
  const [pollVotes, setPollVotes] = useState<Record<string, Record<string, number>>>({});
  
  useEffect(() => {
    if (event?.isPreLaunch && attendees.length > 0) {
      const counts: Record<string, Record<string, number>> = {
        date: {},
        venue: {},
        artist: {},
        food: {},
        theme: {},
        timing: {}
      };

      // Seed with initial options if they exist
      event.dateOptions?.forEach((o: string) => counts.date[o] = 0);
      event.venueOptions?.forEach((o: string) => counts.venue[o] = 0);
      event.artistsOptions?.forEach((o: string) => counts.artist[o] = 0);
      event.foodOptions?.forEach((o: string) => counts.food[o] = 0);
      event.themeOptions?.forEach((o: string) => counts.theme[o] = 0);
      event.timingOptions?.forEach((o: string) => counts.timing[o] = 0);

      attendees.forEach(r => {
        if (r.votes) {
          Object.entries(r.votes).forEach(([category, selection]) => {
            if (selection && typeof selection === 'string') {
              if (!counts[category]) counts[category] = {};
              counts[category][selection] = (counts[category][selection] || 0) + 1;
            }
          });
        }
      });
      setPollVotes(counts);
    }
  }, [event, attendees]);

  const openLaunchDialog = () => {
    if (!event) return;
    
    let winDate = "";
    let maxD = -1;
    event.dateOptions?.forEach((opt: string) => {
      const votes = pollVotes.date?.[opt] || 0;
      if (votes > maxD) { maxD = votes; winDate = opt; }
    });

    let winVenue = "";
    let maxV = -1;
    event.venueOptions?.forEach((opt: string) => {
      const votes = pollVotes.venue?.[opt] || 0;
      if (votes > maxV) { maxV = votes; winVenue = opt; }
    });

    const prices = attendees
      .map(a => parseFloat(a.suggestedPrice))
      .filter(p => !isNaN(p) && p > 0);
    const avgP = prices.length 
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : 0;

    setLaunchDate(winDate || event.tentativeDate || "");
    setLaunchLocation(winVenue || event.city || "");
    setLaunchPrice(avgP || 0);
    setIsLaunchDialogOpen(true);
  };

  const handleOfficialLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLaunchingEvent(true);
    try {
      await updateDoc(doc(db, "events", id), {
        isPreLaunch: false,
        date: launchDate,
        location: launchLocation,
        ticketPrice: launchPrice,
        launchedAt: serverTimestamp(),
      });
      
      toast({
        title: "Event Launched! 🚀",
        description: "Your pre-launch campaign is now an official event page."
      });
      
      // Update local state
      setEvent((prev: any) => ({
        ...prev,
        isPreLaunch: false,
        date: launchDate,
        location: launchLocation,
        ticketPrice: launchPrice
      }));
      setIsLaunchDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Launch failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLaunchingEvent(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", id));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEvent({ id: eventDoc.id, ...data });
          setPhotosLink(data.photosLink || "");

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

  const savePhotosLink = async () => {
    if (!id) return;
    setSavingPhotos(true);
    try {
      await updateDoc(doc(db, "events", id), { photosLink });
      setEvent({ ...event, photosLink });
      toast({
        title: "Photos link updated",
        description: "Approved attendees can now access the event photos."
      });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSavingPhotos(false);
    }
  };

  const sendIndividualConfirmation = async (attendeeId: string) => {
    try {
      setApprovingId(attendeeId);
      if (!id) throw new Error("Missing event ID");

      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error("Attendee not found");

      const rsvpRef = doc(db, "events", id, "rsvps", attendeeId);
      await updateDoc(rsvpRef, {
        confirmationSent: true
      });

      const ticketUrl = `${window.location.origin}/ticket/${id}/${attendeeId}`;
      const qrData = JSON.stringify({ eventId: id, rsvpId: attendeeId });
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TICKET_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: attendee.email,
            event_name: event.title,
            ticket_url: ticketUrl,
            qr_image_url: qrImageUrl,
            otp: ticketUrl,
            passcode: event.title,
            time: event.date ? new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : "",
            location: event.location,
            event_url: `${window.location.origin}/e/${id}`
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
        description: "Guest has been confirmed and their QR ticket has been emailed.",
      });
    } catch (error: any) {
      console.error("Confirmation Error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not approve guest. Check your Firebase Rules.",
        variant: "destructive"
      });
    } finally {
      setApprovingId(null);
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
        const qrData = JSON.stringify({ eventId: id, rsvpId: a.id });
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
        
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TICKET_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              to_email: a.email,
              event_name: event.title,
              ticket_url: ticketUrl,
              qr_image_url: qrImageUrl,
              otp: ticketUrl,
              passcode: event.title,
              time: event.date ? new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : "",
              location: event.location,
              event_url: `${window.location.origin}/e/${id}`
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
        description: `Successfully approved and emailed QR tickets to ${successCount} guests.`,
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

  // Calculate poll winners and average pricing at top-level for shared scope
  let winningDate = "";
  let maxD = -1;
  event?.dateOptions?.forEach((opt: string) => {
    const votes = pollVotes.date?.[opt] || 0;
    if (votes > maxD) { maxD = votes; winningDate = opt; }
  });

  let winningVenue = "";
  let maxV = -1;
  event?.venueOptions?.forEach((opt: string) => {
    const votes = pollVotes.venue?.[opt] || 0;
    if (votes > maxV) { maxV = votes; winningVenue = opt; }
  });

  const pricesList = attendees
    .map(a => parseFloat(a.suggestedPrice))
    .filter(p => !isNaN(p) && p > 0);
  const avgP = pricesList.length 
    ? Math.round(pricesList.reduce((sum, p) => sum + p, 0) / pricesList.length)
    : 0;

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

        {event.isPreLaunch ? (
          // ==================== PRE-LAUNCH VALIDATION DASHBOARD ====================
          (() => {
            const views = event.views || 0;
            const interestedCount = event.interestedCount || attendees.filter(a => a.interestLevel === "interested").length;
            const maybeCount = event.maybeCount || attendees.filter(a => a.interestLevel === "maybe").length;
            const notInterestedCount = event.notInterestedCount || attendees.filter(a => a.interestLevel === "not-interested").length;
            const totalResponses = interestedCount + maybeCount + notInterestedCount;
            const conversionRate = views > 0 ? ((totalResponses / views) * 100).toFixed(1) : "0";
            const referredCount = attendees.filter(a => a.referrer).length;
            const viralCoefficient = (referredCount / Math.max(1, totalResponses)).toFixed(2);
            const goalProgress = Math.min(100, Math.round((interestedCount / (event.targetInterest || 100)) * 100));

            const sortedAttendees = [...attendees].sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
              return dateA.getTime() - dateB.getTime();
            });

            const growthDataMap: Record<string, number> = {};
            let cumulative = 0;
            sortedAttendees.forEach(a => {
              const dateStr = a.createdAt?.toDate 
                ? a.createdAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
                : new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
              cumulative += 1;
              growthDataMap[dateStr] = cumulative;
            });
            const growthChartData = Object.entries(growthDataMap).map(([date, value]) => ({ date, count: value }));

            const aggregatePollVotes = (category: string, options: string[]) => {
              const counts: Record<string, number> = {};
              options?.forEach(opt => counts[opt] = 0);
              attendees.forEach(a => {
                const vote = a.votes?.[category];
                if (vote && options?.includes(vote)) {
                  counts[vote] = (counts[vote] || 0) + 1;
                }
              });
              return Object.entries(counts).map(([name, votes]) => ({ name, votes }));
            };

            const pollsToRender = [
              { key: "date", label: "Preferred Dates", options: event.dateOptions },
              { key: "venue", label: "Preferred Venues", options: event.venueOptions },
              { key: "artist", label: "Preferred Artists", options: event.artistsOptions },
              { key: "food", label: "Preferred Food & Drinks", options: event.foodOptions },
              { key: "theme", label: "Preferred Themes", options: event.themeOptions },
              { key: "timing", label: "Preferred Timings", options: event.timingOptions }
            ].filter(p => p.options && p.options.length > 0);

            const predictedAttendance = Math.round((interestedCount * 0.85 + maybeCount * 0.35) * (1 + parseFloat(viralCoefficient)));
            const recommendedCapacity = Math.round(predictedAttendance * 1.3);
            const marketingBudget = predictedAttendance * 12;

            const goalRatio = Math.min(1.0, interestedCount / Math.max(1, event.targetInterest || 100));
            const convRate = parseFloat(conversionRate);
            const convScore = convRate > 40 ? 0.3 : convRate > 20 ? 0.2 : 0.1;
            const viralScore = Math.min(0.2, parseFloat(viralCoefficient) * 0.5);
            const activePollsScore = pollsToRender.length * 0.05;
            const successProbability = Math.min(99, Math.round((goalRatio * 0.3 + convScore + viralScore + activePollsScore) * 100));

            let strategicRecommendations: string[] = [];

            if (event) {
              const list = [];
              if (parseFloat(conversionRate) < 25) {
                list.push("Your landing page conversion rate is on the lower side. Consider updating the banner poster, adding a catching description, or clarifying the event's value proposition.");
              } else {
                list.push("Excellent visitor conversion! Your landing page is highly engaging. Keep sharing the direct link across your networks.");
              }

              if (parseFloat(viralCoefficient) < 0.15) {
                list.push("The referral loop is quiet. Boost sharing by promising early-bird tickets, exclusive access, or VIP perks to the top referrers on the leaderboard.");
              } else {
                list.push("Viral loop is active! Referrals are driving steady growth. Celebrate your top referrers by mentioning them or offering VIP badges.");
              }

              if (winningDate) {
                list.push(`Strong attendee preference for the date: "${winningDate}". We recommend finalizing this choice immediately before venue rates change.`);
              }
              
              if (winningVenue) {
                list.push(`Your community strongly prefers: "${winningVenue}". Lock in this location style to keep interest levels high.`);
              }

              const pricesList = attendees
                .map(a => parseFloat(a.suggestedPrice))
                .filter(p => !isNaN(p) && p > 0);
              
              if (pricesList.length > 0) {
                const avgP = Math.round(pricesList.reduce((sum, p) => sum + p, 0) / pricesList.length);
                list.push(`Organize your budget around a target ticket price of $${avgP}. This matches the average threshold that interested attendees suggested.`);
              }

              if (interestedCount < event.targetInterest * 0.5) {
                list.push("Currently under 50% of your target interest goal. Focus on micro-communities, partnerships, or co-host shoutouts before officially launching tickets.");
              } else {
                list.push("Goal target is within reach! Launch the event officially to capture ticket sales while the campaign hype is at its peak.");
              }
              strategicRecommendations = list;
            }

            const prices = attendees
              .map(a => parseFloat(a.suggestedPrice))
              .filter(p => !isNaN(p) && p > 0);
            const avgP = prices.length ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
            const avgPriceStr = prices.length ? `$${(prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(1)}` : "N/A";
            const minPriceStr = prices.length ? `$${Math.min(...prices)}` : "N/A";
            const maxPriceStr = prices.length ? `$${Math.max(...prices)}` : "N/A";

            const uniqueVenues = Array.from(new Set(
              attendees.map(a => a.suggestedVenue?.trim()).filter(v => v && v.length > 2)
            )).slice(0, 10);

            const referrers = attendees
              .filter(a => a.referralCount && a.referralCount > 0)
              .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
              .slice(0, 5);

            return (
              <div className="space-y-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 pb-8 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 uppercase animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" /> Pre-Launch Campaign
                      </span>
                      <span className="text-xs text-gray-400 font-medium">Target: {event.targetInterest} Interests</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-gray-900 dark:text-gray-100">{event.title}</h1>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <Link href={`/e/${id}`} className="flex-1 md:flex-none">
                      <Button variant="outline" className="w-full rounded-xl text-xs font-semibold border-black/5 dark:border-white/10 h-11 px-5 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#222]">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Campaign
                      </Button>
                    </Link>
                    <Button 
                      onClick={openLaunchDialog}
                      className="flex-1 md:flex-none rounded-xl text-xs font-bold h-11 px-6 shadow-lg bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white border-none transition-all duration-300 transform active:scale-95"
                    >
                      <Flame className="w-4 h-4 mr-1.5 animate-bounce" /> Launch Event Officially
                    </Button>
                  </div>
                </header>

                {/* Conversion metrics suite */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-5 rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hype Progress</div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <div className="text-2xl font-black">{interestedCount}</div>
                      <div className="text-xs text-gray-400">/ {event.targetInterest || 100}</div>
                    </div>
                    <div className="h-1.5 w-full bg-black/[0.04] dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${goalProgress}%` }} />
                    </div>
                    <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-2 uppercase tracking-wide">{goalProgress}% Completed</div>
                  </div>

                  <div className="p-5 rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Page Views</div>
                    <div className="text-2xl font-black mb-1">{views}</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase">Unique visitor hits</div>
                  </div>

                  <div className="p-5 rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Submissions</div>
                    <div className="text-2xl font-black mb-1">{totalResponses}</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase">Total registrations</div>
                  </div>

                  <div className="p-5 rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Conversion Rate</div>
                    <div className="text-2xl font-black mb-1 text-emerald-600 dark:text-emerald-400">{conversionRate}%</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase">Visitors to RSVPs</div>
                  </div>

                  <div className="p-5 rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm col-span-2 md:col-span-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Viral K-Factor</div>
                    <div className="text-2xl font-black mb-1 text-blue-500">{viralCoefficient}</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase">Referrals loop ratio</div>
                  </div>
                </section>

                {/* Growth and Interest Level chart */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Cumulative Interest Growth
                    </h3>
                    <div className="h-64">
                      {growthChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8129D9" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8129D9" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                            <XAxis dataKey="date" stroke="gray" fontSize={10} tickLine={false} />
                            <YAxis stroke="gray" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ background: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="count" stroke="#8129D9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-400 italic">No growth data accumulated yet</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5" /> Interest Splits
                      </h3>
                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-purple-600 dark:text-purple-400">🔥 Interested</span>
                            <span>{interestedCount} ({totalResponses > 0 ? Math.round(interestedCount / totalResponses * 100) : 0}%)</span>
                          </div>
<<<<<<< HEAD
                          <div className="h-2 w-full bg-black/[0.04] dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600" style={{ width: `${totalResponses > 0 ? (interestedCount / totalResponses * 100) : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-blue-500">🤔 Maybe</span>
                            <span>{maybeCount} ({totalResponses > 0 ? Math.round(maybeCount / totalResponses * 100) : 0}%)</span>
                          </div>
                          <div className="h-2 w-full bg-black/[0.04] dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${totalResponses > 0 ? (maybeCount / totalResponses * 100) : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-500">😴 Not Interested</span>
                            <span>{notInterestedCount} ({totalResponses > 0 ? Math.round(notInterestedCount / totalResponses * 100) : 0}%)</span>
                          </div>
                          <div className="h-2 w-full bg-black/[0.04] dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 dark:bg-gray-600" style={{ width: `${totalResponses > 0 ? (notInterestedCount / totalResponses * 100) : 0}%` }} />
                          </div>
                        </div>
=======
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendIndividualConfirmation(a.id)}
                            disabled={approvingId === a.id}
                            className="rounded-xl font-semibold text-xs border-black/5 dark:border-white/10 h-8 px-3.5 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50"
                          >
                            {approvingId === a.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                            ) : null}
                            {approvingId === a.id ? "Approving..." : "Approve"}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
>>>>>>> b24cbd1fb6ff71ce7b7f996e70301628f940fd8c
                      </div>
                    </div>
                    <div className="pt-6 border-t border-black/[0.03] dark:border-white/[0.03] mt-6 flex justify-between text-xs font-semibold text-gray-500">
                      <span>Organizers Recommendation:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{goalProgress >= 50 ? "Ready to Launch" : "Build Hype"}</span>
                    </div>
                  </div>
                </section>

                {/* AI prediction engine & Suggestions */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI Predictions */}
                  <div className="relative bg-[#0d0d12] text-white p-6 rounded-[28px] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold flex items-center gap-2 text-purple-400">
                            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Forecast Suite
                          </h3>
                          <p className="text-[10px] text-gray-400 font-medium">Predictive modeling from campaign signals</p>
                        </div>
                        {/* Circle score gauge */}
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                            <circle cx="40" cy="40" r="34" stroke="url(#aiSuccessGradient)" strokeWidth="6" fill="transparent"
                                    strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * successProbability) / 100}
                                    strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                            <defs>
                              <linearGradient id="aiSuccessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-sm font-black text-white">{successProbability}%</span>
                            <span className="block text-[7px] uppercase tracking-wider font-bold text-gray-400">Success</span>
                          </div>
                        </div>
                      </div>

                      {/* Forecast stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                          <div className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Est. Attendance</div>
                          <div className="text-xl font-black text-purple-400 mt-1">{predictedAttendance}</div>
                          <div className="text-[8px] text-gray-500 mt-0.5">85% Int. + 35% Maybe</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                          <div className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Venue Size</div>
                          <div className="text-xl font-black text-indigo-400 mt-1">{recommendedCapacity}</div>
                          <div className="text-[8px] text-gray-500 mt-0.5">Capacity +30% buffer</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                          <div className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Budget suggestion</div>
                          <div className="text-xl font-black text-emerald-400 mt-1">${marketingBudget}</div>
                          <div className="text-[8px] text-gray-500 mt-0.5">Calculated at $12/head</div>
                        </div>
                      </div>

                      {/* strategic recs */}
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Strategic Recommendations</h4>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-2 text-[11px] font-medium leading-relaxed scrollbar-thin">
                          {strategicRecommendations.map((rec, index) => (
                            <div key={index} className="flex gap-2.5 items-start bg-white/5 p-3 rounded-xl border border-white/10">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <span className="text-gray-350">{rec}</span>
                            </div>
                          ))}
                          {strategicRecommendations.length === 0 && (
                            <div className="text-xs text-gray-500 italic">No recommendations. Accumulate responses to generate insights.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions pricing & venues */}
                  <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[28px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                          <DollarSign className="w-4 h-4 text-emerald-500" /> Pricing Thresholds
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Price points suggested by audience members</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/5 p-4 rounded-2xl">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Min Suggested</div>
                          <div className="text-2xl font-black text-gray-700 dark:text-gray-300 mt-1">{minPriceStr}</div>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                          <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Average</div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgPriceStr}</div>
                        </div>
                        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/5 p-4 rounded-2xl">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Max Suggested</div>
                          <div className="text-2xl font-black text-gray-700 dark:text-gray-300 mt-1">{maxPriceStr}</div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-600" /> Venue Recommendations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {uniqueVenues.map((ven, i) => (
                            <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/10 text-xs font-bold rounded-xl">
                              {ven}
                            </span>
                          ))}
                          {uniqueVenues.length === 0 && (
                            <div className="text-xs text-gray-400 italic">No specific venue suggestions submitted yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Poll results grid */}
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-serif font-black tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <BarChart3 className="w-5 h-5 text-purple-650" /> Poll Validation
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Real-time breakdown of votes cast in active community polls</p>
                  </div>

                  {pollsToRender.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pollsToRender.map(poll => {
                        const data = aggregatePollVotes(poll.key, poll.options);
                        return (
                          <div key={poll.key} className="bg-white dark:bg-[#1A1A1A] p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-3">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-purple-600" /> {poll.label}
                            </h4>
                            <div className="h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.1)" />
                                  <XAxis type="number" stroke="gray" fontSize={9} tickLine={false} />
                                  <YAxis dataKey="name" type="category" stroke="gray" fontSize={9} width={85} tickLine={false} />
                                  <Tooltip contentStyle={{ background: '#1A1A1A', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }} />
                                  <Bar dataKey="votes" fill="#8129D9" radius={[0, 4, 4, 0]}>
                                    {data.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? "#8129D9" : "#a855f7"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-2xl p-10 text-center text-xs text-gray-400 italic">
                      No custom polls were added during pre-launch creation.
                    </div>
                  )}
                </section>

                {/* Viral loops & Suggestions feed table */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Viral loop leaderboard */}
                  <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-purple-650" /> Referral Leaderboard
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Top advocates sharing the validation link</p>
                    </div>

                    <div className="space-y-3.5">
                      {referrers.map((ref, idx) => {
                        const count = ref.referralCount || 0;
                        const badgeText = count >= 5 ? "👑 Legend" : count >= 3 ? "⚡ Spark" : "🌱 Starter";
                        const badgeClass = count >= 5 
                          ? "bg-purple-500/10 text-purple-650" 
                          : count >= 3 
                          ? "bg-blue-500/10 text-blue-500" 
                          : "bg-gray-500/10 text-gray-500";

                        return (
                          <div key={ref.id} className="flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.01] p-3 rounded-xl border border-black/[0.02] dark:border-white/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                              <span className="text-sm font-semibold truncate text-gray-800 dark:text-gray-200">@{ref.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
                              <span className="text-xs font-black text-purple-650 dark:text-purple-400">{count} refs</span>
                            </div>
                          </div>
                        );
                      })}
                      {referrers.length === 0 && (
                        <div className="text-xs text-gray-400 italic text-center py-6">No referrals recorded yet. Loop starts when guests invite friends!</div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Comments Table */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-500" /> Suggestions Feed
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Individual suggestions submitted in RSVP validation deck</p>
                    </div>

                    <div className="overflow-x-auto max-h-72 border border-black/[0.04] dark:border-white/[0.04] rounded-2xl scrollbar-thin">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.04] text-[10px] font-bold text-gray-400 uppercase">
                            <th className="p-3">Guest</th>
                            <th className="p-3">Interest</th>
                            <th className="p-3">Sug. Venue</th>
                            <th className="p-3">Sug. Price</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.02] dark:divide-white/[0.02] text-xs">
                          {attendees.map((att) => {
                            const isInterested = att.interestLevel === "interested";
                            const interestClass = isInterested 
                              ? "text-purple-600 bg-purple-500/10" 
                              : att.interestLevel === "maybe" 
                              ? "text-blue-500 bg-blue-500/10" 
                              : "text-gray-500 bg-gray-500/10";

                            return (
                              <tr key={att.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                                <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">@{att.displayName}</td>
                                <td className="p-3">
                                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${interestClass}`}>
                                    {att.interestLevel || "Interested"}
                                  </span>
                                </td>
                                <td className="p-3 font-medium opacity-80 max-w-[120px] truncate">{att.suggestedVenue || <span className="opacity-30 italic">None</span>}</td>
                                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{att.suggestedPrice ? `$${att.suggestedPrice}` : <span className="opacity-30 font-normal italic">None</span>}</td>
                                <td className="p-3 opacity-60 font-medium max-w-[200px] truncate" title={att.improvements || ""}>
                                  {att.improvements || <span className="opacity-30 italic">None</span>}
                                </td>
                              </tr>
                            );
                          })}
                          {attendees.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-xs text-gray-400 italic">No validation feedback submitted yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            );
          })()
        ) : (
          // ==================== STANDARD LIVE EVENT DASHBOARD ====================
          <>
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
                            <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                              {a.photoURL ? (
                                <img src={parseAvatarUrlFromStorage(a.photoURL)} alt={a.displayName || a.email} className="w-full h-full object-cover" />
                              ) : (
                                (a.displayName || a.email)[0].toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                {a.displayName ? (
                                  <div className="flex flex-col">
                                    <span>{a.displayName}</span>
                                    <span className="text-[10px] text-gray-500 font-normal">{a.email}</span>
                                  </div>
                                ) : (
                                  a.email
                                )}
                              </div>
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

                {/* Event Photos & AI Recap */}
                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Event Photos
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Add a Drive or Dropbox link here. It will only be visible to approved attendees on the event page.
                    </p>
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={photosLink}
                        onChange={(e) => setPhotosLink(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-gray-900 dark:text-gray-100"
                      />
                      <Button 
                        onClick={savePhotosLink} 
                        disabled={savingPhotos || photosLink === (event.photosLink || "")}
                        className="w-full rounded-xl h-9 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                      >
                        {savingPhotos ? "Saving..." : "Save Link"}
                      </Button>
                    </div>
                  </div>

                  {event.photosLink && (
                    <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Auto-Recap
                      </h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Let MEOW's AI scan your photo folder, summarize the event, and draft a beautiful "Thanks for coming!" newsletter for all checked-in attendees.
                      </p>
                      <Button 
                        onClick={() => {
                          toast({ title: "MEOW AI is analyzing photos...", description: "This might take a minute." });
                          setTimeout(() => {
                            toast({ title: "Auto-Recap Sent! 🚀", description: `Sent a beautiful recap to ${attendees.filter(a => a.checkedIn).length} checked-in guests.` });
                          }, 2500);
                        }}
                        className="w-full rounded-xl h-9 text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 border-none shadow-sm"
                      >
                        Generate & Send Recap
                      </Button>
                    </div>
                  )}
                </div>

                {/* Co-Hosts Info */}
                {event.coHosts && event.coHosts.length > 0 && (
                  <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Co-Hosts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {event.coHosts.map((host: string) => (
                        <span key={host} className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300">
                          @{host}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
          </>
        )}
      </div>

      {/* Launch Official Event Dialog */}
      <AnimatePresence>
        {isLaunchDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLaunchDialogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative z-10 text-left space-y-6"
            >
              <div>
                <h2 className="text-2xl font-serif font-black tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-purple-650 dark:text-purple-400 animate-pulse" /> Launch Event Officially
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Finalize event details using insights validated by your prospective audience. This will close the pre-launch validation campaign and publish the live page.
                </p>
              </div>

              <form onSubmit={handleOfficialLaunch} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Final Date & Time</Label>
                  <input
                    type="datetime-local"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-550 text-gray-900 dark:text-gray-100"
                    required
                  />
                  {winningDate && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold pl-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Community Winner: "{winningDate}" ({pollVotes.date?.[winningDate] || 0} votes)
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Final Venue / Location</Label>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Rooftop Lounge, Brooklyn"
                    value={launchLocation}
                    onChange={(e) => setLaunchLocation(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-550 text-gray-900 dark:text-gray-100"
                    required
                  />
                  {winningVenue && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold pl-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Community Winner: "{winningVenue}" ({pollVotes.venue?.[winningVenue] || 0} votes)
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Ticket Price ($ USD)</Label>
                  <div className="relative flex rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    <span className="px-4 flex items-center border-r border-black/10 dark:border-white/10 text-sm font-bold text-gray-400 select-none">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (Free)"
                      value={launchPrice}
                      onChange={(e) => setLaunchPrice(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-semibold focus:ring-0 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {avgP > 0 && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold pl-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Community Average suggested: ${avgP}
                    </p>
                  )}
                </div>

                <div className="flex gap-3.5 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLaunchDialogOpen(false)}
                    className="flex-1 rounded-xl font-bold h-12 text-sm border-black/10 dark:border-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={launchingEvent}
                    className="flex-1 rounded-xl font-bold h-12 text-sm bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white border-none shadow-lg transform active:scale-95"
                  >
                    {launchingEvent ? "Launching..." : "Publish Live Event 🚀"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

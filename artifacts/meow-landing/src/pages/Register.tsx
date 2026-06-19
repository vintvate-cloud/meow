import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, Lock, Sparkles, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getThemeColors } from "@/lib/theme-colors";

export default function Register() {
  const [match, params] = useRoute("/register/:id");
  const eventId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      if (!eventId) return;
      try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast({ title: "Event not found", variant: "destructive" });
        }

        if (user) {
          const rsvpQ = query(collection(db, `events/${eventId}/rsvps`), where("userId", "==", user.uid));
          const rsvpSnap = await getDocs(rsvpQ);
          if (!rsvpSnap.empty) {
            setRsvpDone(true);
            setIsApproved(rsvpSnap.docs[0].data().status === "approved");
          }
        }
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          console.error("Error fetching event:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [eventId, user, authLoading, toast]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingScreenshot(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dih7y95sc";
      let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "linkhub_unsigned";

      formDataUpload.append("upload_preset", uploadPreset);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Screenshot upload failed");

      const data = await res.json();
      setPaymentScreenshotUrl(data.secure_url);
      toast({ title: "Screenshot uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !event) return;
    if (!email) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    setRsvpLoading(true);
    try {
      if (event.ticketLimit) {
        const limit = parseInt(event.ticketLimit);
        const allRsvpsSnap = await getDocs(collection(db, `events/${eventId}/rsvps`));
        const validRsvps = allRsvpsSnap.docs.filter(d => {
          const s = d.data().status;
          return s !== "rejected" && s !== "cancelled";
        });
        if (validRsvps.length >= limit) {
          toast({ title: "Event is sold out!", variant: "destructive" });
          setRsvpLoading(false);
          return;
        }
      }

      if (event.upiQrCodeUrl && event.ticketPrice && !paymentScreenshotUrl) {
        toast({ title: "Payment screenshot is required", variant: "destructive" });
        setRsvpLoading(false);
        return;
      }

      const rsvpsRef = collection(db, `events/${eventId}/rsvps`);
      let alreadyRegistered = false;
      let alreadyApproved = false;
      
      try {
        const q = query(rsvpsRef, user ? where("userId", "==", user.uid) : where("email", "==", email.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alreadyRegistered = true;
          alreadyApproved = snap.docs[0].data().status === "approved";
        }
      } catch (err: any) {
        if (err?.code !== 'permission-denied') throw err;
      }

      if (alreadyRegistered) {
         toast({ title: "You have already registered!", variant: "destructive" });
         setRsvpDone(true);
         setIsApproved(alreadyApproved);
         setRsvpLoading(false);
         return;
      }

      // Check auto-approval and payment
      let status = "pending";
      if (event.upiQrCodeUrl && event.ticketPrice) {
        status = "payment_pending";
        setIsPaymentPending(true);
      } else if (event.approvalType === "auto") {
        status = "approved";
      }

      const rsvpData = {
        eventId,
        userId: user ? user.uid : null,
        name: user?.displayName || "",
        email: email.toLowerCase(),
        avatar: user?.photoURL || "",
        customResponses,
        status,
        createdAt: serverTimestamp(),
        interestLevel: "interested",
        paymentScreenshotUrl: paymentScreenshotUrl || null,
        ticketPrice: event.ticketPrice || null
      };

      await addDoc(rsvpsRef, rsvpData);

      // Save to user global RSVPs
      try {
        const userRSVPRef = doc(db, `userRSVPs/${email.toLowerCase()}/events`, eventId);
        await setDoc(userRSVPRef, {
          eventId,
          registeredAt: serverTimestamp(),
          status
        });
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          console.error("Error saving to userRSVPs:", err);
        }
      }

      setRsvpDone(true);
      setIsApproved(status === "approved");
      toast({ title: "Registration successful!" });
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.error("RSVP error:", err);
      }
      toast({ title: "Error registering", description: err.message, variant: "destructive" });
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  const themeColors = getThemeColors(event.theme || "cream-cozy");

  return (
    <div 
      className="min-h-screen font-sans relative selection:bg-[#111827] dark:selection:bg-white selection:text-white dark:selection:text-black flex flex-col"
      style={{ 
        backgroundColor: themeColors.bg, 
        backgroundImage: (themeColors as any).bgGradient || "none",
        color: themeColors.text 
      }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-40 mix-blend-screen">
        <div className="absolute w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw]" style={{
          background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, ${themeColors.starburst}22 10deg, transparent 11deg)`,
          animation: "spin 60s linear infinite"
        }} />
        {!(themeColors as any).bgGradient && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle_at_center, transparent 20%, ${themeColors.bg} 70%)`
          }} />
        )}
      </div>

      <div className="relative z-10 px-6 py-6 md:px-12 md:py-8 w-full max-w-2xl mx-auto flex-1 flex flex-col">
        <div className="mb-6">
          <button
            onClick={() => {
              if (window.history.state && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = `/e/${eventId}`;
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">{event.title}</h1>
            <p className="opacity-70 font-medium">{new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <AnimatePresence mode="wait">
            {!rsvpDone ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/10 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[24px] border border-black/5 dark:border-white/10 overflow-hidden shadow-2xl"
              >
                 <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/10 dark:bg-white/[0.02]">
                   <h3 className="text-sm font-bold opacity-60">Registration Form</h3>
                 </div>
                 
                 <div className="p-6 md:p-8 space-y-6">
                    {event.approvalType !== "auto" && (
                      <div className="flex items-start gap-3 bg-white/10 dark:bg-white/[0.03] p-4 rounded-xl border border-black/5 dark:border-white/5">
                         <div className="p-1.5 bg-white/20 dark:bg-white/10 rounded-lg mt-0.5 border border-black/5 dark:border-transparent shadow-sm">
                            <Users className="w-4 h-4 opacity-60" />
                         </div>
                         <div>
                            <div className="text-sm font-bold">Approval Required</div>
                            <div className="text-xs opacity-60 mt-1">Your registration is subject to host approval.</div>
                         </div>
                      </div>
                    )}

                    <form onSubmit={handleRSVP} className="space-y-5">
                      {(!user || !user.email) && (
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold opacity-80 pl-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="Enter your email"
                            className="h-14 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      
                       {event.customFields?.map((field: any, idx: number) => (
                         <div key={idx} className="space-y-1.5 text-left">
                           <label className="text-xs font-bold opacity-80 pl-1">
                             {field.label} {field.required && <span className="text-red-500">*</span>}
                           </label>
                           <Input
                             placeholder={field.placeholder || "Your answer"}
                             className="h-14 rounded-xl bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 focus:border-[#111827] dark:focus:border-white/30 text-[#111827] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium shadow-sm"
                             value={customResponses[field.label] || ""}
                             onChange={(e) => setCustomResponses({ ...customResponses, [field.label]: e.target.value })}
                             required={field.required}
                           />
                         </div>
                      ))}

                      {event.upiQrCodeUrl && event.ticketPrice && (
                        <div className="space-y-4 text-left bg-white/10 dark:bg-white/[0.03] p-4 rounded-xl border border-black/5 dark:border-white/5">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold">Ticket Payment: ₹{event.ticketPrice}</h4>
                            <p className="text-xs opacity-70">Scan the QR code below to pay for your ticket, then upload the screenshot.</p>
                          </div>
                          
                          <div className="flex justify-center py-2">
                            <div className="bg-white p-2 rounded-xl">
                              <img src={event.upiQrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-cover rounded-lg" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold opacity-80 pl-1">
                              Payment Screenshot <span className="text-red-500">*</span>
                            </label>
                            {paymentScreenshotUrl ? (
                              <div className="flex items-center gap-3">
                                <img src={paymentScreenshotUrl} alt="Screenshot" className="w-16 h-16 rounded-xl object-cover border border-white/20" />
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Uploaded</span>
                              </div>
                            ) : (
                              <div className="relative">
                                <input type="file" accept="image/*" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                                <Button type="button" disabled={uploadingScreenshot} variant="outline" className="w-full bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 rounded-xl font-bold">
                                  {uploadingScreenshot ? "Uploading..." : "Upload Screenshot"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                       <Button
                         disabled={rsvpLoading}
                         className="w-full h-14 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-xl border-none text-white mt-4"
                         style={{ backgroundColor: themeColors.accent }}
                       >
                         {rsvpLoading ? "Processing..." : "Complete Registration"}
                       </Button>
                    </form>
                 </div>
              </motion.div>
            ) : (
              <motion.div
                 key="done"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-[#111827] dark:bg-black p-8 md:p-12 rounded-[24px] border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                 <div className="flex justify-center relative z-10">
                   <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm backdrop-blur-sm">
                     <CheckCircle2 className="w-10 h-10" />
                   </div>
                 </div>
                 <h3 className="text-3xl font-bold text-white relative z-10">You're registered!</h3>

                 <div className="bg-white/5 p-6 rounded-xl space-y-2 border border-white/10 relative z-10 text-left max-w-sm mx-auto">
                   <p className="text-white font-semibold text-base flex items-center gap-2">
                     <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isApproved ? 'bg-emerald-400 animate-pulse' : (isPaymentPending ? 'bg-blue-400 animate-pulse' : 'bg-amber-400')}`} />
                     {isApproved ? "Approved & Confirmed" : (isPaymentPending ? "Payment Verification Pending" : "Pending Approval")}
                   </p>
                   <p className="text-sm font-medium text-white/70 leading-relaxed mt-2">
                     {isApproved 
                       ? "You're on the guest list! Your ticket has been emailed to you."
                       : (isPaymentPending 
                          ? "Your ticket will be mailed once the payment is verified by the host." 
                          : "The host will review your request. You'll receive a ticket via email once confirmed.")}
                   </p>
                 </div>

                 <div className="pt-4 relative z-10">
                    <Link href={`/e/${eventId}`}>
                      <Button className="h-12 px-8 rounded-full font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20">
                        Return to Event Page
                      </Button>
                    </Link>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

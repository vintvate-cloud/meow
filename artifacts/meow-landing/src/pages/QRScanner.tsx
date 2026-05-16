import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QRScanner() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    async function onScanSuccess(decodedText: string) {
      try {
        const data = JSON.parse(decodedText);
        if (data.eventId !== id) {
          setResult({ success: false, message: "Invalid ticket for this event!" });
          return;
        }

        // Check in the attendee
        const rsvpRef = doc(db, "events", id, "rsvps", data.rsvpId);
        const rsvpSnap = await getDoc(rsvpRef);

        if (!rsvpSnap.exists()) {
          setResult({ success: false, message: "RSVP not found!" });
        } else if (rsvpSnap.data().checkedIn) {
          setResult({ success: false, message: "Already checked in!", email: rsvpSnap.data().email });
        } else {
          await updateDoc(rsvpRef, { checkedIn: true });
          setResult({ success: true, message: "Welcome!", email: rsvpSnap.data().email });
        }

        setScanning(false);
        scanner.clear();
      } catch (e) {
        console.error(e);
      }
    }

    if (scanning) {
      scanner.render(onScanSuccess, (err) => {
        // quiet error
      });
    }

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [id, scanning]);

  const resetScanner = () => {
    setResult(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="w-full max-w-md">
        <button
          onClick={() => setLocation(`/manage/${id}`)}
          className="flex items-center gap-2 font-bold text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Exit Scanner
        </button>

        <header className="mb-12 text-center">
          <h1 className="text-3xl font-black tracking-tight">Check-in Scanner</h1>
          <p className="text-gray-400 font-medium mt-2">Scan attendee QR codes to confirm entry.</p>
        </header>

        <div className="relative">
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/5 rounded-[40px] border-4 border-dashed border-white/20 p-4 overflow-hidden relative"
              >
                <div id="reader" className="w-full h-full rounded-3xl overflow-hidden"></div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-[#D9FF00] rounded-3xl opacity-50 animate-pulse"></div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-10 rounded-[40px] text-center space-y-6 ${result?.success ? 'bg-[#D9FF00] text-[#111827]' : 'bg-red-500 text-white'}`}
              >
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    {result?.success ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                  </div>
                </div>

                <div>
                  <h2 className="text-4xl font-black leading-tight">{result?.message}</h2>
                  {result?.email && <p className="text-xl font-bold opacity-80 mt-2">{result.email}</p>}
                </div>

                <Button
                  onClick={resetScanner}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-black/10 hover:bg-black/20 border-none"
                >
                  Scan Next
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-gray-500 font-bold">
          <Camera className="w-5 h-5" />
          <span>Point at a MEOW Ticket QR</span>
        </div>
      </div>
    </div>
  );
}

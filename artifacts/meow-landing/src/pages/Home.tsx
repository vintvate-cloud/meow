import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TESTIMONIALS = [
  {
    quote: "Meow turned our random meetups into a thriving creative community.",
    author: "Marcus Chen, Co-founder of The Archive Collective",
    bg1: "#004225", // dark green
    bg2: "#FF6B00", // orange
  },
  {
    quote: "We sold out our first event in 48 hours using Meow. The RSVP page is stunning.",
    author: "Priya Sharma, Indie Music Curator",
    bg1: "#2856E8", // royal blue
    bg2: "#E6E6FA", // lavender
  },
  {
    quote: "Our campus club went from 20 members to 400 in one semester with Meow.",
    author: "Jordan Lee, UCLA Events Lead",
    bg1: "#800020", // burgundy
    bg2: "#D9FF00", // lime
  },
  {
    quote: "The analytics alone are worth it. I finally understand my audience.",
    author: "Kai Nakamura, Creative Director",
    bg1: "#800080", // purple
    bg2: "#00FFFF", // cyan
  }
];

import { useForceLightTheme } from "@/hooks/use-theme-force";

export default function Home() {
  useForceLightTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const [phoneStep, setPhoneStep] = useState(0);
  const [testimonialStep, setTestimonialStep] = useState(0);
  const [activeFaq, setActiveFaq] = useState<string | undefined>();

  useEffect(() => {
    const phoneInterval = setInterval(() => {
      setPhoneStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(phoneInterval);
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setTestimonialStep((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 3000);
    return () => clearInterval(testimonialInterval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Navbar shrink on scroll
      if (navRef.current) {
        gsap.to(navRef.current.querySelector('.nav-inner'), {
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          scrollTrigger: {
            trigger: "body",
            start: "top -50px",
            end: "top -150px",
            scrub: true,
          }
        });
      }

      // Section headings reveal
      gsap.utils.toArray('.gsap-heading').forEach((heading: any) => {
        gsap.fromTo(heading,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
            }
          }
        );
      });

      // Floating metric cards animation (Analytics section)
      gsap.utils.toArray('.metric-card-inner').forEach((card: any, i) => {
        gsap.to(card, {
          y: -15,
          duration: 2 + (i % 3) * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });

      // Hero Parallax on mouse move
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 40;
        const yPos = (clientY / window.innerHeight - 0.5) * 40;

        gsap.to('.gsap-parallax', {
          x: (i) => xPos * (i + 1) * 0.5,
          y: (i) => yPos * (i + 1) * 0.5,
          duration: 1,
          ease: "power2.out",
          overwrite: true
        });
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Subtle parallax on feature cards
      gsap.utils.toArray('.gsap-parallax').forEach((card: any, i) => {
        gsap.fromTo(card,
          { y: 50 },
          {
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: card.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            }
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen w-full font-sans bg-background text-foreground overflow-x-hidden">

      <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-[1200px] z-50 px-4">
        <div className="nav-inner bg-white dark:bg-card dark:text-card-foreground text-navy flex items-center justify-between px-6 h-16 md:h-20 rounded-full shadow-lg border border-gray-100 dark:border-border transition-all">
          <Link href="/" className="relative flex items-center h-full w-32 md:w-48">
            <img src="/meowlogo2.png" alt="MEOW" className="absolute left-0 h-24 md:h-32 w-auto object-contain transition-transform hover:scale-110" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} />
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05, rotate: 1 }} whileTap={{ scale: 0.97 }}>
                  <Button className="rounded-full font-bold px-6 border-none" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}>Dashboard</Button>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full hidden sm:inline-flex" style={{ color: "var(--foreground)" }}>Log in</Button>
                </Link>
                <Link href="/signup">
                  <motion.div whileHover={{ scale: 1.05, rotate: 1 }} whileTap={{ scale: 0.97 }}>
                    <Button className="rounded-full font-bold px-6 border-none" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}>Get Started</Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section ref={heroRef} className="min-h-[100svh] pt-32 pb-20 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden" style={{ backgroundColor: '#D9FF3F' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }}
          className="w-full lg:w-1/2 z-10 space-y-8 max-w-2xl pt-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 mb-6"
          >
            <span className="text-xs font-black tracking-[0.2em] text-[#101828] dark:text-foreground">MEET • ENGAGE • ORGANIZE • WELCOME</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(3.5rem,7vw,7rem)] leading-[0.9] font-black tracking-tighter" style={{ color: "var(--foreground)" }}
          >
            The internet was made for communities. So was MEOW.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl max-w-lg font-medium opacity-90" style={{ color: "var(--foreground)" }}
          >
            Host events, collect RSVPs, spark conversations, and turn moments into movements.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full h-16 px-8 text-lg font-bold border-none w-full sm:w-auto" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
                  Create an Event
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="rounded-full h-16 px-8 text-lg font-bold border-2 bg-transparent hover:bg-[#111827]/10 w-full sm:w-auto" style={{ borderColor: '#111827', color: "var(--foreground)" }}>
                See Pricing
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex items-center gap-3 pt-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#101828] bg-gray-300 overflow-hidden" style={{ backgroundColor: i % 2 === 0 ? '#2457FF' : '#F8F4EC' }} />
              ))}
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>10,000+ events hosted this week</span>
          </motion.div>
        </motion.div>

        <div className="w-full lg:w-1/2 relative h-[600px] mt-16 lg:mt-0">
          <motion.div
            whileHover={{ y: -10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="absolute top-10 left-10 w-64 p-6 rounded-3xl shadow-2xl z-20 gsap-parallax cursor-pointer" style={{ backgroundColor: '#2457FF', color: 'white' }}
          >
            <div className="text-sm font-bold mb-2 opacity-80">TONIGHT</div>
            <div className="text-2xl font-black mb-4 leading-tight">Design Drink & Draw</div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}>RSVP</div>
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20">34 Attending</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -20, 0], rotate: [2, 1, 2] }}
            whileHover={{ scale: 1.05, rotate: 0 }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 right-10 w-72 p-6 rounded-3xl shadow-2xl z-10 gsap-parallax cursor-pointer" style={{ backgroundColor: '#E8C8EC', color: "var(--foreground)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#79001B' }}></div>
              <div>
                <div className="font-bold">Sarah invited you</div>
                <div className="text-sm opacity-70">to Brooklyn Pottery Club</div>
              </div>
            </div>
            <Button className="w-full rounded-full h-10 font-bold border-none" style={{ backgroundColor: '#111827', color: '#E8C8EC' }}>Accept Invite</Button>
          </motion.div>

          <motion.div
            animate={{ y: [0, -12, 0], rotate: [-4, -2, -4] }}
            whileHover={{ scale: 1.05, rotate: 0 }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-20 left-20 w-56 p-5 rounded-3xl shadow-2xl z-30 gsap-parallax cursor-pointer" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#D9FF00' }}></div>
              <div className="font-bold text-xl">QR Ticket</div>
            </div>
            <div className="w-full aspect-square rounded-xl opacity-20 border-4 border-dashed" style={{ borderColor: '#111827' }}></div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="w-full overflow-hidden bg-navy py-6 border-y-2 group" style={{ backgroundColor: '#111827', borderColor: '#D9FF00' }}>
        <div className="flex whitespace-nowrap group-hover:[animation-play-state:paused]" style={{ animation: 'marquee 15s linear infinite' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center mx-4">
              <span className="text-5xl md:text-6xl font-black" style={{ color: '#D9FF00' }}>NO HIDDEN FEES</span>
              <span className="mx-6 text-white text-5xl md:text-6xl">•</span>
              <span className="text-5xl md:text-6xl font-black text-white">GET PAID INSTANTLY</span>
              <span className="mx-6 text-white text-5xl md:text-6xl">•</span>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      {/* 3. Create events fast Section */}
      <section className="py-32 px-6 lg:px-12 flex flex-col-reverse lg:flex-row items-center gap-16 relative" style={{ backgroundColor: '#2856E8' }}>
        <div className="w-full lg:w-1/2 flex justify-center relative">

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-0 lg:right-10 bg-white dark:bg-card dark:text-card-foreground rounded-2xl p-4 shadow-xl z-20 hidden sm:flex items-center gap-3"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <div className="text-sm font-bold text-gray-900 dark:text-foreground">New RSVP — Priya just joined</div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 left-0 lg:left-10 bg-[#D9FF00] rounded-full px-5 py-2 shadow-xl z-20 hidden sm:flex items-center gap-2"
          >
            <div className="text-sm font-bold text-gray-900 dark:text-foreground">5 min setup</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-[300px] h-[600px] rounded-[40px] border-8 shadow-2xl bg-white dark:bg-card dark:text-card-foreground relative overflow-hidden flex flex-col"
            style={{ borderColor: '#111827' }}
          >
            <div className="absolute top-0 w-full h-6 flex justify-center pt-2 z-50">
              <div className="w-20 h-4 rounded-full" style={{ backgroundColor: '#111827' }}></div>
            </div>

            <div className="flex-1 mt-8 relative bg-white">
              <AnimatePresence mode="wait">
                {phoneStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute inset-0 flex flex-col bg-[#F3F0E8] overflow-hidden"
                  >
                    {/* Background Rays */}
                    <div className="absolute inset-0 z-0 opacity-30" style={{ background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, #D9FF0022 10deg, transparent 11deg)` }} />
                    <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(circle_at_center, transparent 20%, #F3F0E8 70%)` }} />
                    
                    <div className="relative z-10 px-4 pt-4 pb-16 flex flex-col h-full">
                      <div className="mt-8 border-4 border-[#111827] bg-[#D9FF00] rounded-2xl p-4 shadow-[4px_4px_0px_#111827]">
                        <div className="w-8 h-8 rounded-full bg-white mb-2 border-2 border-[#111827] flex items-center justify-center font-bold text-xs">V</div>
                        <div className="text-[8px] uppercase font-bold tracking-widest opacity-60">Presented by</div>
                        <div className="font-bold text-xs">Vedant</div>
                      </div>

                      <div className="mt-6 space-y-1">
                        <h1 className="text-3xl font-black leading-[1.1] tracking-tight">Sunset<br/>Rooftop<br/>Mixer</h1>
                      </div>

                      <div className="mt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-2">Hosted By</div>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xs font-bold">V</div>
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center text-xs font-bold">A</div>
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center text-xs font-bold">M</div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="h-12 w-full rounded-full flex items-center justify-center font-bold text-[#111827] shadow-lg border-2 border-[#111827]" style={{ backgroundColor: '#D9FF00' }}>RSVP Now</div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {phoneStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute inset-0 flex flex-col bg-[#F3F0E8] p-4 pt-12 pb-16"
                  >
                    <div className="bg-white w-full h-full rounded-[24px] shadow-lg overflow-hidden flex flex-col border border-gray-100">
                      <div className="bg-[#D9FF00] p-4 text-center border-b border-gray-100">
                        <h1 className="text-xl font-black tracking-tight">Sunset Mixer</h1>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1">Official Entry Ticket</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center p-4 text-center">
                        <p className="text-xs font-medium text-gray-500 mb-6">You're on the list! Present this QR code.</p>
                        
                        <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-2 mb-6">
                          <div className="w-full h-full bg-[#111827] rounded-lg relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-4 gap-1 p-1">
                              {Array.from({length: 16}).map((_, i) => <div key={i} className={`bg-white ${i%3===0 ? 'opacity-0' : ''}`} />)}
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-50 rounded-xl p-3 border border-gray-100 mb-auto">
                          <p className="text-xs font-bold">📍 Secret Location</p>
                        </div>

                        <div className="w-full h-12 rounded-full bg-[#111827] text-[#D9FF00] flex items-center justify-center font-bold text-sm mt-4">
                          Add to Apple Wallet
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {phoneStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 flex flex-col bg-white px-4 pt-12 pb-16"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="font-black text-xl">Dashboard</div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">V</div>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">Approved</div>
                        <div className="text-xl font-black text-green-500">45</div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">Pending</div>
                        <div className="text-xl font-black text-orange-500">12</div>
                      </div>
                    </div>

                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Waitlist</div>
                    
                    <div className="space-y-2 mb-auto">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200" />
                            <div className="text-sm font-bold">Guest {i}</div>
                          </div>
                          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-bold">Approve</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="h-12 w-full rounded-xl flex items-center justify-center font-bold text-white bg-[#111827] shadow-lg gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                        Scan QR Code
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-50">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${phoneStep === i ? 'bg-[#D9FF00]' : 'bg-gray-300'}`} />
              ))}
            </div>

          </motion.div>
        </div>
        <div className="w-full lg:w-1/2 space-y-8">
          <h2
            className="gsap-heading text-5xl lg:text-7xl font-black leading-none" style={{ color: '#D9FF00' }}
          >
            Create beautiful events in minutes.
          </h2>
          <p className="text-xl lg:text-2xl text-white font-medium max-w-lg opacity-90">
            No design skills needed. Just drop in your details, pick a vibe, and you're ready to share your page with the world.
          </p>
          <Link href="/signup">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block mt-4">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold border-none" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}>
                Build your page
              </Button>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* 4. Community Section */}
      <section className="py-32 px-6 lg:px-12 text-center" style={{ backgroundColor: '#79001B' }}>
        <div className="max-w-4xl mx-auto space-y-6 mb-16">
          <h2 className="gsap-heading text-[clamp(3rem,6vw,6rem)] font-black leading-none" style={{ color: '#E8C8EC' }}>
            Turn events into communities.
          </h2>
          <p className="text-xl text-white opacity-80 max-w-2xl mx-auto font-medium">
            Keep the conversation going long after the party ends. Chat with attendees, share photos, and hype up the next one.
          </p>
        </div>

        <div className="relative h-[500px] w-full max-w-5xl mx-auto">
          {/* Decorative collage built with framer-motion staggers */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute top-0 left-[10%] w-64 p-4 rounded-2xl shadow-xl z-20 gsap-parallax" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
          >
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#00B7FF' }}></div>
              <div>
                <div className="font-bold text-sm">Alex</div>
                <div className="text-sm opacity-80">This was the best meetup yet! When's the next one?</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="absolute top-20 right-[15%] w-72 p-6 rounded-3xl shadow-xl z-10 gsap-parallax" style={{ backgroundColor: '#58268C', color: 'white' }}
          >
            <div className="font-black text-xl mb-4">Post-event Discussion</div>
            <div className="space-y-3">
              <div className="h-3 w-full bg-white/20 rounded-full"></div>
              <div className="h-3 w-3/4 bg-white/20 rounded-full"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-10 left-[30%] w-[400px] p-6 rounded-3xl shadow-2xl z-30 gsap-parallax" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-2xl">Member Gallery</div>
              <div className="px-3 py-1 rounded-full bg-[#111827] text-white text-xs font-bold">12 New</div>
            </div>
            <div className="flex gap-2">
              <div className="w-1/3 aspect-square rounded-xl bg-black/10"></div>
              <div className="w-1/3 aspect-square rounded-xl bg-black/10"></div>
              <div className="w-1/3 aspect-square rounded-xl bg-black/10 flex items-center justify-center font-bold text-2xl">+4</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* A. Analytics Section */}
      <section className="py-32 px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-full lg:w-1/2 relative h-[600px] md:h-[500px]">
          <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
            {/* Card 1 */}
            <div className="metric-card bg-[#6F7450] rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden h-full">
              <motion.div whileHover={{ scale: 1.06, y: -4 }} className="metric-card-inner h-full flex flex-col justify-between cursor-default">
                <div className="text-5xl font-black tracking-tighter">12,847</div>
                <div className="text-lg font-bold opacity-90 mt-2">RSVPs Collected</div>
                <svg className="absolute bottom-0 right-0 w-full opacity-30 pointer-events-none" viewBox="0 0 200 50" preserveAspectRatio="none">
                  <path d="M0,50 Q50,0 100,50 T200,50 L200,100 L0,100 Z" fill="currentColor" />
                </svg>
              </motion.div>
            </div>
            {/* Card 2 */}
            <div className="metric-card bg-[#E8C8EC] rounded-3xl p-6 text-[#111827] dark:text-foreground shadow-lg h-full" style={{ marginTop: '40px' }}>
              <motion.div whileHover={{ scale: 1.06, y: -4 }} className="metric-card-inner h-full flex flex-col justify-between cursor-default">
                <div className="w-12 h-12 bg-white dark:bg-card dark:text-card-foreground rounded-full flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path></svg>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter">4,291</div>
                  <div className="text-lg font-bold opacity-80 mt-1">Tickets Sold</div>
                </div>
              </motion.div>
            </div>
            {/* Card 3 */}
            <div className="metric-card bg-[#FF00B7] rounded-3xl p-6 text-white shadow-lg h-full" style={{ marginTop: '-20px' }}>
              <motion.div whileHover={{ scale: 1.06, y: -4 }} className="metric-card-inner h-full flex flex-col justify-between cursor-default">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">$</span>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter">68%</div>
                  <div className="text-lg font-bold opacity-90 mt-1">Return Guests</div>
                </div>
              </motion.div>
            </div>
            {/* Card 4 */}
            <div className="metric-card bg-[#111827] rounded-3xl p-6 text-white shadow-lg h-full" style={{ marginTop: '20px' }}>
              <motion.div whileHover={{ scale: 1.06, y: -4 }} className="metric-card-inner h-full flex flex-col justify-between cursor-default">
                <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full">
                  <div className="w-4 h-4 bg-[#00B7FF] rounded-full"></div>
                  <span className="text-xs font-bold">New York, USA</span>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter" style={{ color: '#D9FF00' }}>3,200</div>
                  <div className="text-lg font-bold opacity-80 mt-1">Communities</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-8 pl-0 lg:pl-10">
          <h2 className="gsap-heading text-5xl lg:text-7xl font-black leading-none" style={{ color: "var(--foreground)" }}>
            Analyze your community and grow it.
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 font-medium max-w-lg">
            Get real-time insights into ticket sales, RSVP sources, and attendee retention. Know exactly what your community wants.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block mt-4">
            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold" style={{ backgroundColor: '#111827', color: 'white' }}>
              View Demo Dashboard
            </Button>
          </motion.div>
        </div>
      </section>

      {/* C. Content / Features Grid Section */}
      <section className="flex flex-col lg:flex-row min-h-[800px]">
        {/* Left Column */}
        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center" style={{ backgroundColor: '#E8C8EC' }}>
          <div className="max-w-md mx-auto w-full space-y-16">

            {/* Mini Cards Row - Upgraded to Premium Post Previews */}
            <div className="flex justify-center gap-6 mb-10">
              <motion.div whileHover={{ y: -12, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-32 h-44 bg-white dark:bg-card dark:text-card-foreground rounded-3xl shadow-2xl p-3 flex flex-col gap-2 transform -rotate-6 cursor-pointer border border-gray-100 dark:border-border relative overflow-hidden">
                <div className="w-full h-24 bg-gradient-to-br from-[#2457FF] to-[#00B7FF] rounded-2xl flex items-center justify-center text-white/40">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <div className="flex -space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-gray-200 border border-white"></div>
                    <div className="w-4 h-4 rounded-full bg-gray-300 border border-white"></div>
                  </div>
                  <div className="text-[8px] font-black opacity-30 tracking-tighter">84 RSVPs</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -12, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-32 h-44 bg-[#101828] rounded-3xl shadow-2xl p-4 flex flex-col gap-3 transform translate-y-4 cursor-pointer border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#D9FF3F] rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/10 rounded-full"></div>
                  <div className="h-1.5 w-5/6 bg-white/10 rounded-full"></div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full"></div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -12, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-32 h-44 bg-[#FF00B7] rounded-3xl shadow-2xl p-3 flex flex-col items-center justify-center transform rotate-6 cursor-pointer relative">
                <div className="w-12 h-12 bg-white dark:bg-card dark:text-card-foreground rounded-full flex items-center justify-center shadow-lg group">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF00B7" strokeWidth="3" className="ml-1"><path d="M5 3l14 9-14 9V3z"></path></svg>
                </div>
                <div className="absolute bottom-4 text-[10px] font-black text-white uppercase tracking-widest">Tutorial</div>
              </motion.div>
            </div>

            <h3 className="gsap-heading text-4xl lg:text-5xl font-black leading-tight text-center" style={{ color: "var(--foreground)" }}>
              Share every type of content — events, tickets, video, community updates
            </h3>

            {/* Stacked Product Cards - Upgraded with Icons and Depth */}
            <div className="relative h-48 flex justify-center mt-12 feature-stagger">
              <motion.div whileHover={{ y: -10, scale: 1.04 }} className="absolute w-44 h-20 bg-[#00B7FF] rounded-2xl shadow-2xl flex items-center justify-between px-5 font-black text-[#101828] dark:text-foreground transform -rotate-12 -translate-x-16 cursor-pointer z-10 border-2 border-black/5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-40">Merch</span>
                  <span className="text-lg">T-Shirt</span>
                </div>
                <span className="text-xl">$30</span>
              </motion.div>
              <motion.div whileHover={{ y: -10, scale: 1.04 }} className="absolute w-44 h-20 bg-[#7A1029] rounded-2xl shadow-2xl flex items-center justify-between px-5 font-black text-white transform -rotate-3 -translate-y-4 cursor-pointer z-20 border-2 border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-40">Ticket</span>
                  <span className="text-lg">VIP Pass</span>
                </div>
                <span className="text-xl">$40</span>
              </motion.div>
              <motion.div whileHover={{ y: -10, scale: 1.04 }} className="absolute w-44 h-20 bg-[#D9FF3F] rounded-2xl shadow-2xl flex items-center justify-between px-5 font-black text-[#101828] dark:text-foreground transform rotate-6 translate-x-12 translate-y-2 cursor-pointer z-30 border-2 border-black/5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-40">Digital</span>
                  <span className="text-lg">Poster</span>
                </div>
                <span className="text-xl">$20</span>
              </motion.div>
              <motion.div whileHover={{ y: -10, scale: 1.04 }} className="absolute w-44 h-20 bg-[#7B5EA7] rounded-2xl shadow-2xl flex items-center justify-between px-5 font-black text-white transform rotate-12 translate-x-28 -translate-y-6 cursor-pointer z-40 border-2 border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-40">Access</span>
                  <span className="text-lg">Sticker</span>
                </div>
                <span className="text-xl">$10</span>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Right Column - Upgraded Device Mockup */}
        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex justify-center items-center relative overflow-hidden" style={{ backgroundColor: '#2457FF' }}>
          <div className="relative w-full max-w-[320px] aspect-[9/19] bg-[#F8F4EC] rounded-[50px] border-[12px] shadow-2xl p-6 z-10 overflow-hidden" style={{ borderColor: '#101828' }}>
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-10 px-8 flex justify-between items-center z-20">
              <span className="text-[10px] font-black text-[#101828] dark:text-foreground">9:41</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-[#101828] rounded-sm opacity-20"></div>
                <div className="w-3 h-3 bg-[#101828] rounded-sm opacity-20"></div>
                <div className="w-5 h-2.5 bg-[#101828] rounded-sm opacity-80 mt-0.5"></div>
              </div>
            </div>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#101828] rounded-b-2xl z-30"></div>
            <div className="flex flex-col items-center mt-12 space-y-4">
              <div className="w-24 h-24 bg-gradient-to-tr from-[#FF00B7] to-[#7B5EA7] rounded-full shadow-lg border-4 border-white"></div>
              <div className="text-center">
                <h4 className="text-2xl font-black flex items-center gap-1 justify-center" style={{ color: "var(--foreground)" }}>
                  @emilio
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#2457FF"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM10 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"></path></svg>
                </h4>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#101828] dark:text-foreground/40 mt-1">Creator & Artist</div>
              </div>
              <div className="flex gap-2 py-2">
                <div className="w-10 h-10 bg-[#101828]/5 rounded-2xl flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>
                <div className="w-10 h-10 bg-[#101828]/5 rounded-2xl flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></div>
                <div className="w-10 h-10 bg-[#101828]/5 rounded-2xl flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></div>
              </div>

              <div className="w-full space-y-3 mt-4">
                <motion.div whileHover={{ x: 4 }} className="w-full h-14 bg-white dark:bg-card dark:text-card-foreground rounded-2xl shadow-sm border border-black/5 flex items-center justify-between px-6 font-black text-sm text-[#101828] dark:text-foreground cursor-pointer">
                  <span>Next Show Tickets</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </motion.div>
                <motion.div whileHover={{ x: 4 }} className="w-full h-14 bg-white dark:bg-card dark:text-card-foreground rounded-2xl shadow-sm border border-black/5 flex items-center justify-between px-6 font-black text-sm text-[#101828] dark:text-foreground cursor-pointer">
                  <span>Listen to New EP</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </motion.div>
                <motion.div whileHover={{ x: 4 }} className="w-full h-14 bg-white dark:bg-card dark:text-card-foreground rounded-2xl shadow-sm border border-black/5 flex items-center justify-between px-6 font-black text-sm text-[#101828] dark:text-foreground cursor-pointer">
                  <span>Merch Store</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[5%] top-[25%] bg-[#D9FF3F] rounded-2xl p-5 shadow-2xl z-20 hidden sm:block border-2 border-[#101828]/10"
          >
            <div className="font-black text-2xl text-[#101828] dark:text-foreground">23</div>
            <div className="text-xs font-black uppercase tracking-widest text-[#101828] dark:text-foreground/60">Emails received</div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute right-[5%] bottom-[25%] bg-white dark:bg-card dark:text-card-foreground rounded-3xl p-6 shadow-2xl z-20 w-56 hidden sm:block border border-gray-100 dark:border-border"
          >
            <div className="text-xs font-black uppercase tracking-widest text-[#101828] dark:text-foreground/40 mb-3">RSVP Questions</div>
            <div className="w-full h-10 bg-gray-50 dark:bg-muted rounded-xl mb-3 flex items-center px-3 text-[10px] font-bold text-gray-400">Your favorite artist?</div>
            <Button className="w-full h-10 text-xs font-black bg-[#2457FF] text-white rounded-xl shadow-lg shadow-blue-500/20">Save Questions</Button>
          </motion.div>
        </div>
      </section>

      {/* B. Social Proof Section with Portrait Cards */}
      <section className="py-24 overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
          className="max-w-4xl mx-auto text-center px-6 mb-16"
        >
          <h2 className="gsap-heading text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight" style={{ color: "var(--foreground)" }}>
            The events platform trusted by <span style={{ color: '#2457FF' }}>creators</span> worldwide.
          </h2>
        </motion.div>

        <div className="w-full overflow-x-auto pb-10 hide-scrollbar flex justify-center">
          <div className="flex px-10 gap-4 min-w-max items-center justify-center mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
              className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform rotate-2 cursor-pointer transition-colors" style={{ backgroundColor: '#2457FF' }}
            >
              <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: "var(--foreground)" }}>
                DJ Emilio — Artist
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
              className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform -rotate-1 -translate-y-4 cursor-pointer transition-colors" style={{ backgroundColor: '#101828' }}
            >
              <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: "var(--foreground)" }}>
                Studio Clay — Brand
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
              className="w-48 h-64 rounded-[2rem] p-4 flex flex-col justify-between items-center shadow-xl transform rotate-3 cursor-pointer transition-colors" style={{ backgroundColor: '#7A1029' }}
            >
              <div className="mt-8 w-20 h-20 bg-white dark:bg-card dark:text-card-foreground rounded-full flex items-center justify-center font-black text-xl" style={{ color: '#2457FF' }}>BFC</div>
              <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: "var(--foreground)" }}>
                Brooklyn FC — Sports
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
              className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform -rotate-2 -translate-y-2 cursor-pointer transition-colors" style={{ backgroundColor: '#D9FF3F' }}
            >
              <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: "var(--foreground)" }}>
                Aisha K. — Creator
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
              className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform rotate-1 cursor-pointer transition-colors" style={{ backgroundColor: '#D9FF3F' }}
            >
              <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: "var(--foreground)" }}>
                The Archive — Club
              </div>
            </motion.div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
      </section>

      {/* D. Testimonial Section - Auto-playing Carousel */}
      <section className="py-32 px-6 lg:px-12 flex flex-col items-center text-center bg-white dark:bg-card dark:text-card-foreground relative overflow-hidden">

        <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-12 z-20 cursor-pointer" onClick={() => setTestimonialStep(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}>
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:bg-muted transition-colors">←</div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-12 z-20 cursor-pointer" onClick={() => setTestimonialStep(prev => (prev + 1) % TESTIMONIALS.length)}>
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:bg-muted transition-colors">→</div>
        </div>

        <div className="max-w-4xl min-h-[400px] flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-48 h-48 mb-12">
                {/* Abstract background shape */}
                <div className="absolute top-0 right-0 w-32 h-40 rounded-full transform rotate-45 mix-blend-multiply" style={{ backgroundColor: TESTIMONIALS[testimonialStep].bg2 }}></div>
                {/* Foreground portrait shape */}
                <div className="absolute bottom-0 left-0 w-40 h-48 rounded-[40px] transform -rotate-12 shadow-2xl z-10" style={{ backgroundColor: TESTIMONIALS[testimonialStep].bg1 }}></div>
              </div>

              <div className="space-y-8">
                <h2 className="gsap-heading text-4xl md:text-5xl lg:text-6xl font-black leading-tight" style={{ color: "var(--foreground)" }}>
                  "{TESTIMONIALS[testimonialStep].quote}"
                </h2>
                <p className="text-xl font-bold opacity-60" style={{ color: "var(--foreground)" }}>
                  — {TESTIMONIALS[testimonialStep].author}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <div
              key={i}
              onClick={() => setTestimonialStep(i)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all ${testimonialStep === i ? 'bg-[#111827]' : 'bg-gray-200 hover:bg-gray-300'}`}
            />
          ))}
        </div>
      </section>

      {/* E. FAQ Section */}
      <section className="py-32 px-6 lg:px-12" style={{ backgroundColor: '#79001B' }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto space-y-12"
        >
          <h2 className="gsap-heading text-5xl md:text-6xl font-black text-center text-white">
            Common Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-4 w-full" onValueChange={setActiveFaq}>
            {[
              "How is Meow different from Eventbrite?",
              "Is Meow free to use?",
              "Can I sell tickets through Meow?",
              "How do communities work on Meow?",
              "Can I embed my Meow page elsewhere?"
            ].map((q, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className={`bg-white dark:bg-card dark:text-card-foreground rounded-3xl px-6 border-none transition-all duration-300 ${activeFaq === `item-${i}` ? 'border-l-4 border-l-[#D9FF00]' : 'border-l-4 border-l-transparent'}`}
              >
                <AccordionTrigger className="text-xl font-bold py-6 hover:no-underline" style={{ color: "var(--foreground)" }}>
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-lg font-medium opacity-80 pb-6" style={{ color: "var(--foreground)" }}>
                  We built Meow for creators who want to own their audience. It's beautiful, fast, and gives you full control over your community data. Sign up to see the difference.
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* 10. Final CTA Section */}
      <section className="py-40 px-6 text-center" style={{ backgroundColor: '#58268C' }}>
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="gsap-heading text-[clamp(3.5rem,7vw,7rem)] font-black leading-none text-white tracking-tighter">
            Start your next gathering with Meow.
          </h2>
          <p className="text-2xl text-white/80 font-medium">Claim your link and host your first event today.</p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-xl mx-auto mt-8 bg-white dark:bg-card dark:text-card-foreground p-2 rounded-full shadow-2xl transition-all focus-within:border-2 focus-within:border-[#D9FF00]">
            <div className="flex-1 flex items-center px-4 w-full sm:w-auto">
              <span className="text-xl font-bold opacity-40 mr-1" style={{ color: "var(--foreground)" }}>meow.so/</span>
              <input
                type="text"
                placeholder="yourname"
                className="text-xl font-bold w-full outline-none bg-transparent"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold w-full sm:w-auto" style={{ backgroundColor: '#D9FF00', color: "var(--foreground)" }}>
                  Claim Link
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="py-20 px-6" style={{ backgroundColor: '#D9FF3F' }}>
        <div className="max-w-[1200px] mx-auto bg-white dark:bg-card dark:text-card-foreground rounded-[40px] p-12 shadow-sm border border-gray-100 dark:border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold mb-4" style={{ color: "var(--foreground)" }}>Company</h4>
              <ul className="space-y-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                <li>About</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Press</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "var(--foreground)" }}>Community</h4>
              <ul className="space-y-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                <li>Creators</li>
                <li>Brands</li>
                <li>Events</li>
                <li>Directory</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "var(--foreground)" }}>Support</h4>
              <ul className="space-y-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                <li>Help Center</li>
                <li>Trust & Safety</li>
                <li>Guidelines</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "var(--foreground)" }}>Legal</h4>
              <ul className="space-y-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                <li>Privacy</li>
                <li>Terms</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <Link href="/" className="flex items-center">
                <img src="/meowlogo2.png" alt="MEOW" className="h-16 md:h-20 w-auto object-contain" />
              </Link>
              <div className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase pl-1">
                Meet • Engage • Organize • Welcome
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline" className="rounded-full font-bold border-2 border-[#101828] text-[#101828] dark:text-foreground">Log in</Button>
              </Link>
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button className="rounded-full font-bold px-8 border-none" style={{ backgroundColor: '#101828', color: '#D9FF3F' }}>Get Started</Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 sm:mt-20 overflow-hidden py-5 sm:py-10">
          <div className="flex justify-center items-end gap-0 px-1 sm:px-4 max-w-[1400px] mx-auto">
            {[
              { letter: 'M', word: 'Meet' },
              { letter: 'E', word: 'Engage' },
              { letter: 'O', word: 'Organize', image: '/meowimage.png' },
              { letter: 'W', word: 'Welcome' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center px-0.5 sm:px-2 relative"
              >
                <div className="relative flex items-center justify-center">
                  <span className="text-[24vw] sm:text-[25vw] font-black tracking-tighter leading-none text-[#101828] dark:text-foreground select-none">
                    {item.letter}
                  </span>
                  {item.image && (
                    <motion.img
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                      src={item.image}
                      className="absolute w-[15vw] sm:w-[16vw] h-[15vw] sm:h-[16vw] object-cover rounded-full border-2 sm:border-4 border-[#101828] bg-[#D9FF3F]"
                      alt="Cat"
                    />
                  )}
                </div>
                <span className="text-[2.2vw] sm:text-[1vw] font-black tracking-tighter sm:tracking-[0.2em] uppercase text-[#101828] dark:text-foreground/60 mt-[-1vw] sm:mt-[-2vw]">
                  {item.word}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

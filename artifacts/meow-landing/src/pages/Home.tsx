import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
      gsap.utils.toArray('.metric-card').forEach((card: any, i) => {
        gsap.to(card, {
          y: -15,
          duration: 2 + (i % 3) * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });

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
      
      {/* 1. Floating Navbar */}
      <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-[1200px] z-50 px-4">
        <div className="nav-inner bg-white text-navy flex items-center justify-between px-6 py-4 rounded-full shadow-lg border border-gray-100 transition-all">
          <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
            MEOW
          </Link>
          <div className="hidden md:flex items-center gap-6 font-medium text-sm" style={{ color: '#111827' }}>
            <span className="hover:text-primary cursor-pointer transition-colors">Discover</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Events</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Communities</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Creators</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full hidden sm:inline-flex" style={{ color: '#111827' }}>Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full font-bold px-6 border-none" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section ref={heroRef} className="min-h-[100svh] pt-32 pb-20 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden" style={{ backgroundColor: '#D9FF00' }}>
        <div className="w-full lg:w-1/2 z-10 space-y-8 max-w-2xl pt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(4rem,8vw,8rem)] leading-[0.9] font-black tracking-tighter" style={{ color: '#111827' }}
          >
            Host events your people actually remember.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl max-w-lg font-medium opacity-90" style={{ color: '#111827' }}
          >
            Create beautiful pages, collect RSVPs effortlessly, and turn one-off moments into thriving communities.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="rounded-full h-16 px-8 text-lg font-bold border-none w-full sm:w-auto" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
                Create an Event
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full h-16 px-8 text-lg font-bold border-2 bg-transparent hover:bg-[#111827]/10 w-full sm:w-auto" style={{ borderColor: '#111827', color: '#111827' }}>
              See Pricing
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex items-center gap-3 pt-4"
          >
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#D9FF00] bg-gray-300 overflow-hidden" style={{ backgroundColor: i%2===0 ? '#E8C8EC' : '#F3F0E8' }} />
              ))}
            </div>
            <span className="font-bold text-sm" style={{ color: '#111827' }}>10,000+ events hosted this week</span>
          </motion.div>
        </div>

        <div className="w-full lg:w-1/2 relative h-[600px] mt-16 lg:mt-0">
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [-2, 0, -2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-64 p-6 rounded-3xl shadow-2xl z-20 gsap-parallax" style={{ backgroundColor: '#2856E8', color: 'white' }}
          >
            <div className="text-sm font-bold mb-2 opacity-80">TONIGHT</div>
            <div className="text-2xl font-black mb-4 leading-tight">Design Drink & Draw</div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>RSVP</div>
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20">34 Attending</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [2, 1, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 right-10 w-72 p-6 rounded-3xl shadow-2xl z-10 gsap-parallax" style={{ backgroundColor: '#E8C8EC', color: '#111827' }}
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
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-20 left-20 w-56 p-5 rounded-3xl shadow-2xl z-30 gsap-parallax" style={{ backgroundColor: '#F3F0E8', color: '#111827' }}
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
      <div className="w-full overflow-hidden bg-navy py-4 border-y-2" style={{ backgroundColor: '#111827', borderColor: '#D9FF00' }}>
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee 20s linear infinite' }}>
           {[...Array(10)].map((_, i) => (
             <div key={i} className="flex items-center mx-4">
               <span className="text-2xl font-black" style={{ color: '#D9FF00' }}>NO HIDDEN FEES</span>
               <span className="mx-4 text-white text-2xl">•</span>
               <span className="text-2xl font-black text-white">GET PAID INSTANTLY</span>
               <span className="mx-4 text-white text-2xl">•</span>
             </div>
           ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      {/* 3. Create events fast Section */}
      <section className="py-32 px-6 lg:px-12 flex flex-col-reverse lg:flex-row items-center gap-16" style={{ backgroundColor: '#2856E8' }}>
        <div className="w-full lg:w-1/2 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-[300px] h-[600px] rounded-[40px] border-8 shadow-2xl bg-white relative overflow-hidden"
            style={{ borderColor: '#111827' }}
          >
            <div className="absolute top-0 w-full h-6 flex justify-center pt-2">
              <div className="w-20 h-4 rounded-full" style={{ backgroundColor: '#111827' }}></div>
            </div>
            <div className="mt-12 px-4 space-y-4">
              <div className="h-48 rounded-2xl w-full" style={{ backgroundColor: '#D9FF00' }}></div>
              <div className="h-8 w-3/4 rounded-lg bg-gray-100"></div>
              <div className="h-4 w-1/2 rounded-lg bg-gray-100"></div>
              <div className="pt-4 space-y-2">
                <div className="h-12 w-full rounded-xl bg-gray-100 flex items-center px-4 gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                </div>
                <div className="h-12 w-full rounded-xl bg-gray-100 flex items-center px-4 gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                </div>
              </div>
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
            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold border-none mt-4 hover:scale-105 transition-transform" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
              Build your page
            </Button>
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
            className="absolute top-0 left-[10%] w-64 p-4 rounded-2xl shadow-xl z-20 gsap-parallax" style={{ backgroundColor: '#F3F0E8', color: '#111827' }}
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
            className="absolute bottom-10 left-[30%] w-[400px] p-6 rounded-3xl shadow-2xl z-30 gsap-parallax" style={{ backgroundColor: '#D9FF00', color: '#111827' }}
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
      <section className="py-32 px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16" style={{ backgroundColor: '#F3F0E8' }}>
        <div className="w-full lg:w-1/2 relative h-[600px] md:h-[500px]">
           <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
             {/* Card 1 */}
             <div className="metric-card bg-[#6F7450] rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden h-full">
                <div className="text-5xl font-black tracking-tighter">12,847</div>
                <div className="text-lg font-bold opacity-90 mt-2">RSVPs Collected</div>
                <svg className="absolute bottom-0 right-0 w-full opacity-30" viewBox="0 0 200 50" preserveAspectRatio="none">
                  <path d="M0,50 Q50,0 100,50 T200,50 L200,100 L0,100 Z" fill="currentColor"/>
                </svg>
             </div>
             {/* Card 2 */}
             <div className="metric-card bg-[#E8C8EC] rounded-3xl p-6 text-[#111827] flex flex-col justify-between shadow-lg h-full" style={{ marginTop: '40px' }}>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path></svg>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter">4,291</div>
                  <div className="text-lg font-bold opacity-80 mt-1">Tickets Sold</div>
                </div>
             </div>
             {/* Card 3 */}
             <div className="metric-card bg-[#FF00B7] rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg h-full" style={{ marginTop: '-20px' }}>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">$</span>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter">68%</div>
                  <div className="text-lg font-bold opacity-90 mt-1">Return Guests</div>
                </div>
             </div>
             {/* Card 4 */}
             <div className="metric-card bg-[#111827] rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg h-full" style={{ marginTop: '20px' }}>
                <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full">
                  <div className="w-4 h-4 bg-[#00B7FF] rounded-full"></div>
                  <span className="text-xs font-bold">New York, USA</span>
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter" style={{ color: '#D9FF00' }}>3,200</div>
                  <div className="text-lg font-bold opacity-80 mt-1">Communities</div>
                </div>
             </div>
           </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-8 pl-0 lg:pl-10">
          <h2 className="gsap-heading text-5xl lg:text-7xl font-black leading-none" style={{ color: '#111827' }}>
            Analyze your community and grow it.
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 font-medium max-w-lg">
            Get real-time insights into ticket sales, RSVP sources, and attendee retention. Know exactly what your community wants.
          </p>
          <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold mt-4" style={{ backgroundColor: '#111827', color: 'white' }}>
            View Demo Dashboard
          </Button>
        </div>
      </section>

      {/* C. Content / Features Grid Section */}
      <section className="flex flex-col lg:flex-row min-h-[800px]">
        {/* Left Column */}
        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center" style={{ backgroundColor: '#E8C8EC' }}>
           <div className="max-w-md mx-auto w-full space-y-16">
             
             {/* Mini Cards Row */}
             <div className="flex justify-center gap-4">
                <div className="w-24 h-32 bg-white rounded-2xl shadow-xl p-2 flex flex-col gap-2 transform -rotate-6">
                  <div className="w-full h-16 bg-[#2856E8] rounded-xl"></div>
                  <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                  <div className="h-2 w-2/3 bg-gray-200 rounded-full"></div>
                </div>
                <div className="w-24 h-32 bg-[#111827] rounded-2xl shadow-xl p-3 flex flex-col gap-3 transform translate-y-4">
                  <div className="h-2 w-full bg-gray-700 rounded-full"></div>
                  <div className="h-2 w-5/6 bg-gray-700 rounded-full"></div>
                  <div className="h-2 w-full bg-gray-700 rounded-full"></div>
                  <div className="h-2 w-4/6 bg-gray-700 rounded-full"></div>
                </div>
                <div className="w-24 h-32 bg-[#FF00B7] rounded-2xl shadow-xl p-2 flex items-center justify-center transform rotate-6">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center pl-1">
                    <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-[#FF00B7] border-b-4 border-b-transparent"></div>
                  </div>
                </div>
             </div>

             <h3 className="gsap-heading text-4xl lg:text-5xl font-black leading-tight text-center" style={{ color: '#111827' }}>
               Share every type of content — events, tickets, video, community updates
             </h3>

             {/* Stacked Cards */}
             <div className="relative h-40 flex justify-center mt-12">
               <div className="absolute w-40 h-16 bg-[#00B7FF] rounded-xl shadow-lg flex items-center justify-between px-4 font-bold text-navy transform -rotate-12 -translate-x-12">
                 <span>T-Shirt</span><span>$30</span>
               </div>
               <div className="absolute w-40 h-16 bg-[#79001B] rounded-xl shadow-lg flex items-center justify-between px-4 font-bold text-white transform -rotate-3 -translate-y-4">
                 <span>VIP Pass</span><span>$40</span>
               </div>
               <div className="absolute w-40 h-16 bg-[#D9FF00] rounded-xl shadow-lg flex items-center justify-between px-4 font-bold text-navy transform rotate-6 translate-x-10 translate-y-2">
                 <span>Poster</span><span>$20</span>
               </div>
               <div className="absolute w-40 h-16 bg-[#58268C] rounded-xl shadow-lg flex items-center justify-between px-4 font-bold text-white transform rotate-12 translate-x-24 -translate-y-6">
                 <span>Sticker</span><span>$10</span>
               </div>
             </div>

           </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex justify-center items-center relative overflow-hidden" style={{ backgroundColor: '#2856E8' }}>
            <div className="relative w-full max-w-[320px] aspect-[9/19] bg-[#F3F0E8] rounded-[40px] border-8 shadow-2xl p-6 z-10" style={{ borderColor: '#111827' }}>
               <div className="flex flex-col items-center mt-8 space-y-4">
                 <div className="w-24 h-24 bg-[#FF00B7] rounded-full"></div>
                 <h4 className="text-2xl font-black" style={{ color: '#111827' }}>@emilio</h4>
                 <div className="flex gap-2">
                   <div className="w-8 h-8 bg-black/10 rounded-full"></div>
                   <div className="w-8 h-8 bg-black/10 rounded-full"></div>
                   <div className="w-8 h-8 bg-black/10 rounded-full"></div>
                 </div>
                 
                 <div className="w-full space-y-3 mt-4">
                   <div className="w-full h-14 bg-white rounded-xl shadow-sm flex items-center px-4 font-bold text-sm">Next Show Tickets</div>
                   <div className="w-full h-14 bg-white rounded-xl shadow-sm flex items-center px-4 font-bold text-sm">Listen to New EP</div>
                   <div className="w-full h-14 bg-white rounded-xl shadow-sm flex items-center px-4 font-bold text-sm">Merch Store</div>
                 </div>
               </div>
            </div>

            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[5%] top-[25%] bg-[#D9FF00] rounded-2xl p-4 shadow-xl z-20 hidden sm:block"
            >
              <div className="font-black text-xl" style={{ color: '#111827' }}>23</div>
              <div className="text-sm font-bold opacity-80" style={{ color: '#111827' }}>Emails received</div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-[5%] bottom-[25%] bg-white rounded-2xl p-5 shadow-xl z-20 w-48 hidden sm:block"
            >
              <div className="text-sm font-bold mb-2" style={{ color: '#111827' }}>Add a question</div>
              <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
              <Button className="w-full h-8 text-xs font-bold bg-[#2856E8] text-white rounded">Save</Button>
            </motion.div>
        </div>
      </section>

      {/* B. Social Proof Section with Portrait Cards */}
      <section className="py-24 overflow-hidden" style={{ backgroundColor: '#F3F0E8' }}>
         <div className="max-w-4xl mx-auto text-center px-6 mb-16">
           <h2 className="gsap-heading text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight" style={{ color: '#111827' }}>
             The events platform trusted by <span style={{ color: '#2856E8' }}>creators</span> worldwide.
           </h2>
         </div>
         
         <div className="w-full overflow-x-auto pb-10 hide-scrollbar flex justify-center">
           <div className="flex px-10 gap-4 min-w-max items-center justify-center mx-auto">
             
             <div className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform rotate-2" style={{ backgroundColor: '#00B7FF' }}>
               <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: '#111827' }}>
                 DJ Emilio — Artist
               </div>
             </div>
             
             <div className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform -rotate-1 -translate-y-4" style={{ backgroundColor: '#111827' }}>
               <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: '#111827' }}>
                 Studio Clay — Brand
               </div>
             </div>

             <div className="w-48 h-64 rounded-[2rem] p-4 flex flex-col justify-between items-center shadow-xl transform rotate-3" style={{ backgroundColor: '#E8C8EC' }}>
               <div className="mt-8 w-20 h-20 bg-white rounded-full flex items-center justify-center font-black text-xl" style={{ color: '#2856E8' }}>BFC</div>
               <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: '#111827' }}>
                 Brooklyn FC — Sports
               </div>
             </div>

             <div className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform -rotate-2 -translate-y-2" style={{ backgroundColor: '#D2B48C' }}>
               <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: '#111827' }}>
                 Aisha K. — Creator
               </div>
             </div>

             <div className="w-48 h-64 rounded-[2rem] p-4 flex items-end shadow-xl transform rotate-1" style={{ backgroundColor: '#D9FF00' }}>
               <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-bold w-full text-center truncate" style={{ color: '#111827' }}>
                 The Archive — Club
               </div>
             </div>

           </div>
         </div>
         <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
      </section>

      {/* D. Testimonial Section */}
      <section className="py-32 px-6 lg:px-12 flex flex-col items-center text-center bg-white">
        <div className="relative w-48 h-48 mb-12">
          {/* Abstract background shape */}
          <div className="absolute top-0 right-0 w-32 h-40 rounded-full transform rotate-45 mix-blend-multiply" style={{ backgroundColor: '#FF6B00' }}></div>
          {/* Foreground portrait shape */}
          <div className="absolute bottom-0 left-0 w-40 h-48 rounded-[40px] transform -rotate-12 shadow-2xl z-10" style={{ backgroundColor: '#2D4A22' }}></div>
        </div>
        
        <div className="max-w-4xl space-y-8">
          <h2 className="gsap-heading text-4xl md:text-5xl lg:text-6xl font-black leading-tight" style={{ color: '#111827' }}>
            "Meow turned our random meetups into a thriving creative community."
          </h2>
          <p className="text-xl font-bold opacity-60" style={{ color: '#111827' }}>
            — Marcus Chen, Co-founder of The Archive Collective
          </p>
        </div>
      </section>

      {/* E. FAQ Section */}
      <section className="py-32 px-6 lg:px-12" style={{ backgroundColor: '#79001B' }}>
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="gsap-heading text-5xl md:text-6xl font-black text-center text-white">
            Common Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4 w-full">
            {[
              "How is Meow different from Eventbrite?",
              "Is Meow free to use?",
              "Can I sell tickets through Meow?",
              "How do communities work on Meow?",
              "Can I embed my Meow page elsewhere?"
            ].map((q, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-white rounded-3xl px-6 border-none">
                <AccordionTrigger className="text-xl font-bold py-6 hover:no-underline" style={{ color: '#111827' }}>
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-lg font-medium opacity-80 pb-6" style={{ color: '#111827' }}>
                  We built Meow for creators who want to own their audience. It's beautiful, fast, and gives you full control over your community data. Sign up to see the difference.
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 10. Final CTA Section */}
      <section className="py-40 px-6 text-center" style={{ backgroundColor: '#58268C' }}>
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="gsap-heading text-[clamp(3.5rem,7vw,7rem)] font-black leading-none text-white tracking-tighter">
            Start your next gathering with Meow.
          </h2>
          <p className="text-2xl text-white/80 font-medium">Claim your link and host your first event today.</p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-xl mx-auto mt-8 bg-white p-2 rounded-full shadow-2xl">
            <div className="flex-1 flex items-center px-4 w-full sm:w-auto">
              <span className="text-xl font-bold opacity-40 mr-1" style={{ color: '#111827' }}>meow.so/</span>
              <input 
                type="text" 
                placeholder="yourname" 
                className="text-xl font-bold w-full outline-none bg-transparent" 
                style={{ color: '#111827' }}
              />
            </div>
            <Link href="/signup">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold w-full sm:w-auto" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
                Claim Link
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="p-6" style={{ backgroundColor: '#F3F0E8' }}>
        <div className="max-w-[1200px] mx-auto bg-white rounded-[40px] p-12 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#111827' }}>Company</h4>
              <ul className="space-y-3 text-sm font-medium opacity-70">
                <li>About</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Press</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#111827' }}>Community</h4>
              <ul className="space-y-3 text-sm font-medium opacity-70">
                <li>Creators</li>
                <li>Brands</li>
                <li>Events</li>
                <li>Directory</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#111827' }}>Support</h4>
              <ul className="space-y-3 text-sm font-medium opacity-70">
                <li>Help Center</li>
                <li>Trust & Safety</li>
                <li>Guidelines</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#111827' }}>Legal</h4>
              <ul className="space-y-3 text-sm font-medium opacity-70">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-4xl font-black tracking-tight" style={{ color: '#111827' }}>MEOW</Link>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full font-bold">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full font-bold px-8" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

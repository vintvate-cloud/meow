import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen w-full font-sans bg-background text-foreground overflow-x-hidden">
      
      {/* 1. Floating Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-[1200px] z-50 px-4">
        <div className="bg-white text-navy flex items-center justify-between px-6 py-3 rounded-full shadow-lg border border-gray-100">
          <div className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
            MEOW
          </div>
          <div className="hidden md:flex items-center gap-6 font-medium text-sm" style={{ color: '#111827' }}>
            <span className="hover:text-primary cursor-pointer transition-colors">Discover</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Events</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Communities</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Creators</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-full hidden sm:inline-flex" style={{ color: '#111827' }}>Log in</Button>
            <Button className="rounded-full font-bold px-6 border-none" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="min-h-[100svh] pt-32 pb-20 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden" style={{ backgroundColor: '#D9FF00' }}>
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
            <Button size="lg" className="rounded-full h-16 px-8 text-lg font-bold border-none" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>
              Create an Event
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-16 px-8 text-lg font-bold border-2 bg-transparent hover:bg-[#111827]/10" style={{ borderColor: '#111827', color: '#111827' }}>
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
            className="absolute top-10 left-10 w-64 p-6 rounded-3xl shadow-2xl z-20" style={{ backgroundColor: '#2856E8', color: 'white' }}
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
            className="absolute top-40 right-10 w-72 p-6 rounded-3xl shadow-2xl z-10" style={{ backgroundColor: '#E8C8EC', color: '#111827' }}
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
            className="absolute bottom-20 left-20 w-56 p-5 rounded-3xl shadow-2xl z-30" style={{ backgroundColor: '#F3F0E8', color: '#111827' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#D9FF00' }}></div>
              <div className="font-bold text-xl">QR Ticket</div>
            </div>
            <div className="w-full aspect-square rounded-xl opacity-20 border-4 border-dashed" style={{ borderColor: '#111827' }}></div>
          </motion.div>
        </div>
      </section>

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
          <motion.h2 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-5xl lg:text-7xl font-black leading-none" style={{ color: '#D9FF00' }}
          >
            Create beautiful events in minutes.
          </motion.h2>
          <p className="text-xl lg:text-2xl text-white font-medium max-w-lg opacity-90">
            No design skills needed. Just drop in your details, pick a vibe, and you're ready to share your page with the world.
          </p>
          <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold border-none mt-4" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
            Build your page
          </Button>
        </div>
      </section>

      {/* 4. Community Section */}
      <section className="py-32 px-6 lg:px-12 text-center" style={{ backgroundColor: '#79001B' }}>
        <div className="max-w-4xl mx-auto space-y-6 mb-16">
          <h2 className="text-[clamp(3rem,6vw,6rem)] font-black leading-none" style={{ color: '#E8C8EC' }}>
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
            className="absolute top-0 left-[10%] w-64 p-4 rounded-2xl shadow-xl z-20" style={{ backgroundColor: '#F3F0E8', color: '#111827' }}
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
            className="absolute top-20 right-[15%] w-72 p-6 rounded-3xl shadow-xl z-10" style={{ backgroundColor: '#58268C', color: 'white' }}
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
            className="absolute bottom-10 left-[30%] w-[400px] p-6 rounded-3xl shadow-2xl z-30" style={{ backgroundColor: '#D9FF00', color: '#111827' }}
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

      {/* 10. Final CTA Section */}
      <section className="py-40 px-6 text-center" style={{ backgroundColor: '#58268C' }}>
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="text-[clamp(3.5rem,7vw,7rem)] font-black leading-none text-white tracking-tighter">
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
            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold w-full sm:w-auto" style={{ backgroundColor: '#D9FF00', color: '#111827' }}>
              Claim Link
            </Button>
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
            <div className="text-4xl font-black tracking-tight" style={{ color: '#111827' }}>MEOW</div>
            <div className="flex gap-4">
              <Button variant="ghost" className="rounded-full font-bold">Log in</Button>
              <Button className="rounded-full font-bold px-8" style={{ backgroundColor: '#111827', color: '#D9FF00' }}>Get Started</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
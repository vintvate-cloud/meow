import re

path = r'd:\meow\Link-Hub\artifacts\meow-landing\src\pages\ManageEvent.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 2. AnimatedNumber Component
anim_num = '''
const AnimatedNumber = ({ value }: { value: number }) => (
  <AnimatePresence mode="popLayout">
    <motion.span
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="inline-block"
    >
      {value}
    </motion.span>
  </AnimatePresence>
);

export default function ManageEvent() {'''
if 'const AnimatedNumber' not in content:
    content = content.replace('export default function ManageEvent() {', anim_num)

# 3. Loading skeleton
skeleton = '''  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-24 md:pt-32 space-y-8 animate-pulse">
          <div className="h-8 bg-black/5 dark:bg-white/5 rounded-xl w-1/3 mb-4"></div>
          <div className="h-6 bg-black/5 dark:bg-white/5 rounded-lg w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-black/5 dark:bg-white/5 rounded-2xl"></div>
              <div className="h-40 bg-black/5 dark:bg-white/5 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-40 bg-black/5 dark:bg-white/5 rounded-2xl"></div>
              <div className="h-40 bg-black/5 dark:bg-white/5 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }'''
if 'animate-bounce' in content:
    start = content.find('  if (loading) {')
    end = content.find('  }', start) + 3
    content = content[:start] + skeleton + content[end:]

# 4. Framer motion tab transitions
content = content.replace('<TabsContent value="overview" className="outline-none m-0 p-0">', '<TabsContent value="overview" className="outline-none m-0 p-0">\n<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>')
content = content.replace('<TabsContent value="guests" className="outline-none m-0 p-0">', '<TabsContent value="guests" className="outline-none m-0 p-0">\n<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>')
content = content.replace('<TabsContent value="settings" className="outline-none m-0 p-0">', '<TabsContent value="settings" className="outline-none m-0 p-0">\n<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>')

# Close motion divs
content = content.replace('                  </div>\n                </div>\n              </TabsContent>', '                  </div>\n                </div>\n</motion.div>\n              </TabsContent>')
content = content.replace('                  </div>\n                </Tabs>\n                </div>\n              </TabsContent>', '                  </div>\n                </Tabs>\n                </div>\n</motion.div>\n              </TabsContent>')


# 5. Pulsing live indicator
content = content.replace(
'''<div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white uppercase" style={{ backgroundColor: event.color || "#2856E8" }}>
                    Active
                  </span>''',
'''<div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5" style={{ backgroundColor: event.color || "#2856E8" }}>
                    {new Date(event.date || event.startDate).toDateString() === new Date().toDateString() && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                    Active
                  </span>'''
)

# 6. Capacity Progress Bar in Overview
perf_bar = '''
                    {event.capacity && (
                      <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-3">
                        <div className="flex justify-between items-end">
                          <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <Users className="w-4 h-4 text-gray-400" /> Event Capacity
                          </h3>
                          <span className="text-xs font-bold text-gray-500"><AnimatedNumber value={attendees.length} /> / {event.capacity}</span>
                        </div>
                        <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (attendees.length / event.capacity) * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${attendees.length / event.capacity >= 1 ? 'bg-red-500' : attendees.length / event.capacity > 0.8 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                      </div>
                    )}
'''
content = content.replace('                {/* Conversion */}', perf_bar + '\n                {/* Conversion */}')

# 7. Animated Numbers
content = content.replace('{attendees.length}', '<AnimatedNumber value={attendees.length} />')
content = content.replace('{attendees.filter(a => a.confirmationSent).length}', '<AnimatedNumber value={attendees.filter(a => a.confirmationSent).length} />')
content = content.replace('{attendees.filter(a => !a.confirmationSent).length}', '<AnimatedNumber value={attendees.filter(a => !a.confirmationSent).length} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")

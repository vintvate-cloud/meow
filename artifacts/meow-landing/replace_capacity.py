import sys
import re

with open('d:/meow/Link-Hub/artifacts/meow-landing/src/pages/CreateEvent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'>Ticket Limit<', r'>Tickets For Sale<', content)

# insert the new capacity input right before "Host UPI QR Code"
insert_str = """
                  <div className="space-y-1 mt-4">
                    <label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Total Venue Capacity (Optional)</label>
                    <Input 
                      type="number"
                      placeholder="Unlimited if empty"
                      value={formData.capacity}
                      onChange={e => setFormData({...formData, capacity: e.target.value})}
                      className="h-10 bg-current/5 border-current/10 rounded-xl font-bold"
                    />
                    <p className="text-[9px] opacity-60 font-medium">Internal tracking for your dashboard.</p>
                  </div>
"""

# Find Host UPI QR Code
if "Host UPI QR Code" in content:
    parts = content.split('<label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Host UPI QR Code</label>')
    if len(parts) == 2:
        new_content = parts[0] + insert_str + '\n                    <label className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Host UPI QR Code</label>' + parts[1]
        with open('d:/meow/Link-Hub/artifacts/meow-landing/src/pages/CreateEvent.tsx', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Successfully added capacity field.')
    else:
        print('Could not find exact split point.')
else:
    print('Host UPI QR Code text not found.')

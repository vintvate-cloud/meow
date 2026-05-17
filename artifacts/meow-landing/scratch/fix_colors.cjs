const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-\[\#F3F0E8\](?!\s*dark:)/g, replace: 'bg-[#F3F0E8] dark:bg-background' },
  { regex: /text-\[\#101828\](?!\s*dark:)/g, replace: 'text-[#101828] dark:text-foreground' },
  { regex: /text-\[\#111827\](?!\s*dark:)/g, replace: 'text-[#111827] dark:text-foreground' },
  { regex: /backgroundColor:\s*['"]#F3F0E8['"]/g, replace: 'backgroundColor: "var(--background)"' },
  { regex: /color:\s*['"]#101828['"]/g, replace: 'color: "var(--foreground)"' },
  { regex: /color:\s*['"]#111827['"]/g, replace: 'color: "var(--foreground)"' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (let r of replacements) {
    content = content.replace(r.regex, r.replace);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      if (!fullPath.includes('EventDetails.tsx')) {
        processFile(fullPath);
      }
    }
  }
}

traverse('src/pages');
processFile('src/components/Navigation.tsx');

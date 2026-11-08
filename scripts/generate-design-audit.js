import fs from 'fs';
import path from 'path';

// Simple script to scan for tailwind classes and generate an audit report
const srcDir = './src';
const auditFile = './design-audit-report.json';

const scanDir = (dir, results = { classes: new Set(), fonts: [], colors: [] }) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDir(filePath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract className from: "...", '...', template literals `...`, cva(...), cn(...)
      const patterns = [
        /className=["']([^"']+)["']/g,
        /className=\{`([^`]+)`\}/g,
        /\bcva\(["']([^"']+)["']/g,
        /\bcn\(["']([^"']+)["']/g,
      ];
      for (const re of patterns) {
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) {
          m[1].split(/\s+/).forEach(c => { if (c.trim()) results.classes.add(c.trim()); });
        }
      }
    }
  });
  
  return results;
};

const audit = scanDir(srcDir);
const report = {
  totalClassesFound: audit.classes.size,
  typographyClasses: Array.from(audit.classes).filter(c => c.startsWith('text-') || c.startsWith('font-')),
  spacingClasses: Array.from(audit.classes).filter(c => c.startsWith('p-') || c.startsWith('m-') || c.startsWith('gap-')),
  colorClasses: Array.from(audit.classes).filter(c => c.includes('bg-') || c.includes('text-') || c.includes('border-')),
  timestamp: new Date().toISOString()
};

fs.writeFileSync(auditFile, JSON.stringify(report, null, 2));
console.log('Design audit report generated at:', auditFile);

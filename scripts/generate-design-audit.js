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
          // Interpolações `${...}` de template literal não são classes.
          m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach(c => { if (c.trim()) results.classes.add(c.trim()); });
        }
      }
    }
  });
  
  return results;
};

if (!fs.existsSync(srcDir)) {
  console.error(`❌ ${srcDir} não encontrado — execute a partir da raiz do repositório.`);
  process.exit(1);
}

const audit = scanDir(srcDir);
// Ordenado: a ordem do readdir depende do filesystem e fazia dois relatórios
// do mesmo código diferirem entre máquinas.
const classes = Array.from(audit.classes).sort();
const report = {
  totalClassesFound: classes.length,
  typographyClasses: classes.filter(c => c.startsWith('text-') || c.startsWith('font-')),
  spacingClasses: classes.filter(c => c.startsWith('p-') || c.startsWith('m-') || c.startsWith('gap-')),
  colorClasses: classes.filter(c => c.includes('bg-') || c.includes('text-') || c.includes('border-')),
  timestamp: new Date().toISOString()
};

fs.writeFileSync(auditFile, JSON.stringify(report, null, 2));
console.log('Design audit report generated at:', auditFile);

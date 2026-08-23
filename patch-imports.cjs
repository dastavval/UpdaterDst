const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutWizard.tsx', 'utf8');

content = content.replace(
  '  ShieldCheck,',
  '  ShieldCheck,\n  AlertTriangle,\n  Mail,\n  Phone,'
);

fs.writeFileSync('src/components/CheckoutWizard.tsx', content);

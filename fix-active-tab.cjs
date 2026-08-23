const fs = require('fs');
let content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');
content = content.replace(
  "useState<'workplace' | 'perks' | 'leads' | 'catalog_builder' | 'orders' | 'plaque' | 'tiers' | 'analytics' | 'profile' | 'guarantee' | 'marketing'>('workplace');",
  "useState<'workplace' | 'perks' | 'leads' | 'catalog_builder' | 'orders' | 'plaque' | 'tiers' | 'analytics' | 'profile' | 'guarantee' | 'marketing' | 'rules'>('workplace');"
);
fs.writeFileSync('src/components/RepresentativeManagementPortal.tsx', content);

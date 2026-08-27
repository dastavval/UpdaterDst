
import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/components/AuthModal.tsx',
  'src/components/AdminSystemConfig.tsx',
  'src/components/AdminSafeBuy.tsx',
  'src/components/LogisticsEstimatorModal.tsx',
  'src/components/SystemPages.tsx',
  'src/components/AdminOrders.tsx',
  'src/components/LoyaltyRewardsClub.tsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const prefix = path.basename(file, '.tsx').toLowerCase();
    
    // Replace key={idx} with key={`${prefix}-idx-${idx}`}
    content = content.replace(/key={idx}/g, `key={\`${prefix}-idx-\${idx}\`}`);
    // Replace key={i} with key={`${prefix}-i-${i}`}
    content = content.replace(/key={i}/g, `key={\`${prefix}-i-\${i}\`}`);
    // Replace key={index} with key={`${prefix}-index-\${index}\`}
    content = content.replace(/key={index}/g, `key={\`${prefix}-index-\${index}\`}`);
    
    fs.writeFileSync(file, content);
    console.log(`Fixed keys in ${file}`);
  }
});

const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutWizard.tsx', 'utf8');
if (content.includes('5384155355')) {
  console.log('Address successfully verified.');
} else {
  console.log('Address missing!');
}

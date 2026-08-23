const fs = require('fs');
const content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');

// find where myOrders is defined
const myOrdersMatch = content.indexOf('const myOrders');
console.log('myOrders found at index:', myOrdersMatch);
if (myOrdersMatch !== -1) {
  console.log(content.substring(myOrdersMatch, myOrdersMatch + 200));
}

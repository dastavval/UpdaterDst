const fs = require('fs');
let content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');

const anchor = 'const myOrders = useMemo(() => {';
const replacement = `  // Check for 3-month inactivity suspension
  const isSuspended = useMemo(() => {
    if (!myOrders || myOrders.length === 0) {
      // If no orders and user is registered for more than 90 days
      const joinedAt = user?.createdAt ? new Date(user.createdAt) : new Date();
      const daysSinceJoin = (Date.now() - joinedAt.getTime()) / (1000 * 3600 * 24);
      return daysSinceJoin > 90;
    }
    // Find the latest order date
    const latestOrderTime = Math.max(...myOrders.map((o: any) => {
      if (o.date) return new Date(o.date).getTime();
      if (o.createdAt?.seconds) return o.createdAt.seconds * 1000;
      return 0;
    }));
    const daysSinceLastOrder = (Date.now() - latestOrderTime) / (1000 * 3600 * 24);
    return daysSinceLastOrder > 90;
  }, [myOrders, user]);

  const myOrders = useMemo(() => {`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/components/RepresentativeManagementPortal.tsx', content);

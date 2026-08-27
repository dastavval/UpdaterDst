# Remove the bad insertions
sed -i -e '/} else if (item.type === '"'"'factory_product'"'"') {/,+9d' src/components/AdminPendingApprovals.tsx
# Now insert correctly
sed -i -e '/} else if (item.type === '"'"'barter_deal'"'"') {/ {
  n;
}' src/components/AdminPendingApprovals.tsx

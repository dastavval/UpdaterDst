sed -i -e 's/| '"'"'user_registration'"'"';/| '"'"'user_registration'"'"'\n  | '"'"'factory_product'"'"';/g' src/components/AdminPendingApprovals.tsx
sed -i -e '/rawMaterialAds?: any\[\];/a\
  products?: any\[\];\
  onUpdateProductStatus?: (id: string, isApproved: boolean, reason?: string) => Promise<void>;' src/components/AdminPendingApprovals.tsx

sed -i -e 's/  rawMaterialAds = \[\]/  rawMaterialAds = \[\],\n  products = \[\],\n  onUpdateProductStatus/g' src/components/AdminPendingApprovals.tsx


sed -i -e '/} else if (item.type === '"'"'barter_deal'"'"') {/i \
      } else if (item.type === '"'"'factory_product'"'"') {\
        if (onUpdateProductStatus) {\
          await onUpdateProductStatus(item.details.id, true);\
          showToast(`کالای "${item.details.name}" تایید و در کاتالوگ منتشر شد.`);\
        }' src/components/AdminPendingApprovals.tsx

sed -i -e '/} else if (item.type === '"'"'barter_deal'"'"') {/i \
      } else if (item.type === '"'"'factory_product'"'"') {\
        if (onUpdateProductStatus) {\
          await onUpdateProductStatus(item.details.id, false, reason);\
          showToast(`کالای "${item.details.name}" رد شد.`);\
        }' src/components/AdminPendingApprovals.tsx

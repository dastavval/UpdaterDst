sed -i -e '/const aggregatedPendingItems: PendingItem\[\] = useMemo(() => {/a\
    if (products) {\
      let prodIdx = 0;\
      for (const p of products) {\
        prodIdx++;\
        if (p.approvalStatus === '"'"'pending'"'"' || (!p.approvalStatus && p.isApproved === false)) {\
          const hasFactoryOrigin = !!(p.factoryName || p.factory_name || (p.sellerId && p.sellerId !== '"'"'admin'"'"'));\
          if (hasFactoryOrigin) {\
            const rawDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : Date.now() - 3600000;\
            items.push({\
              id: `prod_${p.id || prodIdx}`,\
              type: '"'"'factory_product'"'"',\
              typeLabel: '"'"'تایید کالا و قیمت'"'"',\
              title: `ثبت کالای تولیدی: ${p.name || p.title}`,\
              requesterName: p.factoryName || p.sellerName || '"'"'کارخانه تولیدی'"'"',\
              requesterPhone: '"'"'ثبت در سامانه'"'"',\
              requesterCompany: p.brand || p.factoryName || '"'"'نامشخص'"'"',\
              valueToman: Number(p.bulk_price || p.price || 0) * (p.min_order_cartons || 10),\
              quantity: `${p.min_order_cartons || 10} کارتن (حداقل)`,\
              date: p.date || new Date(rawDate).toLocaleDateString('"'"'fa-IR'"'"'),\
              rawTimestamp: rawDate,\
              priority: '"'"'high'"'"',\
              priorityReason: '"'"'نیاز به ممیزی و قیمت‌گذاری'"'"',\
              details: p,\
              originalStatus: p.approvalStatus || '"'"'pending'"'"'\
            });\
          }\
        }\
      }\
    }' src/components/AdminPendingApprovals.tsx

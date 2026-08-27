sed -i -e '/localStorage.setItem("dastavval_ads", JSON.stringify(\[adFormatted, ...existingAds\]));/c\
      localStorage.setItem("dastavval_ads", JSON.stringify([adFormatted, ...existingAds]));\
      \
      const existingSponsored = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");\
      const newSponsoredAd = {\
        id: newDeal.id,\
        title: newDeal.title,\
        description: newDeal.description,\
        factoryName: newDeal.factoryName,\
        contactPerson: user?.name || "مدیر فروش کارخانه",\
        contactPhone: user?.phone || "۰۹۱۲۳۴۵۶۷۸۹",\
        badgeText: newDeal.badgeText,\
        category: lotDealType === '"'"'surplus'"'"' ? "under_market" : lotDealType === '"'"'urgent_cash'"'"' ? "liquid" : "direct_supply",\
        quantity: newDeal.quantity,\
        wholesalePrice: `${toPersianNum(newDeal.floorPrice.toLocaleString('"'"'fa-IR'"'"'))} تومان`,\
        marketPrice: `${toPersianNum((newDeal.floorPrice * 1.3).toLocaleString('"'"'fa-IR'"'"'))} تومان`,\
        buyerProfit: `${toPersianNum(discountPct)}٪ تخفیف نقدی کف بازار`,\
        isSponsored: false,\
        date: newDeal.createdAt,\
        imageUrl: newDeal.imageUrl,\
        imageUrls: newDeal.imageUrl ? [newDeal.imageUrl] : [],\
        status: "pending"\
      };\
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify([newSponsoredAd, ...existingSponsored]));\
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));\
' src/components/FactoryManagementPortal.tsx

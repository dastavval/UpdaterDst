sed -i -e '/const handleUpdateAdStatus = async (adId: string, status:/,/^  };/c\
  const handleUpdateAdStatus = async (adId: string, status: '"'"'approved'"'"' | '"'"'rejected'"'"' | '"'"'pending'"'"', rejectionReason?: string) => {\
    let found = false;\
    if (sponsoredAds.some(a => a.id === adId)) {\
      found = true;\
      const ad = sponsoredAds.find(a => a.id === adId);\
      const newAds = sponsoredAds.map(a => a.id === adId ? { ...a, status, rejectionReason: rejectionReason || '"'"''"'"' } : a);\
      updateAdsState(newAds, status === '"'"'approved'"'"' ? "آگهی با موفقیت تایید و در تالار منتشر شد." : "وضعیت آگهی بروزرسانی شد.");\
      if (status === '"'"'approved'"'"' && ad && ad.phone) {\
        try {\
          fetch("/api/sms/send-ad-status-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ad.phone, userName: ad.userName || ad.ownerName || "کاربر گرامی", adTitle: ad.title || "آگهی شما", status: '"'"'approved'"'"' }) });\
        } catch (e) {}\
      }\
      return;\
    }\
    if (rawMaterialAds.some(a => a.id === adId)) {\
      found = true;\
      const newAds = rawMaterialAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== '"'"'approved'"'"', rejectionReason: rejectionReason || '"'"''"'"' } : a);\
      setRawMaterialAds(newAds);\
      localStorage.setItem("dastavval_raw_materials", JSON.stringify(newAds));\
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: newAds });\
    } else if (equipmentAds.some(a => a.id === adId)) {\
      found = true;\
      const newAds = equipmentAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== '"'"'approved'"'"', rejectionReason: rejectionReason || '"'"''"'"' } : a);\
      setEquipmentAds(newAds);\
      localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(newAds));\
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, equipmentAds: newAds });\
    } else if (serviceAds.some(a => a.id === adId)) {\
      found = true;\
      const newAds = serviceAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== '"'"'approved'"'"', rejectionReason: rejectionReason || '"'"''"'"' } : a);\
      setServiceAds(newAds);\
      localStorage.setItem("dastavval_industrial_services", JSON.stringify(newAds));\
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, serviceAds: newAds });\
    }\
    if (found) {\
      setSuccessMsg(status === '"'"'approved'"'"' ? "آگهی با موفقیت تایید و منتشر شد." : "وضعیت آگهی بروزرسانی شد.");\
      setTimeout(() => setSuccessMsg(null), 2000);\
      window.dispatchEvent(new Event("storage"));\
    }\
  };' src/components/AdminPanel.tsx

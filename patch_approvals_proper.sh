awk '
/} else if \(item.type === '"'"'billboard_ad'"'"'\) {/ {
    count++
    if (count == 1) {
        print "      } else if (item.type === '"'"'factory_product'"'"') {"
        print "        if (onUpdateProductStatus) {"
        print "          await onUpdateProductStatus(item.details.id, true);"
        print "          showToast(`کالای \"${item.details.name || item.details.title}\" تایید و در کاتالوگ منتشر شد.`);"
        print "        }"
    } else if (count == 2) {
        print "      } else if (item.type === '"'"'factory_product'"'"') {"
        print "        if (onUpdateProductStatus) {"
        print "          await onUpdateProductStatus(item.details.id, false, reason);"
        print "          showToast(`کالای \"${item.details.name || item.details.title}\" رد شد.`);"
        print "        }"
    }
}
{ print }
' src/components/AdminPendingApprovals.tsx > temp.tsx && mv temp.tsx src/components/AdminPendingApprovals.tsx

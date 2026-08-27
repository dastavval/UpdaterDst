awk '
/} else if \(item.type === '"'"'factory_product'"'"'\) {/ {
    skip = 1
}
/showToast\(`کالای "\${item.details.name \|\| item.details.title}" تایید و در کاتالوگ منتشر شد.`\);/ {
    if (skip) { skip_end = 1; next }
}
/showToast\(`کالای "\${item.details.name \|\| item.details.title}" رد شد.`\);/ {
    if (skip) { skip_end = 1; next }
}
/^[ \t]*}/ {
    if (skip && skip_end) { skip = 0; skip_end = 0; next }
}
{ if (!skip) print }
' src/components/AdminPendingApprovals.tsx > temp.tsx && mv temp.tsx src/components/AdminPendingApprovals.tsx

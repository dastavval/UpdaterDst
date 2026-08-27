
import sys

# Target file
file_path = "src/components/AdminPanel.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1. Identify ALL nested blocks inside products tab
# Products tab start (rough estimate, we'll find it accurately)
prod_start_idx = -1
for i, line in enumerate(lines):
    if "{activeSubTab === 'products' && (" in line:
        prod_start_idx = i
        break

# Products tab end
prod_end_idx = -1
for i, line in enumerate(lines):
    if "{/* --- TAB: SITE BUILDER / PAGES --- */}" in line:
        for j in range(i-1, i-20, -1):
            if ")}" in lines[j]:
                prod_end_idx = j
                break
        if prod_end_idx != -1:
            break

print(f"Products tab: {prod_start_idx+1} to {prod_end_idx+1}")

# Blocks to extract: profile, system, parspack_storage, sms, reports
to_extract = ['profile', 'system', 'parspack_storage', 'sms', 'reports']

extracted_blocks = []
indices_to_delete = []

i = prod_start_idx + 1
while i < prod_end_idx:
    line = lines[i]
    if "activeSubTab" in line and any(f"'{name}'" in line for name in to_extract) and "&& (" in line:
        # Start of a nested block
        start = i
        brace_count = 0
        paren_count = 0
        found_end = False
        for j in range(i, prod_end_idx + 1):
            lt = lines[j]
            for char in lt:
                if char == '{': brace_count += 1
                elif char == '}': brace_count -= 1
                elif char == '(': paren_count += 1
                elif char == ')': paren_count -= 1
            if brace_count == 0 and paren_count == 0:
                end = j
                found_end = True
                break
        if found_end:
            print(f"Extracting block from {start+1} to {end+1}")
            extracted_blocks.extend(lines[start:end+1])
            indices_to_delete.append((start, end))
            i = end + 1
            continue
    i += 1

# Delete from bottom to top to preserve indices
for start, end in reversed(indices_to_delete):
    del lines[start : end + 1]

# Re-find insertion point (products tab end might have shifted)
for i, line in enumerate(lines):
    if "{/* --- TAB: SITE BUILDER / PAGES --- */}" in line:
        for j in range(i-1, i-20, -1):
            if ")}" in lines[j]:
                insertion_idx = j + 1
                break
        break

# Insert extracted blocks and missing ones
missing_blocks = [
    "\n      {/* --- RE-INSERTED BLOCKS --- */}\n",
    "      {activeSubTab === 'orders' && (\n",
    "        <AdminOrders\n",
    "          orders={orders}\n",
    "          ordersLoading={ordersLoading}\n",
    "          fetchOrders={fetchOrders}\n",
    "          handleUpdateOrderStatus={handleUpdateOrderStatus}\n",
    "          setLoading={setLoading}\n",
    "          setSuccessMsg={setSuccessMsg}\n",
    "          setErrorMsg={setErrorMsg}\n",
    "          confirmAction={confirmAction}\n",
    "          setShowPrintInvoice={setShowPrintInvoice}\n",
    "        />\n",
    "      )}\n",
    "      {activeSubTab === 'crm' && (\n",
    "        <AdminCRM\n",
    "          crmCustomers={crmCustomers}\n",
    "          crmLoading={crmLoading}\n",
    "          products={products}\n",
    "          setLoading={setLoading}\n",
    "          setSuccessMsg={setSuccessMsg}\n",
    "          setErrorMsg={setErrorMsg}\n",
    "          confirmAction={confirmAction}\n",
    "          loadCrmCustomers={loadCrmCustomers}\n",
    "          onUpdateOrders={async () => { await fetchOrders(); }}\n",
    "        />\n",
    "      )}\n",
    "      {(activeSubTab === 'invoice' || activeSubTab === 'accounting') && (\n",
    "        <AdminInvoiceSettings\n",
    "          b2bConfig={b2bConfig}\n",
    "          onUpdateB2bConfig={onUpdateB2bConfig}\n",
    "          setLoading={setLoading}\n",
    "          setSuccessMsg={setSuccessMsg}\n",
    "          setErrorMsg={setErrorMsg}\n",
    "          orders={orders}\n",
    "        />\n",
    "      )}\n",
    "      {activeSubTab === 'safe_buy' && (\n",
    "        <AdminSafeBuy\n",
    "          products={products}\n",
    "          sponsoredAds={sponsoredAds}\n",
    "          setSuccessMsg={setSuccessMsg}\n",
    "          setErrorMsg={setErrorMsg}\n",
    "          setLoading={setLoading}\n",
    "        />\n",
    "      )}\n",
    "      {activeSubTab === 'ads' && (\n",
    "        <div className=\"bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center\">\n",
    "          <Megaphone size={64} className=\"mx-auto text-indigo-200 mb-6\" />\n",
    "          <h3 className=\"text-xl font-black text-slate-900\">مدیریت کمپین‌های تبلیغاتی و بنرها</h3>\n",
    "          <p className=\"text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto\">بزودی ابزارهای پیشرفته مدیریت جایگاه‌های تبلیغاتی در این بخش فعال خواهد شد. فعلاً از بخش صف تایید برای مدیریت آگهی‌ها استفاده کنید.</p>\n",
    "        </div>\n",
    "      )}\n",
    "      {activeSubTab === 'dashboard' && <AdminSalesCharts />}\n"
]

# Note: extracted_blocks might contain dashboard/reports already, but we'll add them if missing
lines[insertion_idx:insertion_idx] = missing_blocks + extracted_blocks

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("AdminPanel.tsx fixed successfully.")


import sys

# Target file
file_path = "src/components/AdminPanel.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1. Identify nested blocks (Line 6658 to 6760)
nested_start_idx = -1
for i, line in enumerate(lines):
    if "{(activeSubTab as any) === 'profile' && (" in line:
        nested_start_idx = i
        break

# Find where reports ends
nested_end_idx = -1
if nested_start_idx != -1:
    brace_count = 0
    paren_count = 0
    found = False
    for i in range(nested_start_idx, len(lines)):
        lt = lines[i]
        for char in lt:
            if char == '{': brace_count += 1
            elif char == '}': brace_count -= 1
            elif char == '(': paren_count += 1
            elif char == ')': paren_count -= 1
        
        # We need to find the END of the reports block, which is )} at column 6 (indented)
        if brace_count == 0 and paren_count == 0:
            nested_end_idx = i
            found = True
            break
    if not found:
         print("Warning: Could not find exact end of nested blocks with brace counting")
         nested_end_idx = nested_start_idx + 100 # Fallback safety

print(f"Nested blocks found from {nested_start_idx+1} to {nested_end_idx+1}")

# 2. Extract nested blocks
nested_content = lines[nested_start_idx : nested_end_idx + 1] if nested_start_idx != -1 else []
# Remove them from the original lines
if nested_start_idx != -1:
    del lines[nested_start_idx : nested_end_idx + 1]

# 3. Find where the products block ends
# The products block started at 6394. Since we removed ~100 lines, it's now earlier.
# We look for the products table area and then the closing </div> </div> </div> )}
products_end_idx = -1
for i, line in enumerate(lines):
    if "{/* --- TAB: SITE BUILDER / PAGES --- */}" in line:
        # Search backwards for the )}
        for j in range(i-1, i-20, -1):
            if ")}" in lines[j]:
                products_end_idx = j
                break
        if products_end_idx != -1:
            break

print(f"Products block end found at {products_end_idx+1}")

# 4. Insert nested blocks and missing blocks after products block end
if products_end_idx != -1:
    insertion_idx = products_end_idx + 1
    
    missing_blocks = [
        "\n      {/* --- ADDED MISSING TABS --- */}\n",
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
    
    lines[insertion_idx:insertion_idx] = missing_blocks + nested_content
else:
    print("Insertion point not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("AdminPanel.tsx updated successfully.")

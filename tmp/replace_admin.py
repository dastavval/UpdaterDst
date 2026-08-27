import re

file_path = "src/components/AdminPanel.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the first useEffect (activeSubTab)
old_useeffect_1 = """  useEffect(() => {
    if (activeSubTab === 'orders') {
      fetchOrders();
    } else if (activeSubTab === 'crm') {
      loadCrmCustomers();
      loadCallbackRequests();
      loadSupportTickets();
    } else if (activeSubTab === 'safe_buy') {
      // Handled by AdminSafeBuy component
    } else if (activeSubTab === 'dashboard' || activeSubTab === 'approvals') {
      fetchOrders();
      loadCallbackRequests();
      loadSupportTickets();
    }
  }, [activeSubTab]);"""

new_useeffect_1 = """  useEffect(() => {
    if (activeSubTab === 'orders') {
      fetchOrders();
    } else if (activeSubTab === 'crm') {
      loadCrmCustomers();
      loadCallbackRequests();
      loadSupportTickets();
    } else if (activeSubTab === 'safe_buy') {
      // Handled by AdminSafeBuy component
    } else if (activeSubTab === 'dashboard' || activeSubTab === 'approvals') {
      fetchOrders();
      loadCallbackRequests();
      loadSupportTickets();
      onUpdateReps();
    }
  }, [activeSubTab]);"""

# 2. Update the second useEffect (mount)
old_useeffect_2 = """  useEffect(() => {
    fetchOrders();
    fetchSafeBuyRequests();
    loadCallbackRequests();
    loadSupportTickets();
    const handleNewCallback = () => {
      loadCallbackRequests();
    };
    const handleSync = () => {
      fetchOrders();
      fetchSafeBuyRequests();
      loadCallbackRequests();
      loadSupportTickets();
    };"""

new_useeffect_2 = """  useEffect(() => {
    fetchOrders();
    fetchSafeBuyRequests();
    loadCallbackRequests();
    loadSupportTickets();
    onUpdateReps();
    const handleNewCallback = () => {
      loadCallbackRequests();
    };
    const handleSync = () => {
      fetchOrders();
      fetchSafeBuyRequests();
      loadCallbackRequests();
      loadSupportTickets();
      onUpdateReps();
    };"""

# 3. Add handlePurgeMockData function
old_delete_all = "  const handleDeleteAllProducts = async () => {"

new_delete_all = """  const handlePurgeMockData = async () => {
    confirmAction(
      "پاک\u200cسازی داده\u200cهای نمونه و فرضی",
      "آیا از حذف تمام سفارشات نمونه، تیکت\u200cهای فرضی و داده\u200cهای آزمایشی اطمینان دارید؟ سیستم بعد از پاک\u200cسازی آماده ثبت سفارشات کاملاً واقعی خواهد بود.",
      async () => {
        setLoading(true);
        try {
          // 1. Set the flag to hide/prevent mock data in lists
          localStorage.setItem("dastavval_hide_mock_data", "true");

          // 2. Clear all mock caches
          localStorage.removeItem("dastavval_orders_cache");
          localStorage.removeItem("dastavval_raw_orders");
          localStorage.removeItem("dastavval_callback_requests");
          localStorage.removeItem("dastavval_tickets");
          localStorage.removeItem("dastavval_representatives_kyc");
          localStorage.removeItem("dastavval_crm_leads");

          // 3. Clear states
          setOrders([]);
          setCallbackRequests([]);
          setSupportTickets([]);

          // 4. Force reload empty/real data from database
          await fetchOrders();
          await loadCallbackRequests();
          await loadSupportTickets();

          setSuccessMsg("کلیه سفارشات نمونه و داده\u200cهای فرضی آزمایشی با موفقیت پاک\u200cسازی شدند. پلتفرم آماده فعالیت واقعی است.");
          setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(`خطا در پاک\u200cسازی داده\u200cها: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteAllProducts = async () => {"""

if old_useeffect_1 in content:
    content = content.replace(old_useeffect_1, new_useeffect_1)
    print("Replaced useEffect 1")
else:
    print("Warning: useEffect 1 not found")

if old_useeffect_2 in content:
    content = content.replace(old_useeffect_2, new_useeffect_2)
    print("Replaced useEffect 2")
else:
    print("Warning: useEffect 2 not found")

if old_delete_all in content:
    content = content.replace(old_delete_all, new_delete_all, 1)
    print("Replaced handleDeleteAllProducts")
else:
    print("Warning: handleDeleteAllProducts not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification finished.")

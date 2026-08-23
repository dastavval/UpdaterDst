import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { cacheProducts, getCachedProducts } from "./lib/db";',
    'import { cacheProducts, getCachedProducts, cacheB2bConfig, getCachedB2bConfig } from "./lib/db";'
)

# 2. Update initApp
import re

initapp_pattern = re.compile(r'  const initApp = async \(\) => \{.*?  \};', re.DOTALL)
new_initapp = """  const initApp = async () => {
    try {
      const isCleaned = localStorage.getItem("dastavval_v6_clean");
      if (isCleaned !== "true") {
        const keysToClear = [
          "mock_db_products", "mock_db_factories", "mock_db_news",
          "mock_db_orders", "mock_db_reviews", "dastavval_b2b_config",
          "dastavval_custom_factories", "dastavval_seller_profile",
          "dastavval_price_alerts", "dastavval_raw_orders",
          "dastavval_local_users", "dastavval_user", "dastavval_crm_leads"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v6_clean", "true"); } catch (e) {}
      }
    } catch (e) {}

    // Check Firestore Connection Status in background
    (async () => {
      try {
        const { getDocFromServer, doc: fireDoc } = await import('./lib/data-layer');
        await getDocFromServer(fireDoc(db, '_connection_test_', 'ping'));
        setFirestoreStatus('online');
      } catch (e) {
        setFirestoreStatus('offline');
      }
    })();

    try {
      // 1. FAST PATH: Check IndexedDB Cache
      const [cachedProducts, cachedConfig] = await Promise.all([
        getCachedProducts(),
        getCachedB2bConfig()
      ]);
      
      let hasCachedData = false;
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
        if (cachedConfig) {
          setB2bConfig(cachedConfig);
        }
        hasCachedData = true;
        setLoading(false); // Render instantly!
      } else {
        setLoading(true);
      }

      // 2. BACKGROUND SYNC (or foreground if no cache)
      const fetchPromises = Promise.all([
        fetchProducts(hasCachedData),
        fetchDailyPresentation(),
        fetchB2bConfig(hasCachedData),
        fetchArticles()
      ]);

      if (!hasCachedData) {
        await seedProductsIfEmpty(); 
        await fetchPromises;
        setLoading(false);
      } else {
        fetchPromises.catch(e => console.error("Background sync error:", e));
      }
    } catch (e) {
      console.error("Critical error during init:", e);
      setLoading(false);
    }
  };"""
content = initapp_pattern.sub(new_initapp, content, count=1)

# 3. Update fetchProducts
fetchprod_pattern = re.compile(r'  const fetchProducts = async \(\) => \{\n    try \{\n      setLoading\(true\);\n      \n      // First try to load from IndexedDB for instant display\n      const cached = await getCachedProducts\(\);\n      if \(cached && cached\.length > 0\) \{\n        setProducts\(cached\);\n        setLoading\(false\);\n      \}')
new_fetchprod = """  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);"""
content = fetchprod_pattern.sub(new_fetchprod, content, count=1)

# 4. Update fetchB2bConfig
fetchconfig_pattern = re.compile(r'  const fetchB2bConfig = async \(\) => \{\n    try \{\n      const res = await fetch\(getApiUrl\("/api/b2b/config"\)\);\n.*?    \} catch \(e\) \{\n      console\.warn\("Failed to load B2B config:", e\);\n    \}\n  \};', re.DOTALL)

new_fetchconfig = """  const fetchB2bConfig = async (isBackground = false) => {
    try {
      const res = await fetch(getApiUrl("/api/b2b/config"));
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setB2bConfig((prev: any) => {
            const factories = (data.factories && data.factories.length > 0) ? data.factories : (prev.factories?.length > 0 ? prev.factories : INITIAL_FACTORIES);
            const categories = (data.categories && data.categories.length > 0) ? data.categories : (prev.categories?.length > 0 ? prev.categories : INITIAL_CATEGORIES);
            const logoUrl = data.logoUrl || prev.logoUrl || "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png";
            
            const merged = { 
              ...prev, 
              ...data,
              factories,
              categories,
              logoUrl
            };
            
            try {
              localStorage.setItem("dastavval_b2b_config", JSON.stringify(merged));
              cacheB2bConfig(merged).catch(() => {});
            } catch (e) {}
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load B2B config:", e);
    }
  };"""
content = fetchconfig_pattern.sub(new_fetchconfig, content, count=1)

# 5. Update handleUpdateB2bConfig
update_pattern = re.compile(r'  const handleUpdateB2bConfig = async \(updatedConfig: any\) => \{\n    setB2bConfig\(updatedConfig\);\n    try \{\n      localStorage\.setItem\("dastavval_b2b_config", JSON\.stringify\(updatedConfig\)\);\n    \} catch \(e\) \{\\}')
new_update = """  const handleUpdateB2bConfig = async (updatedConfig: any) => {
    setB2bConfig(updatedConfig);
    try {
      localStorage.setItem("dastavval_b2b_config", JSON.stringify(updatedConfig));
      cacheB2bConfig(updatedConfig).catch(() => {});
    } catch (e) {}"""
content = update_pattern.sub(new_update, content, count=1)

with open('src/App.tsx', 'w') as f:
    f.write(content)


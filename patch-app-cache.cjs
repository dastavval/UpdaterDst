const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import { cacheProducts, getCachedProducts } from "./lib/db";',
  'import { cacheProducts, getCachedProducts, cacheB2bConfig, getCachedB2bConfig } from "./lib/db";'
);

// We need to rewrite initApp
const oldInitApp = `  const initApp = async () => {
    try {
      const isCleaned = localStorage.getItem("dastavval_v6_clean");
      if (isCleaned !== "true") {
        const keysToClear = [
          "mock_db_products",
          "mock_db_factories",
          "mock_db_news",
          "mock_db_orders",
          "mock_db_reviews",
          "dastavval_b2b_config",
          "dastavval_custom_factories",
          "dastavval_seller_profile",
          "dastavval_price_alerts",
          "dastavval_raw_orders",
          "dastavval_local_users",
          "dastavval_user",
          "dastavval_crm_leads"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v6_clean", "true"); } catch (e) {}
      }
    } catch (e) {
      console.warn("localStorage initialization check error:", e);
    }
    setLoading(true);
    
    // Check Firestore Connection Status
    try {
      const { getDocFromServer, doc: fireDoc } = await import('./lib/data-layer');
      await getDocFromServer(fireDoc(db, '_connection_test_', 'ping'));
      setFirestoreStatus('online');
    } catch (e) {
      console.warn("Firestore status check failed:", e);
      setFirestoreStatus('offline');
    }

    try {
      await seedProductsIfEmpty();
    } catch (e) {
      console.warn("Seeding failed, proceeding to load products:", e);
    }

    try {
      await Promise.all([
        fetchProducts(),
        fetchDailyPresentation(),
        fetchB2bConfig(),
        fetchArticles()
      ]);
    } catch (e) {
      console.error("Critical error during init:", e);
    } finally {
      setLoading(false);
    }
  };`;

const newInitApp = `  const initApp = async () => {
    try {
      const isCleaned = localStorage.getItem("dastavval_v6_clean");
      if (isCleaned !== "true") {
        const keysToClear = [
          "mock_db_products",
          "mock_db_factories",
          "mock_db_news",
          "mock_db_orders",
          "mock_db_reviews",
          "dastavval_b2b_config",
          "dastavval_custom_factories",
          "dastavval_seller_profile",
          "dastavval_price_alerts",
          "dastavval_raw_orders",
          "dastavval_local_users",
          "dastavval_user",
          "dastavval_crm_leads"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v6_clean", "true"); } catch (e) {}
      }
    } catch (e) {
      console.warn("localStorage initialization check error:", e);
    }
    
    // Check Firestore Connection Status in background
    (async () => {
      try {
        const { getDocFromServer, doc: fireDoc } = await import('./lib/data-layer');
        await getDocFromServer(fireDoc(db, '_connection_test_', 'ping'));
        setFirestoreStatus('online');
      } catch (e) {
        console.warn("Firestore status check failed:", e);
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
        await seedProductsIfEmpty(); // seed only if we had nothing
        await fetchPromises;
        setLoading(false);
      } else {
        // Let it run in background to sync state silently
        fetchPromises.catch(e => console.error("Background sync error:", e));
      }
    } catch (e) {
      console.error("Critical error during init:", e);
      setLoading(false);
    }
  };`;

content = content.replace(oldInitApp, newInitApp);

// Now patch fetchProducts
const oldFetchProducts = `  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First try to load from IndexedDB for instant display
      const cached = await getCachedProducts();
      if (cached && cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      }`;

const newFetchProducts = `  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);`;

content = content.replace(oldFetchProducts, newFetchProducts);

// Now patch fetchB2bConfig
const oldFetchB2bConfig = `  const fetchB2bConfig = async () => {
    try {
      const res = await fetch(getApiUrl("/api/b2b/config"));
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setB2bConfig((prev: any) => {
            // Smart Merge: If server returns empty factories/categories but prev had them, 
            // it might be a temporary server-side issue or uninitialized file.
            // We only overwrite if data actually has items OR if it's explicitly non-empty.
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
            } catch (e) {}
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load B2B config:", e);
    }
  };`;

const newFetchB2bConfig = `  const fetchB2bConfig = async (isBackground = false) => {
    try {
      const res = await fetch(getApiUrl("/api/b2b/config"));
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          // Merge logic
          const prev = JSON.parse(localStorage.getItem("dastavval_b2b_config") || "{}");
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
          
          setB2bConfig(merged);
          try {
            localStorage.setItem("dastavval_b2b_config", JSON.stringify(merged));
            await cacheB2bConfig(merged);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn("Failed to load B2B config:", e);
    }
  };`;

content = content.replace(oldFetchB2bConfig, newFetchB2bConfig);

// In handleUpdateB2bConfig, also update IDB
const oldUpdateB2b = `  const handleUpdateB2bConfig = async (updatedConfig: any) => {
    setB2bConfig(updatedConfig);
    try {
      localStorage.setItem("dastavval_b2b_config", JSON.stringify(updatedConfig));
    } catch (e) {}`;

const newUpdateB2b = `  const handleUpdateB2bConfig = async (updatedConfig: any) => {
    setB2bConfig(updatedConfig);
    try {
      localStorage.setItem("dastavval_b2b_config", JSON.stringify(updatedConfig));
      cacheB2bConfig(updatedConfig).catch(() => {});
    } catch (e) {}`;

content = content.replace(oldUpdateB2b, newUpdateB2b);

fs.writeFileSync('src/App.tsx', content);

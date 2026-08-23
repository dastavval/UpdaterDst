const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace(
  "const STORE_NAME = 'products';",
  "const STORE_NAME = 'products';\nconst CONFIG_STORE_NAME = 'b2b_config';"
);

content = content.replace(
  "if (!db.objectStoreNames.contains(STORE_NAME)) {\n        db.createObjectStore(STORE_NAME, { keyPath: 'id' });\n      }",
  "if (!db.objectStoreNames.contains(STORE_NAME)) {\n        db.createObjectStore(STORE_NAME, { keyPath: 'id' });\n      }\n      if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {\n        db.createObjectStore(CONFIG_STORE_NAME, { keyPath: 'id' });\n      }"
);

// Add B2B config cache functions
const configFunctions = `
export async function cacheB2bConfig(config: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONFIG_STORE_NAME);
    
    // Clear old data
    store.clear();
    
    // Config doesn't naturally have an id in the same way, we just use a static one
    store.put({ id: 'main_config', data: config, _cachedAt: Date.now() });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedB2bConfig(): Promise<any | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CONFIG_STORE_NAME);
    const request = store.get('main_config');

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}
`;

content = content + '\n' + configFunctions;
fs.writeFileSync('src/lib/db.ts', content);

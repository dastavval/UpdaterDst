const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFetchProducts = \`  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First try to load from IndexedDB for instant display
      const cached = await getCachedProducts();
      if (cached && cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      }\`;

const newFetchProducts = \`  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);\`;

content = content.replace(oldFetchProducts, newFetchProducts);
fs.writeFileSync('src/App.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldInitAppFetch = `    await Promise.all([
      fetchProducts(),
      fetchDailyPresentation(),
      fetchB2bConfig(),
      fetchArticles()
    ]);
    setLoading(false);`;

const newInitAppFetch = `    try {
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
    }`;

content = content.replace(oldInitAppFetch, newInitAppFetch);
fs.writeFileSync('src/App.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove setLoading(false) from fetchProducts
content = content.replace(
  '    } finally {\n      setLoading(false);\n    }',
  '    } finally {\n      // setLoading(false) is now handled in initApp\n    }'
);

// 2. Change initApp to use Promise.all and then setLoading(false)
const oldInitAppFetch = `    await fetchProducts();
    await fetchDailyPresentation();
    await fetchB2bConfig();
    await fetchArticles();`;

const newInitAppFetch = `    await Promise.all([
      fetchProducts(),
      fetchDailyPresentation(),
      fetchB2bConfig(),
      fetchArticles()
    ]);
    setLoading(false);`;

content = content.replace(oldInitAppFetch, newInitAppFetch);

// 3. Add full-screen loader
const oldReturn = `  return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-white text-slate-900" dir={language === 'en' ? 'ltr' : 'rtl'}>`;

const newReturn = `  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm">در حال دریافت اطلاعات یکپارچه پلتفرم...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-white text-slate-900" dir={language === 'en' ? 'ltr' : 'rtl'}>`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync('src/App.tsx', content);

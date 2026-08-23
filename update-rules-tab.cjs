const fs = require('fs');
let content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');

const anchor = `        {/* Tab 8: Profile & Settings */}`;
const replacement = `        {/* Tab Rules: Agency Rules */}
        <button
          onClick={() => setActiveTab('rules' as any)}
          className={\`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap \${
            activeTab === 'rules'
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }\`}
        >
          <Info size={16} className={activeTab === 'rules' ? 'text-white' : 'text-rose-500'} />
          <span>⚖️ قوانین و مقررات عاملیت</span>
        </button>

        {/* Tab 8: Profile & Settings */}`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/components/RepresentativeManagementPortal.tsx', content);

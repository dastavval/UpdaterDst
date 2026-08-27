
import fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix Equipment Ads
content = content.replace(
  /{equipmentAds\.map\(\(item\) => \(/,
  '{equipmentAds.map((item, idx) => ('
);
content = content.replace(
  /<div key={item\.id} className="bg-slate-50\/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">/,
  '<div key={`ads-equip-${item.id || idx}-${idx}`} className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">'
);

// Fix Service Ads
content = content.replace(
  /{serviceAds\.map\(\(item\) => \(/,
  '{serviceAds.map((item, idx) => ('
);
content = content.replace(
  /<div key={item\.id} className="bg-slate-50\/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">/,
  '<div key={`ads-service-${item.id || idx}-${idx}`} className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">'
);

// Fix Raw Material Ads
content = content.replace(
  /{rawMaterialAds\.map\(\(item\) => \(/,
  '{rawMaterialAds.map((item, idx) => ('
);
content = content.replace(
  /<div key={item\.id} className="bg-slate-50\/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">/,
  '<div key={`ads-raw-${item.id || idx}-${idx}`} className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all">'
);

fs.writeFileSync(filePath, content);
console.log('Fixed duplicate keys in AdminPanel.tsx');

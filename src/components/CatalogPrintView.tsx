import { Product, B2BConfig } from "../types";

interface CatalogPrintViewProps {
  products: Product[];
  config: B2BConfig;
}

export default function CatalogPrintView({ products, config }: CatalogPrintViewProps) {
  return (
    <div className="bg-white p-8 max-w-[21cm] mx-auto print:p-0" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{config.appName || "کاتالوگ محصولات"}</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">{config.appSub || "بانک جامع اطلاعات کالایی"}</p>
        </div>
        <div className="text-left">
          <img 
            src={config.logoUrl || "/assets/logo.svg"} 
            className="h-16 w-auto object-contain" 
            alt="Logo" 
          />
        </div>
      </div>

      {/* Intro */}
      <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
        <h2 className="text-lg font-black text-slate-800 mb-2">درباره ما و نحوه همکاری</h2>
        <p className="text-xs text-slate-600 font-bold leading-relaxed">
          این کاتالوگ شامل لیست آخرین محصولات موجود در انبار مرکزی (شبستر) و نمایندگان سراسر ایران می‌باشد. 
          تمامی قیمت‌ها به نرخ عمده‌فروشی کارخانه محاسبه شده و ثبت سفارش از طریق پرتال آنلاین به نشانی {window.location.origin} میسر است.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-6">
        {products.filter(p => !p.disabled).map((p, idx) => (
          <div key={p.id} className="border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center break-inside-avoid">
            <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 border border-slate-100">
              <img 
                src={p.image_url} 
                alt={p.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center w-full">
              <h3 className="text-sm font-black text-slate-900 mb-1">{p.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold mb-3">{p.brand} - {p.category}</p>
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <div className="text-right">
                  <span className="block text-[8px] text-slate-400 font-black">تعداد در کارتن</span>
                  <span className="text-xs font-black text-slate-700">{p.carton_pack_count} واحد</span>
                </div>
                <div className="text-left">
                  <span className="block text-[8px] text-slate-400 font-black">قیمت عمده</span>
                  <span className="text-sm font-black text-emerald-700">{(p.bulk_price * p.carton_pack_count).toLocaleString()} ت</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-100 text-center">
        <p className="text-xs font-bold text-slate-400">
          آدرس: {config.hqAddress || "آذربایجان شرقی، شبستر، دفتر مرکزی"} | تلفن پشتیبانی: {config.supportPhone || "۰۹۰۴ ۴۵۰ ۲۹۰۰"}
        </p>
        <div className="mt-4 flex justify-center gap-4">
           {config.officialSealUrl && <img src={config.officialSealUrl} className="h-20 grayscale opacity-30" alt="Seal" />}
        </div>
      </div>
    </div>
  );
}

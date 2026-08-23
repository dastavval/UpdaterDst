const fs = require('fs');
let content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');

const anchor = '      {/* 3. REFINED WHITE SUB-TAB NAVIGATION';
const replacement = `      {/* ========================================================================= */}
      {/* 2.5 SUSPENSION BANNER                                                     */}
      {/* ========================================================================= */}
      {isSuspended && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 mb-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4 text-rose-800">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-200">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base">تعلیق موقت عاملیت به دلیل عدم فعالیت مستمر</h4>
              <p className="text-xs font-bold text-rose-700/80 mt-1 leading-relaxed max-w-2xl">
                همکار گرامی، طبق قوانین و مقررات پلتفرم، پنل عاملیت شما به دلیل عدم ثبت سفارش یا خرید در <strong className="font-black">۳ ماه گذشته</strong> موقتاً غیرفعال شده است. لطفاً جهت فعال‌سازی مجدد و تمدید انحصار منطقه‌ای، نسبت به ثبت اولین سفارش جدید اقدام نمایید.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('workplace')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            ثبت سفارش مجدد
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REFINED WHITE SUB-TAB NAVIGATION`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/components/RepresentativeManagementPortal.tsx', content);

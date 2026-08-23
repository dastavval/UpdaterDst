const fs = require('fs');
let content = fs.readFileSync('src/components/RepresentativeManagementPortal.tsx', 'utf8');

const anchor = `      {/* ========================================================================= */}
      {/* 11. SUB-TAB CONTENT: 🏢 AGENCY PROFILE & CONTACT SETTINGS                 */}
      {/* ========================================================================= */}`;
const replacement = `      {/* ========================================================================= */}
      {/* SUB-TAB CONTENT: ⚖️ AGENCY RULES & TERMS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <span className="text-[10px] font-black text-rose-600 tracking-wider uppercase">TERMS AND CONDITIONS</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 pt-1">
              قوانین، مقررات و الزامات انحصار عاملیت پخش
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed max-w-3xl">
              تداوم همکاری و حفظ انحصار منطقه‌ای منوط به رعایت دقیق الزامات زیر می‌باشد. در صورت تخطی، پلتفرم دست‌اول حق لغو یک‌طرفه عاملیت را محفوظ می‌دارد.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-slate-700 text-lg font-black">۱</div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">حفظ سطح خرید و فعالیت مستمر (قانون ۳ ماه)</h4>
                <p className="text-xs font-bold text-slate-600 mt-2 leading-relaxed">
                  نماینده موظف است به منظور حفظ انحصار منطقه‌ای خود، به صورت مستمر ثبت سفارش داشته باشد. <strong className="text-rose-600">عدم ثبت سفارش به مدت ۳ ماه متوالی</strong> منجر به تعلیق خودکار پنل عاملیت و ابطال حق انحصار در شهر/استان مربوطه خواهد شد.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-slate-700 text-lg font-black">۲</div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">حفظ قیمت‌گذاری مصوب (کف بازار)</h4>
                <p className="text-xs font-bold text-slate-600 mt-2 leading-relaxed">
                  نماینده متعهد می‌گردد که محصولات تامین شده از طریق پلتفرم را صرفاً با رعایت حاشیه سود مصوب و قیمت‌های اعلامی کارخانه در منطقه تحت پوشش توزیع نماید. هرگونه گران‌فروشی یا احتکار کالا موجب لغو فوری عاملیت می‌گردد.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-slate-700 text-lg font-black">۳</div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">حفظ حریم برند و عدم فروش خارج از شبکه</h4>
                <p className="text-xs font-bold text-slate-600 mt-2 leading-relaxed">
                  محصولات خریداری شده با شرایط ویژه عاملیت، صرفاً جهت توزیع در منطقه جغرافیایی ثبت شده (استان/شهر نماینده) می‌باشد. فروش به صورت بنکداری عمده به سایر استان‌ها که دارای نماینده انحصاری هستند، تخلف محسوب می‌شود.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-slate-700 text-lg font-black">۴</div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">تضمین‌های مالی و وثایق</h4>
                <p className="text-xs font-bold text-slate-600 mt-2 leading-relaxed">
                  جهت استفاده از شرایط خرید اعتباری و دریافت ضمانت‌نامه، ارائه چک صیادی بنفش یا وثایق معتبر بانکی و ملکی الزامی است. نماینده موظف است در موعد مقرر نسبت به تسویه حساب کامل اقدام نماید.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SUB-TAB CONTENT: 🏢 AGENCY PROFILE & CONTACT SETTINGS                 */}
      {/* ========================================================================= */}`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/components/RepresentativeManagementPortal.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutWizard.tsx', 'utf8');

const addressHtml = `
                    {/* Mailing Address & Warning for Cheque */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                        <AlertTriangle size={18} className="text-amber-600" />
                        توجه مهم: ارسال فیزیکی چک صیادی
                      </div>
                      <p className="text-xs font-bold text-amber-900/80 leading-relaxed">
                        لطفاً پس از آپلود تصویر چک و رسید ثبت صیادی، لاشه فیزیکی چک را از طریق پست پیشتاز به آدرس زیر ارسال فرمایید.
                        <strong className="block mt-2 text-rose-700">⚠️ تذکر: تا زمانی که چک ثبت و به آدرس زیر پست نشود (ارسال کد رهگیری پستی)، بار شما ارسال نخواهد شد.</strong>
                      </p>
                      
                      <div className="bg-white p-3 rounded-lg border border-amber-200 text-[11px] font-bold text-slate-700 leading-relaxed">
                        <div className="flex gap-1.5"><MapPin size={14} className="text-amber-500 shrink-0" /> <span><strong>آدرس:</strong> آذربایجان شرقی، شهرستان شبستر، شهرک صنعتی شندآباد، کوچه شهرک صنعتی st 20، بازرگانی دست اول</span></div>
                        <div className="flex gap-1.5 mt-1.5"><Mail size={14} className="text-amber-500 shrink-0" /> <span><strong>کد پستی:</strong> <span className="font-mono">5384155355</span></span></div>
                        <div className="flex gap-1.5 mt-1.5"><Phone size={14} className="text-amber-500 shrink-0" /> <span><strong>تلفن:</strong> <span className="font-mono">09999123001</span></span></div>
                      </div>
                    </div>`;

content = content.replace(
  '                      </div>\n                    </div>\n                  </div>\n                )}\n              </div>\n            )}\n\n            {/* STEP 4',
  '                      </div>\n                    </div>\n' + addressHtml + '\n                  </div>\n                )}\n              </div>\n            )}\n\n            {/* STEP 4'
);

fs.writeFileSync('src/components/CheckoutWizard.tsx', content);

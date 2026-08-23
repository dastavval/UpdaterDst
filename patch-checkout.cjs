const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutWizard.tsx', 'utf8');

// 1. Add sayadReceiptImage state
content = content.replace(
  'const [chequeImage, setChequeImage] = useState("");',
  'const [chequeImage, setChequeImage] = useState("");\n  const [sayadReceiptImage, setSayadReceiptImage] = useState("");'
);

// 2. Add to order object
content = content.replace(
  'chequeImageUrl: chequeImage || null',
  'chequeImageUrl: chequeImage || null,\n          sayadReceiptImageUrl: sayadReceiptImage || null'
);

// 3. Add address and warning
const addressHtml = `                    {/* Mailing Address & Warning for Cheque */}
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
  '                  </div>\n                )}\n\n              </div>',
  addressHtml + '\n                  </div>\n                )}\n\n              </div>'
);

// 4. Add sayad receipt upload input in the cheque card
const sayadUploadHtml = `                        <div className="pt-2">
                          <input
                            type="file"
                            accept="image/*"
                            id="sayad-receipt-split-input"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onloadend = () => setSayadReceiptImage(r.result as string);
                                r.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="sayad-receipt-split-input"
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Upload size={13} />
                            <span>{sayadReceiptImage ? "تغییر تصویر رسید ثبت صیادی" : "آپلود تصویر رسید ثبت صیادی"}</span>
                          </label>
                          {sayadReceiptImage && (
                            <span className="text-[10px] text-purple-700 font-black flex items-center gap-1 mt-1.5 justify-center">
                              <CheckCircle2 size={13} /> رسید ثبت صیادی دریافت شد
                            </span>
                          )}
                        </div>`;

content = content.replace(
  '                          {chequeImage && (\n                            <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1 mt-1.5 justify-center">\n                              <CheckCircle2 size={13} /> تصویر روی چک صیادی دریافت شد\n                            </span>\n                          )}\n                        </div>',
  '                          {chequeImage && (\n                            <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1 mt-1.5 justify-center">\n                              <CheckCircle2 size={13} /> تصویر روی چک صیادی دریافت شد\n                            </span>\n                          )}\n                        </div>\n' + sayadUploadHtml
);

fs.writeFileSync('src/components/CheckoutWizard.tsx', content);

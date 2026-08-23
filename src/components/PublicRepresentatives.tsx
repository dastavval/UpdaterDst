import React, { useEffect, useState } from "react";
import { collection, getDocs, db } from "../lib/data-layer";
import { Award, MapPin, Building, ShieldCheck, Star } from "lucide-react";
import { motion } from "motion/react";

export default function PublicRepresentatives() {
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const approvedReps = users.filter(u => u.role === 'representative' && u.status === 'approved');
        
        // Mock data if none found to show the feature
        if (approvedReps.length === 0) {
          setReps([
            { id: 'mock1', name: 'رضا احمدی', company: 'پخش مواد غذایی احمدی', city: 'تهران', province: 'تهران', badgeTitle: 'نشان امین', badgeLevel: 'gold', yearsActive: 2 },
            { id: 'mock2', name: 'شرکت توزیع سراسری آفتاب', company: 'توزیع سراسری آفتاب', city: 'مشهد', province: 'خراسان رضوی', badgeTitle: 'نشان امین', badgeLevel: 'silver', yearsActive: 1 },
            { id: 'mock3', name: 'محمد مرادی', company: 'بازرگانی مرادی', city: 'اصفهان', province: 'اصفهان', badgeTitle: 'نشان برنا', badgeLevel: 'bronze', yearsActive: 0 }
          ]);
        } else {
          setReps(approvedReps.map(rep => ({
            ...rep,
            badgeTitle: rep.repBadgeTitle || 'نشان امین',
            badgeLevel: rep.repBadgeLevel || 'silver',
            yearsActive: rep.yearsActive || 0
          })));
        }
      } catch (err) {
        console.error("Error fetching reps:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReps();
  }, []);

  if (loading || reps.length === 0) return null;

  return (
    <div className="py-12 bg-slate-50 border-t border-slate-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Award className="text-amber-500" size={32} />
              <span>عاملیت‌های مجاز و نمایندگان رسمی</span>
            </h2>
            <p className="text-sm font-bold text-slate-500">
              لیست نمایندگان انحصاری و عاملیت‌های پخش دارای نشان تایید پلتفرم دست‌اول در سراسر کشور
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="text-xs font-black text-slate-700">تضمین حسن انجام کار</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reps.map((rep, idx) => (
            <motion.div
              key={rep.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
            >
              {/* Badge Ribbon */}
              <div className={`absolute top-0 left-0 w-16 h-16 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rotate-45 ${
                rep.badgeLevel === 'gold' ? 'bg-amber-400 text-amber-900' :
                rep.badgeLevel === 'silver' ? 'bg-slate-300 text-slate-800' :
                'bg-emerald-500 text-white'
              }`}>
                <Star size={12} className="mt-6 ml-6" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Building className="text-indigo-600" size={24} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {rep.company || rep.name || 'عاملیت مجاز'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <MapPin size={12} />
                    <span>{rep.province}، {rep.city}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                    rep.badgeLevel === 'gold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    rep.badgeLevel === 'silver' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <ShieldCheck size={12} />
                    <span>{rep.badgeTitle || 'نشان امین'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {rep.yearsActive > 0 ? `${rep.yearsActive} سال سابقه فعالیت` : 'عاملیت جدید'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

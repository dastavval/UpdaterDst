import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Award, ThumbsUp, ChevronDown, Plus, ShieldCheck, User } from 'lucide-react';
import { Review } from '../types';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from '../lib/firebase-mock';
import { db, auth } from '../lib/firebase';

interface ProductReviewsProps {
  productId: string;
  theme?: 'light' | 'dark';
}

export default function ProductReviews({ productId, theme = 'light' }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  
  // New Review State
  const [rating, setRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
      return;
    }

    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || 'همکار گرامی',
        rating,
        qualityRating,
        packagingRating,
        comment,
        createdAt: serverTimestamp()
      });
      
      setComment('');
      setRating(5);
      setQualityRating(5);
      setPackagingRating(5);
      setShowAddReview(false);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const toPersianNum = (num: number | string) => {
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  const StarRating = ({ value, onChange, size = 18, readonly = false }: { value: number, onChange?: (v: number) => void, size?: number, readonly?: boolean }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star, idx) => (
        <button
          key={`rev-star-${star}-${idx}`}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          <Star 
            size={size} 
            className={`${star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>نظرات و تجربیات همکاران</h3>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(Number(averageRating))} readonly size={14} />
              <span className="text-[10px] font-black text-slate-500">
                {toPersianNum(averageRating)} از ۵ ({toPersianNum(reviews.length)} نظر ثبت شده)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddReview(!showAddReview)}
          className="flex items-center gap-2 bg-white text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus size={16} />
          ثبت تجربه خرید
        </button>
      </div>

      {/* Add Review Form */}
      <AnimatePresence>
        {showAddReview && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmitReview}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 block">امتیاز کلی محصول</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 block">کیفیت محصول</label>
                  <StarRating value={qualityRating} onChange={setQualityRating} size={16} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 block">بسته‌بندی و ارسال</label>
                  <StarRating value={packagingRating} onChange={setPackagingRating} size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 block">نظر شما در مورد این محصول</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="تجربه خود را در مورد کیفیت، قیمت و بسته‌بندی بنویسید..."
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 outline-none focus focus min-h-[100px] font-medium"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddReview(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 hover transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت نهایی نظر'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black text-slate-400">در حال بارگذاری نظرات...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 space-y-3">
            <MessageSquare size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400">هنوز نظری برای این محصول ثبت نشده است. اولین نفر باشید!</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <motion.div
              key={`prod-review-${review.id || idx}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4 hover transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      {review.userName}
                      <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">خریدار تایید شده</span>
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString('fa-IR') : 'به‌زودی'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarRating value={review.rating} readonly size={12} />
                  <div className="flex gap-2">
                    {review.qualityRating && (
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">کیفیت: {toPersianNum(review.qualityRating)}</span>
                    )}
                    {review.packagingRating && (
                      <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">بسته‌بندی: {toPersianNum(review.packagingRating)}</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {review.comment}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover transition-colors cursor-pointer">
                  <ThumbsUp size={12} />
                  مفید بود
                </button>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600">
                  <ShieldCheck size={12} />
                  تایید اصالت دست اول
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

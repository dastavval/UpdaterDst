import React from "react";
import { ShieldCheck, ShieldAlert, Award, Calendar, FileText, CheckCircle } from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

interface ApprovalDetailViewerProps {
  type: "product" | "ad" | "representative" | "supplier" | "callback" | "safeBuy" | "barter" | "ticket" | "raw_material" | "raw_order";
  id: string;
  b2bConfig?: any;
}

export default function ApprovalDetailViewer({ type, id, b2bConfig }: ApprovalDetailViewerProps) {
  // Find matching approval record
  const approvals: any[] = b2bConfig?.approvalsHistory || [];
  const record = approvals.find(
    (app: any) => app.type === type && String(app.targetId) === String(id)
  );

  if (!record) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-500 text-[10px] font-bold">
        <ShieldCheck size={14} className="text-slate-400" />
        <span>اطلاعات ممیزی مستقیم ثبت نشده یا خودکار تأیید شده است.</span>
      </div>
    );
  }

  const isApproved = record.action === "approve" || record.action === "approved";
  const dateStr = record.timestamp
    ? new Date(record.timestamp).toLocaleDateString("fa-IR") +
      " ساعت " +
      new Date(record.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    : "-";

  return (
    <div className={`p-4 rounded-2xl border ${isApproved ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950" : "bg-rose-50/60 border-rose-200/80 text-rose-950"} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black flex items-center gap-1.5">
          {isApproved ? (
            <ShieldCheck size={14} className="text-emerald-600" />
          ) : (
            <ShieldAlert size={14} className="text-rose-600" />
          )}
          <span>وضعیت ممیزی رسمی: {isApproved ? "تأیید شده" : "رد شده / آرشیو"}</span>
        </span>
        <span className="text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1" dir="ltr">
          <Calendar size={10} /> {toPersianNum(dateStr)}
        </span>
      </div>

      <div className="text-[10px] space-y-1.5 font-bold text-slate-600">
        {record.reason && (
          <p className="leading-relaxed flex items-start gap-1">
            <span className="text-slate-400 font-black">علت ممیزی:</span>
            <span className="text-slate-700 font-extrabold">{record.reason}</span>
          </p>
        )}

        {record.badge && (
          <p className="flex items-center gap-1.5">
            <Award size={12} className="text-indigo-500" />
            <span>نشان تخصیص یافته:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black">
              {record.badge === "vip" ? "ویژه VIP" : record.badge === "gold" ? "طلایی" : record.badge === "silver" ? "نقره‌ای" : record.badge}
            </span>
          </p>
        )}

        {record.adminNote && (
          <p className="leading-relaxed flex items-start gap-1">
            <span className="text-slate-400 font-black font-sans">یادداشت فنی:</span>
            <span className="text-slate-700">{record.adminNote}</span>
          </p>
        )}
      </div>
    </div>
  );
}

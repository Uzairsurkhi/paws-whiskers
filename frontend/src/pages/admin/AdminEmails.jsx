import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";

const TONE = { sent: "bg-teal-50 text-teal-800 ring-teal-200", failed: "bg-red-50 text-red-700 ring-red-200", skipped: "bg-amber-50 text-amber-800 ring-amber-200" };

export const AdminEmails = () => {
  const [emails, setEmails] = useState(null);

  useEffect(() => {
    api.admin.emails().then(setEmails).catch((e) => toast.error(errMsg(e)));
  }, []);

  return (
    <div data-testid="admin-emails">
      <p className="text-sm text-stone-500">Every transactional email the store has sent. Order confirmations go out automatically once Stripe confirms payment.</p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#E7E2DA] bg-white">
        {emails === null && <Loader2 size={28} className="mx-auto my-10 animate-spin text-[#EA580C]" />}
        {emails?.length === 0 && <p data-testid="admin-emails-empty" className="p-10 text-center text-sm text-stone-500">No emails sent yet.</p>}
        {emails?.map((e, i) => (
          <div key={i} data-testid={`email-log-${i}`} className="flex flex-wrap items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600"><Mail size={15} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-stone-900">{e.subject}</p>
              <p className="text-xs text-stone-500">To {e.to} · {new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              {e.error && <p className="mt-1 truncate text-xs text-red-600">{e.error}</p>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${TONE[e.status] || "bg-stone-100 text-stone-600 ring-stone-200"}`}>{e.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

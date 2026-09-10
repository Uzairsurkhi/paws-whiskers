import { useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { OrderCard } from "../Orders";

const STATUSES = ["new", "packed", "shipped", "delivered", "cancelled"];
const FILTERS = [["all", "All"], ["paid", "Paid"], ["pending", "Unpaid"]];

export const AdminOrders = () => {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  const load = () => api.admin.orders().then(setOrders).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    setBusy(id);
    try {
      const updated = await api.admin.updateOrder(id, status);
      setOrders((os) => os.map((o) => (o.id === id ? updated : o)));
      const emailStatus = updated.status_notifications?.slice(-1)[0]?.email_status;
      toast[emailStatus === "sent" ? "success" : "warning"](
        emailStatus === "sent"
          ? `Marked as ${status} · customer email sent`
          : `Marked as ${status} · customer email ${emailStatus || "was not sent"}`
      );
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const resend = async (id, kind) => {
    setBusy(id);
    try {
      const r = await api.admin.resendEmail(id, kind);
      r.status === "sent"
        ? toast.success(`${kind ? kind.toUpperCase() + " email" : "Confirmation email"} sent`)
        : toast.warning(`Email ${r.status}: ${r.error || ""}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const shown = orders?.filter((o) => filter === "all" || (filter === "paid" ? o.payment_status === "paid" : o.payment_status !== "paid"));

  return (
    <div data-testid="admin-orders">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map(([k, l]) => (
            <button key={k} data-testid={`orders-filter-${k}`} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${filter === k ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"}`}>{l}</button>
          ))}
        </div>
        <button data-testid="orders-refresh" onClick={load} className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-[#EA580C]"><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="mt-6 space-y-4">
        {orders === null && <Loader2 size={28} className="mx-auto animate-spin text-[#EA580C]" />}
        {shown?.length === 0 && <p data-testid="admin-orders-empty" className="rounded-3xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">No orders here yet.</p>}
        {shown?.map((o) => {
          const lastNotice = o.status_notifications?.slice(-1)[0];
          const fulfilmentAvailable = ["paid", "pending_cod", "pending_verification", "confirmed"].includes(o.payment_status);
          return (
            <OrderCard key={o.id} order={o} admin>
              {fulfilmentAvailable && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Fulfilment</label>
                  <select
                    data-testid={`order-status-select-${o.id}`}
                    value={o.fulfillment_status}
                    disabled={busy === o.id}
                    onChange={(e) => update(o.id, e.target.value)}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold capitalize text-stone-800 focus:border-[#EA580C] focus:outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className={`text-xs font-semibold ${o.email_status === "sent" ? "text-teal-700" : "text-amber-700"}`}>
                    <Mail size={12} className="mr-1 inline" /> Order email {o.email_status || (o.email_sent ? "queued" : "not sent")}
                  </span>
                  {lastNotice && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                      {lastNotice.status} notified ({lastNotice.email_status})
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    {o.fulfillment_status !== "new" && (
                      <button
                        data-testid={`order-resend-status-email-${o.id}`}
                        onClick={() => resend(o.id, o.fulfillment_status)}
                        disabled={busy === o.id}
                        className="text-xs font-bold text-[#EA580C] underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        Resend {o.fulfillment_status} email
                      </button>
                    )}
                    <button
                      data-testid={`order-resend-email-${o.id}`}
                      onClick={() => resend(o.id)}
                      disabled={busy === o.id}
                      className="text-xs font-bold text-stone-500 underline-offset-2 hover:text-[#EA580C] hover:underline disabled:opacity-50"
                    >
                      Resend order email
                    </button>
                  </div>
                </div>
              )}
            </OrderCard>
          );
        })}
      </div>
    </div>
  );
};

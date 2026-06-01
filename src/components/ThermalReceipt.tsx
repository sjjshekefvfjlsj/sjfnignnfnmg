import type { Invoice, InvoiceItem, Customer, AppSettings } from "@/lib/sales";
import { Truck } from "lucide-react";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n) + " " + currency;
}

/**
 * Pure black/white receipt sized for thermal printers (80mm -> 300px, 58mm -> 200px).
 * Rendered on screen for preview, then printed with window.print() (see styles.css
 * @media print rules which hide everything except `.receipt`).
 */
export function ThermalReceipt({
  invoice,
  items,
  customer,
  settings,
  creditBalance,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer | null;
  settings: AppSettings;
  creditBalance?: number;
}) {
  const cur = settings.currency || "ج.م";
  const width = settings.invoice_width === "58" ? "58" : "80";
  const d = new Date(invoice.created_at);
  const date = d.toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
  const time = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const shortId = invoice.id.slice(0, 8).toUpperCase();

  const credit = Number(invoice.paid_credit);

  return (
    <div data-w={width} className="receipt mx-auto rounded-md border border-black/15 p-3 text-[12px] leading-tight shadow-card">
      {/* Header / logo */}
      <div className="flex flex-col items-center gap-1 border-b border-dashed border-black pb-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: "#000" }}>
          <Truck className="h-7 w-7" style={{ color: "#fff" }} strokeWidth={2.2} />
        </div>
        <div className="text-[16px] font-black">{settings.site_name}</div>
        <div className="text-[10px]">{settings.invoice_footer || "نظام المبيعات"}</div>
      </div>

      {/* Meta */}
      <div className="space-y-0.5 border-b border-dashed border-black py-2 text-[11px]">
        <Row label="رقم الفاتورة" value={`#${shortId}`} />
        <Row label="التاريخ" value={date} />
        <Row label="الوقت" value={time} />
        <Row label="العميل" value={customer?.name ?? "—"} />
        {settings.rep_name && <Row label="المندوب" value={settings.rep_name} />}
      </div>

      {/* Items table */}
      <table className="mt-2 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 text-right font-bold">الصنف</th>
            <th className="py-1 text-center font-bold">كمية</th>
            <th className="py-1 text-center font-bold">سعر</th>
            <th className="py-1 text-left font-bold">إجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-dotted border-black/60">
              <td className="py-1 text-right">{it.product_name}</td>
              <td className="py-1 text-center">{Number(it.quantity)}</td>
              <td className="py-1 text-center">{Number(it.price)}</td>
              <td className="py-1 text-left font-bold">{Number(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-2 space-y-0.5 border-t border-black pt-2 text-[12px]">
        <Row label="عدد القطع" value={String(Number(invoice.total_quantity))} />
        <div className="flex items-center justify-between text-[14px] font-black">
          <span>الإجمالي</span>
          <span>{money(Number(invoice.total_amount), cur)}</span>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="mt-2 space-y-0.5 border-t border-dashed border-black pt-2 text-[11px]">
        <div className="mb-1 text-center font-bold">طريقة الدفع</div>
        <Row label="كاش" value={money(Number(invoice.paid_cash), cur)} />
        <Row label="انستاباي" value={money(Number(invoice.paid_instapay), cur)} />
        <Row label="آجل" value={money(credit, cur)} />
      </div>

      {/* Credit emphasis */}
      {credit > 0 && (
        <div className="mt-2 border-2 border-black p-2 text-center">
          <div className="text-[11px] font-bold">آجل على هذه الفاتورة</div>
          <div className="text-[18px] font-black">{money(credit, cur)}</div>
          {typeof creditBalance === "number" && (
            <div className="mt-1 text-[10px]">إجمالي الآجل المتبقي: {money(creditBalance, cur)}</div>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-dashed border-black pt-2 text-center text-[10px]">
        شكراً لتعاملكم معنا
        {settings.rep_phone ? ` — ${settings.rep_phone}` : ""}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

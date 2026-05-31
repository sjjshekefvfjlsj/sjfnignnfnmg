import type { Invoice, InvoiceItem, Customer, AppSettings } from "@/lib/sales";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n) + " " + currency;
}

/**
 * Opens a print-ready, themed (orange/white) invoice in a new window and
 * triggers the browser print dialog so the user can save it as a PDF.
 * Uses the browser's own renderer so Arabic text shapes correctly.
 */
export function downloadInvoicePdf(opts: {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer | null;
  settings: AppSettings;
}) {
  const { invoice, items, customer, settings } = opts;
  const cur = settings.currency || "ج.م";
  const date = new Date(invoice.created_at).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = invoice.id.slice(0, 8).toUpperCase();

  const rows = items
    .map(
      (it, i) => `
      <tr style="background:${i % 2 ? "#fff7ed" : "#ffffff"}">
        <td class="c">${i + 1}</td>
        <td class="r">${escapeHtml(it.product_name)}</td>
        <td class="c">${Number(it.quantity)}</td>
        <td class="c">${money(Number(it.price), cur)}</td>
        <td class="c b">${money(Number(it.line_total), cur)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>فاتورة ${shortId}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { font-family: "Cairo", system-ui, sans-serif; margin: 0; color: #2b2118; background:#fff; }
  .page { max-width: 760px; margin: 0 auto; padding: 28px; }
  .head {
    display:flex; justify-content:space-between; align-items:center;
    background: linear-gradient(135deg,#fb923c,#ea580c); color:#fff;
    border-radius: 22px; padding: 22px 24px;
  }
  .brand { font-size: 26px; font-weight: 900; }
  .brand small { display:block; font-size: 12px; font-weight:600; opacity:.9; }
  .badge { text-align:left; }
  .badge .lbl { font-size: 12px; opacity:.9; }
  .badge .num { font-size: 20px; font-weight: 900; letter-spacing:1px; }
  .meta { display:flex; gap:14px; margin-top:18px; flex-wrap:wrap; }
  .card { flex:1; min-width:180px; border:1px solid #fed7aa; border-radius:16px; padding:14px 16px; background:#fff; }
  .card .lbl { font-size:12px; color:#9a6b46; font-weight:700; }
  .card .val { font-size:16px; font-weight:800; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin-top:20px; border-radius:16px; overflow:hidden; border:1px solid #fed7aa; }
  thead th { background:#ea580c; color:#fff; font-size:13px; padding:11px 8px; }
  td { padding:11px 8px; font-size:14px; border-top:1px solid #fde7d2; }
  .c { text-align:center; } .r { text-align:right; font-weight:700; } .b { font-weight:800; color:#c2410c; }
  .totals { margin-top:20px; display:flex; justify-content:flex-end; gap:14px; flex-wrap:wrap; }
  .tot { border:1px solid #fed7aa; border-radius:16px; padding:14px 20px; text-align:center; min-width:150px; }
  .tot.main { background:linear-gradient(135deg,#fb923c,#ea580c); color:#fff; border:none; }
  .tot .lbl { font-size:12px; opacity:.85; font-weight:700; }
  .tot .val { font-size:22px; font-weight:900; margin-top:4px; }
  .foot { margin-top:30px; text-align:center; color:#9a6b46; font-size:12px; }
  @media print { .page { padding: 8px; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="page">
    <div class="head">
      <div class="brand">${escapeHtml(settings.site_name)}<small>نظام المبيعات</small></div>
      <div class="badge"><div class="lbl">رقم الفاتورة</div><div class="num">#${shortId}</div></div>
    </div>

    <div class="meta">
      <div class="card"><div class="lbl">العميل</div><div class="val">${escapeHtml(customer?.name ?? "—")}</div></div>
      <div class="card"><div class="lbl">التاريخ</div><div class="val">${date}</div></div>
      ${customer?.phone ? `<div class="card"><div class="lbl">الهاتف</div><div class="val">${escapeHtml(customer.phone)}</div></div>` : ""}
      ${settings.rep_name ? `<div class="card"><div class="lbl">المندوب</div><div class="val">${escapeHtml(settings.rep_name)}</div></div>` : ""}
    </div>

    <table>
      <thead><tr>
        <th style="width:36px">#</th><th>الصنف</th><th style="width:70px">الكمية</th>
        <th style="width:110px">السعر</th><th style="width:120px">الإجمالي</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="tot"><div class="lbl">إجمالي القطع</div><div class="val">${Number(invoice.total_quantity)}</div></div>
      <div class="tot main"><div class="lbl">الإجمالي النهائي</div><div class="val">${money(Number(invoice.total_amount), cur)}</div></div>
    </div>

    <div class="foot">
      شكراً لتعاملكم معنا${settings.rep_phone ? ` — للتواصل: ${escapeHtml(settings.rep_phone)}` : ""}
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    };
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) {
    // Fallback for popup blockers: navigate via blob.
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ReceiptText, User, FilePlus2, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { fetchInvoice, formatMoney } from "@/lib/sales";
import { useSettings } from "@/hooks/use-settings";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";


export const Route = createFileRoute("/invoice/$invoiceId")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفاتورة — ديليفري" },
      { name: "description", content: "مراجعة تفاصيل فاتورة العميل وبنودها." },
    ],
  }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { invoiceId } = useParams({ from: "/invoice/$invoiceId" });
  const { settings } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
  });

  const customer = data?.customer;

  const handlePdf = () => {
    if (!data) return;
    downloadInvoicePdf({
      invoice: data.invoice,
      items: data.items,
      customer: data.customer,
      settings,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="تفاصيل الفاتورة"
        subtitle={customer?.name}
        backTo={customer ? "/customer/$id" : "/dashboard"}
        backParams={customer ? { id: customer.id } : undefined}
        icon={<ReceiptText className="h-6 w-6" />}
        action={
          data ? (
            <button
              onClick={handlePdf}
              className="flex h-10 items-center gap-1 rounded-full bg-white/20 px-4 text-sm font-bold transition hover:bg-white/30 active:scale-90"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          ) : undefined
        }
      />


      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">جاري التحميل...</p>
        ) : !data ? (
          <p className="py-10 text-center text-muted-foreground">الفاتورة غير موجودة.</p>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-bold text-card-foreground">
                    {customer?.name ?? "—"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(data.invoice.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-12 gap-2 bg-muted/60 px-3 py-2 text-xs font-bold text-muted-foreground">
                  <span className="col-span-5">الصنف</span>
                  <span className="col-span-2 text-center">الكمية</span>
                  <span className="col-span-2 text-center">السعر</span>
                  <span className="col-span-3 text-center">الإجمالي</span>
                </div>
                {data.items.map((it) => (
                  <div
                    key={it.id}
                    className="grid grid-cols-12 items-center gap-2 border-t border-border/60 px-3 py-2.5 text-sm"
                  >
                    <span className="col-span-5 truncate font-semibold text-card-foreground">
                      {it.product_name}
                    </span>
                    <span className="col-span-2 text-center text-card-foreground">
                      {Number(it.quantity)}
                    </span>
                    <span className="col-span-2 text-center text-muted-foreground">
                      {formatMoney(Number(it.price))}
                    </span>
                    <span className="col-span-3 text-center font-bold text-card-foreground">
                      {formatMoney(Number(it.line_total))}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
                <p className="text-xs text-muted-foreground">إجمالي القطع</p>
                <p className="mt-1 text-2xl font-black text-card-foreground">
                  {Number(data.invoice.total_quantity)}
                </p>
              </div>
              <div className="rounded-2xl gradient-brand p-4 text-center text-brand-foreground shadow-warm">
                <p className="text-xs opacity-90">الإجمالي النهائي</p>
                <p className="mt-1 text-2xl font-black">
                  {formatMoney(Number(data.invoice.total_amount))}
                </p>
              </div>
            </div>

            {customer && (
              <Link
                to="/customer/$id/new-invoice"
                params={{ id: customer.id }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card px-6 py-3.5 font-extrabold text-primary transition active:scale-[0.98] hover:bg-brand-soft"
              >
                <FilePlus2 className="h-5 w-5" />
                فاتورة جديدة لنفس العميل
              </Link>
            )}
          </>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Phone,
  FilePlus2,
  ReceiptText,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  fetchCustomer,
  fetchInvoicesByCustomer,
  formatMoney,
  dayLabel,
} from "@/lib/sales";

export const Route = createFileRoute("/customer/$id")({
  head: () => ({
    meta: [
      { title: "ملف العميل — ديليفري" },
      { name: "description", content: "بيانات العميل وفواتيره السابقة وإنشاء فاتورة جديدة." },
    ],
  }),
  component: CustomerProfile,
});

function CustomerProfile() {
  const { id } = useParams({ from: "/customer/$id" });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });
  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => fetchInvoicesByCustomer(id),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={customer?.name ?? "ملف العميل"}
        subtitle={customer ? `خط سير ${dayLabel(customer.day_of_week)}` : undefined}
        backTo={customer ? "/day/$day" : "/routes"}
        backParams={customer ? { day: String(customer.day_of_week) } : undefined}
        icon={<User className="h-6 w-6" />}
      />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">جاري التحميل...</p>
        ) : !customer ? (
          <p className="py-10 text-center text-muted-foreground">العميل غير موجود.</p>
        ) : (
          <>
            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-2xl font-black text-brand-foreground shadow-warm">
                  {customer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-black text-card-foreground">{customer.name}</p>
                  <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      يوم {dayLabel(customer.day_of_week)}
                    </span>
                    {customer.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {customer.location}
                      </span>
                    )}
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-primary">
                        <Phone className="h-3.5 w-3.5" />
                        {customer.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* New invoice button */}
            <Link
              to="/customer/$id/new-invoice"
              params={{ id }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98]"
            >
              <FilePlus2 className="h-5 w-5" />
              إنشاء فاتورة جديدة
            </Link>

            {/* History */}
            <div className="mt-7">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <ReceiptText className="h-5 w-5 text-primary" />
                الفواتير السابقة
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-primary">
                  {invoices.length}
                </span>
              </h2>

              {invLoading ? (
                <p className="py-6 text-center text-muted-foreground">جاري التحميل...</p>
              ) : invoices.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card py-10 text-center shadow-card">
                  <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-bold text-card-foreground">مفيش فواتير لسه</p>
                  <p className="mt-1 text-sm text-muted-foreground">اعمل أول فاتورة للعميل ده</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv, i) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <Link
                        to="/invoice/$invoiceId"
                        params={{ invoiceId: inv.id }}
                        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition active:scale-[0.99] hover:shadow-warm"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary">
                          <ReceiptText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-card-foreground">
                            {formatMoney(Number(inv.total_amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Number(inv.total_quantity)} قطعة •{" "}
                            {new Date(inv.created_at).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <ChevronLeft className="h-5 w-5 shrink-0 text-primary transition group-hover:-translate-x-1" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

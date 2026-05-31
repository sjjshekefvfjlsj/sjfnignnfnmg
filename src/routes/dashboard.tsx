import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  CalendarDays,
  Truck,
  ChevronLeft,
  Settings,
  Users,
  Boxes,
  Wallet,
  ReceiptText,
} from "lucide-react";
import { fetchDashboardStats, formatMoney } from "@/lib/sales";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "الرئيسية" },
      { name: "description", content: "الشاشة الرئيسية: رصيد المخزن وخطوط سير العملاء." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { settings } = useSettings();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboardStats });

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="gradient-brand text-brand-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Truck className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-brand-foreground/80">أهلاً بك في</p>
            <h1 className="text-2xl font-black leading-tight">{settings.site_name}</h1>
          </div>
          <Link
            to="/settings"
            aria-label="الإعدادات"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 active:scale-90"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <DashCard
          to="/warehouse"
          icon={<Package className="h-9 w-9" />}
          title="رصيد المخزن"
          desc="الأصناف المتاحة والكميات والأسعار"
          delay={0}
          stats={[
            { icon: <Boxes className="h-4 w-4" />, label: "قطعة بالمخزون", value: String(stats?.totalStockQty ?? 0) },
            { icon: <Wallet className="h-4 w-4" />, label: "قيمة المخزن", value: formatMoney(stats?.totalStockValue ?? 0, settings.currency) },
          ]}
        />

        <div className="h-5" />

        <DashCard
          to="/routes"
          icon={<CalendarDays className="h-9 w-9" />}
          title="خطوط سير العملاء"
          desc="عملاء كل يوم من السبت للخميس"
          delay={0.08}
          stats={[
            { icon: <Users className="h-4 w-4" />, label: "إجمالي العملاء", value: String(stats?.customerCount ?? 0) },
            { icon: <ReceiptText className="h-4 w-4" />, label: "إجمالي المبيعات", value: formatMoney(stats?.totalSales ?? 0, settings.currency) },
          ]}
        />
      </main>
    </div>
  );
}

function DashCard({
  to,
  icon,
  title,
  desc,
  delay,
  stats,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
  stats: { icon: React.ReactNode; label: string; value: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className="group block rounded-3xl border border-border bg-card p-5 shadow-card transition hover:shadow-warm"
      >
        {/* Stats row */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-brand-soft/60 p-3">
              <div className="flex items-center gap-1.5 text-primary">
                {s.icon}
                <span className="text-[11px] font-bold text-muted-foreground">{s.label}</span>
              </div>
              <p className="mt-1 truncate text-lg font-black text-card-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-brand text-brand-foreground shadow-warm">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-card-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
          <ChevronLeft className="h-6 w-6 shrink-0 text-primary transition group-hover:-translate-x-1" />
        </div>
      </Link>
    </motion.div>
  );
}

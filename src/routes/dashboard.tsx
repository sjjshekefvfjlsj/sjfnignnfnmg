import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Package, CalendarDays, Truck, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "الرئيسية — ديليفري" },
      { name: "description", content: "الشاشة الرئيسية: رصيد المخزن وخطوط سير العملاء." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-brand text-brand-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-brand-foreground/80">أهلاً بك في</p>
            <h1 className="text-2xl font-black leading-tight">ديليفري</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="mb-5 text-lg font-extrabold text-foreground">اختر من أين تبدأ</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DashCard
            to="/warehouse"
            color="from-orange-400"
            icon={<Package className="h-9 w-9" />}
            title="رصيد المخزن"
            desc="الأصناف المتاحة والكميات والأسعار"
            delay={0}
          />
          <DashCard
            to="/routes"
            icon={<CalendarDays className="h-9 w-9" />}
            title="خطوط سير العملاء"
            desc="عملاء كل يوم من السبت للخميس"
            delay={0.08}
          />
        </div>
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
}: {
  to: string;
  color?: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <Link
        to={to}
        className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition active:scale-[0.98] hover:shadow-warm"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-brand-foreground shadow-warm">
          {icon}
        </div>
        <h3 className="mt-5 text-xl font-black text-card-foreground">{title}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
        <span className="mt-4 flex items-center gap-1 text-sm font-bold text-primary">
          ادخل
          <ChevronLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
        </span>
      </Link>
    </motion.div>
  );
}

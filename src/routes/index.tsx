import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  Truck,
  Download,
  ArrowLeft,
  Package,
  Users,
  ReceiptText,
  CalendarDays,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ديليفري — حمّل التطبيق وابدأ البيع" },
      {
        name: "description",
        content:
          "ثبّت تطبيق ديليفري على هاتفك لإدارة المخزن وخطوط سير العملاء وإنشاء الفواتير بسهولة.",
      },
    ],
  }),
  component: WelcomePage,
});

const FEATURES = [
  { icon: Package, title: "رصيد المخزن", desc: "تابع كل صنف وكميته وسعره لحظياً" },
  { icon: CalendarDays, title: "خطوط السير", desc: "عملاء كل يوم في مكانهم من السبت للخميس" },
  { icon: ReceiptText, title: "فواتير فورية", desc: "اختر الصنف والكمية والإجمالي يتحسب تلقائياً" },
  { icon: Users, title: "ملفات العملاء", desc: "كل فواتير العميل القديمة في متناول يدك" },
];

function WelcomePage() {
  const navigate = useNavigate();
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();

  // When opened as an installed app (standalone), skip the install screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);


  const handleInstall = async () => {
    if (isInstalled) {
      toast.success("التطبيق مثبّت بالفعل على جهازك ✅");
      return;
    }
    if (canInstall) {
      const ok = await promptInstall();
      if (ok) toast.success("تم تثبيت التطبيق بنجاح 🎉");
    } else {
      toast.info(
        "افتح قائمة المتصفح ثم اختر «إضافة إلى الشاشة الرئيسية / تثبيت التطبيق» لتثبيته.",
        { duration: 6000 },
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-40 h-64 w-64 rounded-full bg-brand-soft blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] gradient-brand shadow-warm"
          >
            <Truck className="h-14 w-14 text-brand-foreground" strokeWidth={2.2} />
          </motion.div>

          <h1 className="mt-6 text-3xl font-black leading-tight text-foreground">
            ديليفري
            <span className="block bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent">
              نظام المبيعات الذكي
            </span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            حمّل التطبيق على هاتفك وخليه دايماً معاك — تفتحه في أي وقت تدير منه المخزن
            وخطوط سير العملاء وتطلع الفواتير في ثواني.
          </p>
        </motion.div>

        {/* Install card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-card-foreground">ثبّت كتطبيق PWA</p>
              <p className="text-sm text-muted-foreground">
                {isInstalled ? "التطبيق مثبّت على جهازك" : "أسرع، أخف، ويفتح من شاشتك الرئيسية"}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {[
              "يفتح بضغطة من شاشة الموبايل بدون متصفح",
              "أداء أسرع وتجربة كأنه تطبيق أصلي",
              "كل بياناتك محفوظة في السحابة",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-card-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Features grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <f.icon className="h-7 w-7 text-primary" />
              <p className="mt-2 font-bold text-card-foreground">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleInstall}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            تثبيت التطبيق
          </button>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card px-6 py-4 text-lg font-extrabold text-primary transition active:scale-[0.98] hover:bg-brand-soft"
          >
            إكمل
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          تقدر تستخدم البرنامج على طول من المتصفح بالضغط على «إكمل».
        </p>
      </div>
    </div>
  );
}

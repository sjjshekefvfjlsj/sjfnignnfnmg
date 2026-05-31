import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Save, Store, KeyRound, Lock, Coins, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { fetchSettings, updateSettings } from "@/lib/sales";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات" },
      { name: "description", content: "تحكم في اسم الموقع وكلمة المرور وإعدادات التطبيق." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["app-settings"], queryFn: fetchSettings });

  const [siteName, setSiteName] = useState("");
  const [password, setPassword] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("10");
  const [lockHours, setLockHours] = useState("3");
  const [currency, setCurrency] = useState("ج.م");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");

  useEffect(() => {
    if (!data) return;
    setSiteName(data.site_name);
    setPassword(data.app_password);
    setMaxAttempts(String(data.max_attempts));
    setLockHours(String(data.lock_hours));
    setCurrency(data.currency);
    setRepName(data.rep_name ?? "");
    setRepPhone(data.rep_phone ?? "");
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings(data!.id, {
        site_name: siteName.trim() || "ديليفري",
        app_password: password.trim() || "1185",
        max_attempts: Math.max(1, Number(maxAttempts) || 10),
        lock_hours: Math.max(1, Number(lockHours) || 3),
        currency: currency.trim() || "ج.م",
        rep_name: repName.trim() || null,
        rep_phone: repPhone.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("تم حفظ الإعدادات ✅");
    },
    onError: () => toast.error("تعذّر الحفظ، حاول مرة أخرى"),
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="الإعدادات"
        subtitle="تحكم كامل في التطبيق"
        backTo="/dashboard"
        icon={<SettingsIcon className="h-6 w-6" />}
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">جاري التحميل...</p>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate();
            }}
            className="space-y-5"
          >
            <Section icon={<Store className="h-5 w-5" />} title="هوية التطبيق">
              <Field label="اسم الموقع / الشركة">
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="ديليفري" />
                <p className="mt-1 text-xs text-muted-foreground">
                  هيظهر الاسم الجديد في كل مكان بدل القديم.
                </p>
              </Field>
              <Field label="عملة الأسعار">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="ج.م" />
                </div>
              </Field>
            </Section>

            <Section icon={<KeyRound className="h-5 w-5" />} title="الحماية وكلمة المرور">
              <Field label="كلمة مرور الدخول">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} inputMode="numeric" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="عدد المحاولات">
                  <Input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                  />
                </Field>
                <Field label="مدة الحظر (ساعة)">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <Input
                      type="number"
                      value={lockHours}
                      onChange={(e) => setLockHours(e.target.value)}
                    />
                  </div>
                </Field>
              </div>
              <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-primary">
                لو زادت المحاولات الخاطئة عن العدد المحدد، يتم قفل التطبيق للمدة المحددة.
              </p>
            </Section>

            <Section icon={<User className="h-5 w-5" />} title="بيانات المندوب (تظهر في الفاتورة)">
              <Field label="اسم المندوب">
                <Input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="اختياري" />
              </Field>
              <Field label="هاتف المندوب">
                <Input
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  placeholder="اختياري"
                  inputMode="tel"
                />
              </Field>
            </Section>

            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saveMut.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </motion.form>
        )}
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-primary">
          {icon}
        </span>
        <h2 className="font-extrabold text-card-foreground">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

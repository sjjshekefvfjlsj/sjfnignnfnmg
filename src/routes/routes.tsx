import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Plus, ChevronLeft, UserPlus, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { WEEK_DAYS, addCustomer, customerCountsByDay, todayRouteIndex } from "@/lib/sales";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "خطوط سير العملاء — ديليفري" },
      { name: "description", content: "عملاء كل يوم من أيام الأسبوع من السبت إلى الخميس." },
    ],
  }),
  component: RoutesPage,
});

function RoutesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: counts = {} } = useQuery({
    queryKey: ["customerCounts"],
    queryFn: customerCountsByDay,
  });
  const today = todayRouteIndex();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState<number>(today >= 0 ? today : 0);

  const addMut = useMutation({
    mutationFn: () =>
      addCustomer({ name: name.trim(), location: location.trim(), phone: phone.trim(), day_of_week: day }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customerCounts"] });
      qc.invalidateQueries({ queryKey: ["customersByDay"] });
      setOpen(false);
      setName("");
      setLocation("");
      setPhone("");
      toast.success("تمت إضافة العميل");
    },
    onError: () => toast.error("حصل خطأ، حاول مرة تانية"),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="خطوط سير العملاء"
        subtitle="اختر اليوم لعرض عملائه"
        backTo="/dashboard"
        icon={<CalendarDays className="h-6 w-6" />}
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-1 rounded-full bg-white/20 px-4 text-sm font-bold transition hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            عميل
          </button>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {today >= 0 && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-bold text-primary">
            <Star className="h-4 w-4 fill-current" />
            خط سير اليوم: {WEEK_DAYS.find((d) => d.value === today)?.label}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {WEEK_DAYS.map((d, i) => {
            const count = counts[d.value] ?? 0;
            const isToday = d.value === today;
            return (
              <motion.div
                key={d.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  to="/day/$day"
                  params={{ day: String(d.value) }}
                  className={`group relative flex h-full flex-col items-center justify-center rounded-3xl border bg-card p-5 text-center shadow-card transition active:scale-[0.97] hover:shadow-warm ${
                    isToday ? "border-primary ring-2 ring-primary/30" : "border-border"
                  }`}
                >
                  {isToday && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
                      اليوم
                    </span>
                  )}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-brand-foreground shadow-warm">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-lg font-black text-card-foreground">{d.label}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {count} عميل
                  </p>
                  <span className="mt-2 flex items-center gap-1 text-xs font-bold text-primary">
                    عرض
                    <ChevronLeft className="h-3 w-3 transition group-hover:-translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={() => setOpen(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-card px-6 py-4 font-extrabold text-primary transition active:scale-[0.98] hover:bg-brand-soft"
        >
          <UserPlus className="h-5 w-5" />
          إضافة عميل جديد وتحديد يومه
        </button>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return toast.error("اكتب اسم العميل");
              addMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="cname">اسم العميل</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: سوبر ماركت النور" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cloc">المقر / العنوان</Label>
              <Input id="cloc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: شارع الجمهورية" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">رقم الهاتف (اختياري)</Label>
              <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>يوم خط السير</Label>
              <div className="grid grid-cols-3 gap-2">
                {WEEK_DAYS.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => setDay(d.value)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
                      day === d.value
                        ? "border-primary bg-primary text-brand-foreground"
                        : "border-border bg-card text-card-foreground hover:bg-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <button
                type="submit"
                disabled={addMut.isPending}
                className="w-full rounded-2xl gradient-brand px-6 py-3 font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98] disabled:opacity-60"
              >
                {addMut.isPending ? "جاري الحفظ..." : "حفظ العميل"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) return toast.error("اكتب اسم العميل");
                  addMut.mutate(undefined, {
                    onSuccess: () => navigate({ to: "/day/$day", params: { day: String(day) } }),
                  });
                }}
                className="w-full rounded-2xl border border-primary bg-card px-6 py-3 font-bold text-primary transition hover:bg-brand-soft"
              >
                حفظ وفتح يوم {WEEK_DAYS.find((d) => d.value === day)?.label}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { FilePlus2, Search, Check, Save, Package, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/hooks/use-settings";
import {
  fetchCustomer,
  fetchProducts,
  createInvoice,
  formatMoney,
  type NewInvoiceLine,
} from "@/lib/sales";

export const Route = createFileRoute("/customer/$id/new-invoice")({
  head: () => ({
    meta: [
      { title: "فاتورة جديدة — ديليفري" },
      { name: "description", content: "إنشاء فاتورة جديدة للعميل مع احتساب تلقائي للإجمالي." },
    ],
  }),
  component: NewInvoice,
});

type Step = "pick" | "qty" | "pay";

function NewInvoice() {
  const { id } = useParams({ from: "/customer/$id/new-invoice" });
  const navigate = useNavigate();
  const { settings } = useSettings();
  const cur = settings.currency;

  const { data: customer } = useQuery({ queryKey: ["customer", id], queryFn: () => fetchCustomer(id) });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [step, setStep] = useState<Step>("pick");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState<Record<string, string>>({});
  const [cash, setCash] = useState("");
  const [insta, setInsta] = useState("");
  const [credit, setCredit] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [products, search],
  );

  const chosen = products.filter((p) => selected[p.id]);

  const lines: NewInvoiceLine[] = chosen.map((p) => ({
    product_id: p.id,
    product_name: p.name,
    price: Number(p.price),
    quantity: Number(qty[p.id]) || 0,
  }));

  const totalAmount = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const paid = (Number(cash) || 0) + (Number(insta) || 0) + (Number(credit) || 0);
  const diff = Math.round((totalAmount - paid) * 100) / 100;

  const saveMut = useMutation({
    mutationFn: () =>
      createInvoice(id, lines, {
        paid_cash: Number(cash) || 0,
        paid_instapay: Number(insta) || 0,
        paid_credit: Number(credit) || 0,
      }),
    onSuccess: (invoice) => {
      toast.success("تم حفظ الفاتورة 🎉");
      navigate({ to: "/invoice/$invoiceId", params: { invoiceId: invoice.id } });
    },
    onError: () => toast.error("تعذّر حفظ الفاتورة"),
  });

  const goToQty = () => {
    if (chosen.length === 0) return toast.error("اختر صنف واحد على الأقل");
    setStep("qty");
  };

  const goToPay = () => {
    for (const l of lines) {
      if (!l.quantity || l.quantity <= 0) return toast.error(`اكتب كمية صحيحة لـ ${l.product_name}`);
    }
    setCash(String(totalAmount));
    setInsta("");
    setCredit("");
    setStep("pay");
  };

  const confirm = () => {
    if (diff !== 0) return toast.error("مجموع طرق الدفع لازم يساوي إجمالي الفاتورة بالظبط");
    saveMut.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <PageHeader
        title="فاتورة جديدة"
        subtitle={customer?.name}
        backTo="/customer/$id"
        backParams={{ id }}
        icon={<FilePlus2 className="h-6 w-6" />}
      />

      {/* Stepper */}
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 pt-4 text-xs font-bold">
        {(["pick", "qty", "pay"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                step === s ? "gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === s ? "text-primary" : "text-muted-foreground"}>
              {s === "pick" ? "الأصناف" : s === "qty" ? "الكميات" : "الدفع"}
            </span>
            {i < 2 && <span className="text-muted-foreground">—</span>}
          </div>
        ))}
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {/* STEP 1: pick products */}
        {step === "pick" && (
          <div>
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن صنف..."
                className="pr-9"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card py-10 text-center shadow-card">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">لا توجد أصناف مطابقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => {
                  const on = !!selected[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected((s) => ({ ...s, [p.id]: !on }))}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-right shadow-card transition active:scale-[0.99] ${
                        on ? "border-primary ring-2 ring-primary/30" : "border-border"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          on ? "gradient-brand border-transparent text-brand-foreground" : "border-border"
                        }`}
                      >
                        {on && <Check className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-card-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          متاح: {Number(p.quantity)} • {formatMoney(Number(p.price), cur)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: quantities */}
        {step === "qty" && (
          <div className="space-y-2">
            {chosen.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-card-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatMoney(Number(p.price), cur)}</p>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={qty[p.id] ?? ""}
                  onChange={(e) => setQty((q) => ({ ...q, [p.id]: e.target.value }))}
                  placeholder="الكمية"
                  className="w-28"
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: payment */}
        {step === "pay" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="mb-3 font-extrabold text-card-foreground">تقسيم الدفع</p>
              <div className="space-y-3">
                <PayField label="كاش" value={cash} onChange={setCash} />
                <PayField label="انستاباي" value={insta} onChange={setInsta} />
                <PayField label="آجل (يتسجل على العميل)" value={credit} onChange={setCredit} />
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الفاتورة</span>
                <span className="font-black text-card-foreground">{formatMoney(totalAmount, cur)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إجمالي المدفوع</span>
                <span className="font-black text-card-foreground">{formatMoney(paid, cur)}</span>
              </div>
              <div
                className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${
                  diff === 0 ? "bg-brand-soft text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                <span>{diff === 0 ? "متطابق ✓" : "الفرق"}</span>
                <span>{formatMoney(Math.abs(diff), cur)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {step !== "pick" && (
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي ({totalQty} قطعة)</span>
              <span className="text-xl font-black text-primary">{formatMoney(totalAmount, cur)}</span>
            </div>
          )}
          <div className="flex gap-2">
            {step !== "pick" && (
              <button
                onClick={() => setStep(step === "pay" ? "qty" : "pick")}
                className="flex items-center justify-center gap-1 rounded-2xl border border-border bg-card px-4 py-3.5 font-bold text-card-foreground transition active:scale-95"
              >
                <ArrowRight className="h-5 w-5" />
                رجوع
              </button>
            )}
            {step === "pick" && (
              <button
                onClick={goToQty}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-3.5 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98]"
              >
                التالي ({chosen.length})
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step === "qty" && (
              <button
                onClick={goToPay}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-3.5 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98]"
              >
                تم — الدفع
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step === "pay" && (
              <button
                onClick={confirm}
                disabled={saveMut.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-3.5 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98] disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {saveMut.isPending ? "جاري الحفظ..." : "حفظ ومعاينة"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  );
}

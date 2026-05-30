import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePlus2, Plus, Trash2, Save, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
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

function NewInvoice() {
  const { id } = useParams({ from: "/customer/$id/new-invoice" });
  const navigate = useNavigate();

  const { data: customer } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const [lines, setLines] = useState<NewInvoiceLine[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);

  const addLine = () => {
    if (!selectedProduct) return toast.error("اختر الصنف الأول");
    const q = Number(qty);
    if (!q || q <= 0) return toast.error("اكتب كمية صحيحة");
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === selectedProduct.id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === selectedProduct.id ? { ...l, quantity: l.quantity + q } : l,
        );
      }
      return [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: Number(selectedProduct.price),
          quantity: q,
        },
      ];
    });
    setProductId("");
    setQty("");
  };

  const removeLine = (pid: string) =>
    setLines((prev) => prev.filter((l) => l.product_id !== pid));

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalAmount = lines.reduce((s, l) => s + l.quantity * l.price, 0);

  const saveMut = useMutation({
    mutationFn: () => createInvoice(id, lines),
    onSuccess: (invoice) => {
      toast.success("تم حفظ الفاتورة 🎉");
      navigate({ to: "/invoice/$invoiceId", params: { invoiceId: invoice.id } });
    },
    onError: () => toast.error("تعذّر حفظ الفاتورة"),
  });

  return (
    <div className="min-h-screen bg-background pb-40">
      <PageHeader
        title="فاتورة جديدة"
        subtitle={customer?.name}
        backTo="/customer/$id"
        backParams={{ id }}
        icon={<FilePlus2 className="h-6 w-6" />}
      />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Add line card */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <p className="mb-3 font-extrabold text-card-foreground">إضافة صنف للفاتورة</p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>الصنف</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر صنف..." />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      لا توجد أصناف في المخزن
                    </div>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatMoney(Number(p.price))}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>السعر (تلقائي)</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-bold text-card-foreground">
                  {selectedProduct ? formatMoney(Number(selectedProduct.price)) : "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">الكمية</Label>
                <Input
                  id="qty"
                  type="number"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={addLine}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card px-6 py-3 font-bold text-primary transition active:scale-[0.98] hover:bg-brand-soft"
            >
              <Plus className="h-5 w-5" />
              إضافة للفاتورة
            </button>
          </div>
        </div>

        {/* Lines */}
        <div className="mt-5">
          <p className="mb-3 font-extrabold text-foreground">بنود الفاتورة</p>
          {lines.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card py-10 text-center shadow-card">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">لسه مفيش أصناف في الفاتورة</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.div
                    key={l.product_id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-card-foreground">{l.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.quantity} × {formatMoney(l.price)}
                      </p>
                    </div>
                    <p className="font-extrabold text-primary">
                      {formatMoney(l.quantity * l.price)}
                    </p>
                    <button
                      onClick={() => removeLine(l.product_id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Sticky total bar */}
      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي القطع</p>
                <p className="text-lg font-black text-card-foreground">{totalQty}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">الإجمالي النهائي</p>
                <p className="text-2xl font-black text-primary">{formatMoney(totalAmount)}</p>
              </div>
            </div>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-lg font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saveMut.isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

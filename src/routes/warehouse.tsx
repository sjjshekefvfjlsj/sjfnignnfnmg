import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, Pencil, Boxes, Wallet } from "lucide-react";
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
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  formatMoney,
  type Product,
} from "@/lib/sales";

export const Route = createFileRoute("/warehouse")({
  head: () => ({
    meta: [
      { title: "رصيد المخزن — ديليفري" },
      { name: "description", content: "الأصناف المتاحة والكميات والأسعار في المخزن." },
    ],
  }),
  component: Warehouse,
});

function Warehouse() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const reset = () => {
    setEditing(null);
    setName("");
    setQuantity("");
    setPrice("");
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setQuantity(String(p.quantity));
    setPrice(String(p.price));
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        quantity: Number(quantity) || 0,
        price: Number(price) || 0,
      };
      if (editing) await updateProduct(editing.id, payload);
      else await addProduct(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      reset();
      toast.success(editing ? "تم تعديل الصنف" : "تمت إضافة الصنف");
    },
    onError: () => toast.error("حصل خطأ، حاول مرة تانية"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف الصنف");
    },
    onError: () => toast.error("تعذّر الحذف"),
  });

  const totalQty = products.reduce((s, p) => s + Number(p.quantity), 0);
  const totalValue = products.reduce((s, p) => s + Number(p.quantity) * Number(p.price), 0);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="رصيد المخزن"
        subtitle="الأصناف المتاحة والكميات"
        backTo="/dashboard"
        icon={<Package className="h-6 w-6" />}
        action={
          <button
            onClick={openNew}
            className="flex h-10 items-center gap-1 rounded-full bg-white/20 px-4 text-sm font-bold transition hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            صنف
          </button>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <StatCard icon={<Boxes className="h-5 w-5" />} label="إجمالي القطع" value={String(totalQty)} />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="قيمة المخزن"
            value={formatMoney(totalValue)}
          />
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">جاري التحميل...</p>
        ) : products.length === 0 ? (
          <EmptyState onAdd={openNew} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/60 px-4 py-3 text-xs font-bold text-muted-foreground">
              <span className="col-span-5">الصنف</span>
              <span className="col-span-2 text-center">الكمية</span>
              <span className="col-span-3 text-center">السعر</span>
              <span className="col-span-2 text-center">إجراءات</span>
            </div>
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 items-center gap-2 border-b border-border/60 px-4 py-3 last:border-0"
              >
                <span className="col-span-5 truncate font-bold text-card-foreground">{p.name}</span>
                <span className="col-span-2 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-sm font-bold ${
                      Number(p.quantity) > 0
                        ? "bg-brand-soft text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {Number(p.quantity)}
                  </span>
                </span>
                <span className="col-span-3 text-center text-sm font-semibold text-card-foreground">
                  {formatMoney(Number(p.price))}
                </span>
                <span className="col-span-2 flex justify-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:bg-brand-soft hover:text-primary"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => delMut.mutate(p.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل صنف" : "إضافة صنف جديد"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return toast.error("اكتب اسم الصنف");
              saveMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pname">اسم الصنف</Label>
              <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مياه 1.5 لتر" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pqty">الكمية المتاحة</Label>
                <Input
                  id="pqty"
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pprice">السعر</Label>
                <Input
                  id="pprice"
                  type="number"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="w-full rounded-2xl gradient-brand px-6 py-3 font-extrabold text-brand-foreground shadow-warm transition active:scale-[0.98] disabled:opacity-60"
              >
                {saveMut.isPending ? "جاري الحفظ..." : "حفظ"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-primary">
          {icon}
        </span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black text-card-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card py-14 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-primary">
        <Package className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-card-foreground">المخزن فاضي</p>
      <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة أول صنف لك</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-1 rounded-2xl gradient-brand px-6 py-3 font-bold text-brand-foreground shadow-warm"
      >
        <Plus className="h-4 w-4" />
        إضافة صنف
      </button>
    </div>
  );
}

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, MapPin, Phone, ChevronLeft, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { fetchCustomersByDay, dayLabel } from "@/lib/sales";

export const Route = createFileRoute("/day/$day")({
  head: () => ({
    meta: [
      { title: "عملاء اليوم — ديليفري" },
      { name: "description", content: "عملاء خط السير المجدولين لهذا اليوم." },
    ],
  }),
  component: DayCustomers,
});

function DayCustomers() {
  const { day } = useParams({ from: "/day/$day" });
  const dayNum = Number(day);
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customersByDay", dayNum],
    queryFn: () => fetchCustomersByDay(dayNum),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`عملاء يوم ${dayLabel(dayNum)}`}
        subtitle={`${customers.length} عميل في خط السير`}
        backTo="/routes"
        icon={<Users className="h-6 w-6" />}
      />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">جاري التحميل...</p>
        ) : customers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card py-14 text-center shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-primary">
              <Users className="h-8 w-8" />
            </div>
            <p className="mt-4 font-bold text-card-foreground">مفيش عملاء في اليوم ده</p>
            <p className="mt-1 text-sm text-muted-foreground">ضيف عملاء وحدد يومهم من خطوط السير</p>
            <Link
              to="/routes"
              className="mt-5 inline-flex items-center gap-1 rounded-2xl gradient-brand px-6 py-3 font-bold text-brand-foreground shadow-warm"
            >
              <UserPlus className="h-4 w-4" />
              إضافة عميل
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <Link
                  to="/customer/$id"
                  params={{ id: c.id }}
                  className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card transition active:scale-[0.99] hover:shadow-warm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-lg font-black text-brand-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-card-foreground">{c.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.location}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 shrink-0 text-primary transition group-hover:-translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

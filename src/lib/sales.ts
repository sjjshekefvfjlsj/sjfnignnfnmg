import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export type CustomerCategory = "route" | "vip";

export interface Customer {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  day_of_week: number;
  category: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  total_quantity: number;
  total_amount: number;
  paid_cash: number;
  paid_instapay: number;
  paid_credit: number;
  work_day_id: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface WorkDay {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  total_sales: number;
  total_cash: number;
  total_instapay: number;
  total_credit: number;
  total_quantity: number;
  invoice_count: number;
  duration_seconds: number;
  created_at: string;
}

export interface CreditPayment {
  id: string;
  customer_id: string;
  amount: number;
  work_day_id: string | null;
  created_at: string;
}

// 0 = Saturday ... 5 = Thursday (Friday is the weekend / off day)
export const WEEK_DAYS = [
  { value: 0, label: "السبت" },
  { value: 1, label: "الأحد" },
  { value: 2, label: "الإثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
] as const;

export function dayLabel(value: number): string {
  return WEEK_DAYS.find((d) => d.value === value)?.label ?? "—";
}

/** Maps JS getDay() (0=Sun..6=Sat) to our route index (0=Sat..5=Thu). Friday=-1 */
export function todayRouteIndex(): number {
  const map: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: -1 };
  return map[new Date().getDay()] ?? -1;
}

// ---------- Products ----------
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addProduct(input: { name: string; quantity: number; price: number }) {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(
  id: string,
  input: { name: string; quantity: number; price: number },
) {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Customers ----------
export async function fetchCustomersByDay(day: number): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("category", "route")
    .eq("day_of_week", day)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVipCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("category", "vip")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function addCustomer(input: {
  name: string;
  location: string;
  phone: string;
  day_of_week: number;
  category?: CustomerCategory;
}) {
  const { error } = await supabase.from("customers").insert({
    name: input.name,
    location: input.location || null,
    phone: input.phone || null,
    day_of_week: input.day_of_week,
    category: input.category ?? "route",
  });
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function customerCountsByDay(): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from("customers")
    .select("day_of_week")
    .eq("category", "route");
  if (error) throw error;
  const counts: Record<number, number> = {};
  (data ?? []).forEach((c) => {
    counts[c.day_of_week] = (counts[c.day_of_week] ?? 0) + 1;
  });
  return counts;
}

// ---------- Invoices ----------
export async function fetchInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchInvoice(
  id: string,
): Promise<{ invoice: Invoice; items: InvoiceItem[]; customer: Customer | null } | null> {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!invoice) return null;

  const { data: items, error: itemsErr } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: true });
  if (itemsErr) throw itemsErr;

  const customer = await fetchCustomer(invoice.customer_id);
  return { invoice, items: items ?? [], customer };
}

export interface NewInvoiceLine {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

export interface InvoicePayments {
  paid_cash: number;
  paid_instapay: number;
  paid_credit: number;
}

async function adjustStock(deltas: { product_id: string; delta: number }[]) {
  const ids = deltas.map((d) => d.product_id).filter(Boolean);
  if (ids.length === 0) return;
  const { data: prods } = await supabase.from("products").select("id, quantity").in("id", ids);
  if (!prods) return;
  await Promise.all(
    deltas.map((d) => {
      const current = prods.find((p) => p.id === d.product_id);
      if (!current) return Promise.resolve();
      const next = Math.max(0, Number(current.quantity) + d.delta);
      return supabase.from("products").update({ quantity: next }).eq("id", d.product_id);
    }),
  );
}

export async function createInvoice(
  customerId: string,
  lines: NewInvoiceLine[],
  payments: InvoicePayments,
) {
  const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0);
  const totalAmount = lines.reduce((s, l) => s + l.quantity * l.price, 0);

  const active = await fetchActiveWorkDay();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: customerId,
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      paid_cash: payments.paid_cash,
      paid_instapay: payments.paid_instapay,
      paid_credit: payments.paid_credit,
      work_day_id: active?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const items = lines.map((l) => ({
    invoice_id: invoice.id,
    product_id: l.product_id,
    product_name: l.product_name,
    price: l.price,
    quantity: l.quantity,
    line_total: l.quantity * l.price,
  }));
  const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
  if (itemsErr) throw itemsErr;

  // Deduct sold quantities from warehouse stock.
  await adjustStock(lines.map((l) => ({ product_id: l.product_id, delta: -l.quantity })));

  return invoice as Invoice;
}

export async function updateInvoice(
  invoiceId: string,
  lines: NewInvoiceLine[],
  payments: InvoicePayments,
) {
  // Restore old stock first.
  const { data: oldItems } = await supabase
    .from("invoice_items")
    .select("product_id, quantity")
    .eq("invoice_id", invoiceId);
  if (oldItems) {
    await adjustStock(
      oldItems
        .filter((i) => i.product_id)
        .map((i) => ({ product_id: i.product_id as string, delta: Number(i.quantity) })),
    );
  }

  // Replace items.
  await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

  const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0);
  const totalAmount = lines.reduce((s, l) => s + l.quantity * l.price, 0);

  const items = lines.map((l) => ({
    invoice_id: invoiceId,
    product_id: l.product_id,
    product_name: l.product_name,
    price: l.price,
    quantity: l.quantity,
    line_total: l.quantity * l.price,
  }));
  const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
  if (itemsErr) throw itemsErr;

  const { error } = await supabase
    .from("invoices")
    .update({
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      paid_cash: payments.paid_cash,
      paid_instapay: payments.paid_instapay,
      paid_credit: payments.paid_credit,
    })
    .eq("id", invoiceId);
  if (error) throw error;

  // Deduct new stock.
  await adjustStock(lines.map((l) => ({ product_id: l.product_id, delta: -l.quantity })));
}

export function formatMoney(n: number, currency = "ج.م"): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n) + " " + currency;
}

// ---------- Work days (daily sessions) ----------
export async function fetchActiveWorkDay(): Promise<WorkDay | null> {
  const { data, error } = await supabase
    .from("work_days")
    .select("*")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startWorkDay(): Promise<WorkDay> {
  const existing = await fetchActiveWorkDay();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("work_days")
    .insert({ status: "active" })
    .select()
    .single();
  if (error) throw error;
  return data as WorkDay;
}

export async function endWorkDay(id: string): Promise<WorkDay> {
  const { data: day, error: dErr } = await supabase
    .from("work_days")
    .select("*")
    .eq("id", id)
    .single();
  if (dErr) throw dErr;

  const { data: invs, error: iErr } = await supabase
    .from("invoices")
    .select("total_amount, total_quantity, paid_cash, paid_instapay, paid_credit")
    .eq("work_day_id", id);
  if (iErr) throw iErr;

  const list = invs ?? [];
  const total_sales = list.reduce((s, i) => s + Number(i.total_amount), 0);
  const total_quantity = list.reduce((s, i) => s + Number(i.total_quantity), 0);
  const total_cash = list.reduce((s, i) => s + Number(i.paid_cash), 0);
  const total_instapay = list.reduce((s, i) => s + Number(i.paid_instapay), 0);
  const total_credit = list.reduce((s, i) => s + Number(i.paid_credit), 0);
  const endedAt = new Date();
  const duration_seconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - new Date(day.started_at).getTime()) / 1000),
  );

  const { data: updated, error } = await supabase
    .from("work_days")
    .update({
      status: "closed",
      ended_at: endedAt.toISOString(),
      total_sales,
      total_quantity,
      total_cash,
      total_instapay,
      total_credit,
      invoice_count: list.length,
      duration_seconds,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as WorkDay;
}

export async function fetchWorkDays(): Promise<WorkDay[]> {
  const { data, error } = await supabase
    .from("work_days")
    .select("*")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Live totals for the currently active day (computed on the fly). */
export interface WorkDayLive {
  total_sales: number;
  total_cash: number;
  total_instapay: number;
  total_credit: number;
  total_quantity: number;
  invoice_count: number;
}

export async function fetchWorkDayReport(id: string): Promise<{
  day: WorkDay;
  invoices: (Invoice & { customer_name: string })[];
  live: WorkDayLive;
} | null> {
  const { data: day, error } = await supabase
    .from("work_days")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!day) return null;

  const { data: invs, error: iErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("work_day_id", id)
    .order("created_at", { ascending: false });
  if (iErr) throw iErr;

  const customers = await fetchAllCustomers();
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const invoices = (invs ?? []).map((i) => ({
    ...i,
    customer_name: nameById.get(i.customer_id) ?? "—",
  })) as (Invoice & { customer_name: string })[];

  const live: WorkDayLive = {
    total_sales: invoices.reduce((s, i) => s + Number(i.total_amount), 0),
    total_cash: invoices.reduce((s, i) => s + Number(i.paid_cash), 0),
    total_instapay: invoices.reduce((s, i) => s + Number(i.paid_instapay), 0),
    total_credit: invoices.reduce((s, i) => s + Number(i.paid_credit), 0),
    total_quantity: invoices.reduce((s, i) => s + Number(i.total_quantity), 0),
    invoice_count: invoices.length,
  };

  return { day, invoices, live };
}

// ---------- Credit (آجل) ----------
export interface CreditEntry {
  customer: Customer;
  balance: number;
}

export async function fetchCreditList(): Promise<CreditEntry[]> {
  const [customers, invoices, payments] = await Promise.all([
    fetchAllCustomers(),
    supabase.from("invoices").select("customer_id, paid_credit"),
    supabase.from("credit_payments").select("customer_id, amount"),
  ]);

  const owed = new Map<string, number>();
  (invoices.data ?? []).forEach((i) => {
    owed.set(i.customer_id, (owed.get(i.customer_id) ?? 0) + Number(i.paid_credit));
  });
  (payments.data ?? []).forEach((p) => {
    owed.set(p.customer_id, (owed.get(p.customer_id) ?? 0) - Number(p.amount));
  });

  return customers
    .map((c) => ({ customer: c, balance: Math.round((owed.get(c.id) ?? 0) * 100) / 100 }))
    .filter((e) => e.balance > 0.001)
    .sort((a, b) => b.balance - a.balance);
}

export async function customerCreditBalance(customerId: string): Promise<number> {
  const [invoices, payments] = await Promise.all([
    supabase.from("invoices").select("paid_credit").eq("customer_id", customerId),
    supabase.from("credit_payments").select("amount").eq("customer_id", customerId),
  ]);
  const owed = (invoices.data ?? []).reduce((s, i) => s + Number(i.paid_credit), 0);
  const paid = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  return Math.round((owed - paid) * 100) / 100;
}

export async function recordCreditPayment(customerId: string, amount: number) {
  const active = await fetchActiveWorkDay();
  const { error } = await supabase.from("credit_payments").insert({
    customer_id: customerId,
    amount,
    work_day_id: active?.id ?? null,
  });
  if (error) throw error;
}

// ---------- App settings ----------
export interface AppSettings {
  id: string;
  site_name: string;
  app_password: string;
  max_attempts: number;
  lock_hours: number;
  currency: string;
  rep_name: string | null;
  rep_phone: string | null;
  invoice_width: string;
  invoice_footer: string | null;
}

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as AppSettings;

  // Self-heal: create a default row if none exists.
  const { data: created, error: insErr } = await supabase
    .from("app_settings")
    .insert({})
    .select()
    .single();
  if (insErr) throw insErr;
  return created as AppSettings;
}

export async function updateSettings(
  id: string,
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<void> {
  const { error } = await supabase.from("app_settings").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- Dashboard stats ----------
export interface DashboardStats {
  customerCount: number;
  productCount: number;
  totalStockQty: number;
  totalStockValue: number;
  invoiceCount: number;
  totalSales: number;
  totalCreditOutstanding: number;
  activeDay: WorkDay | null;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [customers, products, invoices, payments, activeDay] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("products").select("quantity, price"),
    supabase.from("invoices").select("total_amount, paid_credit", { count: "exact" }),
    supabase.from("credit_payments").select("amount"),
    fetchActiveWorkDay(),
  ]);

  const totalStockQty = (products.data ?? []).reduce((s, p) => s + Number(p.quantity), 0);
  const totalStockValue = (products.data ?? []).reduce(
    (s, p) => s + Number(p.quantity) * Number(p.price),
    0,
  );
  const totalSales = (invoices.data ?? []).reduce((s, i) => s + Number(i.total_amount), 0);
  const totalCredit = (invoices.data ?? []).reduce((s, i) => s + Number(i.paid_credit), 0);
  const totalPaid = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

  return {
    customerCount: customers.count ?? 0,
    productCount: (products.data ?? []).length,
    totalStockQty,
    totalStockValue,
    invoiceCount: invoices.count ?? 0,
    totalSales,
    totalCreditOutstanding: Math.max(0, totalCredit - totalPaid),
    activeDay,
  };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} س ${m} د`;
  return `${m} د`;
}

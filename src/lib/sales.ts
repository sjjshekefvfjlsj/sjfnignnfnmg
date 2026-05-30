import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  day_of_week: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  total_quantity: number;
  total_amount: number;
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
    .eq("day_of_week", day)
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
}) {
  const { error } = await supabase.from("customers").insert(input);
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function customerCountsByDay(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from("customers").select("day_of_week");
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

export async function createInvoice(customerId: string, lines: NewInvoiceLine[]) {
  const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0);
  const totalAmount = lines.reduce((s, l) => s + l.quantity * l.price, 0);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: customerId,
      total_quantity: totalQuantity,
      total_amount: totalAmount,
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

  return invoice as Invoice;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n) + " ج.م";
}

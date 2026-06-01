import { useQuery } from "@tanstack/react-query";
import { fetchSettings, type AppSettings } from "@/lib/sales";

const FALLBACK: AppSettings = {
  id: "",
  site_name: "ديليفري",
  app_password: "1185",
  max_attempts: 10,
  lock_hours: 3,
  currency: "ج.م",
  rep_name: null,
  rep_phone: null,
  invoice_width: "80",
  invoice_footer: null,
};

/** App-wide settings (site name, password, currency...). Cached via react-query. */
export function useSettings() {
  const query = useQuery({
    queryKey: ["app-settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });

  return {
    settings: query.data ?? FALLBACK,
    isLoading: query.isLoading,
    isReady: !!query.data,
  };
}

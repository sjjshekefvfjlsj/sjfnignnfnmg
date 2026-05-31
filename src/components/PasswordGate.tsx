import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Delete, ShieldAlert } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

const UNLOCK_KEY = "app_unlocked";
const ATTEMPTS_KEY = "app_attempts";
const LOCK_UNTIL_KEY = "app_lock_until";

function getLockUntil(): number {
  const v = Number(localStorage.getItem(LOCK_UNTIL_KEY) ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const { settings, isReady } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
    setAttempts(Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0));
    setLockUntil(getLockUntil());
  }, []);

  // Keep document title in sync with the site name.
  useEffect(() => {
    if (isReady) document.title = `${settings.site_name} — نظام المبيعات`;
  }, [isReady, settings.site_name]);

  const locked = lockUntil > now;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  if (unlocked) return <>{children}</>;

  const remaining = settings.max_attempts - attempts;

  const press = (d: string) => {
    if (locked || pin.length >= 8) return;
    setPin((p) => p + d);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  const submit = () => {
    if (locked) return;
    if (pin === settings.app_password) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      localStorage.removeItem(ATTEMPTS_KEY);
      setUnlocked(true);
      return;
    }
    const next = attempts + 1;
    setPin("");
    setShake(true);
    setTimeout(() => setShake(false), 450);
    if (next >= settings.max_attempts) {
      const until = Date.now() + settings.lock_hours * 3600_000;
      localStorage.setItem(LOCK_UNTIL_KEY, String(until));
      localStorage.removeItem(ATTEMPTS_KEY);
      setLockUntil(until);
      setAttempts(0);
    } else {
      localStorage.setItem(ATTEMPTS_KEY, String(next));
      setAttempts(next);
    }
  };

  const fmtRemaining = () => {
    const ms = Math.max(0, lockUntil - now);
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-brand-soft blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xs text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] gradient-brand shadow-warm">
          <Lock className="h-10 w-10 text-brand-foreground" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-foreground">{settings.site_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locked ? "تم القفل مؤقتاً" : "أدخل كلمة المرور للدخول"}
        </p>

        {locked ? (
          <div className="mt-8 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 shadow-card">
            <ShieldAlert className="mx-auto h-9 w-9 text-destructive" />
            <p className="mt-3 font-bold text-destructive">تجاوزت عدد المحاولات</p>
            <p className="mt-1 text-sm text-muted-foreground">
              حاول مرة أخرى بعد
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground">{fmtRemaining()}</p>
          </div>
        ) : (
          <>
            {/* PIN dots */}
            <motion.div
              animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 flex items-center justify-center gap-3"
            >
              {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full transition ${
                    i < pin.length ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </motion.div>

            {attempts > 0 && (
              <p className="mt-3 text-xs font-semibold text-destructive">
                كلمة مرور خاطئة — باقي لك {remaining} محاولة
              </p>
            )}

            {/* Keypad */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <KeypadBtn key={d} onClick={() => press(d)}>
                  {d}
                </KeypadBtn>
              ))}
              <KeypadBtn onClick={back} aria-label="حذف">
                <Delete className="mx-auto h-5 w-5" />
              </KeypadBtn>
              <KeypadBtn onClick={() => press("0")}>0</KeypadBtn>
              <KeypadBtn onClick={submit} variant="brand" aria-label="دخول">
                ✓
              </KeypadBtn>
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence />
    </div>
  );
}

function KeypadBtn({
  children,
  onClick,
  variant = "default",
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "brand";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-black shadow-card transition ${
        variant === "brand"
          ? "gradient-brand text-brand-foreground shadow-warm"
          : "border border-border bg-card text-card-foreground hover:bg-brand-soft hover:text-primary"
      }`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

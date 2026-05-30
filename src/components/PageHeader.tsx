import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backParams?: Record<string, string>;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, backParams, icon, action }: PageHeaderProps) {
  return (
    <header className="gradient-brand text-brand-foreground">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
        {backTo && (
          <Link
            to={backTo}
            params={backParams as never}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
            aria-label="رجوع"
          >
            <ChevronRight className="h-6 w-6" />
          </Link>
        )}
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-brand-foreground/80">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

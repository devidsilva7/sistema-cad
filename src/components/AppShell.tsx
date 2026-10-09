import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, CalendarDays, Home, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { canAccessRoute, useStore } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomBar() {
  const { user } = useStore();
  const items = NAV.filter(
    ({ to }) => user?.perfil !== "Aluno" || to !== "/notificacoes",
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-22px_oklch(0.25_0.05_155_/_40%)] backdrop-blur-xl md:bottom-auto md:top-0 md:border-b md:border-t-0 md:pb-0 md:shadow-[0_8px_30px_-22px_oklch(0.25_0.05_155_/_40%)]">
      <div
        className={`mx-auto grid max-w-6xl ${items.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 border-t-2 border-transparent py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors md:flex-row md:justify-center md:gap-2 md:border-b-2 md:border-t-0 md:py-4 md:text-sm"
            activeProps={{ className: "!border-primary !text-primary" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { authReady, user } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const accessAllowed =
    authReady && Boolean(user) && canAccessRoute(user?.perfil, location.pathname);

  useEffect(() => {
    if (authReady && !user) {
      void navigate({ to: "/", replace: true });
    } else if (authReady && user && !canAccessRoute(user.perfil, location.pathname)) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [authReady, user, location.pathname, navigate]);

  if (!accessAllowed) return null;

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 md:pb-8 md:pt-16">
      <header className="bg-hero hero-curve px-4 pb-12 pt-5 text-primary-foreground sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary-foreground/15 bg-primary-foreground/10 shadow-inner backdrop-blur transition hover:bg-primary-foreground/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs opacity-80">{subtitle}</p>}
          </div>
          <img
            src="/logoeducacao.png"
            alt="Brasão LAF"
            className="h-10 w-10 shrink-0 rounded-full bg-card object-contain p-0.5"
          />
        </div>
      </header>
      <main className="mx-auto -mt-5 w-full max-w-6xl px-4 sm:px-6">{children}</main>
      <BottomBar />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </label>
  );
}

export function PrimaryButton({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground shadow-card transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 ${p.className ?? ""}`}
    >
      {children}
    </button>
  );
}

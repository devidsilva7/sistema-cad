import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, CalendarDays, Home, User } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo-laf.jpeg.asset.json";

const NAV = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 border-t-2 border-transparent py-2.5 text-[11px] font-medium text-muted-foreground"
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

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-24">
      <header className="bg-hero hero-curve px-5 pb-10 pt-5 text-primary-foreground">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-foreground/15"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs opacity-80">{subtitle}</p>}
          </div>
          <img src={logo.url} alt="Brasão LAF" className="h-10 w-10 shrink-0 rounded-full bg-card object-contain p-0.5" />
        </div>
      </header>
      <main className="mx-auto -mt-4 max-w-md px-4">{children}</main>
      <BottomBar />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card p-4 shadow-card ${className}`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>;
}

export function PrimaryButton({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50 ${p.className ?? ""}`}
    >
      {children}
    </button>
  );
}

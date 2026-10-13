import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Presentation,
  ReceiptText,
  UserRoundCog,
  Settings,
  User,
  UserRound,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAdmin } from "@/lib/admin-auth";
import { clearLocalAccountSession } from "@/lib/local-accounts";
import { canAccessRoute, useStore } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

type MenuItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  search?: { perfil: "Secretaria" | "Financeiro" };
};
const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/dashboard", label: "Início", icon: Home },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
      { to: "/notificacoes", label: "Notificações", icon: Bell },
      { to: "/perfil", label: "Perfil", icon: User },
    ],
  },
  {
    title: "Escola",
    items: [
      { to: "/agendamento-ambientes", label: "Ambientes", icon: FlaskConical },
      { to: "/ocorrencias", label: "Ocorrências Rápidas", icon: ClipboardList },
      { to: "/agendamento-datashows", label: "Agendamento dos datashows", icon: Presentation },
      { to: "/cardapio", label: "Cardápio Escolar", icon: UtensilsCrossed },
      { to: "/comunicados", label: "Comunicados Gerais", icon: Megaphone },
      { to: "/horarios", label: "Horários Escolares", icon: Clock3 },
    ],
  },
  {
    title: "Administração",
    items: [
      { to: "/secretaria", label: "Secretaria", icon: Building2 },
      { to: "/financeiro", label: "Financeiro", icon: ReceiptText },
      { to: "/alunos", label: "Cadastrar Alunos", icon: GraduationCap },
      { to: "/professores", label: "Cadastrar Professores", icon: UserRound },
      { to: "/responsaveis", label: "Cadastrar Responsáveis", icon: HeartHandshake },
      {
        to: "/equipe",
        label: "Cadastrar pessoal da Secretaria",
        icon: UserRoundCog,
        search: { perfil: "Secretaria" },
      },
      {
        to: "/equipe",
        label: "Cadastrar pessoal do Financeiro",
        icon: UserRoundCog,
        search: { perfil: "Financeiro" },
      },
      { to: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

/** Encerra a sessão (administrador ou conta local) e volta para o login. */
export function useLogout() {
  const { user, set } = useStore();
  const navigate = useNavigate();
  return async () => {
    try {
      clearLocalAccountSession();
      if (!user?.localAccountId) {
        await logoutAdmin();
      }
      set((s) => ({ ...s, user: null }));
      await navigate({ to: "/", replace: true });
    } catch (error) {
      console.error("Falha ao encerrar a sessão.", error);
      toast.error("Não foi possível encerrar a sessão.");
    }
  };
}

/** Botão de menu (canto superior esquerdo) + gaveta lateral com tudo do sistema. */
export function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const { user } = useStore();
  const logout = useLogout();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const sections = MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => canAccessRoute(user?.perfil, item.to))
      .map((item) =>
        (user?.perfil === "Aluno" || user?.perfil === "Responsável") && item.to === "/notificacoes"
          ? { ...item, label: "Acompanhamento Escolar" }
          : item,
      ),
  })).filter((section) => section.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground shadow-inner backdrop-blur transition active:scale-95 hover:bg-primary-foreground/20"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        hideClose
        className="flex h-dvh w-[86%] max-w-[22rem] flex-col gap-0 border-r-0 p-0 sm:max-w-[22rem]"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navegação principal do sistema</SheetDescription>

        <div className="bg-hero relative flex items-center gap-3 px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground">
          <img
            src="/logoeducacao.png"
            alt="Brasão da escola"
            className="h-12 w-12 shrink-0 rounded-full border-2 border-gold bg-card object-contain p-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
              {user?.perfil === "Aluno" || user?.perfil === "Responsável"
                ? "Acompanhamento Escolar"
                : "Gestão Escolar"}
            </p>
            <p className="text-sm font-bold leading-tight">EEEP Luizete Albano de Freitas</p>
          </div>
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Fechar menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 transition active:scale-95 hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetClose>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {sections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, search }) => (
                  <li key={`${to}-${search?.perfil ?? label}`}>
                    <Link
                      to={to}
                      {...(search ? { search } : {})}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-foreground/80 transition hover:bg-accent"
                      activeProps={{
                        className: "!bg-primary !text-primary-foreground shadow-card",
                      }}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/70 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.nome}</p>
                <p className="text-xs text-muted-foreground">{user.perfil}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function BottomBar() {
  const { user } = useStore();
  const items = NAV.filter(({ to }) => canAccessRoute(user?.perfil, to)).map((item) =>
    (user?.perfil === "Aluno" || user?.perfil === "Responsável") && item.to === "/notificacoes"
      ? { ...item, label: "Acompanhamento Escolar" }
      : item,
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-22px_oklch(0.25_0.05_155_/_40%)] backdrop-blur-xl md:bottom-auto md:top-0 md:border-b md:border-t-0 md:pb-0 md:shadow-[0_8px_30px_-22px_oklch(0.25_0.05_155_/_40%)]">
      <div
        className="mx-auto grid max-w-6xl"
        style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
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
    <div className="min-h-dvh overflow-x-clip pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 md:pt-16">
      <header className="bg-hero hero-curve px-4 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <MenuDrawer />
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
      <main className="relative z-10 mx-auto -mt-6 w-full max-w-6xl px-4 sm:px-6">{children}</main>
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

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

const CADASTRO_TABS = [
  { to: "/alunos", label: "Alunos", icon: GraduationCap },
  { to: "/professores", label: "Professores", icon: UserRound },
  { to: "/responsaveis", label: "Responsáveis", icon: HeartHandshake },
] as const;

/** Abas que alternam entre os três cadastros do administrador. */
export function CadastroTabs() {
  return (
    <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-card p-1 shadow-card">
      {CADASTRO_TABS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-semibold text-muted-foreground transition sm:flex-row sm:gap-2 sm:text-sm"
          activeProps={{ className: "!bg-primary !text-primary-foreground shadow-sm" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}

/** Quadro mostrado depois de criar um acesso, com os dados que o administrador precisa passar. */
export function AcessoCriado({
  titulo,
  linhas,
  onClose,
}: {
  titulo: string;
  linhas: { label: string; value: string }[];
  onClose: () => void;
}) {
  const copiar = async () => {
    const texto = linhas.map((l) => `${l.label}: ${l.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Dados copiados.");
    } catch {
      toast.error("Não foi possível copiar. Anote os dados manualmente.");
    }
  };
  return (
    <div className="mb-4 rounded-2xl border border-gold/60 bg-gold/10 p-4">
      <p className="text-sm font-bold text-primary">{titulo}</p>
      <dl className="mt-2 space-y-1 text-sm">
        {linhas.map((l) => (
          <div key={l.label} className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{l.label}:</dt>
            <dd className="break-all font-semibold">{l.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Esses dados só aparecem agora. Passe para a pessoa; no primeiro acesso ela cria uma senha
        própria.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void copiar()}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Copiar dados
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

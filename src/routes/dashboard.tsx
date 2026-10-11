import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Bell,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Settings,
  TriangleAlert,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { BottomBar, MenuDrawer } from "@/components/AppShell";
import { canAccessRoute, useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Painel principal com ocorrências, cardápio, cadastros e comunicados.",
      },
      { property: "og:title", content: "Painel — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Painel principal com ocorrências, cardápio, cadastros e comunicados.",
      },
    ],
  }),
  component: Dashboard,
});

type Modulo = { to: string; label: string; desc: string; icon: LucideIcon };
const GRUPOS: { titulo: string; itens: Modulo[] }[] = [
  {
    titulo: "Dia a dia",
    itens: [
      { to: "/agenda", label: "Agenda", desc: "Compromissos", icon: CalendarDays },
      { to: "/ocorrencias", label: "Ocorrências", desc: "Registro rápido", icon: Megaphone },
      { to: "/cardapio", label: "Cardápio", desc: "Merenda da semana", icon: UtensilsCrossed },
      { to: "/comunicados", label: "Comunicados", desc: "Avisos da direção", icon: Bell },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { to: "/alunos", label: "Alunos", desc: "Cadastrar e gerenciar", icon: GraduationCap },
      { to: "/professores", label: "Professores", desc: "Professores e DTs", icon: UserRound },
      {
        to: "/responsaveis",
        label: "Responsáveis",
        desc: "Pais e responsáveis",
        icon: HeartHandshake,
      },
      { to: "/configuracoes", label: "Configurações", desc: "Preferências", icon: Settings },
    ],
  },
];

function Dashboard() {
  const { authReady, user, ocorrencias, alunos, professores, responsaveis } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (authReady && !user) void navigate({ to: "/", replace: true });
  }, [authReady, navigate, user]);
  if (!authReady || !user) return null;

  const isAdmin = user.perfil === "Administrador";
  const isStaff = user.perfil === "Professor" || user.perfil === "Diretor de Turma";
  const grupos = GRUPOS.map((g) => ({
    ...g,
    itens: g.itens.filter(({ to }) => canAccessRoute(user.perfil, to)),
  })).filter((g) => g.itens.length > 0);
  const primeiroNome = user.nome.split(" ")[0];

  const resumo = isAdmin
    ? [
        { label: "Alunos", valor: alunos.length, to: "/alunos" },
        { label: "Professores", valor: professores.length, to: "/professores" },
        { label: "Responsáveis", valor: responsaveis.length, to: "/responsaveis" },
      ]
    : [];

  return (
    <div className="min-h-dvh overflow-x-clip pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 md:pt-16">
      <header className="bg-hero hero-curve relative px-4 pb-20 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <MenuDrawer />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-primary-foreground/70">Olá,</p>
            <p className="truncate text-base font-bold leading-tight">{primeiroNome}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold px-3 py-1 text-[11px] font-bold text-gold-foreground shadow-sm">
            {user.perfil}
          </span>
        </div>
        <div className="mx-auto mt-6 flex max-w-6xl flex-col items-center text-center">
          <img
            src="/logoeducacao.png"
            alt="Brasão LAF"
            className="h-24 w-24 rounded-full border-[3px] border-gold bg-card object-contain p-1 shadow-[0_0_0_7px_oklch(1_0_0_/_9%),0_16px_36px_-12px_oklch(0.12_0.04_165_/_45%)]"
          />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-gold sm:tracking-[0.24em]">
            EEEP Luizete Albano de Freitas
          </p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-[0.06em]">GESTÃO ESCOLAR</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            Comunicação e serviços em tempo real
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-12 w-full max-w-6xl space-y-6 px-4 sm:px-6">
        {resumo.length > 0 && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-card">
            {resumo.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="rounded-xl px-2 py-1 text-center transition hover:bg-accent"
              >
                <p className="text-2xl font-extrabold text-primary">{r.valor}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{r.label}</p>
              </Link>
            ))}
          </div>
        )}

        {grupos.map((grupo) => (
          <section key={grupo.titulo}>
            <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {grupo.titulo}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {grupo.itens.map(({ to, label, desc, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition duration-200 hover:border-primary/25 hover:shadow-[0_18px_38px_-18px_oklch(0.3_0.05_168_/_35%)] active:scale-[0.98]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold leading-tight">{label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {desc}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {(isAdmin || isStaff) && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div>
                <p className="text-xs text-muted-foreground">Ocorrências registradas</p>
                <p className="text-2xl font-extrabold text-primary">{ocorrencias.length}</p>
              </div>
              <Link to="/notificacoes" className="text-sm font-semibold text-leaf">
                Ver histórico →
              </Link>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-card">
              <TriangleAlert className="h-7 w-7 shrink-0 text-gold" />
              <p className="border-l border-primary-foreground/30 pl-3 text-sm font-medium">
                Notificação imediata para direção e pais a cada registro emitido.
              </p>
            </div>
          </>
        )}
      </main>
      <BottomBar />
    </div>
  );
}
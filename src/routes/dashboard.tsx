import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Bell,
  Building2,
  CircleDollarSign,
  CalendarDays,
  Clock3,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Presentation,
  Settings,
  TriangleAlert,
  UserRound,
  UserRoundCog,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { BottomBar, MenuDrawer } from "@/components/AppShell";
import { canAccessRoute, fmtData, useStore } from "@/lib/store";

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

type Modulo = {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  search?: { perfil: "Secretaria" | "Financeiro" };
};
const GRUPOS: { titulo: string; itens: Modulo[] }[] = [
  {
    titulo: "Dia a dia",
    itens: [
      {
        to: "/agendamento-ambientes",
        label: "Ambientes",
        desc: "Laboratórios e espaços",
        icon: FlaskConical,
      },
      { to: "/ocorrencias", label: "Ocorrências", desc: "Registro rápido", icon: Megaphone },
      {
        to: "/notificacoes",
        label: "Notificações",
        desc: "Acompanhamento de registros",
        icon: TriangleAlert,
      },
      {
        to: "/agendamento-datashows",
        label: "Agendamento dos datashows",
        desc: "Reservar equipamento",
        icon: Presentation,
      },
      { to: "/agenda", label: "Agenda", desc: "Compromissos", icon: CalendarDays },
      { to: "/cardapio", label: "Cardápio", desc: "Merenda da semana", icon: UtensilsCrossed },
      { to: "/comunicados", label: "Comunicados", desc: "Avisos da direção", icon: Bell },
      { to: "/horarios", label: "Horários", desc: "Grade semanal de aulas", icon: Clock3 },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { to: "/secretaria", label: "Secretaria", desc: "Resumo de cadastros", icon: Building2 },
      {
        to: "/financeiro",
        label: "Financeiro",
        desc: "Visão geral do módulo",
        icon: CircleDollarSign,
      },
      { to: "/alunos", label: "Alunos", desc: "Cadastrar e gerenciar", icon: GraduationCap },
      { to: "/professores", label: "Professores", desc: "Professores e DTs", icon: UserRound },
      {
        to: "/responsaveis",
        label: "Responsáveis",
        desc: "Pais e responsáveis",
        icon: HeartHandshake,
      },
      {
        to: "/equipe",
        label: "Pessoal da Secretaria",
        desc: "Cadastrar e gerenciar equipe",
        icon: UserRoundCog,
        search: { perfil: "Secretaria" },
      },
      {
        to: "/equipe",
        label: "Pessoal do Financeiro",
        desc: "Cadastrar e gerenciar equipe",
        icon: UserRoundCog,
        search: { perfil: "Financeiro" },
      },
      { to: "/configuracoes", label: "Configurações", desc: "Preferências", icon: Settings },
    ],
  },
];

function Dashboard() {
  const { authReady, user, ocorrencias, alunos, professores, responsaveis, accounts } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (authReady && !user) void navigate({ to: "/", replace: true });
  }, [authReady, navigate, user]);
  if (!authReady || !user) return null;

  const isAdmin = user.perfil === "Administrador";
  const isStaff = canAccessRoute(user.perfil, "/ocorrencias");
  const isAluno = user.perfil === "Aluno";
  const isResponsavel = user.perfil === "Responsável";
  const emailConta = accounts.find((account) => account.id === user.localAccountId)?.email;
  const alunoAtual = isAluno
    ? alunos.find((aluno) => aluno.email.toLowerCase() === emailConta?.toLowerCase())
    : undefined;
  const responsavelAtual = responsaveis.find(
    (responsavel) => responsavel.email.toLowerCase() === emailConta?.toLowerCase(),
  );
  const idsDosDependentes = new Set(
    alunos
      .filter(
        (aluno) =>
          (responsavelAtual && aluno.responsavelId === responsavelAtual.id) ||
          (emailConta && aluno.responsavelEmail?.toLowerCase() === emailConta.toLowerCase()),
      )
      .map((aluno) => aluno.id),
  );
  const ocorrenciasVisiveis = isAluno
    ? ocorrencias.filter((ocorrencia) => ocorrencia.alunoId === alunoAtual?.id)
    : isResponsavel
      ? ocorrencias.filter((ocorrencia) => idsDosDependentes.has(ocorrencia.alunoId))
      : [];
  const grupos = GRUPOS.map((g) => ({
    ...g,
    itens: g.itens
      .filter(({ to }) => canAccessRoute(user.perfil, to))
      .map((item) =>
        (isAluno || isResponsavel) && item.to === "/notificacoes"
          ? { ...item, label: "Ocorrências" }
          : item,
      ),
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
          {isAluno || isResponsavel ? (
            <h1 className="mt-1.5 text-xl font-extrabold tracking-[0.06em]">
              Acompanhamento Escolar
            </h1>
          ) : (
            <h1 className="mt-1.5 text-xl font-extrabold tracking-[0.06em]">GESTÃO ESCOLAR</h1>
          )}
          <p className="mt-1 text-sm text-primary-foreground/75">
            {isAluno
              ? "Comunicação e Serviço em Tempo Real"
              : "Comunicação e serviços em tempo real"}
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-12 w-full max-w-6xl space-y-6 px-4 sm:px-6">
        {(isAluno || isResponsavel) && (
          <section aria-labelledby="ocorrencias-aluno-heading">
            <h2
              id="ocorrencias-aluno-heading"
              className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Ocorrências
            </h2>
            <div className="space-y-2">
              {ocorrenciasVisiveis.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground shadow-card">
                  Nenhuma ocorrência ou advertência registrada.
                </div>
              ) : (
                ocorrenciasVisiveis.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                  >
                    {isResponsavel && (
                      <p className="text-xs font-semibold text-muted-foreground">
                        {alunos.find((aluno) => aluno.id === ocorrencia.alunoId)?.nome ?? "Aluno"}
                      </p>
                    )}
                    <p className="font-semibold">{ocorrencia.tipo}</p>
                    {ocorrencia.obs && (
                      <p className="mt-1 text-sm text-muted-foreground">{ocorrencia.obs}</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {fmtData(ocorrencia.data)} · {ocorrencia.turma}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

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
              {grupo.itens.map(({ to, label, desc, icon: Icon, search }) => (
                <Link
                  key={`${to}-${search?.perfil ?? label}`}
                  to={to}
                  {...(search ? { search } : {})}
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
              <Link to="/ocorrencias" className="text-sm font-semibold text-leaf">
                Ver ocorrências →
              </Link>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-card">
              <TriangleAlert className="h-7 w-7 shrink-0 text-gold" />
              <p className="border-l border-primary-foreground/30 pl-3 text-sm font-medium">
                Cada ocorrência fica disponível para consulta pela Direção e pelo responsável.
              </p>
            </div>
          </>
        )}
      </main>
      <BottomBar />
    </div>
  );
}

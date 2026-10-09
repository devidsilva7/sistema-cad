import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Bell,
  GraduationCap,
  Megaphone,
  Settings,
  TriangleAlert,
  UserRound,
  UtensilsCrossed,
  LogOut,
} from "lucide-react";
import { BottomBar } from "@/components/AppShell";
import { logoutAdmin } from "@/lib/admin-auth";
import { clearLocalAccountSession } from "@/lib/local-accounts";
import { canAccessRoute, useStore } from "@/lib/store";
import { toast } from "sonner";

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

const MODULOS = [
  { to: "/ocorrencias", label: "Ocorrências Rápidas", icon: Megaphone },
  { to: "/cardapio", label: "Cardápio Escolar", icon: UtensilsCrossed },
  { to: "/alunos", label: "Cadastrar Alunos", icon: GraduationCap },
  { to: "/professores", label: "Cadastrar Professores", icon: UserRound },
  { to: "/comunicados", label: "Comunicados Gerais", icon: Bell },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Dashboard() {
  const { authReady, user, ocorrencias, set } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (authReady && !user) void navigate({ to: "/", replace: true });
  }, [authReady, navigate, user]);
  if (!authReady || !user) return null;

  const sair = async () => {
    try {
      if (user.localAccountId) {
        clearLocalAccountSession();
      } else {
        await logoutAdmin();
      }
      set((s) => ({ ...s, user: null }));
      await navigate({ to: "/", replace: true });
    } catch (error) {
      console.error("Falha ao encerrar a sessão do administrador.", error);
      toast.error("Não foi possível encerrar a sessão.");
    }
  };
  const isAluno = user?.perfil === "Aluno";
  const modulosVisiveis = MODULOS.filter(({ to }) => canAccessRoute(user.perfil, to));
  return (
    <div className="min-h-screen overflow-x-hidden pb-24 md:pb-8 md:pt-16">
      <header className="bg-hero hero-curve relative px-4 pb-16 pt-5 text-center text-primary-foreground sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="min-w-0 truncate text-sm font-medium text-primary-foreground/85">
            {user.nome}
          </span>
          <button
            type="button"
            onClick={() => void sair()}
            aria-label="Sair"
            className="grid h-10 w-10 place-items-center rounded-full border border-primary-foreground/15 bg-primary-foreground/10 transition hover:bg-primary-foreground/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <img
          src="/logoeducacao.png"
          alt="Brasão LAF"
          className="mx-auto mt-3 h-24 w-24 rounded-full border-[3px] border-gold bg-card object-contain p-1 shadow-[0_0_0_7px_oklch(1_0_0_/_9%),0_16px_36px_-12px_oklch(0.12_0.04_155_/_45%)]"
        />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-gold sm:tracking-[0.24em]">
          EEEP Luizete Albano de Freitas
        </p>
        <h1 className="mt-2 text-xl font-extrabold tracking-[0.06em]">GESTÃO ESCOLAR</h1>
        <p className="mt-1 text-sm text-primary-foreground/75">
          Comunicação e serviços em tempo real
        </p>
        {user && (
          <span className="mt-4 inline-block rounded-full border border-gold/35 bg-gold px-4 py-1.5 text-[11px] font-bold text-gold-foreground shadow-sm">
            {user.perfil}
          </span>
        )}
      </header>

      <main className="mx-auto -mt-9 w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {modulosVisiveis.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-3 py-5 text-center shadow-card backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_18px_38px_-18px_oklch(0.3_0.07_155_/_38%)]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary transition duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="text-[13px] font-bold leading-tight text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        {!isAluno && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-card">
              <div>
                <p className="text-xs text-muted-foreground">Ocorrências registradas</p>
                <p className="text-2xl font-extrabold text-primary">{ocorrencias.length}</p>
              </div>
              <Link to="/notificacoes" className="text-sm font-semibold text-leaf">
                Ver histórico →
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-card">
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

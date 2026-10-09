import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, GraduationCap, Megaphone, Settings, TriangleAlert, UserRound, UtensilsCrossed, LogOut } from "lucide-react";
import logo from "@/assets/logo-laf.jpeg.asset.json";
import { BottomBar } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Gestão Escolar LAF" },
      { name: "description", content: "Painel principal com ocorrências, cardápio, cadastros e comunicados." },
      { property: "og:title", content: "Painel — Gestão Escolar LAF" },
      { property: "og:description", content: "Painel principal com ocorrências, cardápio, cadastros e comunicados." },
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
  const { user, ocorrencias, set } = useStore();
  return (
    <div className="min-h-screen pb-24">
      <header className="bg-hero hero-curve relative px-5 pb-14 pt-5 text-center text-primary-foreground">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <span className="text-xs opacity-80">Olá, {user?.nome ?? "visitante"}</span>
          <Link to="/" onClick={() => set((s) => ({ ...s, user: null }))} aria-label="Sair" className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
        <img src={logo.url} alt="Brasão LAF" className="mx-auto mt-2 h-24 w-24 rounded-full border-4 border-gold bg-card object-contain p-1" />
        <h1 className="mt-3 text-xl font-extrabold tracking-wide">SISTEMA DE GESTÃO ESCOLAR</h1>
        <p className="text-sm opacity-85">Comunicação e serviços em tempo real</p>
        {user && <span className="mt-3 inline-block rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-gold-foreground">{user.perfil}</span>}
      </header>

      <main className="mx-auto -mt-8 max-w-md px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULOS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2.5 rounded-2xl bg-card px-2 py-5 text-center shadow-card transition hover:-translate-y-0.5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-primary">{label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
          <div>
            <p className="text-xs text-muted-foreground">Ocorrências registradas</p>
            <p className="text-2xl font-extrabold text-primary">{ocorrencias.length}</p>
          </div>
          <Link to="/notificacoes" className="text-sm font-semibold text-leaf">Ver histórico →</Link>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-card">
          <TriangleAlert className="h-7 w-7 shrink-0 text-gold" />
          <p className="border-l border-primary-foreground/30 pl-3 text-sm font-medium">
            Notificação imediata para direção e pais a cada registro emitido.
          </p>
        </div>
      </main>
      <BottomBar />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Card, PageShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Gestão Escolar LAF" },
      { name: "description", content: "Dados da sua conta no Sistema de Gestão Escolar." },
      { property: "og:title", content: "Perfil — Gestão Escolar LAF" },
      { property: "og:description", content: "Dados da sua conta no Sistema de Gestão Escolar." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user, set } = useStore();
  return (
    <PageShell title="Perfil" subtitle="Sua conta">
      <Card className="flex flex-col items-center py-8 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-9 w-9" /></span>
        <p className="mt-3 text-lg font-bold">{user?.nome ?? "Visitante"}</p>
        <span className="mt-1 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">{user?.perfil ?? "—"}</span>
        <p className="mt-3 text-xs text-muted-foreground">EEEP Luizete Albano de Freitas - LAF</p>
      </Card>
      <Link to="/" onClick={() => set((s) => ({ ...s, user: null }))} className="mt-4 block w-full rounded-xl border border-primary py-3 text-center font-semibold text-primary">
        Sair do sistema
      </Link>
    </PageShell>
  );
}

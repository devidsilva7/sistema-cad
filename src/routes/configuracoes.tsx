import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, PageShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Gestão Escolar LAF" },
      { name: "description", content: "Preferências de notificação e dados do sistema." },
      { property: "og:title", content: "Configurações — Gestão Escolar LAF" },
      { property: "og:description", content: "Preferências de notificação e dados do sistema." },
    ],
  }),
  component: Config,
});

function Config() {
  const { set } = useStore();
  const [opts, setOpts] = useState({ whatsapp: true, email: true, direcao: true });
  const items = [
    { k: "whatsapp", label: "Notificar responsáveis via WhatsApp" },
    { k: "email", label: "Notificar responsáveis via E-mail" },
    { k: "direcao", label: "Copiar direção em todas as ocorrências" },
  ] as const;
  return (
    <PageShell title="Configurações" subtitle="Preferências do sistema">
      <Card className="divide-y">
        {items.map(({ k, label }) => (
          <label key={k} className="flex items-center justify-between gap-3 py-3 text-sm font-medium">
            {label}
            <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
          </label>
        ))}
      </Card>
      <button
        onClick={() => { localStorage.removeItem("laf-gestao-v1"); toast.success("Dados de exemplo restaurados."); setTimeout(() => location.reload(), 600); set((s) => s); }}
        className="mt-4 w-full rounded-xl border border-destructive py-3 font-semibold text-destructive"
      >
        Restaurar dados de exemplo
      </button>
    </PageShell>
  );
}

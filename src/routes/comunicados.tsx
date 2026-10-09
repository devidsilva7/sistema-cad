import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { fmtData, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/comunicados")({
  head: () => ({
    meta: [
      { title: "Comunicados Gerais — Gestão Escolar LAF" },
      { name: "description", content: "Avisos e notificações da direção para toda a comunidade escolar." },
      { property: "og:title", content: "Comunicados Gerais — Gestão Escolar LAF" },
      { property: "og:description", content: "Avisos e notificações da direção para toda a comunidade escolar." },
    ],
  }),
  component: Comunicados,
});

const PUBLICOS = ["Todos", "Responsáveis", "Professores", "Alunos"];

function Comunicados() {
  const { comunicados, set } = useStore();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [publico, setPublico] = useState(PUBLICOS[0]!);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !mensagem) { toast.error("Preencha título e mensagem."); return; }
    set((s) => ({ ...s, comunicados: [{ id: uid(), titulo, mensagem, publico, data: new Date().toISOString() }, ...s.comunicados] }));
    setTitulo(""); setMensagem("");
    toast.success("Comunicado enviado", { description: `Público: ${publico}` });
  };

  return (
    <PageShell title="Comunicados Gerais" subtitle="Direção → comunidade escolar">
      <Card>
        <form onSubmit={enviar} className="space-y-3">
          <div><Label>Título</Label><input className="field" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div><Label>Mensagem</Label><textarea className="field min-h-24" value={mensagem} onChange={(e) => setMensagem(e.target.value)} /></div>
          <div><Label>Público</Label><select className="field" value={publico} onChange={(e) => setPublico(e.target.value)}>{PUBLICOS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <PrimaryButton type="submit">Enviar comunicado</PrimaryButton>
        </form>
      </Card>
      <div className="mt-5 space-y-2">
        {comunicados.map((c) => (
          <Card key={c.id} className="flex gap-3 !p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Bell className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="font-semibold">{c.titulo}</p>
              <p className="text-sm text-muted-foreground">{c.mensagem}</p>
              <p className="mt-1 text-[11px] font-medium text-gold-foreground">{c.publico} · {fmtData(c.data)}</p>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Cadastrar Alunos — Gestão Escolar LAF" },
      { name: "description", content: "Cadastro e busca de alunos com dados do responsável." },
      { property: "og:title", content: "Cadastrar Alunos — Gestão Escolar LAF" },
      { property: "og:description", content: "Cadastro e busca de alunos com dados do responsável." },
    ],
  }),
  component: Alunos,
});

const empty = { nome: "", turma: TURMAS[0], matricula: "", responsavel: "", whatsapp: "" };

function Alunos() {
  const { alunos, set } = useStore();
  const [f, setF] = useState(empty);
  const [q, setQ] = useState("");
  const lista = alunos.filter((a) => (a.nome + a.matricula + a.turma).toLowerCase().includes(q.toLowerCase()));

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome || !f.matricula) return toast.error("Preencha nome e matrícula.");
    set((s) => ({ ...s, alunos: [{ id: uid(), ...f }, ...s.alunos] }));
    setF(empty);
    toast.success("Aluno cadastrado.");
  };

  return (
    <PageShell title="Cadastrar Alunos" subtitle={`${alunos.length} alunos cadastrados`}>
      <Card>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label>Nome</Label><input className="field" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Turma</Label><select className="field" value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}>{TURMAS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><Label>Matrícula</Label><input className="field" value={f.matricula} onChange={(e) => setF({ ...f, matricula: e.target.value })} /></div>
          </div>
          <div><Label>Responsável</Label><input className="field" value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></div>
          <div><Label>WhatsApp do responsável</Label><input className="field" placeholder="(85) 9…" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
          <PrimaryButton type="submit">Cadastrar aluno</PrimaryButton>
        </form>
      </Card>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field !pl-9" placeholder="Buscar por nome, matrícula ou turma" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-3 space-y-2">
        {lista.map((a) => (
          <Card key={a.id} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold">{a.nome}</p>
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{a.turma}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Mat. {a.matricula} · {a.responsavel} · {a.whatsapp}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/professores")({
  head: () => ({
    meta: [
      { title: "Cadastrar Professores — Gestão Escolar LAF" },
      { name: "description", content: "Cadastro de professores, disciplinas, turmas e Diretores de Turma." },
      { property: "og:title", content: "Cadastrar Professores — Gestão Escolar LAF" },
      { property: "og:description", content: "Cadastro de professores, disciplinas, turmas e Diretores de Turma." },
    ],
  }),
  component: Professores,
});

function Professores() {
  const { professores, set } = useStore();
  const [nome, setNome] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turmas, setTurmas] = useState<string[]>([]);
  const [dt, setDt] = useState(false);

  const toggle = (t: string) => setTurmas((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !disciplina) { toast.error("Preencha nome e disciplina."); return; }
    set((s) => ({ ...s, professores: [{ id: uid(), nome, disciplina, turmas, dt }, ...s.professores] }));
    setNome(""); setDisciplina(""); setTurmas([]); setDt(false);
    toast.success("Professor cadastrado.");
  };

  return (
    <PageShell title="Cadastrar Professores" subtitle={`${professores.length} professores`}>
      <Card>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label>Nome</Label><input className="field" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label>Disciplina</Label><input className="field" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} /></div>
          <div>
            <Label>Turmas</Label>
            <div className="flex flex-wrap gap-2">
              {TURMAS.map((t) => (
                <button type="button" key={t} onClick={() => toggle(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${turmas.includes(t) ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-xl bg-accent p-3 text-sm font-semibold text-accent-foreground">
            <input type="checkbox" checked={dt} onChange={(e) => setDt(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
            É Diretor de Turma (DT)
          </label>
          <PrimaryButton type="submit">Cadastrar professor</PrimaryButton>
        </form>
      </Card>
      <div className="mt-5 space-y-2">
        {professores.map((p) => (
          <Card key={p.id} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold">{p.nome}</p>
              {p.dt && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-gold-foreground">DT</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.disciplina} · {p.turmas.join(", ") || "Sem turmas"}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

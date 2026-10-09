import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/ocorrencias")({
  head: () => ({
    meta: [
      { title: "Ocorrências Rápidas — Gestão Escolar LAF" },
      { name: "description", content: "Registre ocorrências e notifique direção e responsáveis instantaneamente." },
      { property: "og:title", content: "Ocorrências Rápidas — Gestão Escolar LAF" },
      { property: "og:description", content: "Registre ocorrências e notifique direção e responsáveis instantaneamente." },
    ],
  }),
  component: Ocorrencias,
});

const TIPOS = ["Advertência", "Fardamento", "Conversa Paralela", "Elogio/Mérito"];
const TEMPLATES = ["Sem fardamento adequado", "Uso indevido do celular", "Conversa paralela durante a aula", "Atraso recorrente", "Participação exemplar", "Não realizou a atividade"];

function Ocorrencias() {
  const { alunos, set } = useStore();
  const [turma, setTurma] = useState(TURMAS[0]!);
  const [alunoId, setAlunoId] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]!);
  const [obs, setObs] = useState("");
  const [sending, setSending] = useState(false);
  const daTurma = alunos.filter((a) => a.turma === turma);

  const enviar = () => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!aluno) { toast.error("Selecione um aluno."); return; }
    setSending(true);
    setTimeout(() => {
      set((s) => ({ ...s, ocorrencias: [{ id: uid(), alunoId, turma, tipo, obs, data: new Date().toISOString() }, ...s.ocorrencias] }));
      toast.success("Ocorrência enviada!", { description: `Direção e ${aluno.responsavel} notificados via WhatsApp (${aluno.whatsapp}) e E-mail.` });
      setSending(false);
      setAlunoId("");
      setObs("");
    }, 900);
  };

  return (
    <PageShell title="Ocorrências Rápidas" subtitle="Fluxo do Diretor de Turma">
      <Card className="space-y-4">
        <div>
          <Label>Turma</Label>
          <select className="field" value={turma} onChange={(e) => { setTurma(e.target.value); setAlunoId(""); }}>
            {TURMAS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label>Aluno</Label>
          <select className="field" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">{daTurma.length ? "Selecione…" : "Nenhum aluno nesta turma"}</option>
            {daTurma.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
        <div>
          <Label>Tipo de ocorrência</Label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${tipo === t ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Frases prontas</Label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" onClick={() => setObs(t)}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-gold/20">
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Observações</Label>
          <textarea className="field min-h-24" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Descreva a ocorrência…" />
        </div>
        <PrimaryButton onClick={enviar} disabled={sending} className="flex items-center justify-center gap-2">
          <Send className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar Ocorrência Instantânea"}
        </PrimaryButton>
      </Card>
    </PageShell>
  );
}

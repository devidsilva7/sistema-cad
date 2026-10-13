import { createFileRoute } from "@tanstack/react-router";
import { Bell, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { fmtData, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/comunicados")({
  head: () => ({
    meta: [
      { title: "Comunicados Gerais — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Avisos e notificações da direção para toda a comunidade escolar.",
      },
      { property: "og:title", content: "Comunicados Gerais — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Avisos e notificações da direção para toda a comunidade escolar.",
      },
    ],
  }),
  component: Comunicados,
});

const PUBLICOS = ["Todos", "Responsáveis", "Professores", "Alunos"];

function Comunicados() {
  const { comunicados, set, user } = useStore();
  const isAluno = user?.perfil === "Aluno";
  const isResponsavel = user?.perfil === "Responsável";
  const somenteLeitura = isAluno || isResponsavel;
  const comunicadosVisiveis = isAluno
    ? comunicados.filter(
        (comunicado) => comunicado.publico === "Todos" || comunicado.publico === "Alunos",
      )
    : isResponsavel
      ? comunicados.filter(
          (comunicado) => comunicado.publico === "Todos" || comunicado.publico === "Responsáveis",
        )
      : comunicados;
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [publico, setPublico] = useState(PUBLICOS[0]!);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error("Preencha título e mensagem.");
      return;
    }
    set((s) => ({
      ...s,
      comunicados: editandoId
        ? s.comunicados.map((item) =>
            item.id === editandoId
              ? { ...item, titulo: titulo.trim(), mensagem: mensagem.trim(), publico }
              : item,
          )
        : [
            {
              id: uid(),
              titulo: titulo.trim(),
              mensagem: mensagem.trim(),
              publico,
              data: new Date().toISOString(),
            },
            ...s.comunicados,
          ],
    }));
    const editado = Boolean(editandoId);
    setEditandoId(null);
    setTitulo("");
    setMensagem("");
    setPublico(PUBLICOS[0]!);
    toast.success(editado ? "Dados atualizados com sucesso!" : "Comunicado enviado", {
      description: `Público: ${publico}`,
    });
  };

  return (
    <PageShell title="Comunicados Gerais" subtitle="Direção → comunidade escolar">
      {!somenteLeitura && (
        <Card>
          <form onSubmit={enviar} className="space-y-3">
            {editandoId && <h2 className="font-bold">Editar comunicado</h2>}
            <div>
              <Label>Título</Label>
              <input className="field" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <textarea
                className="field min-h-24"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </div>
            <div>
              <Label>Público</Label>
              <select
                className="field"
                value={publico}
                onChange={(e) => setPublico(e.target.value)}
              >
                {PUBLICOS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <PrimaryButton type="submit">
                {editandoId ? "Salvar alterações" : "Enviar comunicado"}
              </PrimaryButton>
              {editandoId && (
                <button
                  type="button"
                  className="rounded-xl border px-4 text-sm font-semibold"
                  onClick={() => {
                    setEditandoId(null);
                    setTitulo("");
                    setMensagem("");
                    setPublico(PUBLICOS[0]!);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>
      )}
      <div className="mt-5 space-y-2">
        {comunicadosVisiveis.map((c) => (
          <Card key={c.id} className="flex items-start gap-3 !p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.titulo}</p>
              <p className="text-sm text-muted-foreground">{c.mensagem}</p>
              <p className="mt-1 text-[11px] font-medium text-gold-foreground">
                {c.publico} · {fmtData(c.data)}
              </p>
            </div>
            {!somenteLeitura && (
              <button
                type="button"
                aria-label={`Editar comunicado ${c.titulo}`}
                onClick={() => {
                  setEditandoId(c.id);
                  setTitulo(c.titulo);
                  setMensagem(c.mensagem);
                  setPublico(c.publico);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

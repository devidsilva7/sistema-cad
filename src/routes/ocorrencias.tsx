import { createFileRoute } from "@tanstack/react-router";
import { Phone, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { soDigitos } from "@/lib/cadastros";
import { fmtData, TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/ocorrencias")({
  head: () => ({
    meta: [
      { title: "Ocorrências Rápidas — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Registre ocorrências e notifique direção e responsáveis instantaneamente.",
      },
      { property: "og:title", content: "Ocorrências Rápidas — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Registre ocorrências e notifique direção e responsáveis instantaneamente.",
      },
    ],
  }),
  component: Ocorrencias,
});

const TIPOS = ["Advertência", "Fardamento", "Conversa Paralela", "Elogio/Mérito"];
const TEMPLATES = [
  "Sem fardamento adequado",
  "Uso indevido do celular",
  "Conversa paralela durante a aula",
  "Atraso recorrente",
  "Participação exemplar",
  "Não realizou a atividade",
];

function Ocorrencias() {
  const { accounts, alunos, ocorrencias, professores, responsaveis, set, user } = useStore();
  const somenteLeitura = user?.perfil === "Diretor";
  const podeGerenciar = user?.perfil === "Administrador" || user?.perfil === "Coordenador";
  const emailUsuario = accounts.find((account) => account.id === user?.localAccountId)?.email;
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario?.toLowerCase(),
  );
  const turmasVisiveis =
    user?.perfil === "Professor" || user?.perfil === "Diretor de Turma"
      ? (professorAtual?.turmas ?? [])
      : undefined;
  const alunosVisiveis = turmasVisiveis
    ? alunos.filter((aluno) => turmasVisiveis.includes(aluno.turma))
    : alunos;
  const ocorrenciasVisiveis = turmasVisiveis
    ? ocorrencias.filter((ocorrencia) => turmasVisiveis.includes(ocorrencia.turma))
    : ocorrencias;
  const [turma, setTurma] = useState(TURMAS[0]!);
  const [alunoId, setAlunoId] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]!);
  const [obs, setObs] = useState("");
  const [sending, setSending] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipoEditado, setTipoEditado] = useState(TIPOS[0]!);
  const [obsEditada, setObsEditada] = useState("");
  const daTurma = alunosVisiveis.filter((a) => a.turma === turma);
  const alunoSelecionado = alunosVisiveis.find((aluno) => aluno.id === alunoId);
  const responsavelDoAluno = (aluno: (typeof alunos)[number]) =>
    responsaveis.find(
      (responsavel) =>
        responsavel.id === aluno.responsavelId ||
        (aluno.responsavelEmail &&
          responsavel.email.toLowerCase() === aluno.responsavelEmail.toLowerCase()),
    );

  const enviar = () => {
    const aluno = alunosVisiveis.find((a) => a.id === alunoId);
    if (!aluno) {
      toast.error("Selecione um aluno.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      set((s) => ({
        ...s,
        ocorrencias: [
          {
            id: uid(),
            alunoId,
            turma,
            tipo,
            obs,
            data: new Date().toISOString(),
            ...(user?.nome ? { registradoPor: user.nome } : {}),
          },
          ...s.ocorrencias,
        ],
      }));
      toast.success("Ocorrência registrada e disponível para o responsável.", {
        description: `Registro de ${aluno.nome} salvo no histórico escolar.`,
      });
      setSending(false);
      setAlunoId("");
      setObs("");
    }, 900);
  };

  return (
    <PageShell
      title="Ocorrências Rápidas"
      subtitle={somenteLeitura ? "Consulta de ocorrências" : "Registro e acompanhamento"}
    >
      {!somenteLeitura && (
        <Card className="space-y-4">
          <div>
            <Label>Turma</Label>
            <select
              className="field"
              value={turma}
              onChange={(e) => {
                setTurma(e.target.value);
                setAlunoId("");
              }}
            >
              {TURMAS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Aluno</Label>
            <select className="field" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
              <option value="">{daTurma.length ? "Selecione…" : "Nenhum aluno nesta turma"}</option>
              {daTurma.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          {alunoSelecionado && (
            <div className="rounded-xl border border-border/70 bg-accent/40 p-3 text-sm">
              <p className="font-semibold">
                Responsável:{" "}
                {responsavelDoAluno(alunoSelecionado)?.nome ||
                  alunoSelecionado.responsavel ||
                  "Não cadastrado"}
              </p>
              {(() => {
                const responsavel = responsavelDoAluno(alunoSelecionado);
                const contato = responsavel?.whatsapp || alunoSelecionado.whatsapp;
                const numero = soDigitos(contato);
                return numero.length >= 10 ? (
                  <a
                    href={`tel:${numero}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-primary underline"
                  >
                    <Phone className="h-4 w-4" />
                    {contato}
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {contato || "Contato não cadastrado."}
                  </p>
                );
              })()}
            </div>
          )}
          <div>
            <Label>Tipo de ocorrência</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${tipo === t ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Frases prontas</Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setObs(t)}
                  className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-gold/20"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <textarea
              className="field min-h-24"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Descreva a ocorrência…"
            />
          </div>
          <PrimaryButton
            onClick={enviar}
            disabled={sending}
            className="flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar Ocorrência Instantânea"}
          </PrimaryButton>
        </Card>
      )}
      <section className="mt-5 space-y-2">
        <h2 className="px-1 text-sm font-bold">Histórico de ocorrências</h2>
        {ocorrenciasVisiveis.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">Nenhuma ocorrência registrada ainda.</p>
          </Card>
        )}
        {ocorrenciasVisiveis.map((ocorrencia) => {
          const aluno = alunos.find((item) => item.id === ocorrencia.alunoId);
          const responsavel = aluno ? responsavelDoAluno(aluno) : undefined;
          const contatoResponsavel = responsavel?.whatsapp || aluno?.whatsapp || "";
          const numeroResponsavel = soDigitos(contatoResponsavel);
          const editando = editandoId === ocorrencia.id;
          return (
            <Card key={ocorrencia.id} className="flex items-start justify-between gap-3 !p-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {aluno?.nome ?? "Aluno"} · {ocorrencia.turma}
                </p>
                {editando ? (
                  <div className="mt-2 space-y-2">
                    <select
                      className="field"
                      value={tipoEditado}
                      onChange={(event) => setTipoEditado(event.target.value)}
                    >
                      {TIPOS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <textarea
                      className="field min-h-20"
                      value={obsEditada}
                      onChange={(event) => setObsEditada(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          set((state) => ({
                            ...state,
                            ocorrencias: state.ocorrencias.map((item) =>
                              item.id === ocorrencia.id
                                ? { ...item, tipo: tipoEditado, obs: obsEditada }
                                : item,
                            ),
                          }));
                          setEditandoId(null);
                          toast.success("Ocorrência atualizada.");
                        }}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">
                    <b className="text-primary">{ocorrencia.tipo}</b>
                    {ocorrencia.obs && ` — ${ocorrencia.obs}`}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {fmtData(ocorrencia.data)}
                  {podeGerenciar && ocorrencia.registradoPor
                    ? ` · Registrada por ${ocorrencia.registradoPor}`
                    : ""}
                </p>
                <div className="mt-2 text-xs">
                  <p className="font-semibold">
                    Responsável: {responsavel?.nome || aluno?.responsavel || "Não cadastrado"}
                  </p>
                  {numeroResponsavel.length >= 10 ? (
                    <a
                      href={`tel:${numeroResponsavel}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-primary underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {contatoResponsavel}
                    </a>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      {contatoResponsavel || "Contato não cadastrado."}
                    </p>
                  )}
                </div>
              </div>
              {podeGerenciar && !editando && (
                <button
                  type="button"
                  aria-label={`Editar ocorrência de ${aluno?.nome ?? "aluno"}`}
                  onClick={() => {
                    setEditandoId(ocorrencia.id);
                    setTipoEditado(ocorrencia.tipo);
                    setObsEditada(ocorrencia.obs);
                  }}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  Editar
                </button>
              )}
              {podeGerenciar && !editando && (
                <button
                  type="button"
                  aria-label={`Excluir ocorrência de ${aluno?.nome ?? "aluno"}`}
                  onClick={() => {
                    if (!window.confirm("Excluir esta ocorrência?")) return;
                    set((state) => ({
                      ...state,
                      ocorrencias: state.ocorrencias.filter((item) => item.id !== ocorrencia.id),
                    }));
                    toast.success("Ocorrência excluída.");
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}

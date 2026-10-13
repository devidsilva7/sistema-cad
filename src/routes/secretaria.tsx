import { createFileRoute } from "@tanstack/react-router";
import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, Field, PageShell, PrimaryButton } from "@/components/AppShell";
import { uid, useStore, type SolicitacaoDocumento } from "@/lib/store";

export const Route = createFileRoute("/secretaria")({
  head: () => ({
    meta: [
      { title: "Secretaria — Gestão Escolar LAF" },
      { name: "description", content: "Busca de alunos e gestão de documentos escolares." },
    ],
  }),
  component: Secretaria,
});

const TIPOS_DOCUMENTOS: SolicitacaoDocumento["tipo"][] = [
  "Declaração de frequência",
  "Comprovante de matrícula",
  "Histórico escolar",
  "Ficha do aluno",
];
const STATUS_DOCUMENTOS: SolicitacaoDocumento["status"][] = [
  "Solicitado",
  "Em andamento",
  "Concluído",
  "Entregue",
];
const CURSOS = ["Informática", "Administração", "Meio Ambiente"] as const;
const SERIES = ["1º", "2º", "3º"] as const;

function Secretaria() {
  const { alunos, responsaveis, solicitacoesDocumentos, set } = useStore();
  const [busca, setBusca] = useState("");
  const [curso, setCurso] = useState("");
  const [serie, setSerie] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [tipo, setTipo] = useState<SolicitacaoDocumento["tipo"]>(TIPOS_DOCUMENTOS[0]!);
  const [documentoId, setDocumentoId] = useState<string | null>(null);

  const alunosFiltrados = useMemo(
    () =>
      alunos.filter((aluno) => {
        const correspondeBusca = `${aluno.nome} ${aluno.matricula} ${aluno.turma}`
          .toLocaleLowerCase("pt-BR")
          .includes(busca.toLocaleLowerCase("pt-BR"));
        return (
          correspondeBusca &&
          (!curso || aluno.turma.endsWith(curso)) &&
          (!serie || aluno.turma.startsWith(serie))
        );
      }),
    [alunos, busca, curso, serie],
  );

  const criarSolicitacao = () => {
    if (!alunos.some((aluno) => aluno.id === alunoId)) {
      toast.error("Selecione um aluno para solicitar o documento.");
      return;
    }
    const solicitacao: SolicitacaoDocumento = {
      id: uid(),
      alunoId,
      tipo,
      status: "Solicitado",
      criadaEm: new Date().toISOString(),
    };
    set((state) => ({
      ...state,
      solicitacoesDocumentos: [solicitacao, ...state.solicitacoesDocumentos],
    }));
    toast.success("Solicitação de documento criada.");
  };

  const mudarStatus = (id: string, valor: string) => {
    const status = STATUS_DOCUMENTOS.find((item) => item === valor);
    if (!status) return;
    set((state) => ({
      ...state,
      solicitacoesDocumentos: state.solicitacoesDocumentos.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    }));
  };

  const documento = solicitacoesDocumentos.find((item) => item.id === documentoId);
  const alunoDocumento = alunos.find((item) => item.id === documento?.alunoId);

  return (
    <PageShell title="Secretaria" subtitle="Busca de alunos e documentos escolares">
      <style>{`@media print { body * { visibility: hidden !important; } .documento-para-imprimir, .documento-para-imprimir * { visibility: visible !important; } .documento-para-imprimir { display: block !important; position: fixed; inset: 0; padding: 32px; background: white; color: black; } }`}</style>
      <section className="space-y-3">
        <h2 className="font-bold">Localizar alunos</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field !pl-9"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome, matrícula ou turma"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Curso">
            <select
              className="field"
              value={curso}
              onChange={(event) => setCurso(event.target.value)}
            >
              <option value="">Todos</option>
              {CURSOS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Série">
            <select
              className="field"
              value={serie}
              onChange={(event) => setSerie(event.target.value)}
            >
              <option value="">Todas</option>
              {SERIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="space-y-2">
          {alunosFiltrados.length === 0 && (
            <Card>
              <p className="text-sm text-muted-foreground">Nenhum aluno corresponde à busca.</p>
            </Card>
          )}
          {alunosFiltrados.map((aluno) => {
            const responsavel = responsaveis.find(
              (item) =>
                item.id === aluno.responsavelId ||
                (aluno.responsavelEmail &&
                  item.email.toLowerCase() === aluno.responsavelEmail.toLowerCase()),
            );
            const telefone = responsavel?.whatsapp || aluno.whatsapp;
            return (
              <Card
                key={aluno.id}
                className="flex flex-wrap items-center justify-between gap-3 !p-3"
              >
                <div>
                  <p className="font-semibold">{aluno.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {aluno.turma} · Matrícula {aluno.matricula}
                  </p>
                  <p className="mt-1 text-xs">
                    Responsável: {responsavel?.nome || aluno.responsavel || "Não cadastrado"}
                    {telefone && ` · ${telefone}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlunoId(aluno.id)}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  {alunoId === aluno.id ? "Selecionado" : "Selecionar"}
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="mt-5 space-y-3">
        <h2 className="font-bold">Solicitar documento escolar</h2>
        <p className="text-sm text-muted-foreground">
          Aluno selecionado: {alunos.find((aluno) => aluno.id === alunoId)?.nome ?? "nenhum"}
        </p>
        <Field label="Tipo de documento">
          <select
            className="field"
            value={tipo}
            onChange={(event) => {
              const selecionado = TIPOS_DOCUMENTOS.find((item) => item === event.target.value);
              if (selecionado) setTipo(selecionado);
            }}
          >
            {TIPOS_DOCUMENTOS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <PrimaryButton onClick={criarSolicitacao}>Registrar solicitação</PrimaryButton>
      </Card>

      <section className="mt-5 space-y-2">
        <h2 className="font-bold">Solicitações internas</h2>
        {solicitacoesDocumentos.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">
              Nenhuma solicitação de documento registrada.
            </p>
          </Card>
        )}
        {solicitacoesDocumentos.map((item) => {
          const aluno = alunos.find((registro) => registro.id === item.alunoId);
          return (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 !p-3">
              <div>
                <p className="font-semibold">{item.tipo}</p>
                <p className="text-xs text-muted-foreground">
                  {aluno?.nome ?? "Aluno removido"} · {aluno?.turma ?? "—"} ·{" "}
                  {new Date(item.criadaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="field !w-auto"
                  aria-label={`Status da solicitação para ${aluno?.nome ?? "aluno"}`}
                  value={item.status}
                  onChange={(event) => mudarStatus(item.id, event.target.value)}
                >
                  {STATUS_DOCUMENTOS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDocumentoId(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  <FileText className="h-4 w-4" />
                  Gerar
                </button>
              </div>
            </Card>
          );
        })}
      </section>

      {documento && alunoDocumento && (
        <Card className="mt-5">
          <h2 className="font-bold">Pré-visualização do documento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {documento.tipo} · {alunoDocumento.nome} · {alunoDocumento.turma}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            O modelo contém os dados cadastrais disponíveis. Confirme e complete informações
            acadêmicas oficiais antes de entregar.
          </p>
          <div className="mt-3 flex gap-2">
            <PrimaryButton onClick={() => window.print()}>Imprimir / Salvar em PDF</PrimaryButton>
            <button
              type="button"
              className="rounded-xl border px-3 text-sm"
              onClick={() => setDocumentoId(null)}
            >
              Fechar
            </button>
          </div>
        </Card>
      )}
      {documento && alunoDocumento && (
        <article className="documento-para-imprimir hidden">
          <h1>EEEP Luizete Albano de Freitas</h1>
          <h2>{documento.tipo}</h2>
          <p>Aluno(a): {alunoDocumento.nome}</p>
          <p>Matrícula: {alunoDocumento.matricula}</p>
          <p>Curso/turma: {alunoDocumento.turma}</p>
          <p>Responsável: {alunoDocumento.responsavel || "Não cadastrado"}</p>
          <p>
            {documento.tipo === "Declaração de frequência"
              ? "Declaração modelo: dados de frequência não são mantidos neste sistema. Validar no sistema acadêmico oficial antes de emitir."
              : documento.tipo === "Histórico escolar"
                ? "Histórico modelo: notas e resultados acadêmicos não são mantidos neste sistema. Anexar o histórico oficial antes de emitir."
                : documento.tipo === "Comprovante de matrícula"
                  ? `Declaramos, para os devidos fins, que ${alunoDocumento.nome} consta no cadastro escolar na turma indicada.`
                  : `Ficha cadastral extraída do cadastro escolar em ${new Date().toLocaleDateString("pt-BR")}.`}
          </p>
          <p>
            Solicitação registrada em {new Date(documento.criadaEm).toLocaleDateString("pt-BR")}.
          </p>
          <br />
          <br />
          <p>________________________________________</p>
          <p>Assinatura / carimbo da Secretaria</p>
        </article>
      )}
    </PageShell>
  );
}

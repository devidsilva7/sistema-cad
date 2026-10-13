import { createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Field, PageShell, PrimaryButton } from "@/components/AppShell";
import { uid, useStore, type LancamentoFinanceiro } from "@/lib/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Gestão Escolar LAF" },
      { name: "description", content: "Painel financeiro, pagamentos e relatórios." },
    ],
  }),
  component: Financeiro,
});

type TipoRelatorio = "inadimplencia" | "fluxo" | "recibo";
const STATUS_PAGAMENTO: LancamentoFinanceiro["status"][] = ["Pago", "Pendente", "Atrasado"];
const fmtMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mesAtual = () => new Date().toISOString().slice(0, 7);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function Financeiro() {
  const { alunos, responsaveis, lancamentosFinanceiros, set } = useStore();
  const [form, setForm] = useState({
    tipo: "Receita" as LancamentoFinanceiro["tipo"],
    descricao: "",
    valor: "",
    competencia: mesAtual(),
    status: "Pendente" as LancamentoFinanceiro["status"],
    alunoId: "",
  });
  const [relatorio, setRelatorio] = useState<TipoRelatorio | null>(null);
  const [reciboId, setReciboId] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const resumo = useMemo(() => {
    const recebidos = lancamentosFinanceiros
      .filter((item) => item.tipo === "Receita" && item.status === "Pago")
      .reduce((total, item) => total + item.valor, 0);
    const pagosDespesas = lancamentosFinanceiros
      .filter((item) => item.tipo === "Despesa" && item.status === "Pago")
      .reduce((total, item) => total + item.valor, 0);
    const pendencias = lancamentosFinanceiros
      .filter(
        (item) =>
          item.tipo === "Receita" && (item.status === "Pendente" || item.status === "Atrasado"),
      )
      .reduce((total, item) => total + item.valor, 0);
    const atrasados = lancamentosFinanceiros.filter(
      (item) => item.tipo === "Receita" && item.status === "Atrasado",
    ).length;
    return { recebidos, pagosDespesas, pendencias, fluxo: recebidos - pagosDespesas, atrasados };
  }, [lancamentosFinanceiros]);

  const comparativo = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - index));
        const competencia = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const doMes = lancamentosFinanceiros.filter(
          (item) => item.competencia === competencia && item.status === "Pago",
        );
        return {
          mes: MESES[date.getMonth()]!,
          Receitas: doMes
            .filter((item) => item.tipo === "Receita")
            .reduce((total, item) => total + item.valor, 0),
          Despesas: doMes
            .filter((item) => item.tipo === "Despesa")
            .reduce((total, item) => total + item.valor, 0),
        };
      }),
    [lancamentosFinanceiros],
  );

  const dadosInadimplencia = useMemo(
    () =>
      STATUS_PAGAMENTO.filter((status) => status !== "Pago").map((status) => ({
        name: status,
        value: lancamentosFinanceiros
          .filter((item) => item.tipo === "Receita" && item.status === status)
          .reduce((total, item) => total + item.valor, 0),
      })),
    [lancamentosFinanceiros],
  );

  const salvarLancamento = (event: React.FormEvent) => {
    event.preventDefault();
    const valor = Number(form.valor.replace(",", "."));
    if (!form.descricao.trim() || !Number.isFinite(valor) || valor <= 0 || !form.competencia) {
      toast.error("Informe descrição, competência e um valor maior que zero.");
      return;
    }
    const movimento: LancamentoFinanceiro = {
      id: editandoId ?? uid(),
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor,
      competencia: form.competencia,
      status: form.status,
      ...(form.alunoId ? { alunoId: form.alunoId } : {}),
      criadaEm:
        lancamentosFinanceiros.find((item) => item.id === editandoId)?.criadaEm ??
        new Date().toISOString(),
    };
    set((state) => ({
      ...state,
      lancamentosFinanceiros: editandoId
        ? state.lancamentosFinanceiros.map((item) => (item.id === editandoId ? movimento : item))
        : [movimento, ...state.lancamentosFinanceiros],
    }));
    const editado = Boolean(editandoId);
    setEditandoId(null);
    setForm({
      tipo: "Receita",
      descricao: "",
      valor: "",
      competencia: mesAtual(),
      status: "Pendente",
      alunoId: "",
    });
    toast.success(editado ? "Dados atualizados com sucesso!" : `${form.tipo} registrada.`);
  };

  const mudarStatus = (id: string, valor: string) => {
    const status = STATUS_PAGAMENTO.find((item) => item === valor);
    if (!status) return;
    set((state) => ({
      ...state,
      lancamentosFinanceiros: state.lancamentosFinanceiros.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    }));
  };

  const emitirRelatorio = (tipo: TipoRelatorio, movimentoId = "") => {
    setReciboId(movimentoId);
    setRelatorio(tipo);
    window.setTimeout(() => window.print(), 50);
  };

  const itensInadimplentes = lancamentosFinanceiros.filter(
    (item) => item.tipo === "Receita" && (item.status === "Pendente" || item.status === "Atrasado"),
  );
  const movimentoRecibo = lancamentosFinanceiros.find((item) => item.id === reciboId);

  return (
    <PageShell title="Financeiro" subtitle="Receitas, despesas e controle de pagamentos">
      <style>{`@media print { body * { visibility: hidden !important; } .relatorio-para-imprimir, .relatorio-para-imprimir * { visibility: visible !important; } .relatorio-para-imprimir { display: block !important; position: fixed; inset: 0; padding: 32px; background: white; color: black; } }`}</style>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { titulo: "Total arrecadado", valor: resumo.recebidos },
          { titulo: "Pendências", valor: resumo.pendencias },
          { titulo: "Despesas pagas", valor: resumo.pagosDespesas },
          { titulo: "Fluxo de caixa", valor: resumo.fluxo },
        ].map((item) => (
          <Card key={item.titulo} className="!p-3">
            <p className="text-xs font-semibold text-muted-foreground">{item.titulo}</p>
            <p className="mt-1 text-lg font-extrabold text-primary">{fmtMoeda(item.valor)}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Receitas pagas vs. despesas pagas</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativo} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => fmtMoeda(Number(value))} />
                <Bar dataKey="Receitas" fill="var(--primary)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--gold)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Indicador de inadimplência</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            {resumo.atrasados} mensalidades/taxas atrasadas · {fmtMoeda(resumo.pendencias)} em
            aberto
          </p>
          <div className="h-56">
            {resumo.pendencias > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosInadimplencia}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={82}
                    label
                  >
                    {dadosInadimplencia.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={index === 0 ? "var(--gold)" : "var(--destructive)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmtMoeda(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl bg-accent/40 text-sm text-muted-foreground">
                Nenhuma pendência registrada
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 font-bold">
          {editandoId ? "Editar lançamento" : "Novo lançamento ou mensalidade/taxa"}
        </h2>
        <form onSubmit={salvarLancamento} className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select
              className="field"
              value={form.tipo}
              onChange={(event) => {
                const tipo = event.target.value === "Despesa" ? "Despesa" : "Receita";
                setForm({ ...form, tipo, alunoId: tipo === "Despesa" ? "" : form.alunoId });
              }}
            >
              <option>Receita</option>
              <option>Despesa</option>
            </select>
          </Field>
          <Field label="Descrição">
            <input
              className="field"
              value={form.descricao}
              onChange={(event) => setForm({ ...form, descricao: event.target.value })}
              required
            />
          </Field>
          <Field label="Valor (R$)">
            <input
              className="field"
              type="number"
              min="0.01"
              step="0.01"
              value={form.valor}
              onChange={(event) => setForm({ ...form, valor: event.target.value })}
              required
            />
          </Field>
          <Field label="Competência">
            <input
              className="field"
              type="month"
              value={form.competencia}
              onChange={(event) => setForm({ ...form, competencia: event.target.value })}
              required
            />
          </Field>
          <Field label="Status">
            <select
              className="field"
              value={form.status}
              onChange={(event) => {
                const status = STATUS_PAGAMENTO.find((item) => item === event.target.value);
                if (status) setForm({ ...form, status });
              }}
            >
              {STATUS_PAGAMENTO.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          {form.tipo === "Receita" && (
            <Field label="Aluno / responsável (opcional)">
              <select
                className="field"
                value={form.alunoId}
                onChange={(event) => setForm({ ...form, alunoId: event.target.value })}
              >
                <option value="">Sem vínculo</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome} · {aluno.responsavel || "Sem responsável"}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="sm:col-span-2 flex gap-2">
            <PrimaryButton type="submit">
              {editandoId ? "Salvar alterações" : "Registrar lançamento"}
            </PrimaryButton>
            {editandoId && (
              <button
                type="button"
                className="rounded-xl border px-4 text-sm font-semibold"
                onClick={() => {
                  setEditandoId(null);
                  setForm({
                    tipo: "Receita",
                    descricao: "",
                    valor: "",
                    competencia: mesAtual(),
                    status: "Pendente",
                    alunoId: "",
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <section className="mt-5 space-y-2">
        <h2 className="font-bold">Mensalidades, taxas e lançamentos</h2>
        {lancamentosFinanceiros.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento financeiro registrado.
            </p>
          </Card>
        )}
        {lancamentosFinanceiros.map((item) => {
          const aluno = alunos.find((registro) => registro.id === item.alunoId);
          const responsavel = aluno
            ? responsaveis.find(
                (registro) =>
                  registro.id === aluno.responsavelId ||
                  (aluno.responsavelEmail &&
                    registro.email.toLowerCase() === aluno.responsavelEmail.toLowerCase()),
              )
            : undefined;
          return (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 !p-3">
              <div>
                <p className="font-semibold">
                  {item.descricao} · {fmtMoeda(item.valor)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.tipo} · {item.competencia}
                  {aluno && ` · ${aluno.nome}`}
                  {responsavel && ` · Resp.: ${responsavel.nome} (${responsavel.whatsapp})`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Editar lançamento ${item.descricao}`}
                  onClick={() => {
                    setEditandoId(item.id);
                    setForm({
                      tipo: item.tipo,
                      descricao: item.descricao,
                      valor: String(item.valor),
                      competencia: item.competencia,
                      status: item.status,
                      alunoId: item.alunoId ?? "",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <select
                  className="field !w-auto"
                  aria-label={`Status de ${item.descricao}`}
                  value={item.status}
                  onChange={(event) => mudarStatus(item.id, event.target.value)}
                >
                  {STATUS_PAGAMENTO.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                {item.tipo === "Receita" && item.status === "Pago" && item.alunoId && (
                  <button
                    type="button"
                    onClick={() => emitirRelatorio("recibo", item.id)}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    Recibo PDF
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="mt-5">
        <h2 className="font-bold">Relatórios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Imprima ou escolha “Salvar como PDF” no diálogo do navegador.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => emitirRelatorio("inadimplencia")}
            className="rounded-xl border px-3 py-3 text-sm font-semibold"
          >
            Relatório de inadimplência
          </button>
          <button
            type="button"
            onClick={() => emitirRelatorio("fluxo")}
            className="rounded-xl border px-3 py-3 text-sm font-semibold"
          >
            Extrato de fluxo de caixa
          </button>
        </div>
      </Card>

      <article className="relatorio-para-imprimir hidden">
        <h1>
          EEEP Luizete Albano de Freitas —{" "}
          {relatorio === "recibo" ? "Recibo de pagamento" : "Relatório financeiro"}
        </h1>
        <p>Emitido em {new Date().toLocaleString("pt-BR")}</p>
        {relatorio === "recibo" && movimentoRecibo ? (
          <>
            <h2>Recibo de pagamento</h2>
            <p>Recebemos referente a: {movimentoRecibo.descricao}</p>
            <p>Valor: {fmtMoeda(movimentoRecibo.valor)}</p>
            <p>Competência: {movimentoRecibo.competencia}</p>
            <p>Aluno: {alunos.find((aluno) => aluno.id === movimentoRecibo.alunoId)?.nome}</p>
            <p>
              Responsável:{" "}
              {alunos.find((aluno) => aluno.id === movimentoRecibo.alunoId)?.responsavel ||
                "Não cadastrado"}
            </p>
            <p>Status: {movimentoRecibo.status}</p>
            <p>________________________________________</p>
            <p>Assinatura / carimbo</p>
          </>
        ) : relatorio === "inadimplencia" ? (
          <>
            <h2>Relatório de inadimplência</h2>
            <p>Total em aberto: {fmtMoeda(resumo.pendencias)}</p>
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Responsável</th>
                  <th>Descrição</th>
                  <th>Competência</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {itensInadimplentes.map((item) => {
                  const aluno = alunos.find((registro) => registro.id === item.alunoId);
                  return (
                    <tr key={item.id}>
                      <td>{aluno?.nome ?? "—"}</td>
                      <td>{aluno?.responsavel || "—"}</td>
                      <td>{item.descricao}</td>
                      <td>{item.competencia}</td>
                      <td>{item.status}</td>
                      <td>{fmtMoeda(item.valor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h2>Extrato de fluxo de caixa</h2>
            <p>Receitas pagas: {fmtMoeda(resumo.recebidos)}</p>
            <p>Despesas pagas: {fmtMoeda(resumo.pagosDespesas)}</p>
            <p>Fluxo líquido: {fmtMoeda(resumo.fluxo)}</p>
            <table>
              <thead>
                <tr>
                  <th>Competência</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentosFinanceiros.map((item) => (
                  <tr key={item.id}>
                    <td>{item.competencia}</td>
                    <td>{item.tipo}</td>
                    <td>{item.descricao}</td>
                    <td>{item.status}</td>
                    <td>{fmtMoeda(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </article>
    </PageShell>
  );
}

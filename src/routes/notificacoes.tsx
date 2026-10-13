import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { Card, PageShell } from "@/components/AppShell";
import { fmtData, useStore } from "@/lib/store";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Histórico de ocorrências enviadas à direção e responsáveis.",
      },
      { property: "og:title", content: "Notificações — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Histórico de ocorrências enviadas à direção e responsáveis.",
      },
    ],
  }),
  component: Notificacoes,
});

function Notificacoes() {
  const { ocorrencias, alunos, accounts, responsaveis, user } = useStore();
  // Responsável só enxerga as ocorrências dos alunos vinculados a ele.
  const isResponsavel = user?.perfil === "Responsável";
  const emailConta = accounts.find((c) => c.id === user?.localAccountId)?.email;
  const meuId = responsaveis.find(
    (responsavel) => responsavel.email.toLowerCase() === emailConta?.toLowerCase(),
  )?.id;
  const idsDosFilhos = new Set(
    alunos
      .filter(
        (aluno) =>
          (meuId && aluno.responsavelId === meuId) ||
          (emailConta && aluno.responsavelEmail?.toLowerCase() === emailConta.toLowerCase()),
      )
      .map((aluno) => aluno.id),
  );
  const visiveis = isResponsavel
    ? ocorrencias.filter((o) => idsDosFilhos.has(o.alunoId))
    : ocorrencias;
  return (
    <PageShell
      title="Notificações"
      subtitle={isResponsavel ? "Ocorrências dos seus filhos" : "Ocorrências enviadas"}
    >
      <div className="space-y-2">
        {visiveis.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">Nenhuma ocorrência ainda.</p>
          </Card>
        )}
        {visiveis.map((o) => {
          const a = alunos.find((x) => x.id === o.alunoId);
          const elogio = o.tipo === "Elogio/Mérito";
          return (
            <Card key={o.id} className="flex gap-3 !p-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${elogio ? "bg-gold/20 text-gold-foreground" : "bg-primary-soft text-primary"}`}
              >
                <Megaphone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {a?.nome ?? "Aluno"}{" "}
                  <span className="text-xs font-medium text-muted-foreground">· {o.turma}</span>
                </p>
                <p className="text-sm">
                  <b className="text-primary">{o.tipo}</b>
                  {o.obs && ` — ${o.obs}`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {fmtData(o.data)} · Disponível para a Direção e o responsável
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

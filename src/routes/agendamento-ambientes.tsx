import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, Clock3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, PageShell } from "@/components/AppShell";
import { BLOCOS_HORARIOS, DIAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/agendamento-ambientes")({
  head: () => ({
    meta: [
      { title: "Agendamento de Ambientes — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Consulte horários livres e solicite laboratórios escolares.",
      },
    ],
  }),
  component: AgendamentoAmbientes,
});

const AMBIENTES = [
  "Laboratório de Informática",
  "Laboratório de Biologia",
  "Laboratório de Física",
  "Laboratório de Química",
] as const;
function AgendamentoAmbientes() {
  const { reservasAmbientes, set, user } = useStore();
  const [ambiente, setAmbiente] = useState<(typeof AMBIENTES)[number]>(AMBIENTES[0]);
  const [dia, setDia] = useState<(typeof DIAS)[number]>(DIAS[0]!);

  const solicitar = (periodo: number) => {
    const ocupada = reservasAmbientes.some(
      (reserva) =>
        reserva.ambiente === ambiente && reserva.dia === dia && reserva.periodo === periodo,
    );
    if (ocupada) {
      toast.error("Esse horário acabou de ser reservado. Atualize a disponibilidade.");
      return;
    }
    set((state) => ({
      ...state,
      reservasAmbientes: [
        ...state.reservasAmbientes,
        {
          id: uid(),
          ambiente,
          dia,
          periodo,
          solicitante: user?.nome ?? "Usuário",
          solicitanteEmail:
            state.accounts.find((account) => account.id === user?.localAccountId)?.email ?? "",
        },
      ],
    }));
    toast.success("Solicitação de agendamento registrada.");
  };

  return (
    <PageShell title="Agendamento de Ambientes" subtitle="Disponibilidade semanal dos laboratórios">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {AMBIENTES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAmbiente(item)}
            aria-pressed={ambiente === item}
            className={`min-h-16 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${ambiente === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5 overflow-x-auto rounded-2xl bg-card p-1.5 shadow-card">
        {DIAS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setDia(item)}
            aria-pressed={dia === item}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${dia === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {item.slice(0, 3)}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 font-bold">
          {ambiente} · {dia}
        </h2>
        <div className="space-y-2">
          {BLOCOS_HORARIOS.filter((bloco) => bloco.tipo === "aula").map((bloco) => {
            const periodo = bloco.periodo;
            const reserva = reservasAmbientes.find(
              (item) => item.ambiente === ambiente && item.dia === dia && item.periodo === periodo,
            );
            return (
              <div
                key={periodo}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
              >
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {periodo}º período · {bloco.horario}
                  </span>
                </div>
                {reserva ? (
                  <span className="text-right text-xs font-semibold text-destructive">
                    Ocupado
                    <br />
                    {reserva.solicitante}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitar(periodo)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <CalendarCheck2 className="h-4 w-4" />
                    Solicitar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Os horários reservados ficam visíveis para a equipe escolar; solicitações registradas
        bloqueiam o mesmo espaço, dia e período.
      </p>
    </PageShell>
  );
}

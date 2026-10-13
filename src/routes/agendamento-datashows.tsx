import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, Clock3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, PageShell } from "@/components/AppShell";
import { BLOCOS_HORARIOS, DIAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/agendamento-datashows")({
  head: () => ({
    meta: [
      { title: "Agendamento dos datashows — Gestão Escolar LAF" },
      { name: "description", content: "Consulte disponibilidade e reserve um datashow." },
    ],
  }),
  component: AgendamentoDatashows,
});

function AgendamentoDatashows() {
  const { reservasDatashows, set, user } = useStore();
  const [dia, setDia] = useState<(typeof DIAS)[number]>(DIAS[0]!);

  const solicitar = (periodo: number) => {
    if (reservasDatashows.some((reserva) => reserva.dia === dia && reserva.periodo === periodo)) {
      toast.error("Esse datashow já está reservado nesse horário.");
      return;
    }
    set((state) => ({
      ...state,
      reservasDatashows: [
        ...state.reservasDatashows,
        {
          id: uid(),
          dia,
          periodo,
          solicitante: user?.nome ?? "Usuário",
          solicitanteEmail:
            state.accounts.find((account) => account.id === user?.localAccountId)?.email ?? "",
        },
      ],
    }));
    toast.success("Agendamento do datashow registrado.");
  };

  return (
    <PageShell title="Agendamento dos datashows" subtitle="Disponibilidade semanal do equipamento">
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
        <h2 className="mb-3 font-bold">Datashow · {dia}</h2>
        <div className="space-y-2">
          {BLOCOS_HORARIOS.filter((bloco) => bloco.tipo === "aula").map((bloco) => {
            const reserva = reservasDatashows.find(
              (item) => item.dia === dia && item.periodo === bloco.periodo,
            );
            return (
              <div
                key={bloco.periodo}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
              >
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {bloco.periodo}º período · {bloco.horario}
                  </span>
                </div>
                {reserva ? (
                  <span className="text-right text-xs font-semibold text-destructive">
                    Reservado
                    <br />
                    {reserva.solicitante}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitar(bloco.periodo)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <CalendarCheck2 className="h-4 w-4" />
                    Reservar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        A reserva bloqueia o datashow para todos os usuários no mesmo dia e período.
      </p>
    </PageShell>
  );
}

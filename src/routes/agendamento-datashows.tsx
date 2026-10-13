import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, Clock3, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell } from "@/components/AppShell";
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

const LABORATORIOS_DATASHOW = [
  "Laboratório de Linguagens",
  "Laboratório de Ciências da Natureza",
  "Laboratório de Humanas",
  "Laboratório de Matemática",
] as const;

function AgendamentoDatashows() {
  const { reservasDatashows, set, user, accounts, professores } = useStore();
  const [dia, setDia] = useState<(typeof DIAS)[number]>(DIAS[0]!);
  const [ambiente, setAmbiente] = useState<(typeof LABORATORIOS_DATASHOW)[number]>(
    LABORATORIOS_DATASHOW[0],
  );
  const emailUsuario = accounts.find((account) => account.id === user?.localAccountId)?.email ?? "";
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario.toLowerCase(),
  );
  const opcoesProfessor =
    professorAtual || !user
      ? professores
      : [
          ...professores,
          {
            id: "usuario-atual",
            nome: user.nome,
            email: emailUsuario,
            disciplina: "",
            turmas: [],
            dt: false,
          },
        ];
  const [professorResponsavel, setProfessorResponsavel] = useState(
    () => professorAtual?.id ?? (user ? "usuario-atual" : (professores[0]?.id ?? "")),
  );

  const solicitar = (periodo: number) => {
    if (reservasDatashows.some((reserva) => reserva.dia === dia && reserva.periodo === periodo)) {
      toast.error("Esse datashow já está reservado nesse horário.");
      return;
    }
    const professor = opcoesProfessor.find((item) => item.id === professorResponsavel);
    if (!professor) {
      toast.error("Selecione o professor responsável pelo agendamento.");
      return;
    }
    set((state) => ({
      ...state,
      reservasDatashows: [
        ...state.reservasDatashows,
        {
          id: uid(),
          ambiente,
          dia,
          periodo,
          solicitante: user?.nome ?? "Usuário",
          solicitanteEmail: emailUsuario,
          professorResponsavel: professor.nome,
          professorEmail: professor.email,
        },
      ],
    }));
    toast.success("Agendamento do datashow registrado.");
  };

  const cancelar = (id: string) => {
    set((state) => ({
      ...state,
      reservasDatashows: state.reservasDatashows.filter((reserva) => reserva.id !== id),
    }));
    toast.success("Reserva do datashow cancelada.");
  };

  const podeCancelar = (reserva: (typeof reservasDatashows)[number]) =>
    user?.perfil === "Administrador" ||
    Boolean(
      emailUsuario &&
      [reserva.solicitanteEmail, reserva.professorEmail].some(
        (email) => email?.toLowerCase() === emailUsuario.toLowerCase(),
      ),
    );

  return (
    <PageShell title="Agendamento dos datashows" subtitle="Disponibilidade semanal do equipamento">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LABORATORIOS_DATASHOW.map((item) => (
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
      <Card className="mt-3">
        <Label>Professor responsável</Label>
        <select
          className="field"
          value={professorResponsavel}
          onChange={(event) => setProfessorResponsavel(event.target.value)}
          disabled={opcoesProfessor.length === 0}
        >
          {opcoesProfessor.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.nome}
            </option>
          ))}
        </select>
      </Card>
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
                  <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                    <span className="text-xs font-semibold text-destructive">
                      Reservado · {reserva.ambiente ?? "Local não informado"}
                      <br />
                      {reserva.professorResponsavel ?? reserva.solicitante}
                    </span>
                    {podeCancelar(reserva) && (
                      <button
                        type="button"
                        onClick={() => cancelar(reserva.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                        Cancelar Agendamento
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitar(bloco.periodo)}
                    disabled={!professorResponsavel}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <CalendarCheck2 className="h-4 w-4" />
                    Agendar
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

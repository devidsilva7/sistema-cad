import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, Clock3, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell } from "@/components/AppShell";
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
  const { reservasAmbientes, set, user, accounts, professores } = useStore();
  const [ambiente, setAmbiente] = useState<(typeof AMBIENTES)[number]>(AMBIENTES[0]);
  const [dia, setDia] = useState<(typeof DIAS)[number]>(DIAS[0]!);
  const emailUsuario =
    accounts.find((account) => account.id === user?.localAccountId)?.email?.toLowerCase() ?? "";
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario,
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
    const professor = opcoesProfessor.find((item) => item.id === professorResponsavel);
    if (!professor) {
      toast.error("Selecione o professor responsável pelo agendamento.");
      return;
    }
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
          professorResponsavel: professor.nome,
          professorEmail: professor.email,
        },
      ],
    }));
    toast.success("Solicitação de agendamento registrada.");
  };

  const cancelar = (id: string) => {
    set((state) => ({
      ...state,
      reservasAmbientes: state.reservasAmbientes.filter((reserva) => reserva.id !== id),
    }));
    toast.success("Agendamento do ambiente cancelado.");
  };

  const podeCancelar = (reserva: (typeof reservasAmbientes)[number]) =>
    user?.perfil === "Administrador" ||
    Boolean(
      emailUsuario &&
      [reserva.solicitanteEmail, reserva.professorEmail].some(
        (email) => email?.toLowerCase() === emailUsuario,
      ),
    );

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
                  <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                    <span className="text-xs font-semibold text-destructive">
                      Ocupado
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
                    onClick={() => solicitar(periodo)}
                    disabled={!professorResponsavel}
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

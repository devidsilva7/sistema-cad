import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Field, PageShell, PrimaryButton } from "@/components/AppShell";
import { DIAS, TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horários Escolares — Gestão Escolar LAF" },
      { name: "description", content: "Grade semanal de aulas por turma e professor." },
    ],
  }),
  component: Horarios,
});

const PERIODOS = [
  "07:00 – 07:50",
  "07:50 – 08:40",
  "08:40 – 09:30",
  "09:50 – 10:40",
  "10:40 – 11:30",
  "11:30 – 12:20",
];

function Horarios() {
  const { accounts, aulasHorario, professores, set, user } = useStore();
  const isAdmin = user?.perfil === "Administrador";
  const emailUsuario = accounts.find((account) => account.id === user?.localAccountId)?.email;
  const gradeVisivel =
    user?.perfil === "Professor" || user?.perfil === "Diretor de Turma"
      ? aulasHorario.filter(
          (aula) => aula.professorEmail.toLowerCase() === emailUsuario?.toLowerCase(),
        )
      : aulasHorario;
  const [dia, setDia] = useState<(typeof DIAS)[number]>(DIAS[0]!);
  const [periodo, setPeriodo] = useState(1);
  const [professorEmail, setProfessorEmail] = useState("");
  const [turma, setTurma] = useState(TURMAS[0]!);
  const [disciplina, setDisciplina] = useState("");

  const adicionarAula = () => {
    if (!professorEmail || !disciplina.trim()) {
      toast.error("Selecione o professor e informe a disciplina.");
      return;
    }
    set((state) => ({
      ...state,
      aulasHorario: [
        ...state.aulasHorario,
        { id: uid(), dia, periodo, turma, disciplina: disciplina.trim(), professorEmail },
      ],
    }));
    setDisciplina("");
    toast.success("Aula adicionada à grade semanal.");
  };

  const professorPorEmail = (email: string) =>
    professores.find((professor) => professor.email.toLowerCase() === email.toLowerCase());

  return (
    <PageShell
      title="Horários Escolares"
      subtitle={
        user?.perfil === "Professor" || user?.perfil === "Diretor de Turma"
          ? "Sua grade semanal de aulas"
          : "Grade geral por dia e período"
      }
    >
      {isAdmin && professores.length > 0 && (
        <Card className="mb-4 space-y-3">
          <h2 className="font-bold">Adicionar aula à grade</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dia">
              <select
                className="field"
                value={dia}
                onChange={(event) => setDia(event.target.value as typeof dia)}
              >
                {DIAS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Período">
              <select
                className="field"
                value={periodo}
                onChange={(event) => setPeriodo(Number(event.target.value))}
              >
                {PERIODOS.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {index + 1}º · {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Professor">
              <select
                className="field"
                value={professorEmail}
                onChange={(event) => setProfessorEmail(event.target.value)}
              >
                <option value="">Selecione</option>
                {professores.map((professor) => (
                  <option key={professor.id} value={professor.email}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Turma">
              <select
                className="field"
                value={turma}
                onChange={(event) => setTurma(event.target.value)}
              >
                {TURMAS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Disciplina">
              <input
                className="field"
                value={disciplina}
                onChange={(event) => setDisciplina(event.target.value)}
              />
            </Field>
          </div>
          <PrimaryButton onClick={adicionarAula}>
            <span className="inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar aula
            </span>
          </PrimaryButton>
        </Card>
      )}

      <div className="space-y-3">
        {DIAS.map((diaSemana) => {
          const aulasDoDia = gradeVisivel.filter((aula) => aula.dia === diaSemana);
          return (
            <Card key={diaSemana} className="!p-3">
              <h2 className="mb-2 flex items-center gap-2 font-bold">
                <CalendarClock className="h-4 w-4 text-primary" />
                {diaSemana}
              </h2>
              <div className="space-y-2">
                {PERIODOS.map((horario, index) => {
                  const periodoAulas = aulasDoDia.filter((aula) => aula.periodo === index + 1);
                  return (
                    <div
                      key={horario}
                      className="grid grid-cols-[7rem_1fr] gap-2 border-t border-border/60 pt-2"
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        {index + 1}º · {horario}
                      </p>
                      <div className="space-y-1">
                        {periodoAulas.map((aula) => {
                          const professor = professorPorEmail(aula.professorEmail);
                          return (
                            <div
                              key={aula.id}
                              className="flex items-start justify-between gap-2 rounded-lg bg-primary-soft/60 px-2.5 py-2 text-xs"
                            >
                              <p>
                                <b>{aula.turma}</b> · {aula.disciplina}
                                <br />
                                <span className="text-muted-foreground">
                                  {professor?.nome ?? aula.professorEmail}
                                </span>
                              </p>
                              {isAdmin && (
                                <button
                                  type="button"
                                  aria-label={`Remover aula de ${aula.disciplina}`}
                                  onClick={() =>
                                    set((state) => ({
                                      ...state,
                                      aulasHorario: state.aulasHorario.filter(
                                        (item) => item.id !== aula.id,
                                      ),
                                    }))
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {periodoAulas.length === 0 && (
                          <p className="text-xs text-muted-foreground">Sem aulas cadastradas</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      {!isAdmin &&
        (user?.perfil === "Professor" || user?.perfil === "Diretor de Turma") &&
        gradeVisivel.length === 0 && (
          <Card className="mt-3">
            <p className="text-sm text-muted-foreground">
              Ainda não há aulas associadas à sua conta. A grade é vinculada ao e-mail cadastrado no
              perfil do professor.
            </p>
          </Card>
        )}
    </PageShell>
  );
}

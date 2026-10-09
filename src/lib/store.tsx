import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Aluno = { id: string; nome: string; turma: string; matricula: string; responsavel: string; whatsapp: string };
export type Professor = { id: string; nome: string; disciplina: string; turmas: string[]; dt: boolean };
export type Ocorrencia = { id: string; alunoId: string; turma: string; tipo: string; obs: string; data: string };
export type Comunicado = { id: string; titulo: string; mensagem: string; publico: string; data: string };
export type Dia = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
export type Refeicoes = { manha: string; almoco: string; tarde: string };
export type User = { nome: string; perfil: string };

export const TURMAS = ["1º Informática", "1º Enfermagem", "2º Informática", "2º Administração", "3º Informática", "3º Enfermagem"];
export const DIAS: Dia[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const PERFIS = ["Diretor de Turma", "Professor", "Direção", "Aluno", "Responsável"];

const seed = {
  alunos: [
    { id: "a1", nome: "Ana Beatriz Lima", turma: "1º Informática", matricula: "2026001", responsavel: "Maria Lima", whatsapp: "(85) 98811-2233" },
    { id: "a2", nome: "Carlos Eduardo Sousa", turma: "1º Informática", matricula: "2026002", responsavel: "José Sousa", whatsapp: "(85) 98722-1144" },
    { id: "a3", nome: "Francisca Rayane Alves", turma: "2º Administração", matricula: "2025014", responsavel: "Antônia Alves", whatsapp: "(85) 99633-7788" },
    { id: "a4", nome: "João Pedro Freitas", turma: "3º Informática", matricula: "2024031", responsavel: "Raimundo Freitas", whatsapp: "(85) 98544-9900" },
    { id: "a5", nome: "Larissa Menezes", turma: "1º Enfermagem", matricula: "2026019", responsavel: "Cláudia Menezes", whatsapp: "(85) 99155-3322" },
    { id: "a6", nome: "Mateus Oliveira", turma: "2º Informática", matricula: "2025007", responsavel: "Paulo Oliveira", whatsapp: "(85) 98266-4455" },
  ] as Aluno[],
  professores: [
    { id: "p1", nome: "Prof. Ricardo Nogueira", disciplina: "Matemática", turmas: ["1º Informática", "2º Informática"], dt: true },
    { id: "p2", nome: "Profª. Helena Castro", disciplina: "Língua Portuguesa", turmas: ["1º Enfermagem", "3º Enfermagem"], dt: true },
    { id: "p3", nome: "Prof. Marcos Vieira", disciplina: "Programação Web", turmas: ["2º Informática", "3º Informática"], dt: false },
  ] as Professor[],
  ocorrencias: [
    { id: "o1", alunoId: "a2", turma: "1º Informática", tipo: "Fardamento", obs: "Sem fardamento adequado", data: "2026-10-08T09:12:00" },
    { id: "o2", alunoId: "a4", turma: "3º Informática", tipo: "Elogio/Mérito", obs: "Excelente desempenho no projeto integrador", data: "2026-10-07T14:30:00" },
  ] as Ocorrencia[],
  comunicados: [
    { id: "c1", titulo: "Reunião de Pais e Mestres", mensagem: "Sábado, 17/10, às 8h no auditório.", publico: "Responsáveis", data: "2026-10-06T10:00:00" },
    { id: "c2", titulo: "Semana Científica", mensagem: "Inscrições abertas até 20/10 com o DT da turma.", publico: "Todos", data: "2026-10-05T08:00:00" },
  ] as Comunicado[],
  cardapio: {
    Segunda: { manha: "Cuscuz com ovo e suco de caju", almoco: "Arroz, feijão, frango assado e salada", tarde: "Bolo de milho e leite" },
    Terça: { manha: "Pão com queijo e café com leite", almoco: "Baião de dois com carne moída", tarde: "Frutas da estação" },
    Quarta: { manha: "Tapioca com manteiga e suco de goiaba", almoco: "Macarrão à bolonhesa e salada", tarde: "Biscoito e iogurte" },
    Quinta: { manha: "Mingau de aveia", almoco: "Arroz, feijão verde e peixe ao molho", tarde: "Sanduíche natural" },
    Sexta: { manha: "Pão com ovo e suco de acerola", almoco: "Galinhada com legumes", tarde: "Salada de frutas" },
  } as Record<Dia, Refeicoes>,
};

type State = typeof seed & { user: User | null };
type Ctx = State & { set: (fn: (s: State) => State) => void };
const StoreCtx = createContext<Ctx | null>(null);
const KEY = "laf-gestao-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ...seed, user: null });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);
  return <StoreCtx.Provider value={{ ...state, set: setState }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
export const fmtData = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

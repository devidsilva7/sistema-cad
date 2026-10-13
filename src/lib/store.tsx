import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearLocalAccountSession,
  getLocalAccountSession,
  type LocalAccount,
} from "@/lib/local-accounts";

export type Aluno = {
  id: string;
  nome: string;
  email: string;
  turma: string;
  matricula: string;
  responsavel: string;
  responsavelEmail?: string;
  whatsapp: string;
  responsavelId?: string | undefined;
};
export type Responsavel = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  parentesco: string;
};
export type AreaConhecimento = (typeof AREAS_CONHECIMENTO)[number];
export type Professor = {
  id: string;
  nome: string;
  email: string;
  disciplina: string;
  area?: AreaConhecimento;
  turmas: string[];
  dt: boolean;
};
export type Ocorrencia = {
  id: string;
  alunoId: string;
  turma: string;
  tipo: string;
  obs: string;
  data: string;
  registradoPor?: string;
};
export type AulaHorario = {
  id: string;
  dia: Dia;
  periodo: number;
  turma: string;
  disciplina: string;
  professorEmail: string;
};
export type ReservaAmbiente = {
  id: string;
  ambiente: string;
  dia: Dia;
  periodo: number;
  solicitante: string;
  solicitanteEmail: string;
};
export type ReservaDatashow = {
  id: string;
  dia: Dia;
  periodo: number;
  solicitante: string;
  solicitanteEmail: string;
};
export type Funcionario = {
  id: string;
  accountId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cargo: string;
  perfil: "Secretaria" | "Financeiro";
  ativo: boolean;
};
export type SolicitacaoDocumento = {
  id: string;
  alunoId: string;
  tipo:
    | "Declaração de frequência"
    | "Comprovante de matrícula"
    | "Histórico escolar"
    | "Ficha do aluno";
  status: "Solicitado" | "Em andamento" | "Concluído" | "Entregue";
  criadaEm: string;
};
export type LancamentoFinanceiro = {
  id: string;
  tipo: "Receita" | "Despesa";
  descricao: string;
  valor: number;
  competencia: string;
  status: "Pago" | "Pendente" | "Atrasado";
  alunoId?: string;
  criadaEm: string;
};
export type Comunicado = {
  id: string;
  titulo: string;
  mensagem: string;
  publico: string;
  data: string;
};
export type Dia = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
export type Refeicoes = { manha: string; almoco: string; tarde: string };
export const PERFIS = [
  "Administrador",
  "Diretor",
  "Coordenador",
  "Professor",
  "Diretor de Turma",
  "Aluno",
  "Responsável",
  "Secretaria",
  "Financeiro",
] as const;
export type Perfil = (typeof PERFIS)[number];
export type User = { nome: string; perfil: Perfil; localAccountId?: string };

export const TURMAS = [
  "1º Informática",
  "2º Informática",
  "3º Informática",
  "1º Administração",
  "2º Administração",
  "3º Administração",
  "1º Meio Ambiente",
  "2º Meio Ambiente",
  "3º Meio Ambiente",
  "1º Enfermagem",
  "3º Enfermagem",
];
export const AREAS_CONHECIMENTO = ["Linguagens", "Matemática", "Humanas", "Natureza"] as const;
export const PERIODOS_AULA = [
  "07:30 – 08:20",
  "08:20 – 09:10",
  "09:30 – 10:20",
  "10:20 – 11:10",
  "11:10 – 12:00",
  "13:00 – 13:50",
  "13:50 – 14:40",
  "15:00 – 15:50",
  "15:50 – 16:40",
];
export const BLOCOS_HORARIOS: (
  | { tipo: "aula"; periodo: number; horario: string }
  | { tipo: "intervalo" | "almoco"; horario: string }
)[] = [
  { tipo: "aula", periodo: 1, horario: "07:30 – 08:20" },
  { tipo: "aula", periodo: 2, horario: "08:20 – 09:10" },
  { tipo: "intervalo", horario: "09:10 – 09:30" },
  { tipo: "aula", periodo: 3, horario: "09:30 – 10:20" },
  { tipo: "aula", periodo: 4, horario: "10:20 – 11:10" },
  { tipo: "aula", periodo: 5, horario: "11:10 – 12:00" },
  { tipo: "almoco", horario: "12:00 – 13:00" },
  { tipo: "aula", periodo: 6, horario: "13:00 – 13:50" },
  { tipo: "aula", periodo: 7, horario: "13:50 – 14:40" },
  { tipo: "intervalo", horario: "14:40 – 15:00" },
  { tipo: "aula", periodo: 8, horario: "15:00 – 15:50" },
  { tipo: "aula", periodo: 9, horario: "15:50 – 16:40" },
];
export const DIAS: Dia[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const PARENTESCOS = ["Mãe", "Pai", "Avó/Avô", "Tio/Tia", "Outro"];
export const ADMIN_ONLY_ROUTES = ["/alunos", "/responsaveis", "/configuracoes", "/equipe"] as const;
export const SECRETARIA_ROUTES = [
  "/dashboard",
  "/secretaria",
  "/alunos",
  "/responsaveis",
  "/cardapio",
  "/ocorrencias",
  "/notificacoes",
  "/perfil",
] as const;
export const FINANCEIRO_ROUTES = ["/dashboard", "/financeiro", "/perfil"] as const;
export const STAFF_ROUTES = [
  "/dashboard",
  "/agenda",
  "/ocorrencias",
  "/cardapio",
  "/comunicados",
  "/horarios",
  "/agendamento-ambientes",
  "/agendamento-datashows",
  "/perfil",
] as const;
export const MANAGEMENT_ROUTES = [
  "/dashboard",
  "/ocorrencias",
  "/professores",
  "/cardapio",
  "/horarios",
  "/agendamento-ambientes",
  "/agendamento-datashows",
  "/secretaria",
  "/financeiro",
  "/perfil",
] as const;
export const COORDINATOR_ROUTES = [
  ...MANAGEMENT_ROUTES,
  "/agenda",
  "/comunicados",
  "/notificacoes",
] as const;
export const TEACHER_ROUTES = [...STAFF_ROUTES, "/alunos", "/responsaveis"] as const;
export const ALUNO_ALLOWED_ROUTES = [
  "/dashboard",
  "/agenda",
  "/cardapio",
  "/comunicados",
  "/perfil",
] as const;

export const RESPONSAVEL_ALLOWED_ROUTES = [
  "/dashboard",
  "/agenda",
  "/cardapio",
  "/comunicados",
  "/notificacoes",
  "/perfil",
] as const;

export function isPerfilFinanceiro(perfil: string | undefined) {
  return perfil === "Financeiro";
}

export function isPerfilSecretaria(perfil: string | undefined) {
  return perfil === "Secretaria";
}

export function sincronizarVinculosResponsaveis(alunos: Aluno[], responsaveis: Responsavel[]) {
  return alunos.map((aluno) => {
    const emailAluno = aluno.responsavelEmail?.trim().toLowerCase();
    const responsavel = responsaveis.find(
      (item) =>
        item.id === aluno.responsavelId ||
        (emailAluno && item.email.trim().toLowerCase() === emailAluno),
    );
    return responsavel
      ? {
          ...aluno,
          responsavelId: responsavel.id,
          responsavel: responsavel.nome,
          responsavelEmail: responsavel.email,
          whatsapp: responsavel.whatsapp,
        }
      : aluno;
  });
}

export function canAccessRoute(perfil: string | undefined, pathname: string) {
  if (perfil === "Administrador") return true;
  if (perfil === "Diretor") return MANAGEMENT_ROUTES.some((route) => route === pathname);
  if (perfil === "Coordenador") return COORDINATOR_ROUTES.some((route) => route === pathname);
  if (perfil === "Aluno") return ALUNO_ALLOWED_ROUTES.some((route) => route === pathname);
  if (perfil === "Responsável") {
    return RESPONSAVEL_ALLOWED_ROUTES.some((route) => route === pathname);
  }
  if (isPerfilSecretaria(perfil)) {
    return SECRETARIA_ROUTES.some((route) => route === pathname);
  }
  if (isPerfilFinanceiro(perfil)) {
    return FINANCEIRO_ROUTES.some((route) => route === pathname);
  }
  if (perfil === "Professor" || perfil === "Diretor de Turma") {
    return TEACHER_ROUTES.some((route) => route === pathname);
  }
  if (ADMIN_ONLY_ROUTES.some((route) => route === pathname)) return false;
  return false;
}

const seed = {
  alunos: [] as Aluno[],
  professores: [] as Professor[],
  responsaveis: [] as Responsavel[],
  accounts: [] as LocalAccount[],
  ocorrencias: [] as Ocorrencia[],
  aulasHorario: [] as AulaHorario[],
  reservasAmbientes: [] as ReservaAmbiente[],
  reservasDatashows: [] as ReservaDatashow[],
  funcionarios: [] as Funcionario[],
  solicitacoesDocumentos: [] as SolicitacaoDocumento[],
  lancamentosFinanceiros: [] as LancamentoFinanceiro[],
  comunicados: [] as Comunicado[],
  cardapio: {
    Segunda: {
      manha: "Cuscuz com ovo e suco de caju",
      almoco: "Arroz, feijão, frango assado e salada",
      tarde: "Bolo de milho e leite",
    },
    Terça: {
      manha: "Pão com queijo e café com leite",
      almoco: "Baião de dois com carne moída",
      tarde: "Frutas da estação",
    },
    Quarta: {
      manha: "Tapioca com manteiga e suco de goiaba",
      almoco: "Macarrão à bolonhesa e salada",
      tarde: "Biscoito e iogurte",
    },
    Quinta: {
      manha: "Mingau de aveia",
      almoco: "Arroz, feijão verde e peixe ao molho",
      tarde: "Sanduíche natural",
    },
    Sexta: {
      manha: "Pão com ovo e suco de acerola",
      almoco: "Galinhada com legumes",
      tarde: "Salada de frutas",
    },
  } as Record<Dia, Refeicoes>,
};

type State = typeof seed & { user: User | null };
type Ctx = State & { authReady: boolean; set: (fn: (s: State) => State) => void };
const StoreCtx = createContext<Ctx | null>(null);
const KEY = "laf-gestao-v2";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ...seed, user: null });
  const [loaded, setLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    let active = true;
    const initialize = async () => {
      let savedState: State = { ...seed, user: null };
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<State>;
          savedState = { ...seed, ...saved, user: null };
          savedState.alunos = sincronizarVinculosResponsaveis(
            savedState.alunos,
            savedState.responsaveis,
          );
          if (active) setState(savedState);
        }
      } catch (error) {
        console.error("Falha ao carregar os dados salvos do sistema.", error);
      } finally {
        if (active) setLoaded(true);
      }

      try {
        const { getAdminSession } = await import("@/lib/admin-auth");
        const session = await getAdminSession();
        if (active && session) {
          setState((current) => ({
            ...current,
            user: { nome: session.nome, perfil: "Administrador" },
          }));
        } else if (active) {
          const accountId = getLocalAccountSession();
          const localAccount = accountId
            ? savedState.accounts.find((account) => account.id === accountId)
            : undefined;
          if (localAccount && localAccount.ativo !== false && !localAccount.mustChangePassword) {
            setState((current) => ({
              ...current,
              user: {
                nome: localAccount.nome,
                perfil: localAccount.perfil,
                localAccountId: localAccount.id,
              },
            }));
          } else {
            clearLocalAccountSession();
          }
        }
      } catch (error) {
        console.error("Falha ao verificar a sessão do administrador.", error);
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ ...state, user: null }));
  }, [state, loaded]);
  return (
    <StoreCtx.Provider value={{ ...state, authReady, set: setState }}>{children}</StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
export const fmtData = (d: string) =>
  new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

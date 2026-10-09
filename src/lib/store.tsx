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
};
export type Professor = {
  id: string;
  nome: string;
  email: string;
  disciplina: string;
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
export const PERFIS = ["Administrador", "Professor", "Diretor de Turma", "Aluno"] as const;
export type Perfil = (typeof PERFIS)[number];
export type User = { nome: string; perfil: Perfil; localAccountId?: string };

export const TURMAS = [
  "1º Informática",
  "1º Enfermagem",
  "2º Informática",
  "2º Administração",
  "3º Informática",
  "3º Enfermagem",
];
export const DIAS: Dia[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const ADMIN_ONLY_ROUTES = ["/alunos", "/professores", "/configuracoes"] as const;
export const STAFF_ROUTES = [
  "/dashboard",
  "/agenda",
  "/ocorrencias",
  "/cardapio",
  "/comunicados",
  "/notificacoes",
  "/perfil",
] as const;
export const ALUNO_ALLOWED_ROUTES = [
  "/dashboard",
  "/agenda",
  "/cardapio",
  "/comunicados",
  "/perfil",
] as const;

export function canAccessRoute(perfil: string | undefined, pathname: string) {
  if (perfil === "Administrador") return true;
  if (ADMIN_ONLY_ROUTES.some((route) => route === pathname)) return false;
  if (perfil === "Aluno") return ALUNO_ALLOWED_ROUTES.some((route) => route === pathname);
  if (perfil === "Professor" || perfil === "Diretor de Turma") {
    return STAFF_ROUTES.some((route) => route === pathname);
  }
  return false;
}

const seed = {
  alunos: [] as Aluno[],
  professores: [] as Professor[],
  accounts: [] as LocalAccount[],
  ocorrencias: [] as Ocorrencia[],
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
          if (localAccount && !localAccount.mustChangePassword) {
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

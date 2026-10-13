import type { Aluno, Professor, Responsavel } from "./store";
import type { LocalAccount } from "./local-accounts";

type Dados = {
  accounts: LocalAccount[];
  alunos: Aluno[];
  professores: Professor[];
  responsaveis: Responsavel[];
};

type Exclusions = {
  accountId?: string | undefined;
  alunoId?: string | undefined;
  professorId?: string | undefined;
  responsavelId?: string | undefined;
};

const norm = (valor: string | undefined) => (valor ?? "").trim().toLowerCase();

/** Retorna true se o e-mail já pertence a alguma conta ou cadastro. */
export function emailEmUso(dados: Dados, email: string, excluir: Exclusions = {}) {
  const alvo = norm(email);
  if (!alvo) return false;
  return (
    dados.accounts.some((a) => a.id !== excluir.accountId && norm(a.email) === alvo) ||
    dados.alunos.some((a) => a.id !== excluir.alunoId && norm(a.email) === alvo) ||
    dados.professores.some((p) => p.id !== excluir.professorId && norm(p.email) === alvo) ||
    dados.responsaveis.some((r) => r.id !== excluir.responsavelId && norm(r.email) === alvo)
  );
}

export function usernameEmUso(dados: Dados, username: string, excluirAccountId?: string) {
  const alvo = norm(username);
  return (
    alvo === "admin" ||
    dados.accounts.some((a) => a.id !== excluirAccountId && norm(a.username) === alvo)
  );
}

/** Sugere um nome de usuário a partir do e-mail (parte antes do @). */
export function usernameDoEmail(email: string) {
  return (
    norm(email)
      .split("@")[0]
      ?.replace(/[^a-z0-9._-]/g, "") ?? ""
  );
}

/** Senha temporária de 8 caracteres, sem letras/números que se confundem (0/O, 1/l). */
export function senhaTemporaria() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Máscara de telefone brasileiro: (85) 99999-9999 */
export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

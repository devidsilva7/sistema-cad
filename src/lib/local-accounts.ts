export type LocalAccountProfile = "Professor" | "Diretor de Turma" | "Aluno";

export type LocalAccount = {
  id: string;
  email: string;
  username: string;
  nome: string;
  perfil: LocalAccountProfile;
  passwordSalt: string;
  passwordHash: string;
  mustChangePassword: boolean;
};

const PASSWORD_ITERATIONS = 120_000;
const LOCAL_SESSION_KEY = "laf-local-account-session";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    keyMaterial,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export async function createLocalAccount(
  email: string,
  username: string,
  nome: string,
  perfil: LocalAccountProfile,
  password: string,
  mustChangePassword = false,
) {
  if (!password) {
    throw new Error("A senha inicial da conta é obrigatória.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account: LocalAccount = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    username: username.trim().toLowerCase(),
    nome: nome.trim(),
    perfil,
    passwordSalt: toHex(salt),
    passwordHash: await hashPassword(password, salt),
    mustChangePassword,
  };

  return account;
}

export async function authenticateLocalAccount(
  accounts: LocalAccount[],
  email: string,
  username: string,
  password: string,
  perfil: LocalAccountProfile,
) {
  const account = accounts.find(
    (entry) =>
      entry.email === email.trim().toLowerCase() &&
      entry.username === username.trim().toLowerCase() &&
      entry.perfil === perfil,
  );
  if (!account) return null;

  const salt = Uint8Array.from(
    account.passwordSalt.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  );
  const candidateHash = await hashPassword(password, salt);
  return candidateHash === account.passwordHash ? account : null;
}

export async function updateLocalAccountPassword(account: LocalAccount, password: string) {
  if (password.length < 8) {
    throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    ...account,
    passwordSalt: toHex(salt),
    passwordHash: await hashPassword(password, salt),
    mustChangePassword: false,
  };
}

export function setLocalAccountSession(accountId: string) {
  sessionStorage.setItem(LOCAL_SESSION_KEY, accountId);
}

export function getLocalAccountSession() {
  return sessionStorage.getItem(LOCAL_SESSION_KEY);
}

export function clearLocalAccountSession() {
  sessionStorage.removeItem(LOCAL_SESSION_KEY);
}

import { describe, expect, it } from "vitest";
import { emailEmUso, usernameEmUso } from "@/lib/cadastros";

const account = {
  id: "account-1",
  email: "person@example.test",
  username: "person",
  nome: "Pessoa",
  perfil: "Professor" as const,
  passwordSalt: "",
  passwordHash: "",
  mustChangePassword: false,
};

describe("registration uniqueness validation", () => {
  const store = {
    accounts: [account],
    alunos: [],
    professores: [{ id: "professor-1", nome: "Pessoa", email: account.email }],
    responsaveis: [],
  };

  it("ignores the record being edited while checking email uniqueness", () => {
    expect(
      emailEmUso(store, account.email, {
        accountId: account.id,
        professorId: "professor-1",
      }),
    ).toBe(false);
    expect(emailEmUso(store, account.email)).toBe(true);
  });

  it("ignores the account being edited while checking username uniqueness", () => {
    expect(usernameEmUso(store, account.username, account.id)).toBe(false);
    expect(usernameEmUso(store, account.username)).toBe(true);
  });
});

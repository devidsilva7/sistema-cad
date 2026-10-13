import { describe, expect, it } from "vitest";
import { canAccessRoute } from "@/lib/store";
import {
  authenticateLocalAccount,
  clearLocalAccountSession,
  createLocalAccount,
  getLocalAccountSession,
  setLocalAccountSession,
} from "@/lib/local-accounts";

describe("local account registration and login", () => {
  it("logs in immediately with administrator-defined credentials and profile", async () => {
    const account = await createLocalAccount(
      "  PROFESSOR@school.test ",
      "  Maria.Silva ",
      "Maria Silva",
      "Professor",
      "SenhaSegura123",
    );

    expect(account.email).toBe("professor@school.test");
    expect(account.username).toBe("maria.silva");
    expect(account.perfil).toBe("Professor");
    expect(account.mustChangePassword).toBe(false);

    const authenticated = await authenticateLocalAccount(
      [account],
      "PROFESSOR@school.test",
      "MARIA.SILVA",
      "SenhaSegura123",
      "Professor",
    );

    expect(authenticated?.id).toBe(account.id);
    expect(authenticated?.perfil).toBe("Professor");
    expect(canAccessRoute(authenticated?.perfil, "/horarios")).toBe(true);
    expect(
      await authenticateLocalAccount(
        [account],
        account.email,
        account.username,
        "senha-incorreta",
        "Professor",
      ),
    ).toBeNull();
    expect(
      await authenticateLocalAccount(
        [account],
        account.email,
        account.username,
        "SenhaSegura123",
        "Coordenador",
      ),
    ).toBeNull();
  });

  it("sets and clears the local login session", () => {
    setLocalAccountSession("account-id");
    expect(getLocalAccountSession()).toBe("account-id");

    clearLocalAccountSession();
    expect(getLocalAccountSession()).toBeNull();
  });

  it("authenticates every local profile and preserves each profile's route access", async () => {
    const profiles = [
      { perfil: "Aluno" as const, route: "/agenda" },
      { perfil: "Responsável" as const, route: "/notificacoes" },
      { perfil: "Professor" as const, route: "/horarios" },
      { perfil: "Diretor de Turma" as const, route: "/ocorrencias" },
      { perfil: "Diretor" as const, route: "/agendamento-ambientes" },
      { perfil: "Coordenador" as const, route: "/notificacoes" },
      { perfil: "Secretaria" as const, route: "/secretaria" },
      { perfil: "Financeiro" as const, route: "/financeiro" },
    ];

    for (const { perfil, route } of profiles) {
      const account = await createLocalAccount(
        `${perfil.replaceAll(" ", ".")}@school.test`,
        `user.${perfil.toLowerCase().replaceAll(" ", ".")}`,
        `Pessoa ${perfil}`,
        perfil,
        "SenhaSegura123",
      );
      const authenticated = await authenticateLocalAccount(
        [account],
        account.email,
        account.username,
        "SenhaSegura123",
      );

      expect(authenticated?.perfil).toBe(perfil);
      expect(canAccessRoute(authenticated?.perfil, route)).toBe(true);
    }
  });

  it("does not authenticate a deactivated local account", async () => {
    const account = await createLocalAccount(
      "financeiro@school.test",
      "financeiro",
      "Equipe Financeira",
      "Financeiro",
      "SenhaSegura123",
    );

    await expect(
      authenticateLocalAccount(
        [{ ...account, ativo: false }],
        account.email,
        account.username,
        "SenhaSegura123",
      ),
    ).resolves.toBeNull();
  });
});

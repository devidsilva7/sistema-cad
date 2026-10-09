import { describe, expect, it } from "vitest";
import { canAccessRoute } from "@/lib/store";

describe("role-based route access", () => {
  it("restricts student and staff registration to the administrator", () => {
    expect(canAccessRoute("Administrador", "/alunos")).toBe(true);
    expect(canAccessRoute("Administrador", "/professores")).toBe(true);
    expect(canAccessRoute("Professor", "/alunos")).toBe(false);
    expect(canAccessRoute("Diretor de Turma", "/professores")).toBe(false);
    expect(canAccessRoute("Aluno", "/alunos")).toBe(false);
    expect(canAccessRoute(undefined, "/professores")).toBe(false);
    expect(canAccessRoute("Professor", "/configuracoes")).toBe(false);
    expect(canAccessRoute("Diretor de Turma", "/configuracoes")).toBe(false);
  });

  it("allows students into consultation pages only", () => {
    expect(canAccessRoute("Aluno", "/dashboard")).toBe(true);
    expect(canAccessRoute("Aluno", "/agenda")).toBe(true);
    expect(canAccessRoute("Aluno", "/cardapio")).toBe(true);
    expect(canAccessRoute("Aluno", "/comunicados")).toBe(true);
    expect(canAccessRoute("Aluno", "/perfil")).toBe(true);
    expect(canAccessRoute("Aluno", "/alunos")).toBe(false);
    expect(canAccessRoute("Aluno", "/professores")).toBe(false);
    expect(canAccessRoute("Aluno", "/ocorrencias")).toBe(false);
    expect(canAccessRoute("Aluno", "/notificacoes")).toBe(false);
    expect(canAccessRoute("Aluno", "/configuracoes")).toBe(false);
  });

  it("allows teachers and directors of class to use communication routes", () => {
    for (const perfil of ["Diretor de Turma", "Professor"]) {
      expect(canAccessRoute(perfil, "/ocorrencias")).toBe(true);
      expect(canAccessRoute(perfil, "/comunicados")).toBe(true);
      expect(canAccessRoute(perfil, "/alunos")).toBe(false);
      expect(canAccessRoute(perfil, "/professores")).toBe(false);
      expect(canAccessRoute(perfil, "/configuracoes")).toBe(false);
    }
  });
});

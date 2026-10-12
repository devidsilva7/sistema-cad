import { describe, expect, it } from "vitest";
import { canAccessRoute } from "@/lib/store";

describe("role-based route access", () => {
  it("restricts registration and configuration to the administrator", () => {
    expect(canAccessRoute("Administrador", "/alunos")).toBe(true);
    expect(canAccessRoute("Administrador", "/professores")).toBe(true);
    expect(canAccessRoute("Professor", "/alunos")).toBe(true);
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

  it("allows teachers to see associated students, guardians and school modules", () => {
    for (const perfil of ["Diretor de Turma", "Professor"]) {
      expect(canAccessRoute(perfil, "/ocorrencias")).toBe(true);
      expect(canAccessRoute(perfil, "/comunicados")).toBe(true);
      expect(canAccessRoute(perfil, "/alunos")).toBe(true);
      expect(canAccessRoute(perfil, "/responsaveis")).toBe(true);
      expect(canAccessRoute(perfil, "/horarios")).toBe(true);
      expect(canAccessRoute(perfil, "/agendamento-ambientes")).toBe(true);
      expect(canAccessRoute(perfil, "/professores")).toBe(false);
      expect(canAccessRoute(perfil, "/configuracoes")).toBe(false);
    }
  });

  it("gives directors read access to DTs and the school-wide schedule", () => {
    for (const rota of [
      "/dashboard",
      "/ocorrencias",
      "/professores",
      "/cardapio",
      "/horarios",
      "/agendamento-ambientes",
    ]) {
      expect(canAccessRoute("Diretor", rota)).toBe(true);
    }
    for (const rota of ["/alunos", "/responsaveis", "/agenda", "/comunicados", "/notificacoes"]) {
      expect(canAccessRoute("Diretor", rota)).toBe(false);
    }
  });

  it("allows coordinators to manage school modules but not restricted registrations", () => {
    for (const rota of [
      "/ocorrencias",
      "/professores",
      "/agenda",
      "/comunicados",
      "/notificacoes",
      "/horarios",
      "/agendamento-ambientes",
    ]) {
      expect(canAccessRoute("Coordenador", rota)).toBe(true);
    }
    for (const rota of ["/alunos", "/responsaveis", "/configuracoes"]) {
      expect(canAccessRoute("Coordenador", rota)).toBe(false);
    }
  });

  it("gives guardians a read-only view and blocks the registration screens", () => {
    for (const rota of [
      "/dashboard",
      "/agenda",
      "/cardapio",
      "/comunicados",
      "/notificacoes",
      "/perfil",
    ]) {
      expect(canAccessRoute("Responsável", rota)).toBe(true);
    }
    for (const rota of [
      "/alunos",
      "/professores",
      "/responsaveis",
      "/configuracoes",
      "/ocorrencias",
    ]) {
      expect(canAccessRoute("Responsável", rota)).toBe(false);
    }
  });

  it("keeps guardian registration read access limited to staff and administrators", () => {
    expect(canAccessRoute("Administrador", "/responsaveis")).toBe(true);
    for (const perfil of ["Aluno", "Responsável", "Diretor", "Coordenador"]) {
      expect(canAccessRoute(perfil, "/responsaveis")).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  AREAS_CONHECIMENTO,
  BLOCOS_HORARIOS,
  TURMAS,
  sincronizarVinculosResponsaveis,
} from "@/lib/store";

describe("school structure", () => {
  it("includes all requested grades and knowledge areas", () => {
    for (const course of ["Informática", "Administração", "Meio Ambiente"]) {
      for (const year of ["1º", "2º", "3º"]) {
        expect(TURMAS).toContain(`${year} ${course}`);
      }
    }
    expect(AREAS_CONHECIMENTO).toEqual(["Linguagens", "Matemática", "Humanas", "Natureza"]);
  });

  it("uses the school periods and breaks in chronological order", () => {
    expect(
      BLOCOS_HORARIOS.map((bloco) =>
        bloco.tipo === "aula"
          ? `${bloco.periodo}º: ${bloco.horario}`
          : `${bloco.tipo === "almoco" ? "Almoço" : "Intervalo"}: ${bloco.horario}`,
      ),
    ).toEqual([
      "1º: 07:30 – 08:20",
      "2º: 08:20 – 09:10",
      "Intervalo: 09:10 – 09:30",
      "3º: 09:30 – 10:20",
      "4º: 10:20 – 11:10",
      "5º: 11:10 – 12:00",
      "Almoço: 12:00 – 13:00",
      "6º: 13:00 – 13:50",
      "7º: 13:50 – 14:40",
      "Intervalo: 14:40 – 15:00",
      "8º: 15:00 – 15:50",
      "9º: 15:50 – 16:40",
    ]);
  });

  it("migrates legacy student contact data to a guardian relationship", () => {
    const aluno = {
      id: "student-1",
      nome: "Ana",
      email: "ana@example.test",
      turma: "1º Informática",
      matricula: "A1",
      responsavel: "Nome antigo",
      responsavelEmail: "MAE@example.test",
      whatsapp: "(85) 90000-0000",
    };
    const responsavel = {
      id: "guardian-1",
      nome: "Mãe da Ana",
      email: "mae@example.test",
      whatsapp: "(85) 98888-7777",
      parentesco: "Mãe",
    };

    expect(sincronizarVinculosResponsaveis([aluno], [responsavel])).toEqual([
      {
        ...aluno,
        responsavelId: responsavel.id,
        responsavel: responsavel.nome,
        responsavelEmail: responsavel.email,
        whatsapp: responsavel.whatsapp,
      },
    ]);
  });
});

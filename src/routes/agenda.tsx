import { createFileRoute } from "@tanstack/react-router";
import { Card, PageShell } from "@/components/AppShell";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Gestão Escolar LAF" },
      { name: "description", content: "Próximos eventos e datas importantes da escola." },
      { property: "og:title", content: "Agenda — Gestão Escolar LAF" },
      { property: "og:description", content: "Próximos eventos e datas importantes da escola." },
    ],
  }),
  component: Agenda,
});

const EVENTOS = [
  { d: "12", m: "OUT", t: "Feriado — Dia de N. Sra. Aparecida" },
  { d: "17", m: "OUT", t: "Reunião de Pais e Mestres" },
  { d: "23", m: "OUT", t: "Conselho de Classe — 3º bimestre" },
  { d: "05", m: "NOV", t: "Semana Científica LAF" },
];

function Agenda() {
  return (
    <PageShell title="Agenda" subtitle="Calendário escolar">
      <div className="space-y-2">
        {EVENTOS.map((e) => (
          <Card key={e.t} className="flex items-center gap-4 !p-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-center text-primary-foreground">
              <div><p className="text-lg font-extrabold leading-none">{e.d}</p><p className="text-[10px] font-bold text-gold">{e.m}</p></div>
            </div>
            <p className="font-semibold">{e.t}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

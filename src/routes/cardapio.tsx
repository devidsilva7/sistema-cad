import { createFileRoute } from "@tanstack/react-router";
import { Coffee, Pencil, Soup, Apple } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { DIAS, useStore, type Dia, type Refeicoes } from "@/lib/store";

export const Route = createFileRoute("/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio Escolar — Gestão Escolar LAF" },
      { name: "description", content: "Cardápio semanal com lanche da manhã, almoço e lanche da tarde." },
      { property: "og:title", content: "Cardápio Escolar — Gestão Escolar LAF" },
      { property: "og:description", content: "Cardápio semanal com lanche da manhã, almoço e lanche da tarde." },
    ],
  }),
  component: Cardapio,
});

const REF = [
  { k: "manha", label: "Lanche da Manhã", icon: Coffee },
  { k: "almoco", label: "Almoço", icon: Soup },
  { k: "tarde", label: "Lanche da Tarde", icon: Apple },
] as const;

function Cardapio() {
  const { cardapio, set } = useStore();
  const [dia, setDia] = useState<Dia>("Segunda");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Refeicoes>(cardapio[dia]);

  const pick = (d: Dia) => { setDia(d); setDraft(cardapio[d]); setEdit(false); };
  const salvar = () => {
    set((s) => ({ ...s, cardapio: { ...s.cardapio, [dia]: draft } }));
    setEdit(false);
    toast.success(`Cardápio de ${dia} atualizado.`);
  };

  return (
    <PageShell title="Cardápio Escolar" subtitle="Semana atual">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-card p-1.5 shadow-card">
        {DIAS.map((d) => (
          <button key={d} onClick={() => pick(d)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${dia === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {REF.map(({ k, label, icon: Icon }) => (
          <Card key={k} className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-foreground">{label}</p>
              {edit ? (
                <input className="field mt-1" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              ) : (
                <p className="mt-0.5 font-medium">{cardapio[dia][k]}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        {edit ? (
          <PrimaryButton onClick={salvar}>Salvar cardápio</PrimaryButton>
        ) : (
          <button onClick={() => setEdit(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 font-semibold text-primary">
            <Pencil className="h-4 w-4" /> Editar (Gestão / Nutricionista)
          </button>
        )}
      </div>
      <Label>{" "}</Label>
    </PageShell>
  );
}

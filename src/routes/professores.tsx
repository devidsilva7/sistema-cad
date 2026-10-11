import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AcessoCriado,
  CadastroTabs,
  Card,
  Field,
  PageShell,
  PrimaryButton,
} from "@/components/AppShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { emailEmUso, senhaTemporaria, usernameDoEmail, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount } from "@/lib/local-accounts";
import { TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/professores")({
  head: () => ({
    meta: [
      { title: "Cadastrar Professores — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Cadastro de professores, disciplinas, turmas e Diretores de Turma.",
      },
      { property: "og:title", content: "Cadastrar Professores — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Cadastro de professores, disciplinas, turmas e Diretores de Turma.",
      },
    ],
  }),
  component: Professores,
});

const vazio = { nome: "", disciplina: "", email: "", username: "" };

type Acesso = { titulo: string; linhas: { label: string; value: string }[] };

function Professores() {
  const store = useStore();
  const { professores, set } = store;
  const [f, setF] = useState(vazio);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [dt, setDt] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [q, setQ] = useState("");

  const lista = professores.filter((p) =>
    `${p.nome} ${p.disciplina}`.toLowerCase().includes(q.toLowerCase()),
  );
  const toggle = (t: string) =>
    setTurmas((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = f.nome.trim();
    const email = f.email.trim().toLowerCase();
    const disciplina = f.disciplina.trim();
    const username = (f.username.trim() || usernameDoEmail(email)).toLowerCase();
    if (!nome || !email || !disciplina) {
      toast.error("Preencha nome, disciplina e e-mail de acesso.");
      return;
    }
    if (emailEmUso(store, email)) {
      toast.error("Esse e-mail já está em uso por outra conta.");
      return;
    }
    if (!username || usernameEmUso(store, username)) {
      toast.error("Esse nome de usuário já está em uso. Informe outro.");
      return;
    }
    setSalvando(true);
    try {
      await requireAdminSession();
      const senha = senhaTemporaria();
      const perfil = dt ? "Diretor de Turma" : "Professor";
      const conta = await createLocalAccount(email, username, nome, perfil, senha, true);
      set((s) => ({
        ...s,
        professores: [{ id: uid(), nome, email, disciplina, turmas, dt }, ...s.professores],
        accounts: [...s.accounts, conta],
      }));
      setAcesso({
        titulo: `Acesso de ${nome} criado`,
        linhas: [
          { label: "E-mail", value: conta.email },
          { label: "Usuário", value: conta.username },
          { label: "Senha temporária", value: senha },
        ],
      });
      setF(vazio);
      setTurmas([]);
      setDt(false);
      setAberto(false);
    } catch (error) {
      console.error("Falha ao cadastrar professor.", error);
      toast.error("Sessão administrativa inválida. Entre novamente como administrador.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (professorId: string) => {
    const professor = professores.find((item) => item.id === professorId);
    if (!professor || !window.confirm(`Remover ${professor.nome} e a conta de acesso?`)) return;
    try {
      await requireAdminSession();
      set((s) => ({
        ...s,
        professores: s.professores.filter((item) => item.id !== professorId),
        accounts: s.accounts.filter((c) => c.email !== professor.email.toLowerCase()),
      }));
      toast.success("Professor removido.");
    } catch (error) {
      console.error("Falha ao remover professor.", error);
      toast.error("Não foi possível remover. Confira a sessão do administrador.");
    }
  };

  return (
    <PageShell title="Cadastros" subtitle={`${professores.length} professores cadastrados`}>
      <CadastroTabs />
      {acesso && (
        <AcessoCriado
          titulo={acesso.titulo}
          linhas={acesso.linhas}
          onClose={() => setAcesso(null)}
        />
      )}

      {aberto ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Novo professor</h2>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Cancelar"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={salvar} className="space-y-4">
            <Field label="Nome completo">
              <input
                className="field"
                autoComplete="off"
                value={f.nome}
                onChange={(e) => setF({ ...f, nome: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Disciplina">
                <input
                  className="field"
                  autoComplete="off"
                  value={f.disciplina}
                  onChange={(e) => setF({ ...f, disciplina: e.target.value })}
                />
              </Field>
              <Field label="E-mail de acesso">
                <input
                  className="field"
                  type="email"
                  autoComplete="off"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </Field>
              <Field label="Usuário" hint="Se deixar vazio, usamos o início do e-mail.">
                <input
                  className="field"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder={usernameDoEmail(f.email) || "ex.: joao.souza"}
                  value={f.username}
                  onChange={(e) => setF({ ...f, username: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Turmas que leciona">
              <div className="flex flex-wrap gap-2">
                {TURMAS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggle(t)}
                    aria-pressed={turmas.includes(t)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                      turmas.includes(t)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-3 rounded-xl bg-accent p-3.5 text-sm font-semibold text-accent-foreground">
              <input
                type="checkbox"
                checked={dt}
                onChange={(e) => setDt(e.target.checked)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              É Diretor de Turma (DT)
            </label>
            <p className="rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
              Uma senha temporária é gerada ao salvar. No primeiro acesso o professor cria a senha
              dele.
            </p>
            <PrimaryButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar professor"}
            </PrimaryButton>
          </form>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/60 py-4 font-semibold text-primary transition hover:bg-primary-soft"
        >
          <Plus className="h-5 w-5" />
          Novo professor
        </button>
      )}

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field !pl-9"
          placeholder="Buscar por nome ou disciplina"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-3 space-y-2">
        {lista.length === 0 && (
          <Card>
            <p className="text-center text-sm text-muted-foreground">
              {professores.length === 0
                ? "Nenhum professor cadastrado ainda."
                : "Nenhum professor encontrado."}
            </p>
          </Card>
        )}
        {lista.map((p) => (
          <Card key={p.id} className="!p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{p.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{p.email}</p>
              </div>
              {p.dt && (
                <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-gold-foreground">
                  DT
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <b className="text-foreground">{p.disciplina}</b> ·{" "}
              {p.turmas.join(", ") || "Sem turmas"}
            </p>
            <button
              type="button"
              onClick={() => void remover(p.id)}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Remover professor
            </button>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
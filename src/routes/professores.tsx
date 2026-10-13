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
import { emailEmUso, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount, type LocalAccountProfile } from "@/lib/local-accounts";
import { AREAS_CONHECIMENTO, TURMAS, uid, useStore, type AreaConhecimento } from "@/lib/store";

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

const vazio: {
  nome: string;
  disciplina: string;
  area: AreaConhecimento;
  email: string;
  username: string;
  senha: string;
} = {
  nome: "",
  disciplina: "",
  area: AREAS_CONHECIMENTO[0],
  email: "",
  username: "",
  senha: "",
};

type Acesso = { titulo: string; linhas: { label: string; value: string }[] };

function Professores() {
  const store = useStore();
  const { accounts, professores, set, user } = store;
  const podeCadastrar = user?.perfil === "Administrador";
  const somenteDiretoresDeTurma = user?.perfil === "Diretor";
  const [f, setF] = useState(vazio);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [perfilConta, setPerfilConta] = useState<LocalAccountProfile>("Professor");
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [q, setQ] = useState("");

  const professoresVisiveis = somenteDiretoresDeTurma
    ? professores.filter((professor) => professor.dt)
    : professores;
  const lista = professoresVisiveis.filter((p) =>
    `${p.nome} ${p.disciplina} ${p.area ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );
  const acessosGestao = accounts.filter(
    (account) => account.perfil === "Diretor" || account.perfil === "Coordenador",
  );
  const toggle = (t: string) =>
    setTurmas((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = f.nome.trim();
    const email = f.email.trim().toLowerCase();
    const disciplina = f.disciplina.trim();
    const area = f.area;
    const username = f.username.trim().toLowerCase();
    const perfilDocente = perfilConta === "Professor" || perfilConta === "Diretor de Turma";
    if (!nome || !username || !email || !f.senha || (perfilDocente && (!disciplina || !area))) {
      toast.error("Preencha nome, usuário, e-mail, senha e os dados docentes quando aplicável.");
      return;
    }
    if (f.senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
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
      const conta = await createLocalAccount(email, username, nome, perfilConta, f.senha);
      set((s) => ({
        ...s,
        professores: perfilDocente
          ? [
              {
                id: uid(),
                nome,
                email,
                disciplina,
                area,
                turmas,
                dt: perfilConta === "Diretor de Turma",
              },
              ...s.professores,
            ]
          : s.professores,
        accounts: [...s.accounts, conta],
      }));
      setAcesso({
        titulo: `Acesso de ${nome} criado`,
        linhas: [
          { label: "E-mail", value: conta.email },
          { label: "Usuário", value: conta.username },
          { label: "Senha definida", value: f.senha },
        ],
      });
      setF(vazio);
      setTurmas([]);
      setPerfilConta("Professor");
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

  const removerAcessoGestao = async (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);
    if (!account || !window.confirm(`Remover o acesso de ${account.nome} (${account.perfil})?`)) {
      return;
    }
    try {
      await requireAdminSession();
      set((state) => ({
        ...state,
        accounts: state.accounts.filter((item) => item.id !== accountId),
      }));
      toast.success("Acesso removido.");
    } catch (error) {
      console.error("Falha ao remover acesso de gestão.", error);
      toast.error("Não foi possível remover. Confira a sessão do administrador.");
    }
  };

  return (
    <PageShell
      title={podeCadastrar ? "Cadastros" : "Professores"}
      subtitle={`${professoresVisiveis.length} professores cadastrados`}
    >
      {podeCadastrar && <CadastroTabs />}
      {acesso && (
        <AcessoCriado
          titulo={acesso.titulo}
          linhas={acesso.linhas}
          onClose={() => setAcesso(null)}
        />
      )}

      {podeCadastrar ? (
        aberto ? (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Novo acesso escolar</h2>
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
              <Field label="Perfil da conta">
                <select
                  className="field"
                  value={perfilConta}
                  onChange={(event) => setPerfilConta(event.target.value as LocalAccountProfile)}
                >
                  {(["Professor", "Diretor de Turma", "Diretor", "Coordenador"] as const).map(
                    (perfil) => (
                      <option key={perfil}>{perfil}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Nome completo">
                <input
                  className="field"
                  autoComplete="off"
                  value={f.nome}
                  onChange={(e) => setF({ ...f, nome: e.target.value })}
                  required
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(perfilConta === "Professor" || perfilConta === "Diretor de Turma") && (
                  <>
                    <Field label="Disciplina">
                      <input
                        className="field"
                        autoComplete="off"
                        value={f.disciplina}
                        onChange={(e) => setF({ ...f, disciplina: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Área de conhecimento">
                      <select
                        className="field"
                        value={f.area}
                        onChange={(event) => {
                          const area = AREAS_CONHECIMENTO.find(
                            (item) => item === event.target.value,
                          );
                          if (area) setF({ ...f, area });
                        }}
                      >
                        {AREAS_CONHECIMENTO.map((areaConhecimento) => (
                          <option key={areaConhecimento}>{areaConhecimento}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                <Field label="Nome de usuário">
                  <input
                    className="field"
                    autoComplete="off"
                    autoCapitalize="none"
                    value={f.username}
                    onChange={(e) => setF({ ...f, username: e.target.value })}
                    required
                  />
                </Field>
                <Field label="E-mail de acesso">
                  <input
                    className="field"
                    type="email"
                    autoComplete="off"
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label="Senha"
                  hint="Mínimo de 8 caracteres. O usuário poderá entrar com esta senha."
                >
                  <input
                    className="field"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={f.senha}
                    onChange={(e) => setF({ ...f, senha: e.target.value })}
                    required
                  />
                </Field>
              </div>
              {(perfilConta === "Professor" || perfilConta === "Diretor de Turma") && (
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
              )}
              <PrimaryButton type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Criar acesso"}
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
            Novo acesso escolar
          </button>
        )
      ) : null}

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
              <b className="text-foreground">{p.disciplina}</b>
              {p.area && ` · ${p.area}`} · {p.turmas.join(", ") || "Sem turmas"}
            </p>
            {podeCadastrar && (
              <button
                type="button"
                onClick={() => void remover(p.id)}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Remover professor
              </button>
            )}
          </Card>
        ))}
      </div>
      {podeCadastrar && (
        <section className="mt-6 space-y-2">
          <h2 className="px-1 text-sm font-bold">Acessos de Diretores e Coordenadores</h2>
          {acessosGestao.length === 0 && (
            <Card>
              <p className="text-sm text-muted-foreground">
                Nenhum acesso de Diretor ou Coordenador cadastrado.
              </p>
            </Card>
          )}
          {acessosGestao.map((account) => (
            <Card key={account.id} className="flex items-center justify-between gap-3 !p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{account.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.perfil} · {account.username} · {account.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removerAcessoGestao(account.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            </Card>
          ))}
        </section>
      )}
    </PageShell>
  );
}

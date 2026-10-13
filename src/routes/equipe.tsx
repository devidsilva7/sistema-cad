import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Field, PageShell, PrimaryButton } from "@/components/AppShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { emailEmUso, mascaraTelefone, soDigitos, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount, updateLocalAccountPassword } from "@/lib/local-accounts";
import { uid, useStore, type Funcionario } from "@/lib/store";

export const Route = createFileRoute("/equipe")({
  validateSearch: (search: Record<string, unknown>) => {
    const perfil = search["perfil"];
    return {
      perfil: perfil === "Secretaria" || perfil === "Financeiro" ? perfil : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Equipe e acessos — Gestão Escolar LAF" },
      { name: "description", content: "Cadastro e gerenciamento de funcionários e acessos." },
    ],
  }),
  component: Equipe,
});

const inicial = {
  nome: "",
  email: "",
  telefone: "",
  cpf: "",
  username: "",
  senha: "",
  ativo: true,
};
const PERFIS_EQUIPE: Funcionario["perfil"][] = ["Secretaria", "Financeiro"];
const isPerfilEquipe = (value: string | undefined): value is Funcionario["perfil"] =>
  value === "Secretaria" || value === "Financeiro";

function Equipe() {
  const store = useStore();
  const { funcionarios, set } = store;
  const { perfil: perfilDaRota } = Route.useSearch();
  const [perfilSelecionado, setPerfilSelecionado] = useState<Funcionario["perfil"] | null>(null);
  const [form, setForm] = useState(inicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const perfilAtivo = perfilSelecionado ?? (isPerfilEquipe(perfilDaRota) ? perfilDaRota : null);
  const equipesVisiveis = funcionarios.filter(
    (item) => !perfilAtivo || item.perfil === perfilAtivo,
  );

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const username = form.username.trim().toLowerCase();
    const cpf = soDigitos(form.cpf);
    if (!perfilAtivo || !nome || !email || !form.telefone.trim() || cpf.length !== 11) {
      toast.error("Informe nome, e-mail, telefone e um CPF válido com 11 dígitos.");
      return;
    }
    if (!editandoId && form.senha.length < 8) {
      toast.error("A senha inicial precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (form.senha && form.senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    const funcionarioEditado = funcionarios.find((item) => item.id === editandoId);
    const contaEditada = store.accounts.find(
      (account) => account.id === funcionarioEditado?.accountId,
    );
    if (
      emailEmUso(store, email, { accountId: contaEditada?.id }) ||
      usernameEmUso(store, username, contaEditada?.id)
    ) {
      toast.error("O e-mail ou nome de usuário já está em uso.");
      return;
    }
    if (funcionarios.some((item) => item.id !== editandoId && soDigitos(item.cpf) === cpf)) {
      toast.error("Já existe um funcionário cadastrado com esse CPF.");
      return;
    }

    setSalvando(true);
    try {
      await requireAdminSession();
      const contaBase = contaEditada
        ? { ...contaEditada, email, username, nome, perfil: perfilAtivo, ativo: form.ativo }
        : await createLocalAccount(email, username, nome, perfilAtivo, form.senha, true);
      const contaAtualizada =
        contaEditada && form.senha
          ? await updateLocalAccountPassword(contaBase, form.senha)
          : contaBase;
      const conta = { ...contaAtualizada, ativo: form.ativo };
      const funcionario: Funcionario = {
        id: funcionarioEditado?.id ?? uid(),
        accountId: conta.id,
        nome,
        email,
        telefone: mascaraTelefone(form.telefone),
        cpf,
        cargo: perfilAtivo,
        perfil: perfilAtivo,
        ativo: form.ativo,
      };
      set((current) => ({
        ...current,
        funcionarios: [
          funcionario,
          ...current.funcionarios.filter((item) => item.id !== funcionarioEditado?.id),
        ],
        accounts: contaEditada
          ? current.accounts.map((item) => (item.id === conta.id ? conta : item))
          : [...current.accounts, conta],
      }));
      setForm(inicial);
      setAberto(false);
      setPerfilSelecionado(null);
      setEditandoId(null);
      toast.success(
        funcionarioEditado
          ? "Dados atualizados com sucesso!"
          : `Acesso de ${nome} criado. A senha deverá ser alterada no primeiro login.`,
      );
    } catch (error) {
      console.error("Falha ao cadastrar funcionário.", error);
      toast.error("Não foi possível cadastrar. Confira a sessão administrativa.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (funcionario: Funcionario) => {
    try {
      await requireAdminSession();
      set((current) => ({
        ...current,
        funcionarios: current.funcionarios.map((item) =>
          item.id === funcionario.id ? { ...item, ativo: !item.ativo } : item,
        ),
        accounts: current.accounts.map((account) =>
          account.id === funcionario.accountId
            ? { ...account, ativo: !funcionario.ativo }
            : account,
        ),
      }));
      toast.success(funcionario.ativo ? "Acesso desativado." : "Acesso ativado.");
    } catch (error) {
      console.error("Falha ao alterar o status do funcionário.", error);
      toast.error("Não foi possível alterar o acesso. Confira a sessão administrativa.");
    }
  };

  const remover = async (funcionario: Funcionario) => {
    if (!window.confirm(`Remover ${funcionario.nome} e seu acesso ao sistema?`)) return;
    try {
      await requireAdminSession();
      set((current) => ({
        ...current,
        funcionarios: current.funcionarios.filter((item) => item.id !== funcionario.id),
        accounts: current.accounts.filter((account) => account.id !== funcionario.accountId),
      }));
      toast.success("Funcionário e acesso removidos.");
    } catch (error) {
      console.error("Falha ao remover funcionário.", error);
      toast.error("Não foi possível remover. Confira a sessão administrativa.");
    }
  };

  return (
    <PageShell
      title="Equipe e acessos"
      subtitle="Cadastre e gerencie separadamente as equipes da Secretaria e do Financeiro"
    >
      {!aberto && !perfilDaRota && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PERFIS_EQUIPE.map((perfil) => {
            const quantidade = funcionarios.filter((item) => item.perfil === perfil).length;
            const nomeEquipe =
              perfil === "Secretaria" ? "pessoal da Secretaria" : "pessoal do Financeiro";
            return (
              <Card key={perfil} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <UserRoundCog className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold">{perfil}</h2>
                    <p className="text-xs text-muted-foreground">{quantidade} funcionário(s)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPerfilSelecionado(perfil);
                    setForm(inicial);
                    setEditandoId(null);
                    setAberto(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/60 py-3 text-sm font-semibold text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar {nomeEquipe}
                </button>
              </Card>
            );
          })}
        </div>
      )}
      {!aberto && perfilDaRota && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <UserRoundCog className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">
                Pessoal {perfilDaRota === "Secretaria" ? "da Secretaria" : "do Financeiro"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {equipesVisiveis.length} funcionário(s) cadastrado(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isPerfilEquipe(perfilDaRota)) return;
              setPerfilSelecionado(perfilDaRota);
              setForm(inicial);
              setEditandoId(null);
              setAberto(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/60 py-3 text-sm font-semibold text-primary"
          >
            <Plus className="h-4 w-4" />
            Cadastrar pessoal {perfilDaRota === "Secretaria" ? "da Secretaria" : "do Financeiro"}
          </button>
        </Card>
      )}
      {aberto ? (
        <Card>
          <form onSubmit={salvar} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">
                {editandoId
                  ? "Editar cadastro de funcionário"
                  : perfilAtivo === "Secretaria"
                    ? "Cadastrar pessoal da Secretaria"
                    : "Cadastrar pessoal do Financeiro"}
              </h2>
            </div>
            {editandoId && (
              <Field label="Equipe">
                <select
                  className="field"
                  value={perfilAtivo ?? ""}
                  onChange={(event) =>
                    setPerfilSelecionado(event.target.value as Funcionario["perfil"])
                  }
                >
                  {PERFIS_EQUIPE.map((perfil) => (
                    <option key={perfil}>{perfil}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Nome completo">
              <input
                className="field"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <input
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field>
              <Field label="Telefone">
                <input
                  className="field"
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                  required
                />
              </Field>
              <Field label="CPF">
                <input
                  className="field"
                  inputMode="numeric"
                  maxLength={14}
                  value={form.cpf}
                  onChange={(e) =>
                    setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })
                  }
                  required
                />
              </Field>
              <Field label="Nome de usuário">
                <input
                  className="field"
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </Field>
              <Field
                label={editandoId ? "Nova senha (opcional)" : "Senha inicial"}
                hint="Mínimo de 8 caracteres; será solicitada a troca no primeiro login."
              >
                <input
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  required={!editandoId}
                />
              </Field>
              <Field label="Status">
                <select
                  className="field"
                  value={form.ativo ? "Ativo" : "Inativo"}
                  onChange={(event) => setForm({ ...form, ativo: event.target.value === "Ativo" })}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={salvando}>
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : perfilAtivo === "Secretaria"
                      ? "Cadastrar pessoal da Secretaria"
                      : "Cadastrar pessoal do Financeiro"}
              </PrimaryButton>
              <button
                type="button"
                className="rounded-xl border px-4 text-sm font-semibold"
                onClick={() => {
                  setAberto(false);
                  setPerfilSelecionado(null);
                  setEditandoId(null);
                  setForm(inicial);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      ) : null}
      <div className="mt-4 space-y-2">
        {equipesVisiveis.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">
              Nenhum funcionário {perfilAtivo ? `da equipe de ${perfilAtivo}` : "cadastrado"}.
            </p>
          </Card>
        )}
        {equipesVisiveis.map((funcionario) => (
          <Card
            key={funcionario.id}
            className="flex flex-wrap items-center justify-between gap-3 !p-3.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <UserRoundCog className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{funcionario.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {funcionario.cargo} · {funcionario.perfil} · {funcionario.telefone}
                </p>
                <p className="text-xs text-muted-foreground">
                  {funcionario.email} · CPF {funcionario.cpf}
                </p>
                <p
                  className={`text-xs font-semibold ${funcionario.ativo ? "text-leaf" : "text-destructive"}`}
                >
                  {funcionario.ativo ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const account = store.accounts.find((item) => item.id === funcionario.accountId);
                  setEditandoId(funcionario.id);
                  setPerfilSelecionado(funcionario.perfil);
                  setForm({
                    nome: funcionario.nome,
                    email: funcionario.email,
                    telefone: funcionario.telefone,
                    cpf: funcionario.cpf,
                    username: account?.username ?? "",
                    senha: "",
                    ativo: funcionario.ativo,
                  });
                  setAberto(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-label={`Editar ${funcionario.nome}`}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void alternarStatus(funcionario)}
                className="rounded-lg border px-3 py-2 text-xs font-semibold"
              >
                {funcionario.ativo ? "Desativar" : "Ativar"}
              </button>
              <button
                type="button"
                aria-label={`Remover ${funcionario.nome}`}
                onClick={() => void remover(funcionario)}
                className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

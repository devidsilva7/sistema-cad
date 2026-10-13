import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import { emailEmUso, mascaraTelefone, soDigitos, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount, updateLocalAccountPassword } from "@/lib/local-accounts";
import { PARENTESCOS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/responsaveis")({
  head: () => ({
    meta: [
      { title: "Cadastrar Responsáveis — Gestão Escolar LAF" },
      { name: "description", content: "Cadastro de pais e responsáveis dos alunos." },
      { property: "og:title", content: "Cadastrar Responsáveis — Gestão Escolar LAF" },
      { property: "og:description", content: "Cadastro de pais e responsáveis dos alunos." },
    ],
  }),
  component: Responsaveis,
});

const vazio = {
  nome: "",
  parentesco: PARENTESCOS[0]!,
  whatsapp: "",
  email: "",
  username: "",
  senha: "",
};

type Acesso = { titulo: string; linhas: { label: string; value: string }[] };

function Responsaveis() {
  const store = useStore();
  const { alunos, responsaveis, professores, set, user } = store;
  const isAdmin = user?.perfil === "Administrador";
  const emailUsuario = store.accounts.find((account) => account.id === user?.localAccountId)?.email;
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario?.toLowerCase(),
  );
  const alunosAssociados = isAdmin
    ? alunos
    : alunos.filter((aluno) => professorAtual?.turmas.includes(aluno.turma));
  const idsResponsaveis = new Set(alunosAssociados.map((aluno) => aluno.responsavelId));
  const emailsResponsaveis = new Set(
    alunosAssociados
      .map((aluno) => aluno.responsavelEmail?.toLowerCase())
      .filter((email): email is string => Boolean(email)),
  );
  const responsaveisVisiveis = isAdmin
    ? responsaveis
    : responsaveis.filter(
        (responsavel) =>
          idsResponsaveis.has(responsavel.id) ||
          emailsResponsaveis.has(responsavel.email.toLowerCase()),
      );
  const [f, setF] = useState(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [q, setQ] = useState("");

  const lista = responsaveisVisiveis.filter((r) =>
    `${r.nome} ${r.email}`.toLowerCase().includes(q.toLowerCase()),
  );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = f.nome.trim();
    const email = f.email.trim().toLowerCase();
    const username = f.username.trim().toLowerCase();
    if (!nome || !email || !username || (!editandoId && !f.senha)) {
      toast.error("Preencha nome, usuário e e-mail.");
      return;
    }
    if (f.senha && f.senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (soDigitos(f.whatsapp).length < 10) {
      toast.error("Informe um WhatsApp válido, com DDD.");
      return;
    }
    setSalvando(true);
    try {
      await requireAdminSession();
      const responsavelEditado = responsaveis.find((item) => item.id === editandoId);
      const contaEditada = store.accounts.find(
        (account) => account.email.toLowerCase() === responsavelEditado?.email.toLowerCase(),
      );
      if (
        emailEmUso(store, email, {
          accountId: contaEditada?.id,
          responsavelId: editandoId ?? undefined,
        })
      ) {
        toast.error("Esse e-mail já está em uso por outra conta.");
        return;
      }
      if (usernameEmUso(store, username, contaEditada?.id)) {
        toast.error("Esse nome de usuário já está em uso. Informe outro.");
        return;
      }
      if (responsavelEditado) {
        const contaAtualizada = contaEditada
          ? { ...contaEditada, email, username, nome }
          : undefined;
        const contaComSenha =
          contaAtualizada && f.senha
            ? await updateLocalAccountPassword(contaAtualizada, f.senha)
            : contaAtualizada;
        set((state) => ({
          ...state,
          responsaveis: state.responsaveis.map((item) =>
            item.id === responsavelEditado.id
              ? { ...item, nome, email, parentesco: f.parentesco, whatsapp: f.whatsapp }
              : item,
          ),
          alunos: state.alunos.map((aluno) =>
            aluno.responsavelId === responsavelEditado.id ||
            aluno.responsavelEmail?.toLowerCase() === responsavelEditado.email.toLowerCase()
              ? {
                  ...aluno,
                  responsavelId: responsavelEditado.id,
                  responsavel: nome,
                  responsavelEmail: email,
                  whatsapp: f.whatsapp,
                }
              : aluno,
          ),
          accounts: contaComSenha
            ? state.accounts.map((account) =>
                account.id === contaComSenha.id ? contaComSenha : account,
              )
            : state.accounts,
        }));
        setF(vazio);
        setEditandoId(null);
        setAberto(false);
        toast.success("Dados do responsável atualizados com sucesso!");
        return;
      }
      const conta = await createLocalAccount(email, username, nome, "Responsável", f.senha);
      set((s) => ({
        ...s,
        responsaveis: [
          { id: uid(), nome, email, parentesco: f.parentesco, whatsapp: f.whatsapp },
          ...s.responsaveis,
        ],
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
      setAberto(false);
    } catch (error) {
      console.error("Falha ao cadastrar responsável.", error);
      toast.error("Sessão administrativa inválida. Entre novamente como administrador.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string) => {
    const resp = responsaveis.find((r) => r.id === id);
    if (!resp) return;
    const vinculados = alunos.filter((a) => a.responsavelId === id).length;
    const aviso = vinculados
      ? `${resp.nome} está vinculado(a) a ${vinculados} aluno(s). Remover mesmo assim? Os alunos ficam sem responsável.`
      : `Remover ${resp.nome} e a conta de acesso?`;
    if (!window.confirm(aviso)) return;
    try {
      await requireAdminSession();
      set((s) => ({
        ...s,
        responsaveis: s.responsaveis.filter((r) => r.id !== id),
        accounts: s.accounts.filter((c) => c.email !== resp.email.toLowerCase()),
        alunos: s.alunos.map((a) =>
          a.responsavelId === id
            ? {
                ...a,
                responsavelId: undefined,
                responsavel: "",
                responsavelEmail: "",
                whatsapp: "",
              }
            : a,
        ),
      }));
      toast.success("Responsável removido.");
    } catch (error) {
      console.error("Falha ao remover responsável.", error);
      toast.error("Não foi possível remover. Confira a sessão do administrador.");
    }
  };

  return (
    <PageShell
      title={isAdmin ? "Cadastros" : "Pais e Responsáveis"}
      subtitle={`${responsaveisVisiveis.length} responsáveis ${isAdmin ? "cadastrados" : "associados às suas turmas"}`}
    >
      {isAdmin && <CadastroTabs />}
      {acesso && (
        <AcessoCriado
          titulo={acesso.titulo}
          linhas={acesso.linhas}
          onClose={() => setAcesso(null)}
        />
      )}

      {isAdmin ? (
        aberto ? (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">
                {editandoId ? "Editar responsável" : "Novo responsável"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  setEditandoId(null);
                  setF(vazio);
                }}
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
                  required
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Parentesco">
                  <select
                    className="field"
                    value={f.parentesco}
                    onChange={(e) => setF({ ...f, parentesco: e.target.value })}
                  >
                    {PARENTESCOS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="WhatsApp" hint="Recebe os avisos de ocorrência.">
                  <input
                    className="field"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="(85) 99999-9999"
                    value={f.whatsapp}
                    onChange={(e) => setF({ ...f, whatsapp: mascaraTelefone(e.target.value) })}
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
                <Field
                  label={editandoId ? "Nova senha (opcional)" : "Senha"}
                  hint="Mínimo de 8 caracteres."
                >
                  <input
                    className="field"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={f.senha}
                    onChange={(e) => setF({ ...f, senha: e.target.value })}
                    required={!editandoId}
                  />
                </Field>
              </div>
              <p className="rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
                A senha definida já permite entrar com o perfil Responsável. Depois, vincule o
                responsável ao aluno na aba <b>Alunos</b>.
              </p>
              <PrimaryButton type="submit" disabled={salvando}>
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Cadastrar responsável"}
              </PrimaryButton>
              {editandoId && (
                <button
                  type="button"
                  className="w-full rounded-xl border px-4 py-3 text-sm font-semibold"
                  onClick={() => {
                    setAberto(false);
                    setEditandoId(null);
                    setF(vazio);
                  }}
                >
                  Cancelar
                </button>
              )}
            </form>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setF(vazio);
              setAberto(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/60 py-4 font-semibold text-primary transition hover:bg-primary-soft"
          >
            <Plus className="h-5 w-5" />
            Novo responsável
          </button>
        )
      ) : null}

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field !pl-9"
          placeholder="Buscar por nome ou e-mail"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-3 space-y-2">
        {lista.length === 0 && (
          <Card>
            <p className="text-center text-sm text-muted-foreground">
              {responsaveis.length === 0
                ? "Nenhum responsável cadastrado ainda."
                : "Nenhum responsável encontrado."}
            </p>
          </Card>
        )}
        {lista.map((r) => {
          const filhos = alunosAssociados.filter(
            (a) =>
              a.responsavelId === r.id ||
              a.responsavelEmail?.toLowerCase() === r.email.toLowerCase(),
          );
          const wa = soDigitos(r.whatsapp);
          return (
            <Card key={r.id} className="!p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{r.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                  {r.parentesco}
                </span>
              </div>
              <p className="mt-2 break-words text-xs text-muted-foreground">
                {filhos.length > 0 ? (
                  <>
                    Responsável por:{" "}
                    <b className="text-foreground">{filhos.map((a) => a.nome).join(", ")}</b>
                  </>
                ) : (
                  "Ainda sem aluno vinculado"
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {wa.length >= 10 && (
                  <a
                    href={`https://wa.me/55${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-leaf hover:bg-accent"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {r.whatsapp}
                  </a>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const account = store.accounts.find(
                        (item) => item.email.toLowerCase() === r.email.toLowerCase(),
                      );
                      setEditandoId(r.id);
                      setF({
                        nome: r.nome,
                        parentesco: r.parentesco,
                        whatsapp: r.whatsapp,
                        email: r.email,
                        username: account?.username ?? "",
                        senha: "",
                      });
                      setAberto(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const account = store.accounts.find(
                        (item) => item.email.toLowerCase() === r.email.toLowerCase(),
                      );
                      setEditandoId(r.id);
                      setF({
                        nome: r.nome,
                        parentesco: r.parentesco,
                        whatsapp: r.whatsapp,
                        email: r.email,
                        username: account?.username ?? "",
                        senha: "",
                      });
                      setAberto(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => void remover(r.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

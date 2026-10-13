import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Phone, Search, Trash2, UserRoundX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AcessoCriado, Card, Field, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { emailEmUso, soDigitos, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount, updateLocalAccountPassword } from "@/lib/local-accounts";
import { TURMAS, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Cadastrar Alunos — Gestão Escolar LAF" },
      { name: "description", content: "Cadastro e busca de alunos com dados do responsável." },
      { property: "og:title", content: "Cadastrar Alunos — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Cadastro e busca de alunos com dados do responsável.",
      },
    ],
  }),
  component: Alunos,
});

const empty = {
  nome: "",
  email: "",
  username: "",
  senha: "",
  turma: TURMAS[0]!,
  matricula: "",
  responsavelId: "",
  responsavel: "",
  responsavelEmail: "",
  whatsapp: "",
};

type AcessoAluno = { titulo: string; linhas: { label: string; value: string }[] };

function Alunos() {
  const store = useStore();
  const { accounts, alunos, professores, responsaveis, set, user } = store;
  const isAdmin = user?.perfil === "Administrador";
  const emailUsuario = accounts.find((account) => account.id === user?.localAccountId)?.email;
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario?.toLowerCase(),
  );
  const eSecretaria = user?.perfil === "Secretaria";
  const alunosVisiveis =
    isAdmin || eSecretaria
      ? alunos
      : alunos.filter((aluno) => professorAtual?.turmas.includes(aluno.turma));
  const [f, setF] = useState(empty);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [acesso, setAcesso] = useState<AcessoAluno | null>(null);
  const lista = alunosVisiveis.filter((a) =>
    (a.nome + a.matricula + a.turma).toLowerCase().includes(q.toLowerCase()),
  );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !f.nome.trim() ||
      !f.email.trim() ||
      !f.matricula.trim() ||
      (!editandoId && (!f.username.trim() || !f.senha))
    ) {
      toast.error("Preencha nome, e-mail, matrícula e os dados de acesso obrigatórios.");
      return;
    }
    const normalizedEmail = f.email.trim().toLowerCase();
    const normalizedUsername = f.username.trim().toLowerCase();
    const normalizedResponsavelEmail = f.responsavelEmail.trim().toLowerCase();
    const normalizedMatricula = f.matricula.trim().toLowerCase();
    if (!normalizedMatricula || (!editandoId && !normalizedUsername)) {
      toast.error("Informe uma matrícula e um nome de usuário válidos.");
      return;
    }
    if (f.senha && f.senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    try {
      await requireAdminSession();
      const alunoEditado = alunos.find((aluno) => aluno.id === editandoId);
      const contaEditada = accounts.find(
        (account) => account.email.toLowerCase() === alunoEditado?.email.toLowerCase(),
      );
      if (
        alunos.some(
          (aluno) =>
            aluno.id !== editandoId && aluno.matricula.trim().toLowerCase() === normalizedMatricula,
        )
      ) {
        toast.error("Já existe um aluno cadastrado com essa matrícula.");
        return;
      }
      if (
        emailEmUso(store, normalizedEmail, {
          accountId: contaEditada?.id,
          alunoId: editandoId ?? undefined,
        }) ||
        alunos.some(
          (aluno) =>
            aluno.id !== editandoId &&
            (aluno.email?.trim().toLowerCase() === normalizedEmail ||
              aluno.responsavelEmail?.trim().toLowerCase() === normalizedEmail),
        )
      ) {
        toast.error("Já existe uma conta cadastrada com esse e-mail.");
        return;
      }
      if (normalizedUsername && usernameEmUso(store, normalizedUsername, contaEditada?.id)) {
        toast.error("Esse nome de usuário já está em uso.");
        return;
      }
      if (
        !f.responsavelId &&
        normalizedResponsavelEmail &&
        (normalizedResponsavelEmail === normalizedEmail ||
          accounts.some(
            (account) =>
              account.id !== contaEditada?.id &&
              account.email.trim().toLowerCase() === normalizedResponsavelEmail,
          ) ||
          alunos.some(
            (aluno) =>
              aluno.id !== editandoId &&
              (aluno.email?.trim().toLowerCase() === normalizedResponsavelEmail ||
                aluno.responsavelEmail?.trim().toLowerCase() === normalizedResponsavelEmail),
          ))
      ) {
        toast.error("O e-mail do responsável já está sendo usado por outra pessoa.");
        return;
      }
      const dadosAluno = {
        nome: f.nome.trim(),
        email: normalizedEmail,
        matricula: f.matricula.trim(),
        turma: f.turma,
        responsavelId: f.responsavelId || undefined,
        responsavel: f.responsavelId
          ? (responsaveis.find((responsavel) => responsavel.id === f.responsavelId)?.nome ?? "")
          : f.responsavel.trim(),
        responsavelEmail: f.responsavelId
          ? (responsaveis.find((responsavel) => responsavel.id === f.responsavelId)?.email ?? "")
          : normalizedResponsavelEmail,
        whatsapp: f.responsavelId
          ? (responsaveis.find((responsavel) => responsavel.id === f.responsavelId)?.whatsapp ?? "")
          : f.whatsapp,
      };
      if (alunoEditado) {
        const contaAtualizada = contaEditada
          ? {
              ...contaEditada,
              email: normalizedEmail,
              username: normalizedUsername || contaEditada.username,
              nome: dadosAluno.nome,
            }
          : undefined;
        const contaComSenha =
          contaAtualizada && f.senha
            ? await updateLocalAccountPassword(contaAtualizada, f.senha)
            : contaAtualizada;
        set((state) => ({
          ...state,
          alunos: state.alunos.map((aluno) =>
            aluno.id === alunoEditado.id ? { ...aluno, ...dadosAluno } : aluno,
          ),
          accounts: contaComSenha
            ? state.accounts.map((account) =>
                account.id === contaComSenha.id ? contaComSenha : account,
              )
            : state.accounts,
        }));
        setEditandoId(null);
        setF(empty);
        toast.success("Dados do aluno atualizados com sucesso!");
        return;
      }
      const id = uid();
      const account = await createLocalAccount(
        f.email,
        normalizedUsername,
        f.nome,
        "Aluno",
        f.senha,
      );
      set((s) => ({
        ...s,
        alunos: [
          {
            id,
            ...dadosAluno,
          },
          ...s.alunos,
        ],
        accounts: [...s.accounts, account],
      }));
      setAcesso({
        titulo: `Acesso do aluno ${account.nome} criado`,
        linhas: [
          { label: "E-mail", value: account.email },
          { label: "Usuário", value: account.username },
          { label: "Senha definida", value: f.senha },
          { label: "Perfil", value: account.perfil },
        ],
      });
      setF(empty);
      toast.success("Aluno cadastrado e conta criada.", {
        description: `E-mail: ${account.email} · Usuário: ${account.username} · A senha definida já pode ser usada para entrar.`,
        duration: 15000,
      });
    } catch (error) {
      console.error("Falha ao cadastrar aluno.", error);
      toast.error("Sessão administrativa inválida. Entre novamente como administrador.");
    }
  };

  const removerAluno = async (alunoId: string) => {
    const aluno = alunos.find((item) => item.id === alunoId);
    if (!aluno || !window.confirm(`Remover o cadastro de ${aluno.nome} e sua conta de acesso?`)) {
      return;
    }

    try {
      await requireAdminSession();
      set((current) => ({
        ...current,
        alunos: current.alunos.filter((item) => item.id !== alunoId),
        accounts: current.accounts.filter((account) => account.email !== aluno.email.toLowerCase()),
        ocorrencias: current.ocorrencias.filter((item) => item.alunoId !== alunoId),
      }));
      toast.success("Aluno, conta e ocorrências relacionadas foram removidos.");
    } catch (error) {
      console.error("Falha ao remover aluno.", error);
      toast.error("Não foi possível remover o aluno. Confira a sessão do administrador.");
    }
  };

  const removerResponsavel = async (alunoId: string) => {
    const aluno = alunos.find((item) => item.id === alunoId);
    if (
      !aluno ||
      (!aluno.responsavel && !aluno.responsavelEmail && !aluno.whatsapp) ||
      !window.confirm(`Remover os dados de contato do responsável de ${aluno.nome}?`)
    ) {
      return;
    }

    try {
      await requireAdminSession();
      set((current) => ({
        ...current,
        alunos: current.alunos.map((item) =>
          item.id === alunoId
            ? {
                ...item,
                responsavelId: undefined,
                responsavel: "",
                responsavelEmail: "",
                whatsapp: "",
              }
            : item,
        ),
      }));
      toast.success("Dados de contato do responsável removidos.");
    } catch (error) {
      console.error("Falha ao remover dados do responsável.", error);
      toast.error("Não foi possível remover os dados. Confira a sessão do administrador.");
    }
  };

  return (
    <PageShell
      title={isAdmin ? "Cadastrar Alunos" : "Alunos"}
      subtitle={`${alunosVisiveis.length} alunos ${isAdmin ? "cadastrados" : "associados às suas turmas"}`}
    >
      {acesso && (
        <AcessoCriado
          titulo={acesso.titulo}
          linhas={acesso.linhas}
          onClose={() => setAcesso(null)}
        />
      )}
      {isAdmin && (
        <Card>
          <form onSubmit={salvar} className="space-y-3">
            {editandoId && <h2 className="font-bold">Editar dados do aluno</h2>}
            <div>
              <Label>Nome</Label>
              <input
                className="field"
                value={f.nome}
                onChange={(e) => setF({ ...f, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Turma</Label>
                <select
                  className="field"
                  value={f.turma}
                  onChange={(e) => setF({ ...f, turma: e.target.value })}
                >
                  {TURMAS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nome de usuário para entrar</Label>
                <input
                  className="field"
                  type="text"
                  autoComplete="off"
                  value={f.username}
                  onChange={(e) => setF({ ...f, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{editandoId ? "Nova senha (opcional)" : "Senha para entrar"}</Label>
                <input
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={f.senha}
                  onChange={(e) => setF({ ...f, senha: e.target.value })}
                  required={!editandoId}
                />
              </div>
              <div>
                <Label>E-mail de acesso do aluno</Label>
                <input
                  className="field"
                  type="email"
                  autoComplete="off"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Matrícula</Label>
                <input
                  className="field"
                  value={f.matricula}
                  onChange={(e) => setF({ ...f, matricula: e.target.value })}
                />
              </div>
            </div>
            <Field label="Vincular responsável cadastrado">
              <select
                className="field"
                value={f.responsavelId}
                onChange={(event) => {
                  const responsavel = responsaveis.find((item) => item.id === event.target.value);
                  setF({
                    ...f,
                    responsavelId: responsavel?.id ?? "",
                    responsavel: responsavel?.nome ?? "",
                    responsavelEmail: responsavel?.email ?? "",
                    whatsapp: responsavel?.whatsapp ?? "",
                  });
                }}
              >
                <option value="">Sem vínculo cadastrado</option>
                {responsaveis.map((responsavel) => (
                  <option key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome} · {responsavel.email}
                  </option>
                ))}
              </select>
            </Field>
            {!f.responsavelId && (
              <>
                <div>
                  <Label>Nome do responsável (opcional)</Label>
                  <input
                    className="field"
                    value={f.responsavel}
                    onChange={(e) => setF({ ...f, responsavel: e.target.value })}
                  />
                </div>
                <div>
                  <Label>E-mail do responsável (opcional)</Label>
                  <input
                    className="field"
                    type="email"
                    autoComplete="off"
                    value={f.responsavelEmail}
                    onChange={(e) => setF({ ...f, responsavelEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label>WhatsApp do responsável</Label>
                  <input
                    className="field"
                    placeholder="(85) 9…"
                    value={f.whatsapp}
                    onChange={(e) => setF({ ...f, whatsapp: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <PrimaryButton type="submit">
                {editandoId ? "Salvar alterações" : "Cadastrar aluno"}
              </PrimaryButton>
              {editandoId && (
                <button
                  type="button"
                  className="rounded-xl border px-4 text-sm font-semibold"
                  onClick={() => {
                    setEditandoId(null);
                    setF(empty);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>
      )}

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field !pl-9"
          placeholder="Buscar por nome, matrícula ou turma"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {lista.map((a) => (
          <Card key={a.id} className="!p-3">
            {(() => {
              const responsavel = store.responsaveis.find(
                (item) =>
                  item.id === a.responsavelId ||
                  (a.responsavelEmail &&
                    item.email.toLowerCase() === a.responsavelEmail.toLowerCase()),
              );
              const nomeResponsavel = responsavel?.nome || a.responsavel || "Não cadastrado";
              const contatoResponsavel = responsavel?.whatsapp || a.whatsapp;
              const numeroResponsavel = soDigitos(contatoResponsavel);
              return (
                <div className="mb-2 rounded-lg bg-accent/50 px-2.5 py-2 text-xs">
                  <p className="font-semibold">Responsável: {nomeResponsavel}</p>
                  {contatoResponsavel && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{contatoResponsavel}</span>
                      {numeroResponsavel.length >= 10 && (
                        <a
                          href={`tel:${numeroResponsavel}`}
                          className="inline-flex items-center gap-1 font-semibold text-primary underline"
                          aria-label={`Ligar para ${nomeResponsavel}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Ligar
                        </a>
                      )}
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold">{a.nome}</p>
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                {a.turma}
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs text-muted-foreground">
              Mat. {a.matricula}
              {a.responsavel && ` · ${a.responsavel}`}
              {a.responsavelEmail && ` · ${a.responsavelEmail}`}
              {a.whatsapp && ` · ${a.whatsapp}`}
            </p>
            {isAdmin && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const account = accounts.find(
                      (item) => item.email.toLowerCase() === a.email.toLowerCase(),
                    );
                    setEditandoId(a.id);
                    setF({
                      nome: a.nome,
                      email: a.email,
                      username: account?.username ?? "",
                      senha: "",
                      turma: a.turma,
                      matricula: a.matricula,
                      responsavelId: a.responsavelId ?? "",
                      responsavel: a.responsavel,
                      responsavelEmail: a.responsavelEmail ?? "",
                      whatsapp: a.whatsapp,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                {(a.responsavel || a.responsavelEmail || a.whatsapp) && (
                  <button
                    type="button"
                    onClick={() => void removerResponsavel(a.id)}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <UserRoundX className="h-4 w-4" />
                    Remover contato do responsável
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removerAluno(a.id)}
                  className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover aluno e conta
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Search, Trash2, UserRoundX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AcessoCriado, Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { emailEmUso, usernameEmUso } from "@/lib/cadastros";
import { createLocalAccount } from "@/lib/local-accounts";
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
  responsavel: "",
  responsavelEmail: "",
  whatsapp: "",
};

type AcessoAluno = { titulo: string; linhas: { label: string; value: string }[] };

function Alunos() {
  const store = useStore();
  const { accounts, alunos, professores, set, user } = store;
  const isAdmin = user?.perfil === "Administrador";
  const emailUsuario = accounts.find((account) => account.id === user?.localAccountId)?.email;
  const professorAtual = professores.find(
    (professor) => professor.email.toLowerCase() === emailUsuario?.toLowerCase(),
  );
  const alunosVisiveis = isAdmin
    ? alunos
    : alunos.filter((aluno) => professorAtual?.turmas.includes(aluno.turma));
  const [f, setF] = useState(empty);
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
      !f.username.trim() ||
      !f.senha
    ) {
      toast.error("Preencha nome, usuário, e-mail, senha e matrícula.");
      return;
    }
    const normalizedEmail = f.email.trim().toLowerCase();
    const normalizedUsername = f.username.trim().toLowerCase();
    const normalizedResponsavelEmail = f.responsavelEmail.trim().toLowerCase();
    const normalizedMatricula = f.matricula.trim().toLowerCase();
    if (!normalizedMatricula || !normalizedUsername) {
      toast.error("Informe uma matrícula e um nome de usuário válidos.");
      return;
    }
    if (f.senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    try {
      await requireAdminSession();
      if (alunos.some((aluno) => aluno.matricula.trim().toLowerCase() === normalizedMatricula)) {
        toast.error("Já existe um aluno cadastrado com essa matrícula.");
        return;
      }
      if (
        emailEmUso(store, normalizedEmail) ||
        alunos.some(
          (aluno) =>
            aluno.email?.trim().toLowerCase() === normalizedEmail ||
            aluno.responsavelEmail?.trim().toLowerCase() === normalizedEmail,
        )
      ) {
        toast.error("Já existe uma conta cadastrada com esse e-mail.");
        return;
      }
      if (usernameEmUso(store, normalizedUsername)) {
        toast.error("Esse nome de usuário já está em uso.");
        return;
      }
      if (
        normalizedResponsavelEmail &&
        (normalizedResponsavelEmail === normalizedEmail ||
          accounts.some(
            (account) => account.email.trim().toLowerCase() === normalizedResponsavelEmail,
          ) ||
          alunos.some(
            (aluno) =>
              aluno.email?.trim().toLowerCase() === normalizedResponsavelEmail ||
              aluno.responsavelEmail?.trim().toLowerCase() === normalizedResponsavelEmail,
          ))
      ) {
        toast.error("O e-mail do responsável já está sendo usado por outra pessoa.");
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
      const dadosAluno = {
        nome: f.nome.trim(),
        turma: f.turma,
        responsavel: f.responsavel.trim(),
        responsavelEmail: normalizedResponsavelEmail,
        whatsapp: f.whatsapp,
      };
      set((s) => ({
        ...s,
        alunos: [
          {
            id,
            ...dadosAluno,
            email: normalizedEmail,
            matricula: f.matricula.trim(),
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
            ? { ...item, responsavel: "", responsavelEmail: "", whatsapp: "" }
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
                <Label>Senha para entrar</Label>
                <input
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={f.senha}
                  onChange={(e) => setF({ ...f, senha: e.target.value })}
                  required
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
            <div>
              <Label>Responsável</Label>
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
            <PrimaryButton type="submit">Cadastrar aluno</PrimaryButton>
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

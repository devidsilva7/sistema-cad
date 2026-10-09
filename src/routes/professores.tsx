import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Label, PageShell, PrimaryButton } from "@/components/AppShell";
import { requireAdminSession } from "@/lib/admin-auth";
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

function Professores() {
  const { accounts, alunos, professores, set } = useStore();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turmas, setTurmas] = useState<string[]>([]);
  const [dt, setDt] = useState(false);

  const toggle = (t: string) =>
    setTurmas((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !username || !disciplina || !senha) {
      toast.error("Preencha nome, e-mail, nome de usuário, disciplina e senha.");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha do professor precisa ter pelo menos 8 caracteres.");
      return;
    }
    try {
      await requireAdminSession();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();
      if (
        accounts.some((account) => account.email.trim().toLowerCase() === normalizedEmail) ||
        professores.some(
          (professor) => professor.email.trim().toLowerCase() === normalizedEmail,
        ) ||
        alunos.some(
          (aluno) =>
            aluno.email?.trim().toLowerCase() === normalizedEmail ||
            aluno.responsavelEmail?.trim().toLowerCase() === normalizedEmail,
        )
      ) {
        toast.error("Já existe uma conta cadastrada com esse e-mail.");
        return;
      }
      if (
        normalizedUsername === "admin" ||
        accounts.some((account) => account.username?.trim().toLowerCase() === normalizedUsername)
      ) {
        toast.error("Esse nome de usuário já está em uso.");
        return;
      }
      const id = uid();
      const perfil = dt ? "Diretor de Turma" : "Professor";
      const account = await createLocalAccount(email, username, nome, perfil, senha);
      set((s) => ({
        ...s,
        professores: [
          { id, nome, email: email.trim().toLowerCase(), disciplina, turmas, dt },
          ...s.professores,
        ],
        accounts: [...s.accounts, account],
      }));
      setNome("");
      setEmail("");
      setUsername("");
      setSenha("");
      setDisciplina("");
      setTurmas([]);
      setDt(false);
      toast.success("Professor cadastrado e conta criada.", {
        description: `E-mail de acesso: ${account.email}. A senha definida pelo administrador já pode ser usada.`,
        duration: 15000,
      });
    } catch (error) {
      console.error("Falha ao cadastrar professor.", error);
      toast.error("Sessão administrativa inválida. Entre novamente como administrador.");
    }
  };

  const removerProfessor = async (professorId: string) => {
    const professor = professores.find((item) => item.id === professorId);
    if (
      !professor ||
      !window.confirm(`Remover o cadastro e a conta de acesso de ${professor.nome}?`)
    ) {
      return;
    }

    try {
      await requireAdminSession();
      set((current) => ({
        ...current,
        professores: current.professores.filter((item) => item.id !== professorId),
        accounts: current.accounts.filter(
          (account) => account.email !== professor.email.toLowerCase(),
        ),
      }));
      toast.success("Professor e conta de acesso removidos.");
    } catch (error) {
      console.error("Falha ao remover professor.", error);
      toast.error("Não foi possível remover o professor. Confira a sessão do administrador.");
    }
  };

  return (
    <PageShell title="Cadastrar Professores" subtitle={`${professores.length} professores`}>
      <Card>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <Label>Nome</Label>
            <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Senha inicial da conta</Label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Disciplina</Label>
            <input
              className="field"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            />
          </div>
          <div>
            <Label>E-mail de acesso</Label>
            <input
              className="field"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Nome de usuário para entrar</Label>
            <input
              className="field"
              type="text"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Turmas</Label>
            <div className="flex flex-wrap gap-2">
              {TURMAS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggle(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${turmas.includes(t) ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-xl bg-accent p-3 text-sm font-semibold text-accent-foreground">
            <input
              type="checkbox"
              checked={dt}
              onChange={(e) => setDt(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            É Diretor de Turma (DT)
          </label>
          <PrimaryButton type="submit">Cadastrar professor</PrimaryButton>
        </form>
      </Card>
      <div className="mt-5 space-y-2">
        {professores.map((p) => (
          <Card key={p.id} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold">{p.nome}</p>
              {p.dt && (
                <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-gold-foreground">
                  DT
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {p.disciplina} · {p.turmas.join(", ") || "Sem turmas"}
            </p>
            <button
              type="button"
              onClick={() => void removerProfessor(p.id)}
              className="mt-3 flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Remover professor e conta
            </button>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

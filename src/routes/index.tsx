import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { loginAdmin } from "@/lib/admin-auth";
import {
  authenticateLocalAccount,
  setLocalAccountSession,
  updateLocalAccountPassword,
  type LocalAccount,
} from "@/lib/local-accounts";
import { PERFIS, useStore, type Perfil } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Gestão Escolar LAF" },
      {
        name: "description",
        content: "Acesse o Sistema de Gestão Escolar da EEEP Luizete Albano de Freitas.",
      },
      { property: "og:title", content: "Entrar — Gestão Escolar LAF" },
      {
        property: "og:description",
        content: "Acesse o Sistema de Gestão Escolar da EEEP Luizete Albano de Freitas.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const { accounts, authReady, set, user } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Perfil>(PERFIS[0]);
  const [pendingAccount, setPendingAccount] = useState<LocalAccount | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && user) void navigate({ to: "/dashboard", replace: true });
  }, [authReady, navigate, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingAccount) {
      if (novaSenha.length < 8) {
        toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (novaSenha !== confirmarSenha) {
        toast.error("As senhas não coincidem.");
        return;
      }
      setSubmitting(true);
      try {
        const updatedAccount = await updateLocalAccountPassword(pendingAccount, novaSenha);
        set((current) => ({
          ...current,
          accounts: current.accounts.map((account) =>
            account.id === updatedAccount.id ? updatedAccount : account,
          ),
          user: {
            nome: updatedAccount.nome,
            perfil: updatedAccount.perfil,
            localAccountId: updatedAccount.id,
          },
        }));
        setLocalAccountSession(updatedAccount.id);
        await navigate({ to: "/dashboard" });
      } catch (error) {
        console.error("Falha ao atualizar a senha da conta local.", error);
        toast.error("Não foi possível salvar a nova senha.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!email.trim() || !senha || (perfil !== "Administrador" && !username.trim())) {
      toast.error(
        perfil === "Administrador"
          ? "Informe o e-mail e a senha do administrador."
          : "Informe o e-mail, o nome de usuário e a senha.",
      );
      return;
    }
    setSubmitting(true);
    try {
      if (perfil === "Administrador") {
        const result = await loginAdmin({
          data: { email, displayName: username.trim() || "Administrador", password: senha },
        });
        if (!result.authenticated) {
          toast.error("E-mail ou senha do administrador incorretos.");
          return;
        }
        set((current) => ({
          ...current,
          user: {
            nome: username.trim() || "Administrador",
            perfil: "Administrador",
          },
        }));
      } else {
        const account = await authenticateLocalAccount(
          accounts,
          email,
          username,
          senha,
          perfil,
        );
        if (!account) {
          toast.error("E-mail, senha ou perfil incorretos.");
          return;
        }
        if (account.mustChangePassword) {
          setPendingAccount(account);
          setSenha("");
          toast.info("Crie sua senha pessoal para continuar.");
          return;
        }
        setLocalAccountSession(account.id);
        set((current) => ({
          ...current,
          user: { nome: account.nome, perfil: account.perfil, localAccountId: account.id },
        }));
      }
      await navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Falha ao autenticar o administrador.", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-backdrop flex min-h-screen flex-col overflow-x-hidden">
      <div className="bg-hero hero-curve h-56 w-full shadow-[0_18px_50px_-35px_oklch(0.2_0.06_155_/_65%)]" />
      <div className="mx-auto -mt-40 w-full max-w-sm px-4 pb-10 sm:px-5">
        <div className="rounded-[1.75rem] border border-white/75 bg-card/95 p-5 shadow-[0_24px_70px_-32px_oklch(0.2_0.06_155_/_38%)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col items-center text-center">
            <img
              src="/logoeducacao.png"
              alt="Brasão EEEP LAF"
              className="h-28 w-28 rounded-full bg-white p-1 object-contain shadow-[0_0_0_1px_oklch(0.78_0.12_79_/_48%),0_12px_28px_-14px_oklch(0.2_0.06_155_/_38%)]"
            />
            <span className="mt-4 rounded-full border border-gold/25 bg-gold/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-foreground">
              Gestão Escolar
            </span>
            <h1 className="mt-3 text-base font-extrabold leading-tight tracking-tight text-primary sm:text-lg">
              EEEP Luizete Albano de Freitas - LAF
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {pendingAccount ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Primeiro acesso de {pendingAccount.nome}. Defina uma senha pessoal com pelo menos
                  8 caracteres.
                </p>
                <input
                  className="field"
                  type="password"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  disabled={submitting}
                  required={perfil !== "Administrador"}
                />
                <input
                  className="field"
                  type="password"
                  placeholder="Confirme a nova senha"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  disabled={submitting}
                  required
                />
              </>
            ) : (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="field !pl-10"
                    type="email"
                    placeholder="E-mail"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!authReady || submitting}
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="field !pl-10"
                    type="text"
                    placeholder={
                      perfil === "Administrador" ? "Nome que aparecerá no topo" : "Nome de usuário"
                    }
                    autoComplete="nickname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!authReady || submitting}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="field !pl-10"
                    type="password"
                    placeholder="Senha"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={!authReady || submitting}
                    maxLength={perfil === "Administrador" ? 8 : undefined}
                    required
                  />
                </div>
                <select
                  className="field"
                  value={perfil}
                  onChange={(e) => {
                    const selected = PERFIS.find((opcao) => opcao === e.target.value);
                    if (selected) setPerfil(selected);
                  }}
                  aria-label="Perfil"
                  disabled={!authReady || submitting}
                >
                  {PERFIS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="submit"
              disabled={(!authReady && !pendingAccount) || submitting}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-card transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:opacity-60"
            >
              {submitting
                ? pendingAccount
                  ? "Salvando..."
                  : "Verificando..."
                : pendingAccount
                  ? "Salvar senha e entrar"
                  : "Entrar no Sistema"}
            </button>
            <button
              type="button"
              onClick={() => toast("Procure a secretaria para redefinir sua senha.")}
              className="block w-full text-center text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Esqueceu a senha?
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Contas locais de alunos e professores são apenas para teste neste navegador.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Plus, Search, Trash2, X } from "lucide-react";
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
import {
  emailEmUso,
  mascaraTelefone,
  senhaTemporaria,
  soDigitos,
  usernameDoEmail,
  usernameEmUso,
} from "@/lib/cadastros";
import { createLocalAccount } from "@/lib/local-accounts";
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

const vazio = { nome: "", parentesco: PARENTESCOS[0]!, whatsapp: "", email: "", username: "" };

type Acesso = { titulo: string; linhas: { label: string; value: string }[] };

function Responsaveis() {
  const store = useStore();
  const { alunos, responsaveis, set } = store;
  const [f, setF] = useState(vazio);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [q, setQ] = useState("");

  const lista = responsaveis.filter((r) =>
    `${r.nome} ${r.email}`.toLowerCase().includes(q.toLowerCase()),
  );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = f.nome.trim();
    const email = f.email.trim().toLowerCase();
    const username = (f.username.trim() || usernameDoEmail(email)).toLowerCase();
    if (!nome || !email) {
      toast.error("Preencha o nome e o e-mail de acesso.");
      return;
    }
    if (soDigitos(f.whatsapp).length < 10) {
      toast.error("Informe um WhatsApp válido, com DDD.");
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
      const conta = await createLocalAccount(email, username, nome, "Responsável", senha, true);
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
          { label: "Senha temporária", value: senha },
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
    <PageShell title="Cadastros" subtitle={`${responsaveis.length} responsáveis cadastrados`}>
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
            <h2 className="text-base font-bold">Novo responsável</h2>
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
                />
              </Field>
              <Field label="Usuário" hint="Se deixar vazio, usamos o início do e-mail.">
                <input
                  className="field"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder={usernameDoEmail(f.email) || "ex.: maria.silva"}
                  value={f.username}
                  onChange={(e) => setF({ ...f, username: e.target.value })}
                />
              </Field>
            </div>
            <p className="rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
              Uma senha temporária é gerada ao salvar. No primeiro acesso o responsável cria a senha
              dele. Depois, vincule o responsável ao aluno na aba <b>Alunos</b>.
            </p>
            <PrimaryButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar responsável"}
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
          Novo responsável
        </button>
      )}

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
          const filhos = alunos.filter((a) => a.responsavelId === r.id);
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
                <button
                  type="button"
                  onClick={() => void remover(r.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
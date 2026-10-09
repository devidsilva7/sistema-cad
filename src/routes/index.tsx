import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-laf.jpeg.asset.json";
import { PERFIS, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Gestão Escolar LAF" },
      { name: "description", content: "Acesse o Sistema de Gestão Escolar da EEEP Luizete Albano de Freitas." },
      { property: "og:title", content: "Entrar — Gestão Escolar LAF" },
      { property: "og:description", content: "Acesse o Sistema de Gestão Escolar da EEEP Luizete Albano de Freitas." },
    ],
  }),
  component: Login,
});

function Login() {
  const { set } = useStore();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState(PERFIS[0]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !senha) return toast.error("Informe usuário e senha.");
    set((s) => ({ ...s, user: { nome: usuario, perfil } }));
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-hero hero-curve h-56 w-full" />
      <div className="mx-auto -mt-40 w-full max-w-sm px-5 pb-10">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <img src={logo.url} alt="Brasão EEEP LAF" className="h-28 w-28 object-contain" />
            <span className="mt-3 rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-foreground">
              Gestão Escolar
            </span>
            <h1 className="mt-2 text-lg font-extrabold leading-tight text-primary">EEEP Luizete Albano de Freitas - LAF</h1>
            <p className="mt-1 text-xs text-muted-foreground">Entre com suas credenciais para continuar</p>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="field !pl-9" placeholder="Usuário / Matrícula / CPF" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="field !pl-9" type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <select className="field" value={perfil} onChange={(e) => setPerfil(e.target.value)} aria-label="Perfil">
              {PERFIS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-95">
              Entrar no Sistema
            </button>
            <button type="button" onClick={() => toast("Procure a secretaria para redefinir sua senha.")} className="block w-full text-center text-xs font-medium text-muted-foreground hover:text-primary">
              Esqueceu a senha?
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">Demonstração: use qualquer usuário e senha.</p>
      </div>
    </div>
  );
}

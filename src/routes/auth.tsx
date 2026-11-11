import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — I-PlusOne" },
      { name: "description", content: "Entre no I-PlusOne para salvar seu vocabulário diário em qualquer aparelho." },
      { property: "og:title", content: "Entrar — I-PlusOne" },
      { property: "og:description", content: "Entre no I-PlusOne para salvar seu vocabulário diário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/hoje" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (s && e === "SIGNED_IN") navigate({ to: "/hoje" }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error("E-mail ou senha incorretos.");
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/hoje", data: { full_name: name } } });
        if (error) toast.error(error.message); else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) toast.error(error.message); else toast.success("Enviamos um link para redefinir sua senha.");
      }
    } finally { setBusy(false); }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar.");
  }

  const input = "w-full h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:border-primary";
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <img src={logo} alt="I-PlusOne" width={112} height={112} className="mx-auto h-28 w-28 rounded-2xl border" />
          <h1 className="text-2xl font-bold">{mode === "up" ? "Criar conta" : mode === "forgot" ? "Recuperar senha" : "Bem-vinda de volta"}</h1>
          <p className="text-sm text-muted-foreground">Uma palavra nova por vez. Todo dia.</p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          {mode !== "forgot" && (
            <>
              <button onClick={() => oauth("google")} className="w-full h-11 rounded-lg border bg-background text-sm font-medium hover:border-primary transition">Continuar com Google</button>
              <button onClick={() => oauth("lovable")} className="w-full h-11 rounded-lg border bg-background text-sm font-medium hover:border-primary transition">Continuar com Lovable</button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <input className={input} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />}
            <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {mode !== "forgot" && <input className={input} type="password" placeholder="Senha" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />}
            <button disabled={busy} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "in" ? "Entrar" : mode === "up" ? "Criar conta" : "Enviar link"}
            </button>
          </form>
          <div className="flex justify-between text-xs text-muted-foreground">
            {mode === "in" ? (
              <><button onClick={() => setMode("forgot")} className="hover:text-foreground">Esqueci a senha</button><button onClick={() => setMode("up")} className="text-primary-glow">Criar conta</button></>
            ) : (
              <button onClick={() => setMode("in")} className="text-primary-glow">Já tenho conta — entrar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

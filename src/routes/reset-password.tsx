import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — I-PlusOne" },
      { name: "description", content: "Defina uma nova senha para sua conta I-PlusOne." },
      { property: "og:title", content: "Nova senha — I-PlusOne" },
      { property: "og:description", content: "Defina uma nova senha para sua conta I-PlusOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("Senha atualizada!"); navigate({ to: "/hoje" }); }
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={save} className="w-full max-w-sm rounded-xl border bg-card p-6 space-y-4">
        <h1 className="text-xl font-bold">Nova senha</h1>
        <input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha"
          className="w-full h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:border-primary" />
        <button className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium">Salvar</button>
      </form>
    </div>
  );
}

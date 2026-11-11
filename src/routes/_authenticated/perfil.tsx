import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { LANGUAGES, LEVELS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — I-PlusOne" }, { name: "description", content: "Seu nome, idioma, nível e meta diária." }] }),
  component: Perfil,
});

function Perfil() {
  const { data: p } = useProfile();
  const update = useUpdateProfile();
  const [f, setF] = useState({ display_name: "", language: "Inglês", level: "B1", daily_goal: 10 });
  useEffect(() => { if (p) setF({ display_name: p.display_name ?? "", language: p.language, level: p.level, daily_goal: p.daily_goal }); }, [p?.id]);

  const sel = "w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary";
  return (
    <div className="space-y-6 max-w-xl">
      <div><h1 className="text-3xl font-bold tracking-tight">Perfil</h1><p className="text-muted-foreground">As frases são criadas de acordo com o seu nível.</p></div>
      <form onSubmit={async (e) => { e.preventDefault(); const err = await update(f); if (err) toast.error("Não foi possível salvar."); else toast.success("Perfil salvo."); }}
        className="rounded-xl border bg-card p-6 space-y-4">
        <Field label="Nome"><input className={sel} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></Field>
        <Field label="Idioma estudado">
          <select className={sel} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <Field label="Nível">
          <div className="grid grid-cols-6 gap-2">
            {LEVELS.map((l) => (
              <button type="button" key={l} onClick={() => setF({ ...f, level: l })} className={`h-10 rounded-lg border text-sm ${f.level === l ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary"}`}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Meta diária">
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((n) => (
              <button type="button" key={n} onClick={() => setF({ ...f, daily_goal: n })} className={`h-10 rounded-lg border text-sm ${f.daily_goal === n ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary"}`}>{n} palavras</button>
            ))}
          </div>
        </Field>
        <button className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">Salvar</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm text-muted-foreground">{label}</span>{children}</label>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileInput, RefreshCcw, Settings2 } from "lucide-react";
import { useProfile, useStudyDays, useUpdateProfile } from "@/hooks/use-profile";
import { exportFile, todayStr, type DayEntry } from "@/lib/study";
import type { WordResult } from "@/lib/sentences.functions";

export const Route = createFileRoute("/_authenticated/anki")({
  head: () => ({ meta: [{ title: "Anki — I-PlusOne" }, { name: "description", content: "Como levar seus cards para o Anki e o AnkiWeb." }] }),
  component: Anki,
});

const STEPS = [
  { icon: Download, title: "1. Baixe o arquivo", text: "Na página Hoje ou no Histórico, toque em Exportar para o Anki." },
  { icon: FileInput, title: "2. Importe no Anki", text: "Abra o Anki no computador e vá em Arquivo → Importar. Escolha o arquivo baixado." },
  { icon: Settings2, title: "3. Confira", text: "O baralho e os campos já vêm prontos. Clique em Importar." },
  { icon: RefreshCcw, title: "4. Sincronize", text: "Clique em Sincronizar para enviar os cards ao AnkiWeb e ao celular." },
];

function Anki() {
  const { data: profile } = useProfile();
  const { data: days = [] } = useStudyDays();
  const update = useUpdateProfile();
  const [deck, setDeck] = useState("");
  useEffect(() => { if (profile) setDeck(profile.deck_name); }, [profile?.deck_name]);

  function exportAll() {
    const all = days.flatMap((d) => d.results as unknown as WordResult[]);
    if (!all.length) { toast.error("Ainda não há palavras."); return; }
    exportFile({ study_date: `tudo-${todayStr()}`, deck: deck || "I-PlusOne", results: all } as DayEntry);
  }

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Anki</h1><p className="text-muted-foreground">Leve suas frases para o Anki em 4 passos.</p></div>
      <div className="grid sm:grid-cols-2 gap-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center"><Icon className="h-5 w-5 text-primary-glow" /></div>
            <div className="font-medium">{title}</div>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-medium">Configuração dos cards</h2>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Nome do baralho</span>
          <div className="flex gap-2">
            <input value={deck} onChange={(e) => setDeck(e.target.value)} className="flex-1 h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:border-primary" />
            <button onClick={async () => { await update({ deck_name: deck.trim() || "I-PlusOne" }); toast.success("Baralho salvo."); }} className="h-11 px-5 rounded-lg border hover:border-primary text-sm">Salvar</button>
          </div>
        </label>
        <div className="rounded-lg bg-secondary/50 border p-4 text-sm grid sm:grid-cols-2 gap-4">
          <div><div className="text-xs text-muted-foreground mb-1">Frente</div>Frase no idioma estudado + palavra e contexto</div>
          <div><div className="text-xs text-muted-foreground mb-1">Verso</div>Tradução + significado da palavra</div>
        </div>
        <button onClick={exportAll} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90">
          <Download className="h-4 w-4" /> Exportar todas as palavras
        </button>
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Empty } from "@/components/EmptyState";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useWords } from "@/hooks/use-profile";
import { blankOut, speak } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/revisar")({
  head: () => ({ meta: [{ title: "Revisar — I-PlusOne" }, { name: "description", content: "Revise suas palavras completando frases." }] }),
  component: Revisar,
});

const PRIORITY: Record<string, number> = { unknown: 0, new: 1, almost: 2, known: 3 };

function Revisar() {
  const { data: words = [], isLoading } = useWords();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  const queue = useMemo(
    () => [...words].sort((a, b) => (PRIORITY[a.status] ?? 1) - (PRIORITY[b.status] ?? 1) || (a.last_reviewed_at ?? "").localeCompare(b.last_reviewed_at ?? "")).slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words.length],
  );
  const w = queue[idx];

  async function rate(status: "known" | "almost" | "unknown") {
    if (!w) return;
    await supabase.from("words").update({ status, last_reviewed_at: new Date().toISOString() }).eq("id", w.id);
    setDone((d) => d + 1); setAnswer(""); setRevealed(false); setIdx((i) => i + 1);
    if (idx + 1 >= queue.length) qc.invalidateQueries({ queryKey: ["words"] });
  }

  if (isLoading) return null;
  if (words.length === 0)
    return <Empty text="Ainda não há palavras para revisar." />;
  if (!w)
    return (
      <div className="rounded-xl border bg-card p-10 text-center space-y-4">
        <Check className="h-10 w-10 mx-auto text-primary-glow" />
        <h1 className="text-2xl font-bold">Revisão concluída!</h1>
        <p className="text-muted-foreground">Você revisou {done} palavras.</p>
        <button onClick={() => { setIdx(0); setDone(0); qc.invalidateQueries({ queryKey: ["words"] }); }} className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium">Revisar de novo</button>
      </div>
    );

  const correct = answer.trim().toLowerCase() === w.word.toLowerCase();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Revisar</h1><p className="text-muted-foreground">Complete a frase com a palavra que falta.</p></div>
        <span className="text-sm text-muted-foreground">{idx + 1}/{queue.length}</span>
      </div>
      <div className="flex gap-1.5">{queue.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-primary" : i === idx ? "bg-primary-glow" : "bg-muted"}`} />)}</div>
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <p className="text-lg leading-relaxed">{blankOut(w.sentence_en, w.word)}</p>
        <p className="text-sm text-muted-foreground">{w.sentence_pt}</p>
        <form onSubmit={(e) => { e.preventDefault(); setRevealed(true); }} className="flex gap-2">
          <input autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={revealed} placeholder="Digite a palavra"
            className="flex-1 h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:border-primary" />
          {!revealed && <button className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-medium">Verificar</button>}
        </form>
        {revealed && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${correct ? "border-primary text-primary-glow" : "border-destructive"}`}>
              {correct ? "Acertou!" : "Resposta:"} <strong>{w.word}</strong> — {w.meaning}
              <button onClick={() => speak(w.sentence_en, profile?.language ?? "Inglês")} className="ml-auto text-muted-foreground hover:text-primary-glow" aria-label="Ouvir"><Volume2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => rate("unknown")} className="h-11 rounded-lg border hover:border-destructive text-sm">Não sei</button>
              <button onClick={() => rate("almost")} className="h-11 rounded-lg border hover:border-primary text-sm">Quase</button>
              <button onClick={() => rate("known")} className="h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Sei</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

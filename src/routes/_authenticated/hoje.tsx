import { createFileRoute } from "@tanstack/react-router";
import { LEVELS, asLevel } from "@/lib/level-words";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Loader2, Volume2, Eye, EyeOff, RefreshCw, Send, BookOpen } from "lucide-react";
import { generateSentences, regenerateSentence, type Rating, type WordResult } from "@/lib/sentences.functions";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useStudyDays, useUpdateProfile } from "@/hooks/use-profile";
import { CONTEXTS, CONTEXT_STYLES, RATING_LABELS, RATING_STYLES, dayScore, exportFile, parseWords, speak, todayStr, wordScore } from "@/lib/study";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({ meta: [{ title: "Hoje — I-PlusOne" }, { name: "description", content: "Suas palavras do dia no I-PlusOne." }] }),
  component: Hoje,
});

function Hoje() {
  const { data: profile } = useProfile();
  const { data: days = [] } = useStudyDays();
  const updateProfile = useUpdateProfile();
  const qc = useQueryClient();
  const gen = useServerFn(generateSentences);
  const regen = useServerFn(regenerateSentence);
  const [text, setText] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});

  const goal = profile?.daily_goal ?? 10;
  const language = profile?.language ?? "Inglês";
  const level = asLevel(profile?.level);
  const deck = profile?.deck_name ?? "I-PlusOne";
  const todayEntry = days.find((d) => d.study_date === todayStr());

  useEffect(() => {
    if (todayEntry && results.length === 0) setResults(todayEntry.results as unknown as WordResult[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry?.id]);

  const words = useMemo(() => parseWords(text), [text]);
  const count = words.length;
  const firstName = profile?.display_name?.split(" ")[0] ?? "";

  async function persist(rs: WordResult[]) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const date = todayStr();
    await supabase.from("study_days").upsert({ user_id: u.user.id, study_date: date, deck, results: rs as never }, { onConflict: "user_id,study_date" });
    await supabase.from("words").upsert(
      rs.map((r) => ({ user_id: u.user!.id, word: r.word.toLowerCase(), meaning: r.meaning, sentence_en: r.sentences[0]?.en ?? "", sentence_pt: r.sentences[0]?.pt ?? "", study_date: date })),
      { onConflict: "user_id,word", ignoreDuplicates: true },
    );
    qc.invalidateQueries({ queryKey: ["study_days"] });
    qc.invalidateQueries({ queryKey: ["words"] });
  }

  async function onGenerate() {
    setLoading(true);
    try {
      const r = await gen({ data: { words: words.slice(0, goal), language, level } });
      if (r.error) toast.error(r.error);
      else {
        // One fixed sentence per context, in order: Geral, Casual, Profissional.
        const normalized = r.results.map((w) => ({
          ...w,
          sentences: w.sentences.length === CONTEXTS.length
            ? w.sentences.map((s, i) => ({ ...s, context: CONTEXTS[i] ?? s.context }))
            : w.sentences,
        }));
        const existing = results.filter((x) => !normalized.some((n) => n.word.toLowerCase() === x.word.toLowerCase()));
        const merged = [...existing, ...normalized];
        setResults(merged); setText(""); await persist(merged);
        toast.success("Frases geradas e salvas no seu histórico.");
      }
    } catch { toast.error("Falha ao gerar frases."); }
    setLoading(false);
  }

  async function onRegen(wi: number, si: number) {
    const r = results[wi]; const s = r?.sentences[si];
    if (!r || !s) return;
    setBusyKey(`${wi}-${si}`);
    try {
      const out = await regen({ data: { word: r.word, context: s.context, avoid: s.en, language, level } });
      if (out.error || !out.sentence) toast.error(out.error ?? "Falha.");
      else {
        const next = results.map((x, i) => i !== wi ? x : { ...x, sentences: x.sentences.map((y, j) => j !== si ? y : out.sentence!) });
        setResults(next); await persist(next);
      }
    } catch { toast.error("Falha ao gerar frase."); }
    setBusyKey("");
  }

  async function onRate(wi: number, si: number, rating: Rating) {
    const next = results.map((x, i) =>
      i !== wi ? x : { ...x, rating: undefined, sentences: x.sentences.map((y, j) => (j !== si ? y : { ...y, rating })) },
    );
    setResults(next);
    await persist(next);
  }

  const total = results.length;
  const progress = Math.min(total + count, goal);
  const sentenceTotal = results.reduce((a, r) => a + r.sentences.length, 0);
  const ratedCount = results.reduce((a, r) => a + r.sentences.filter((s) => s.rating).length, 0);
  const score = dayScore(results);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary-glow">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Método i+1 · aprendizado diário
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Sua jornada de hoje{firstName && <>, <span className="text-primary-glow">{firstName}</span></>}</h1>
        <p className="text-muted-foreground">Insira até {goal} palavras novas e gere frases em contextos variados · {language} · nível {level}</p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            Lembrete diário por e-mail
            <Switch checked={!!profile?.reminder_enabled} onCheckedChange={(v) => { updateProfile({ reminder_enabled: v }); toast.success(v ? "Lembrete ativado. Os envios começam em breve." : "Lembrete desativado."); }} />
          </label>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            Nível das palavras
            <select
              value={level}
              onChange={(e) => { updateProfile({ level: e.target.value }); toast.success(`Nível ${e.target.value} selecionado.`); }}
              className="rounded-full border bg-card px-3 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Palavras do dia</span>
          <span className={`text-sm font-semibold ${total + count > goal ? "text-destructive" : "text-muted-foreground"}`}>{total + count}/{goal}</span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={"resilient\nbreakthrough\nthorough\n..."}
          className="w-full rounded-lg border bg-background px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
        <div className="flex gap-1.5">
          {Array.from({ length: goal }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < progress ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{goal - progress > 0 ? `Faltam ${goal - progress} palavras para a meta diária.` : "Meta diária completa! 🎉"}</p>
          <button onClick={onGenerate} disabled={loading || count === 0 || total + count > goal}
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Gerando..." : "Gerar Frases e Contextos"}
          </button>
        </div>
      </section>

      {results.length === 0 ? (
        <section className="rounded-xl border border-dashed p-12 text-center text-muted-foreground space-y-3">
          <BookOpen className="h-8 w-8 mx-auto" />
          <p>Comece digitando suas palavras do dia acima.</p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium">Aproveitamento do dia</p>
              <p className="text-sm text-muted-foreground">
                {ratedCount}/{sentenceTotal} frases avaliadas · Got It = 1 ponto, More or Less = 0,5, Hell No = 0 · nota máxima sempre 10
              </p>
            </div>
            <span className={`text-3xl font-bold ${ratedCount === sentenceTotal && sentenceTotal > 0 ? "text-primary-glow" : "text-muted-foreground"}`}>
              {score.toFixed(1).replace(".", ",")}<span className="text-base text-muted-foreground">/10</span>
            </span>
          </div>
          {results.map((r, wi) => (
            <div key={r.word} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-primary-glow">{r.word}</h3>
                <button onClick={() => speak(r.word, language)} aria-label="Ouvir" className="text-muted-foreground hover:text-primary-glow"><Volume2 className="h-4 w-4" /></button>
                <span className="text-sm text-muted-foreground">{r.meaning}</span>
                {(() => {
                  const ratedS = r.sentences.filter((s) => s.rating);
                  if (ratedS.length === 0) return null;
                  const best: Rating = ratedS.some((s) => s.rating === "got") ? "got" : ratedS.some((s) => s.rating === "almost") ? "almost" : "no";
                  return (
                    <span className={`ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${RATING_STYLES[best].active}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${RATING_STYLES[best].dot}`} />
                      {wordScore(r)} / {r.sentences.length} pts
                    </span>
                  );
                })()}
              </div>
              {r.sentences.map((s, si) => {
                const k = `${wi}-${si}`;
                const cs = CONTEXT_STYLES[s.context] ?? { border: "border-border", pill: "text-muted-foreground border-border bg-transparent", dot: "bg-muted" };
                return (
                  <div key={si} className={`rounded-xl border bg-secondary/40 p-4 space-y-3 ${cs.border}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${cs.pill}`}>{s.context}</span>
                      <div className="flex gap-1">
                        <IconBtn label="Ouvir" onClick={() => speak(s.en, language)}><Volume2 className="h-4 w-4" /></IconBtn>
                        <IconBtn label="Tradução" onClick={() => setShown((x) => ({ ...x, [k]: !x[k] }))}>{shown[k] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</IconBtn>
                        <IconBtn label="Gerar outra" onClick={() => onRegen(wi, si)}>{busyKey === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</IconBtn>
                      </div>
                    </div>
                    <p className="font-medium">{s.en}</p>
                    <button onClick={() => setShown((x) => ({ ...x, [k]: !x[k] }))} className={`text-sm text-left transition ${shown[k] ? "text-muted-foreground" : "text-transparent bg-muted/60 rounded select-none"}`}>
                      {s.pt}
                    </button>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(["got", "almost", "no"] as Rating[]).map((rt) => {
                        const st = RATING_STYLES[rt];
                        const active = s.rating === rt;
                        return (
                          <button key={rt} onClick={() => onRate(wi, si, rt)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              active ? st.active : "border-border bg-background/60 text-muted-foreground hover:border-primary/60"
                            }`}>
                            <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                            {RATING_LABELS[rt]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <button onClick={() => { exportFile({ study_date: todayStr(), deck, results }); toast.success("Arquivo gerado! No Anki: Arquivo → Importar, depois Sincronizar."); }}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90">
            <Send className="h-4 w-4" /> Exportar para o Anki ({deck})
          </button>
        </section>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-label={label} title={label} className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-primary-glow hover:bg-background">{children}</button>;
}

import type { Rating, WordResult } from "@/lib/sentences.functions";

export type DayEntry = { study_date: string; deck: string; results: WordResult[] };

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dstr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function streakOf(days: string[], now = new Date()) {
  const set = new Set(days);
  let n = 0;
  const d = new Date(now);
  if (!set.has(dstr(d))) d.setDate(d.getDate() - 1);
  while (set.has(dstr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function parseWords(t: string) {
  return t.split(/[\n,]+/).map((w) => w.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
}

export function exportFile(entry: DayEntry) {
  const esc = (s: string) => s.replace(/[\t\n]/g, " ");
  const lines = ["#separator:tab", "#html:true", `#deck:${entry.deck}`];
  entry.results.forEach((r) =>
    r.sentences.forEach((s) =>
      lines.push(`${esc(s.en)}<br><small>${esc(r.word)} · ${esc(s.context)}</small>\t${esc(s.pt)}<br><small>${esc(r.meaning)}</small>`),
    ),
  );
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `anki-${entry.deck.replace(/\s+/g, "-")}-${entry.study_date}.txt`;
  a.click();
}

const LANG_CODES: Record<string, string> = { "Inglês": "en-US", "Espanhol": "es-ES", "Francês": "fr-FR", "Italiano": "it-IT", "Alemão": "de-DE" };
export const LANGUAGES = Object.keys(LANG_CODES);
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function speak(text: string, language: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CODES[language] ?? "en-US";
  window.speechSynthesis.speak(u);
}

/** Replace the target word in a sentence with a blank for the review quiz. */
export function blankOut(sentence: string, word: string) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`, "i");
  return re.test(sentence) ? sentence.replace(re, "_____") : `${sentence} (_____)`;
}

export const ACHIEVEMENTS = [
  { id: "first", label: "Primeiro dia", test: (s: { streak: number; words: number; days: number }) => s.days >= 1 },
  { id: "streak7", label: "7 dias seguidos", test: (s: { streak: number; words: number; days: number }) => s.streak >= 7 },
  { id: "streak30", label: "30 dias seguidos", test: (s: { streak: number; words: number; days: number }) => s.streak >= 30 },
  { id: "words50", label: "50 palavras", test: (s: { streak: number; words: number; days: number }) => s.words >= 50 },
  { id: "words100", label: "100 palavras", test: (s: { streak: number; words: number; days: number }) => s.words >= 100 },
  { id: "words500", label: "500 palavras", test: (s: { streak: number; words: number; days: number }) => s.words >= 500 },
];

/** Daily self-rating weights: Got It = 1, More or Less = 0.5, Hell No = 0. */
export const RATING_WEIGHTS: Record<Rating, number> = { got: 1, almost: 0.5, no: 0 };
export const RATING_LABELS: Record<Rating, string> = { got: "Got It =)", almost: "More or Less =/", no: "Hell No =(" };

/** Score 0–10 for a day based on per-sentence self-ratings: each sentence is worth Got It = 1, More or Less = 0.5, Hell No = 0.
 * The base is the total number of sentences of the day, so the maximum is always 10 no matter how many sentences there are; unrated sentences count as 0. */
export function dayScore(results: WordResult[]) {
  const total = results.reduce((acc, r) => acc + r.sentences.length, 0);
  if (total === 0) return 0;
  const sum = results.reduce(
    (acc, r) => acc + r.sentences.reduce((sAcc, s) => sAcc + (s.rating ? RATING_WEIGHTS[s.rating] : 0), 0),
    0,
  );
  return Math.round((sum / total) * 100) / 10;
}

/** Points earned by one word's sentences (maximum = number of sentences). */
export function wordScore(r: WordResult) {
  return r.sentences.reduce((acc, s) => acc + (s.rating ? RATING_WEIGHTS[s.rating] : 0), 0);
}

/** Sentence contexts, one fixed sentence per word, each with its own border/pill color: Geral=purple, Casual=yellow, Profissional=blue. */
export const CONTEXTS = ["Geral", "Casual", "Profissional"] as const;

export const CONTEXT_STYLES: Record<string, { border: string; pill: string; dot: string }> = {
  Geral: { border: "border-violet-500/60", pill: "text-violet-300 border-violet-500/50 bg-violet-500/10", dot: "bg-violet-400" },
  Casual: { border: "border-amber-400/60", pill: "text-amber-300 border-amber-400/50 bg-amber-400/10", dot: "bg-amber-400" },
  Profissional: { border: "border-sky-400/60", pill: "text-sky-300 border-sky-400/50 bg-sky-400/10", dot: "bg-sky-400" },
};

/** Pill styling for the per-sentence self-rating buttons (Got It / More or Less / Hell No). */
export const RATING_STYLES: Record<Rating, { dot: string; active: string }> = {
  got: { dot: "bg-emerald-400", active: "bg-emerald-500/15 border-emerald-400 text-emerald-300" },
  almost: { dot: "bg-amber-400", active: "bg-amber-400/15 border-amber-400 text-amber-300" },
  no: { dot: "bg-rose-400", active: "bg-rose-500/15 border-rose-400 text-rose-300" },
};

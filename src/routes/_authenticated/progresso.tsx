import { createFileRoute } from "@tanstack/react-router";
import { Flame, BookOpen, CalendarDays, Trophy } from "lucide-react";
import { useStudyDays, useWords } from "@/hooks/use-profile";
import { ACHIEVEMENTS, streakOf } from "@/lib/study";
import type { WordResult } from "@/lib/sentences.functions";

export const Route = createFileRoute("/_authenticated/progresso")({
  head: () => ({ meta: [{ title: "Progresso — I-PlusOne" }, { name: "description", content: "Sua sequência, palavras e conquistas." }] }),
  component: Progresso,
});

const ds = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Progresso() {
  const { data: days = [] } = useStudyDays();
  const { data: words = [] } = useWords();
  const streak = streakOf(days.map((d) => d.study_date));
  const counts = new Map(days.map((d) => [d.study_date, (d.results as unknown as WordResult[]).length]));
  const known = words.filter((w) => w.status === "known").length;
  const stats = { streak, words: words.length, days: days.length };

  // 18 weeks heatmap ending this week
  const end = new Date(); end.setDate(end.getDate() + (6 - end.getDay()));
  const cells: { date: string; n: number; future: boolean }[] = [];
  for (let i = 18 * 7 - 1; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    cells.push({ date: ds(d), n: counts.get(ds(d)) ?? 0, future: d > new Date() });
  }
  const shade = (n: number) => n === 0 ? "bg-muted" : n < 4 ? "bg-primary/35" : n < 8 ? "bg-primary/65" : "bg-primary";

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Progresso</h1><p className="text-muted-foreground">Cada dia conta.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Flame} label="Dias seguidos" value={streak} />
        <Stat icon={BookOpen} label="Palavras" value={words.length} />
        <Stat icon={Trophy} label="Dominadas" value={known} />
        <Stat icon={CalendarDays} label="Dias de estudo" value={days.length} />
      </div>
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-medium">Atividade</h2>
        <div className="overflow-x-auto">
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
            {cells.map((c) => <div key={c.date} title={`${c.date}: ${c.n} palavras`} className={`h-3.5 w-3.5 rounded-sm ${c.future ? "opacity-0" : shade(c.n)}`} />)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">Menos {[0, 2, 5, 10].map((n) => <div key={n} className={`h-3 w-3 rounded-sm ${shade(n)}`} />)} Mais</div>
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const ok = a.test(stats);
            return (
              <div key={a.id} className={`rounded-xl border p-4 flex items-center gap-3 ${ok ? "bg-card border-primary/50" : "opacity-50"}`}>
                <Trophy className={`h-5 w-5 ${ok ? "text-primary-glow" : "text-muted-foreground"}`} /> <span className="text-sm">{a.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2">
      <Icon className="h-5 w-5 text-primary-glow" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudyDays } from "@/hooks/use-profile";
import { exportFile, type DayEntry } from "@/lib/study";
import type { WordResult } from "@/lib/sentences.functions";
import { Empty } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — I-PlusOne" }, { name: "description", content: "Todos os seus dias de estudo." }] }),
  component: Historico,
});

function Historico() {
  const { data: days = [], isLoading } = useStudyDays();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const list = days.filter((d) => !term || (d.results as unknown as WordResult[]).some((r) => r.word.toLowerCase().includes(term)));

  async function remove(id: string) {
    if (!confirm("Excluir este dia do histórico?")) return;
    await supabase.from("study_days").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["study_days"] });
    toast.success("Dia excluído.");
  }

  if (isLoading) return null;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Histórico</h1><p className="text-muted-foreground">{days.length} dias de estudo.</p></div>
      {days.length === 0 ? <Empty text="Seu histórico aparece aqui depois do primeiro dia." /> : (
        <>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar palavra..." className="w-full h-11 rounded-lg border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-3">
            {list.map((d) => {
              const rs = d.results as unknown as WordResult[];
              return (
                <div key={d.id} className="rounded-xl border bg-card">
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <button onClick={() => setOpen(open === d.id ? null : d.id)} className="min-w-0 text-left">
                      <div className="text-sm font-medium">{new Date(d.study_date + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} · {rs.length} palavras</div>
                      <div className="text-xs text-muted-foreground truncate">{rs.map((r) => r.word).join(", ")}</div>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => exportFile(d as unknown as DayEntry)} aria-label="Exportar" className="h-9 w-9 grid place-items-center rounded-lg border hover:border-primary text-primary-glow"><Download className="h-4 w-4" /></button>
                      <button onClick={() => remove(d.id)} aria-label="Excluir" className="h-9 w-9 grid place-items-center rounded-lg border hover:border-destructive text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {open === d.id && (
                    <div className="border-t px-5 py-4 space-y-3">
                      {rs.map((r) => (
                        <div key={r.word} className="text-sm">
                          <span className="font-medium text-primary-glow">{r.word}</span> <span className="text-muted-foreground">— {r.meaning}</span>
                          <ul className="mt-1 ml-4 list-disc text-muted-foreground">{r.sentences.map((s, i) => <li key={i}>{s.en}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, RotateCcw, History, BarChart3, Layers, UserRound, LogOut, Coffee, Flame, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useStudyDays } from "@/hooks/use-profile";
import { streakOf } from "@/lib/study";
import logo from "@/assets/logo.jpg";
import { LEVEL_WORDS, asLevel } from "@/lib/level-words";

const NAV = [
  { to: "/hoje", label: "Hoje", icon: Sparkles },
  { to: "/revisar", label: "Revisar", icon: RotateCcw },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/progresso", label: "Progresso", icon: BarChart3 },
  { to: "/anki", label: "Anki", icon: Layers },
] as const;

export function AppShell() {
  const { data: profile } = useProfile();
  const { data: days = [] } = useStudyDays();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const streak = streakOf(days.map((d) => d.study_date));
  const [email, setEmail] = useState("");
  const level = asLevel(profile?.level);
  const tickerWords = LEVEL_WORDS[level];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition";
  const activeCls = "bg-secondary text-primary-glow font-medium";

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card/40 backdrop-blur p-4 gap-6 sticky top-0 h-screen">
        <Link to="/hoje" className="block">
          <img src={logo} alt="I-PlusOne" width={160} height={160} className="mx-auto h-36 w-36 rounded-2xl border shadow-lg" />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={linkCls} activeProps={{ className: activeCls }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />

        <div className="space-y-3">
          <div className="rounded-lg border bg-background/40 p-3 text-xs space-y-1">
            <div className="text-muted-foreground">Sequência</div>
            <div className="flex items-center gap-1.5 font-medium"><Flame className="h-3.5 w-3.5 text-primary-glow" /> {streak} {streak === 1 ? "dia" : "dias"}</div>
          </div>
          <div className="rounded-lg border bg-background/40 p-3 text-xs space-y-1">
            <div className="text-muted-foreground">Status da conexão</div>
            <div className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" /> Anki desconectado
            </div>
          </div>
          <div className="rounded-lg border bg-background/40 p-3 text-xs space-y-1.5">
            <div className="text-muted-foreground">Status do login</div>
            <div className="flex items-center gap-2 font-medium text-primary-glow">
              <ShieldCheck className="h-3.5 w-3.5" /> Conectado
            </div>
            <div className="truncate text-muted-foreground">{email}</div>
            <button onClick={signOut} className="w-full rounded-md border px-2 py-1.5 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition">
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </div>
          <Link to="/perfil" className={linkCls} activeProps={{ className: activeCls }}>
            <UserRound className="h-4 w-4" /> <span className="truncate">{profile?.display_name ?? "Perfil"}</span>
          </Link>
        </div>
      </aside>



      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="h-14 border-b flex items-center justify-between px-4 md:justify-end">
          <Link to="/hoje" className="md:hidden flex items-center gap-2 font-semibold">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 rounded-md" /> I-PlusOne
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/perfil" className="md:hidden h-9 w-9 grid place-items-center rounded-full border" aria-label="Perfil"><UserRound className="h-4 w-4" /></Link>
            <button disabled title="Em breve" className="flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary-glow opacity-80">
              <Coffee className="h-3.5 w-3.5" /> Compre um cafezinho
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8 md:py-10">
          <Outlet />
        </main>
      </div>

      <aside className="hidden lg:flex w-40 xl:w-48 shrink-0 flex-col border-l bg-card/30 backdrop-blur sticky top-0 h-screen overflow-hidden py-4">
        <div className="px-4 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Palavras nível {level}</div>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(transparent,black_8%,black_92%,transparent)]">
          <ul className="animate-ticker space-y-6 text-center">
            {[...tickerWords, ...tickerWords].map(([w], i) => (
              <li key={i} className="text-lg xl:text-xl font-semibold text-primary-glow">{w}</li>
            ))}
          </ul>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t bg-card/95 backdrop-blur grid grid-cols-5">

        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary-glow" }}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

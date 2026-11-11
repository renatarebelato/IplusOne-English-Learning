import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, RotateCcw, BarChart3, Layers } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "I-PlusOne — vocabulário diário pelo método i+1" },
      { name: "description", content: "Aprenda palavras novas todos os dias com frases no seu nível, revisões e exportação para o Anki." },
      { property: "og:title", content: "I-PlusOne — vocabulário diário pelo método i+1" },
      { property: "og:description", content: "Frases no seu nível, revisões rápidas e exportação para o Anki." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "Frases no seu nível", text: "Cada frase traz só uma palavra nova — o resto você já entende." },
  { icon: RotateCcw, title: "Revisão rápida", text: "Complete a frase e marque o quanto você já sabe." },
  { icon: BarChart3, title: "Progresso visível", text: "Sequência de dias, mapa de atividade e conquistas." },
  { icon: Layers, title: "Direto para o Anki", text: "Exporte os cards e sincronize com o AnkiWeb." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-5xl flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2 font-semibold"><img src={logo} alt="" width={36} height={36} className="h-9 w-9 rounded-lg" /> I-PlusOne</div>
        <Link to="/auth" className="text-sm rounded-lg border px-4 py-2 hover:border-primary">Entrar</Link>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-16 md:py-24 text-center space-y-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary-glow">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Método i+1 · aprendizado diário
        </span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Uma palavra nova por vez.<br /><span className="text-primary-glow">Todo dia.</span></h1>
        <p className="max-w-xl mx-auto text-muted-foreground">Digite as palavras do dia e receba frases em contextos reais, no seu nível, com áudio e tradução. Depois revise e leve tudo para o Anki.</p>
        <Link to="/auth" className="inline-flex h-12 items-center rounded-lg bg-primary px-8 font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">Começar agora</Link>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-5 space-y-2">
              <Icon className="h-5 w-5 text-primary-glow" />
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

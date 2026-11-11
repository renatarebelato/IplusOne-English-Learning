import { Link } from "@tanstack/react-router";

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center space-y-4 text-muted-foreground">
      <p>{text}</p>
      <Link to="/hoje" className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Adicionar palavras de hoje</Link>
    </div>
  );
}

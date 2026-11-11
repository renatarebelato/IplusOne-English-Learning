import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Sentence = { context: string; en: string; pt: string; rating?: Rating };
export type Rating = "got" | "almost" | "no";
export type WordResult = { word: string; meaning: string; sentences: Sentence[]; rating?: Rating };

async function callAI(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { error: "Serviço de IA indisponível." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (res.status === 429) return { error: "Muitas requisições. Tente em instantes." };
  if (res.status === 402) return { error: "Créditos de IA esgotados." };
  if (!res.ok) return { error: "Falha ao gerar frases." };
  const json = await res.json();
  try { return { data: JSON.parse(json.choices[0].message.content) }; }
  catch { return { error: "Resposta inválida da IA." }; }
}

const base = (language: string, level: string) =>
  `You help Brazilian learners study ${language} vocabulary using Krashen's i+1 method. The learner is CEFR level ${level}: every sentence must use only vocabulary and grammar at or below ${level}, so the target word is the ONLY new element (i+1). Sentences are written in ${language}; "pt" is the Brazilian Portuguese translation.`;

const opts = z.object({ language: z.string().max(30).default("Inglês"), level: z.string().max(4).default("B1") });

export const generateSentences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { words: string[]; language?: string; level?: string }) =>
    opts.extend({ words: z.array(z.string().min(1).max(60)).min(1).max(15) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ results: WordResult[]; error?: string }> => {
    const r = await callAI(
      base(data.language, data.level) +
        ' Return JSON {"results":[{"word","meaning" (short Portuguese meaning),"sentences":[{"context" one of "Geral"|"Casual"|"Profissional","en","pt"}]}]}. Exactly 3 sentences per word, one per context, in that order: "Geral" (neutral everyday use), "Casual" (informal conversation with friends), "Profissional" (work or formal setting). The "en" field holds the sentence in the target language.',
      data.words.join("\n"),
    );
    if ("error" in r) return { results: [], error: r.error };
    return { results: r.data.results as WordResult[] };
  });

export const regenerateSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { word: string; context: string; avoid: string; language?: string; level?: string }) =>
    opts.extend({ word: z.string().min(1).max(60), context: z.string().max(30), avoid: z.string().max(500) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ sentence?: Sentence; error?: string }> => {
    const r = await callAI(
      base(data.language, data.level) + ' Return JSON {"context","en","pt"} with ONE new sentence.',
      `Word: ${data.word}\nContext: ${data.context}\nMust be different from: ${data.avoid}`,
    );
    if ("error" in r) return { error: r.error };
    return { sentence: { context: data.context, en: r.data.en, pt: r.data.pt } };
  });

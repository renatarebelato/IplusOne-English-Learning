<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Signed-in app pages live under `src/routes/_authenticated/` and share `AppShell` (sidebar on desktop, bottom bar on mobile); `/` and `/auth` are public — keeps one layout for all study pages.
- User data (profiles, study_days, words) is read/written from the browser client with owner-only RLS; AI calls go through `src/lib/sentences.functions.ts` server functions with `requireSupabaseAuth` — keeps the AI key server-side.
- Pure study rules (streak, parsing, quiz blanks) live in `src/lib/study.ts` with tests in `src/lib/__tests__/` — easy to test without UI.

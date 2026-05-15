\# 🚨 JackStudio OS — Critical Safety Rules for Claude Code



> \*\*Last updated: 2026-05-15 after a real `--force-reset` disaster.\*\*

> \*\*Read this BEFORE any database operation. No exceptions.\*\*



\---



\## 📌 Project context



\- \*\*Project\*\*: JackStudio OS (internal CMS + analytics)

\- \*\*Stack\*\*: Next.js + Prisma + Supabase auth + Vercel

\- \*\*Database\*\*: Neon PostgreSQL (Free tier)

\- \*\*PITR window\*\*: 6 hours only (Free tier limitation)

\- \*\*Main branch\*\*: `production` (ID: `br-shiny-unit-amtvenu2`)

\- \*\*Parent branch\*\*: `production\_old\_2026-05-15T10:17:00Z` — DO NOT DELETE

\- \*\*Connection pooling\*\*: Always use `-pooler` endpoint for serverless (Vercel)



\---



\## ❌ NEVER execute under ANY circumstance



These commands have caused real data loss in this project:



\- `npx prisma db push --force-reset` ← caused 2026-05-15 disaster

\- `npx prisma db push --accept-data-loss`

\- `npx prisma migrate reset`

\- `npx prisma migrate reset --force`

\- `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`

\- Any command containing `--force`, `--accept-data-loss`, `--reset`

\- Direct SQL `DELETE FROM <table>` without `WHERE` clause



\*\*No matter what error message you see, do not "fix" it with these.\*\*



\---



\## ✅ Safe commands



\- `npx prisma db push` (NO flags) — incremental schema sync, preserves data

\- `npx prisma generate` — only regenerates Prisma Client, never touches DB

\- `npx prisma migrate dev --name <descriptive\_name>` — proper migration with history

\- `npx prisma studio` — read-only inspection UI



\---



\## 🚨 When you see scary errors, DO THIS instead



\### "Drift detected" / "Database schema is not in sync"

\- ❌ DO NOT escalate to `--force-reset`

\- ✅ Run `npx prisma db pull` to see current DB state

\- ✅ Update local schema.prisma to match, OR write a proper migration

\- ✅ If unclear, STOP and ask the user



\### "Already in sync" but client errors persist

\- ✅ Just run `npx prisma generate`

\- ❌ DO NOT run `db push` again



\### Migration history mismatch

\- ✅ Inspect `\_prisma\_migrations` table first

\- ❌ DO NOT run `migrate reset`

\- ✅ Suggest creating Neon backup branch first, then ask user



\---



\## 🛡️ Before ANY destructive-sounding operation



Required pre-flight checklist:



1\. \*\*Has user explicitly confirmed?\*\* (Not just "go ahead", but explicit ack of data loss)

2\. \*\*Is there a Neon backup branch?\*\* (Create one via Console first)

3\. \*\*Is this within PITR window?\*\* (Free tier = 6h, so recovery may not work)

4\. \*\*Have I shown user the EXACT command before running?\*\*



If any answer is "no" → STOP and ask.



\---



\## 🗄️ Database recovery cheatsheet



If something goes wrong, use Neon Console:



1\. \*\*Backup \& Restore\*\* does NOT reliably do in-place restore on Free tier — verified failed 3 times on 2026-05-15

2\. \*\*Use "New Branch from Past data" instead\*\* — creates a recovery branch from WAL history

3\. Parent branch for recovery must be one with valid WAL (typically `production\_old\_\*` or older)

4\. After recovery, update `DATABASE\_URL` in Vercel to new branch's pooled connection string



\---



\## 📋 Code-level guardrails



When editing Prisma schema:



\- ✅ Always test changes locally first (`prisma db push` against a dev branch)

\- ✅ Rename columns via SQL migration, never delete-then-add

\- ✅ Use `@map()` to preserve column names across schema renames

\- ❌ Never edit production schema directly via SQL Editor



\---



\## 🤖 Tone for the user



User context:

\- Solo founder, non-technical background, bilingual EN/中文

\- Prefers Chinese answers, English code

\- Uses PowerShell on Windows

\- Already burned by `--force-reset` once — be extra cautious



If user types something risky:

\- ❌ Don't just execute

\- ✅ Explain risk, show command, get explicit "yes" before proceeding



\---



\*\*Bottom line\*\*: When in doubt, DO LESS, not more. Ask the user. A 10-minute delay is infinitely better than another 3-hour recovery session.


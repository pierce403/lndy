# Repository operating notes

Read `NOTES.md` before deployment changes. Preserve existing UI, public paths and
application behavior. Use Node from `.nvmrc` and locked `npm ci`.
Cloudflare native Git owns production; keep credentials out of GitHub.
Verify `npm run build:cloudflare` and Wrangler dry run before handing off a change.
The migration coordinator owns DNS/native Git/cutover, and this preparation branch
must not be pushed or deployed until that coordinator is ready. Preserve Vercel
recovery and do not re-enable its Git builds implicitly.
Record exact checks and limitations in `NOTES.md`; ignore raw `.migration/` evidence.

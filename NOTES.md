# Cloudflare migration notes

## 2026-10-12 preparation

Prepared from `f23f246d5782a64ba7169a9feb0087931daee6ab` on
`codex/cloudflare-migration`. The Vite frontend and contract logic are unchanged.
Worker `lndy` serves `dist`; a small Worker handles `www.lndy.org` -> `https://lndy.org`
with path/query preserved before falling through to the ASSETS binding.
Cloudflare Workers `_redirects` does not support host-based source rules; the local
redirect check caught that before deployment. Missing paths return a real 404.

Required public build variables are `VITE_THIRDWEB_CLIENT_ID` and
`VITE_LAUNCHER_CONTRACT_ADDRESS`. The build fails if absent/invalid rather than
publishing an unconfigured UI. The coordinator supplied verified existing values
via an ignored file; only those two were passed into the build subprocess.
`LNDY_REDIS_URL` and `NEYNAR_API_KEY` are not frontend environment requirements.
No server-only variable was fetched, embedded or moved. Both existing Farcaster
manifests, account association, metadata, hidden-loan list and assets are preserved.
The advertised `/api/webhook` is unimplemented and remains 404, matching production.

Validation: Node 22 build with production public values; existing Vitest suite
(3 tests); redirect/asset-fallback tests; lint (one existing Fast Refresh warning);
Wrangler dry run; local HTTP paths/manifests/404s/no-store marker and exact www
redirect; browser all five tabs and wallet chooser. Local Thirdweb RPC returns 401,
while the existing live `lndy.org` browser lists loans without errors. This is
consistent with an origin restriction and requires a custom-domain browser check
after cutover; no key/allowlist changes or chain transactions were performed.

Dependency audit reports existing critical findings in handlebars, tar, tinypool
and vitest. Framework/wallet upgrades are outside this hosting-only change; no
blanket audit fix was applied. These dependencies need a separate reviewed update.

Clean `npm ci --no-audit --no-fund` from the final lockfile succeeded under Node
22.23.3. The final Cloudflare build and Wrangler dry run were repeated after that
install. Existing application dependency versions are preserved except the required
React 19.2.6 adapter peer alignment in OSSTrust and resolved shared transitive tools.

## Deployment contract

Cloudflare native Git builds publish production after an approved push to `main`.
Use Node 22.23.3 (`.nvmrc`), install with `npm ci`, build with
`npm run build:cloudflare`, and deploy with `npx wrangler deploy`. Deployment
credentials stay in Cloudflare. `vercel.json` disables future Vercel Git builds
while the existing deployment remains the recovery source. Do not run a local
production deployment concurrently with native builds. Initial config intentionally
has no production routes; the migration coordinator owns DNS, routes and cutover.
`/deployment.json` reports `CF_COMMIT_SHA` (or the local Git commit) with `no-store`.
A local build does not establish deployment identity, DNS, TLS or production behavior.
Ignored `.migration/` contains local command logs, HTTP evidence and a screenshot.

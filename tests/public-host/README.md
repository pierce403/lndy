# Public host acceptance

The **Public host smoke** Actions workflow runs only through `workflow_dispatch`.
Wait for the selected application's native Cloudflare build to finish, then supply
its exact Git revision. There are no deployment permissions, repository secrets,
wallets, DNS overrides, TLS exceptions, write-capable credentials or schedule.

The isolated Node 22/Playwright lockfile leaves the application dependency graph
unchanged. The GitHub runner uses ordinary DNS and certificate validation. It
checks the exact no-store deployment marker, assets, real 404 and HTTP upgrades,
then Chromium user flows:

- LNDY: live loan cards from successful contract RPC reads, followed by opening
  the wallet chooser. No wallet is selected, connected, signed or funded.
- Fhtagn: quiz progression and the incorrect-answer reset. The reverse-CAPTCHA
  is not started or completed.
- OSSTrust: seeded API query counts and the search/language/claim filters.
- FOIA: `foia_mode=maintenance` (default) requires the notice, disabled write
  controls and 503 responses to empty `{}` POSTs. `foia_mode=writable` requires
  no notice, enabled controls and 400 responses to the same invalid requests.
  Writable mode is rejected for every other app. Neither mode submits a valid
  production mutation or clicks a write control. API code review confirms empty
  ideas/votes and a non-UUID comment target return before database writes or
  voter-cookie creation. Both modes reject Set-Cookie, compare public readbacks
  before/after invalid requests, and verify existing idea/comment rendering.
  Concurrent genuine user writes can invalidate the readback comparison and
  must be investigated separately. Content stays in memory; only counts/digests
  are recorded, and screenshots mask idea/comment articles. Run a FOIA mode only
  after the coordinator confirms its exact native revision and cutover state.

Artifacts retain public result metadata and screenshots for seven days. They
contain no migration snapshots or credentials. A passing workflow establishes
the selected public host's behavior from that runner. It does not erase a
separately recorded stale DNS answer on another network.

For server-rendered forms, the browser waits until initial scripts and requests
settle before entering filter values. DOMContentLoaded alone can expose an input
before React attaches its event handlers. The runner revision may differ from
the tested application's deployment revision; `expected_revision` always names
the application revision whose public marker must match.

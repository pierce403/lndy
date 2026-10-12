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
- FOIA: read-only notice, API counts, existing idea/comment rendering and disabled
  write controls. Empty `{}` POST requests must return 503 without cookies; no
  valid mutation payload is sent. Content stays in memory, and screenshots mask
  idea/comment articles. Run this choice only during the coordinated read-only
  migration window after the exact native marker is deployed.

Artifacts retain public result metadata and screenshots for seven days. They
contain no migration snapshots or credentials. A passing workflow establishes
the selected public host's behavior from that runner. It does not erase a
separately recorded stale DNS answer on another network.

For server-rendered forms, the browser waits until initial scripts and requests
settle before entering filter values. DOMContentLoaded alone can expose an input
before React attaches its event handlers. The runner revision may differ from
the tested application's deployment revision; `expected_revision` always names
the application revision whose public marker must match.

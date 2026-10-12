import assert from "node:assert/strict";
import test from "node:test";
import worker from "./index.mjs";

test("www redirects preserve path, encoded path, and query without an asset lookup", async () => {
  for (const suffix of ["/", "/missing?keep=yes", "/path%20name?a=1&a=2"]) {
    const result = await worker.fetch(new Request(`https://www.lndy.org${suffix}`), {
      ASSETS: { fetch() { throw new Error("redirect must not fetch assets"); } },
    });
    assert.equal(result.status, 301);
    assert.equal(result.headers.get("location"), `https://lndy.org${suffix}`);
  }
});

test("apex and Worker hosts preserve the asset binding's terminal 404", async () => {
  for (const host of ["lndy.org", "lndy.bcrt43.workers.dev"]) {
    const request = new Request(`https://${host}/missing`);
    const result = await worker.fetch(request, {
      ASSETS: { fetch(received) { assert.equal(received, request); return new Response("missing", { status: 404 }); } },
    });
    assert.equal(result.status, 404);
  }
});

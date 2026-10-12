import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve4 } from 'node:dns/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const sites = {
  lndy: { host: 'lndy.org', project: 'lndy' },
  fhtagn: { host: 'fhtagn.party', project: 'fhtagn.party' },
  osstrust: { host: 'osstrust.org', project: 'osstrust' },
  foia: { host: 'foia.fun', project: 'foia.fun' },
};
const app = process.env.SMOKE_APP;
const site = sites[app];
const revision = process.env.EXPECTED_REVISION;
const foiaMode = process.env.FOIA_MODE || 'maintenance';
assert.ok(site, 'SMOKE_APP must select a fixed, approved public application');
assert.match(revision ?? '', /^[0-9a-f]{40}$/, 'An exact Git revision is required');
assert.ok(['maintenance', 'writable'].includes(foiaMode), 'Invalid FOIA mode');
assert.ok(app === 'foia' || foiaMode === 'maintenance', 'Writable mode is accepted only for FOIA');
const origin = `https://${site.host}`;
const evidence = { app, origin, expected_revision: revision, started_at: new Date().toISOString(), checks: [], browser: {} };
if (app === 'foia') evidence.foia_mode = foiaMode;
let foiaIdeas = [];
let foiaComments = [];
let foiaCommentIndex = -1;
const publicDigest = rows => createHash('sha256').update(JSON.stringify([...rows].sort((a, b) => a.id.localeCompare(b.id)))).digest('hex');
await mkdir('results', { recursive: true });

async function request(path, expected = 200) {
  const url = new URL(path, origin);
  assert.equal(url.hostname, site.host, 'HTTP checks stay on the selected host');
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  evidence.checks.push({ path, status: response.status, content_type: response.headers.get('content-type'), cache_control: response.headers.get('cache-control') });
  assert.equal(response.status, expected, path);
  return response;
}

async function redirect(url, destination, status = 301) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  evidence.checks.push({ url, status: response.status, location: response.headers.get('location') });
  assert.equal(response.status, status, url);
  assert.equal(response.headers.get('location'), destination, url);
}

async function checkHttp() {
  evidence.dns_addresses = await resolve4(site.host);
  const markerResponse = await request('/deployment.json');
  assert.equal(markerResponse.headers.get('cache-control'), 'no-store');
  const marker = await markerResponse.json();
  assert.equal(marker.revision, revision);
  assert.equal(marker.project, site.project);
  evidence.marker = marker;
  const home = await (await request('/')).text();
  await request('/__migration_missing_public_smoke', 404);
  await redirect(`http://${site.host}/`, `${origin}/`);
  const assets = [...home.matchAll(/(?:src|href)="([^" ]+\.(?:js|css|woff2?)(?:\?[^" ]*)?)"/g)]
    .map(match => new URL(match[1], origin)).filter(url => url.origin === origin);
  assert.ok(assets.length, 'The homepage must reference application assets');
  for (const url of new Map(assets.map(url => [url.href, url])).values()) await request(url.pathname + url.search);
  if (app === 'lndy') {
    await redirect('https://www.lndy.org/nested/a%20b?keep=yes&n=2', `${origin}/nested/a%20b?keep=yes&n=2`);
    for (const path of ['/.well-known/farcaster.json', '/farcaster.json', '/manifest.webmanifest']) await (await request(path)).json();
    for (const path of ['/hidden.txt', '/og-card.png', '/miniapp-tile.png', '/lndy-favicon.svg']) await request(path);
    await request('/api/webhook', 404);
  } else if (app === 'fhtagn') {
    for (const path of ['/filter', '/secret', '/tentacle-bg.png']) await request(path);
    for (const category of ['ceph', 'crust']) for (let i = 1; i <= 10; i++) {
      const response = await request(`/images/${category}/${category}${i}.jpg`);
      assert.match(response.headers.get('cache-control') ?? '', /immutable/);
    }
  } else if (app === 'osstrust') {
    const queries = [['', 8], ['?q=CURL', 1], ['?language=C', 2], ['?repositoryType=Framework', 2], ['?claimState=Unclaimed', 3], ['?q=next&language=TypeScript&repositoryType=Framework&claimState=Claimed', 1], ['?q=%20CURL%20', 1], ['?q=___absent___', 0]];
    for (const [query, count] of queries) {
      const data = await (await request('/api/programs' + query)).json();
      assert.equal(data.count, count, query);
      evidence.checks.at(-1).count = data.count;
    }
  } else if (app === 'foia') {
    await redirect('https://www.foia.fun/api/ideas?migration_probe=one%20two', `${origin}/api/ideas?migration_probe=one%20two`, 308);
    const ideaResponse = await request('/api/ideas');
    assert.match(ideaResponse.headers.get('cache-control') ?? '', /no-store/);
    foiaIdeas = (await ideaResponse.json()).ideas;
    assert.ok(Array.isArray(foiaIdeas) && foiaIdeas.length > 0, 'Restored public ideas must be present');
    foiaIdeas.sort((a, b) => b.votes - a.votes || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    evidence.foia_counts = { ideas: foiaIdeas.length, comments: foiaIdeas.reduce((sum, idea) => sum + idea.commentCount, 0) };
    foiaCommentIndex = foiaIdeas.findIndex(idea => idea.commentCount > 0);
    if (foiaCommentIndex >= 0) {
      const data = await (await request(`/api/ideas/${foiaIdeas[foiaCommentIndex].id}/comments`)).json();
      foiaComments = data.comments;
      assert.equal(foiaComments.length, foiaIdeas[foiaCommentIndex].commentCount, 'Public comment count matches the idea summary');
    }
    for (const path of ['/api/ideas', '/api/ideas/not-a-uuid/comments', '/api/votes']) {
      const response = await fetch(origin + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', redirect: 'manual', signal: AbortSignal.timeout(30_000) });
      evidence.checks.push({ path, method: 'POST {}', status: response.status });
      assert.equal(response.status, foiaMode === 'maintenance' ? 503 : 400, 'Empty POST must be rejected before writes or voter-cookie creation');
      if (foiaMode === 'maintenance') {
        assert.equal(response.headers.get('retry-after'), '60');
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
      assert.equal(response.headers.get('set-cookie'), null);
    }
    // Compare only public API readbacks in memory. Persist counts/digests, not rows.
    // Concurrent genuine user writes can make this check fail without proving
    // that an invalid test request wrote data; preserve that distinction.
    const afterIdeas = (await (await request('/api/ideas')).json()).ideas;
    const beforeDigest = publicDigest(foiaIdeas);
    const afterDigest = publicDigest(afterIdeas);
    evidence.invalid_posts = { expected_status: foiaMode === 'maintenance' ? 503 : 400, set_cookie: false, public_ideas_digest_before: beforeDigest, public_ideas_digest_after: afterDigest };
    assert.ok(beforeDigest === afterDigest, 'Public idea readback changed during invalid requests; investigate concurrent writes');
    if (foiaCommentIndex >= 0) {
      const afterComments = (await (await request(`/api/ideas/${foiaIdeas[foiaCommentIndex].id}/comments`)).json()).comments;
      assert.ok(publicDigest(foiaComments) === publicDigest(afterComments), 'Public comment readback changed during invalid requests; investigate concurrent writes');
      evidence.invalid_posts.public_comment_readback_unchanged = true;
    }
  }
}

async function checkBrowser() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  const rpc = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname.endsWith('.rpc.thirdweb.com')) rpc.push({ host: url.hostname, status: response.status() });
  });
  try {
    const markerResponse = await page.goto(`${origin}/deployment.json`);
    assert.equal(markerResponse.status(), 200);
    assert.equal(JSON.parse(await page.locator('body').innerText()).revision, revision);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    if (app === 'osstrust' || app === 'foia') {
      // SSR inputs exist before the client module attaches event handlers.
      // These read-only pages have finite initial requests and no live streams.
      await page.waitForLoadState('networkidle');
      evidence.browser.readiness = 'initial scripts and requests settled before input';
    }
    if (app === 'lndy') {
      await page.getByRole('heading', { name: 'Available Loans', exact: true }).waitFor();
      await page.getByText('Requesting', { exact: true }).first().waitFor({ timeout: 90_000 });
      evidence.browser.rendered_loan_count = await page.getByText('Requesting', { exact: true }).count();
      assert.ok(evidence.browser.rendered_loan_count > 0, 'Live contract reads must render loan cards');
      assert.equal(await page.getByText('Configuration Error', { exact: true }).count(), 0);
      assert.ok(rpc.some(item => item.status === 200), 'At least one live Thirdweb RPC request must succeed');
      await page.screenshot({ path: 'results/loans.png', fullPage: true });
      await page.getByRole('button', { name: 'Connect Wallet', exact: true }).click();
      await page.getByText('Connect a wallet', { exact: true }).first().waitFor();
      await page.getByText('MetaMask', { exact: true }).first().waitFor();
      evidence.browser.wallet_chooser = 'visible; no wallet selected, connected or signed';
    } else if (app === 'fhtagn') {
      await page.getByText('Question 1 of 3', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Weak', exact: true }).click();
      await page.getByText('Question 2 of 3', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Monkeys', exact: true }).click();
      await page.getByText('Question 3 of 3', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Yes', exact: true }).click();
      await page.getByText('Question 1 of 3', { exact: true }).waitFor();
      evidence.browser.quiz = 'progression and incorrect-answer reset pass; CAPTCHA not started';
    } else if (app === 'osstrust') {
      const summary = page.locator('.filter-summary');
      await page.getByLabel('Search repositories').fill('curl');
      await summary.getByText('1 programs', { exact: true }).waitFor();
      await page.getByLabel('Search repositories').fill('');
      await page.getByLabel('Language', { exact: true }).selectOption('C');
      await summary.getByText('2 programs', { exact: true }).waitFor();
      await page.getByLabel('Claim status', { exact: true }).selectOption('Unclaimed');
      await summary.getByText('1 programs', { exact: true }).waitFor();
      evidence.browser.filters = 'curl=1; C=2; C+Unclaimed=1';
    } else if (app === 'foia') {
      const notice = page.getByRole('status').filter({ hasText: 'Posting and voting are temporarily paused while we move the board. You can still read all ideas and comments.' });
      const disabled = foiaMode === 'maintenance';
      if (disabled) await notice.waitFor();
      else assert.equal(await notice.count(), 0, 'Writable mode removes the maintenance notice');
      assert.equal(await page.getByRole('button', { name: 'Post idea', exact: true }).isDisabled(), disabled, 'Post idea matches the selected mode');
      await page.waitForFunction(count => document.querySelectorAll('article').length === count, foiaIdeas.length);
      const renderedTitles = await page.locator('article h3').allTextContents();
      assert.ok(renderedTitles.every((title, index) => title === foiaIdeas[index].title), 'All public idea headings render in API order');
      if (foiaCommentIndex >= 0) {
        const article = page.locator('article').nth(foiaCommentIndex);
        await article.getByRole('button', { name: /^Comments \(/ }).click();
        await page.waitForFunction(({ index, count }) => document.querySelectorAll('article')[index]?.querySelectorAll('p.text-sm.text-slate-100').length === count, { index: foiaCommentIndex, count: foiaComments.length });
        const bodies = await article.locator('p.text-sm.text-slate-100').allTextContents();
        assert.ok(foiaComments.every(comment => bodies.includes(comment.body)), 'Existing public comment bodies render');
        assert.equal(await article.getByRole('button', { name: 'Comment', exact: true }).isDisabled(), disabled, 'Comment control matches the selected mode');
      }
      for (const button of await page.getByRole('button', { name: /^▲/ }).all()) assert.equal(await button.isDisabled(), disabled, 'Idea and comment vote controls match the selected mode');
      evidence.browser.ideas_rendered = foiaIdeas.length;
      evidence.browser.comments_rendered = foiaComments.length;
      evidence.browser.mode = disabled ? 'maintenance notice visible; write controls disabled' : 'maintenance notice absent; write controls enabled but never clicked';
      assert.ok(!(await context.cookies()).some(cookie => cookie.name === 'foia_voter'), 'Read-only browser checks do not create a voter cookie');
      evidence.browser.voter_cookie_created = false;
    }
    evidence.browser.rpc = rpc;
    evidence.browser.page_errors = errors;
    assert.deepEqual(errors, [], 'No uncaught page errors');
    await page.screenshot({ path: 'results/browser.png', fullPage: true, mask: app === 'foia' ? [page.locator('article')] : [] });
  } finally {
    evidence.browser.page_errors = errors;
    evidence.browser.rpc = rpc;
    await page.screenshot({ path: 'results/final-state.png', fullPage: true, mask: app === 'foia' ? [page.locator('article')] : [] }).catch(() => {});
    await browser.close();
  }
}

test(`${app}: normal-DNS public HTTPS and browser acceptance`, { timeout: 240_000 }, async () => {
  try {
    await checkHttp();
    await checkBrowser();
    evidence.result = 'pass';
  } catch (error) {
    evidence.result = 'fail';
    evidence.failure = error.message;
    throw error;
  } finally {
    evidence.completed_at = new Date().toISOString();
    await writeFile('results/evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  }
});

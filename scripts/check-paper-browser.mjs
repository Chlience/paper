import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { launchBrowserPage, wait } from './browser/cdp.mjs';
import { searchPaperItems } from '../src/lib/paper-search.mjs';

const dist = path.resolve('dist');
const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(dist, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
    if (!file.startsWith(`${dist}${path.sep}`)) throw new Error('Invalid path');
    const body = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const paperPath = '/papers/2609.03501-statistical-understanding-mixture-of-experts/';
const searchItems = JSON.parse(await fs.readFile(path.join(dist, 'paper-search.json'), 'utf8'));
const expectedMoE = searchPaperItems(searchItems, 'MoE', Infinity);
const data = JSON.parse(await fs.readFile('src/generated/paper-data.json', 'utf8'));
let browser;
let checks = 0;

try {
  browser = await launchBrowserPage({ siteUrl: base, profileName: 'paper-browser-regression', width: 1440, height: 900 });
  const { page } = browser;
  const evaluate = async (expression) => {
    const result = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, message) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await evaluate(expression)) return;
      await wait(50);
    }
    throw new Error(`Timed out: ${message}`);
  };
  const navigate = async (pathname) => {
    const previousDocument = await evaluate('document.documentElement.dataset.browserDocumentId ||= crypto.randomUUID()');
    const navigation = await page.send('Page.navigate', { url: `${base}${pathname}` });
    const expectedPath = new URL(pathname, base).pathname;
    const newDocument = navigation.loaderId
      ? `document.documentElement.dataset.browserDocumentId !== ${JSON.stringify(previousDocument)}`
      : 'true';
    await until(`document.documentElement && ${newDocument} && location.pathname === ${JSON.stringify(expectedPath)} && document.readyState === 'complete' && !!document.querySelector('.site-header[data-nav-ready]')`, `ready page ${pathname}`);
    await evaluate('document.fonts.ready.then(() => true)');
  };
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const input = (selector, value, event = 'input') => evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    input.value = ${JSON.stringify(value)};
    input.dispatchEvent(new Event(${JSON.stringify(event)}, { bubbles: true }));
  })()`);
  const passed = (message) => { checks += 1; console.log(`Passed: ${message}`); };

  for (const width of [390, 768, 1440]) {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 768 });
    await navigate(paperPath);
    await until("!!document.querySelector('[data-article-toc][data-toc-ready]')", 'article TOC');
    assert.equal(await evaluate("document.querySelector('[data-paper-source-link]').href"), 'https://arxiv.org/abs/2609.03501');
    assert.equal(await evaluate("document.querySelector('[data-paper-source]').open"), false);
    assert.equal(await evaluate("document.querySelectorAll('[data-paper-figure-open]').length"), 2);
    const figure = await evaluate(`(async () => {
      const trigger = document.querySelector('[data-paper-figure-open]');
      const image = trigger.querySelector('img');
      const dialog = document.querySelector('[data-paper-figure-dialog]');
      trigger.click();
      await document.querySelector('[data-paper-figure-dialog-image]').decode();
      const opened = dialog.open && document.activeElement === dialog;
      const sourced = dialog.textContent.includes('Image Source');
      const fits = dialog.getBoundingClientRect().right <= innerWidth;
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return { opened, sourced, fits, closed: !dialog.open, focused: document.activeElement === trigger,
        stableSize: Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0,
        lazy: image.loading === 'lazy' };
    })()`);
    assert.ok(Object.values(figure).every(Boolean), JSON.stringify(figure));

    if (width <= 900) {
      await evaluate('window.scrollTo(0, 0)');
      await click('[data-toc-disclosure] > summary');
    }
    await click('[data-article-toc-link][href="#论文脉络"]');
    await until(`(() => {
      const heading = document.getElementById('论文脉络').getBoundingClientRect();
      const obstacle = ${width <= 900 ? "document.querySelector('[data-article-toc]')" : "document.querySelector('.site-header')"}.getBoundingClientRect();
      return heading.top >= obstacle.bottom && heading.top < innerHeight / 2;
    })()`, `unobstructed heading at ${width}px`);
    if (width <= 900) assert.equal(await evaluate("document.querySelector('[data-toc-disclosure]').open"), false);
    assert.equal(await evaluate("document.querySelector('[aria-current=location]').getAttribute('href')"), '#论文脉络');
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
    await navigate(`${paperPath}#source`);
    await until("document.querySelector('[data-paper-source]').open", 'source permalink opens details');
    assert.ok(await evaluate("document.querySelector('[data-paper-source]').textContent.includes('Reading scope')"));
    passed(`v3 source, figures, focus and unobstructed TOC at ${width}px`);
  }

  await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/');
  assert.ok(await evaluate("document.querySelector('.home-primary-action').getBoundingClientRect().bottom < innerHeight"));
  await click('[data-site-nav-toggle]');
  assert.equal(await evaluate("document.querySelector('[data-site-nav-toggle]').getAttribute('aria-expanded')"), 'true');
  await click('[data-site-nav-toggle]');
  passed('mobile navigation and first-screen reading entry');

  for (const width of [390, 1440]) {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    await navigate('/papers/');
    await click('[data-paper-search-open]');
    await input('[data-paper-search-input]', 'MoE');
    await until("document.querySelectorAll('[data-paper-search-result]').length === 12", 'first search page');
    assert.match(await evaluate("document.querySelector('[data-paper-search-status]').textContent"), new RegExp(`匹配 ${expectedMoE.length} 项`));
    let keyboardMore = width === 390;
    while (await evaluate("!document.querySelector('[data-paper-search-more]').hidden")) {
      assert.ok(await evaluate("(() => { const rect = document.querySelector('[data-paper-search-more]').getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; })()"), 'more results must remain visible');
      if (keyboardMore) {
        await evaluate("document.querySelector('[data-paper-search-more]').focus()");
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        await until("document.querySelectorAll('[data-paper-search-result]').length > 12", 'keyboard opens the next search page');
        keyboardMore = false;
      } else await click('[data-paper-search-more]');
    }
    const paths = await evaluate("[...document.querySelectorAll('[data-paper-search-result]')].map((item) => new URL(item.href).pathname)");
    assert.deepEqual(paths, expectedMoE.map((item) => item.path));
    assert.ok(paths.some((pathname) => pathname.startsWith('/mainlines/')));
    await input('[data-paper-search-input]', 'unlikely-no-matching-paper-987654');
    assert.equal(await evaluate("document.querySelectorAll('[data-paper-search-result]').length"), 0);
    assert.equal(await evaluate("document.querySelector('[data-paper-search-more]').hidden"), true);
    await click('[data-paper-search-close]');
    await until("!document.documentElement.classList.contains('is-search-locked')", 'closing search restores page scrolling');
    passed(`complete search results, mainlines and empty state at ${width}px`);
  }

  await navigate('/papers/?review=pending&tag=moe-architecture');
  await until("!document.querySelector('[data-directory-controls]').hidden", 'paper filters');
  const expectedPendingMoE = data.papers.filter((paper) => paper.reviewStatus === 'pending' && paper.tagIds.includes('moe-architecture'));
  assert.equal(await evaluate("[...document.querySelectorAll('.paper-row')].filter((row) => !row.hidden).length"), Math.min(24, expectedPendingMoE.length));
  await input('[data-directory-query]', 'Towards a Statistical');
  assert.equal(await evaluate("[...document.querySelectorAll('.paper-row')].filter((row) => !row.hidden).length"), 1);
  assert.ok(await evaluate("location.search.includes('review=pending') && location.search.includes('tag=moe-architecture') && new URL(location.href).searchParams.has('q')"));
  await input('[data-directory-query]', 'unlikely-no-matching-paper-987654');
  assert.equal(await evaluate("document.querySelector('[data-paper-review-empty]').hidden"), false);

  const collectDirectory = async (pathname, selector) => {
    await navigate(pathname);
    await until("!document.querySelector('[data-directory-controls]').hidden", 'directory controls');
    const urls = [];
    for (let attempt = 0; attempt < 100; attempt += 1) {
      urls.push(...await evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter((item) => !item.hidden).map((item) => (item.matches('a') ? item : item.querySelector('h3 a')).getAttribute('href'))`));
      if (await evaluate("document.querySelector('[data-directory-next]').disabled")) return urls;
      await click('[data-directory-next]');
    }
    throw new Error('Directory pagination did not finish');
  };
  const paperUrls = await collectDirectory('/papers/', '.paper-row');
  assert.deepEqual(paperUrls, data.papers.map((paper) => paper.path));
  await navigate('/papers/');
  await until("!document.querySelector('[data-directory-controls]').hidden", 'paper pagination');
  await click('[data-directory-next]');
  assert.equal(await evaluate("new URL(location.href).searchParams.get('page')"), '2');
  await evaluate('history.back()');
  await until("!new URL(location.href).searchParams.has('page') && document.querySelector('[data-directory-prev]').disabled", 'back restores the first page');
  await evaluate('history.forward()');
  await until("new URL(location.href).searchParams.get('page') === '2' && !document.querySelector('[data-directory-prev]').disabled", 'forward restores the second page');
  await navigate('/papers/?review=invalid&tag=invalid&page=invalid');
  await until("!document.querySelector('[data-directory-controls]').hidden", 'invalid paper filter normalization');
  assert.equal(await evaluate("document.querySelector('[data-directory-tag]').selectedIndex"), 0);
  assert.equal(await evaluate('location.search'), '');
  const authorUrls = await collectDirectory('/authors/', '[data-directory-item]');
  assert.equal(authorUrls.length, data.authors.length);
  assert.equal(new Set(authorUrls).size, data.authors.length);
  await input('[data-directory-query]', 'Bo Zheng');
  assert.equal(await evaluate("[...document.querySelectorAll('[data-directory-item]')].filter((card) => !card.hidden).length"), 1);
  assert.equal(await evaluate("new URL(location.href).searchParams.get('page')"), null);
  await navigate('/authors/?profile=invalid&page=invalid');
  await until("!document.querySelector('[data-directory-controls]').hidden", 'invalid author filter normalization');
  assert.equal(await evaluate("document.querySelector('[data-directory-status]').selectedIndex"), 0);
  assert.equal(await evaluate('location.search'), '');
  passed('combined paper filters, empty results, all directory pages and author search');

  await page.send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const [pathname, selector, total] of [
    ['/papers/', '.paper-row', data.papers.length],
    ['/authors/', '[data-directory-item]', data.authors.length],
  ]) {
    await page.send('Page.navigate', { url: `${base}${pathname}` });
    await until(`location.pathname === ${JSON.stringify(pathname)} && document.readyState === 'complete'`, 'directory without JavaScript');
    assert.equal(await evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter((item) => !item.hidden).length`), total);
    assert.ok(await evaluate("document.querySelector('[data-directory-controls]').hidden"));
  }
  await page.send('Emulation.setScriptExecutionDisabled', { value: false });
  passed('complete paper and author directories without JavaScript');

  await navigate('/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/');
  assert.ok(await evaluate("document.querySelector('[data-paper-figure-open]').getAttribute('href').includes('fig-2-lsa-architecture.png')"));
  await click('[data-paper-figure-open]');
  assert.equal(await evaluate("document.querySelector('[data-paper-figure-dialog]').open"), true);
  passed('legacy paper figure compatibility');
  console.log(`Browser regression passed: ${checks} checks.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

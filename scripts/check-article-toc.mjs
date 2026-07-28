import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import process from 'node:process';

const siteUrl =
  process.env.PAPER_SITE_URL ??
  'http://127.0.0.1:4321/papers/2026-07-27-kimi-k3-open-frontier-intelligence/';
const screenshotPath = process.env.PAPER_TOC_SCREENSHOT;
const viewportWidth = Number(process.env.PAPER_TOC_VIEWPORT_WIDTH ?? 1440);
const viewportHeight = Number(process.env.PAPER_TOC_VIEWPORT_HEIGHT ?? 900);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDevTools = (stream) =>
  new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(
      () => reject(new Error(`Chrome DevTools endpoint did not start. stderr: ${stderr}`)),
      10_000,
    );

    stream.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    });
  });

const connect = async (url) => {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (!data.id || !pending.has(data.id)) return;
    const request = pending.get(data.id);
    pending.delete(data.id);
    data.error ? request.reject(new Error(JSON.stringify(data.error))) : request.resolve(data.result);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const messageId = ++id;
      pending.set(messageId, { resolve, reject });
      socket.send(JSON.stringify({ id: messageId, method, params }));
    });

  return { socket, send };
};

const chrome = spawn('google-chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--remote-debugging-port=0',
  `--user-data-dir=/tmp/paper-article-toc-${process.pid}`,
  'about:blank',
]);

try {
  const browserWsUrl = await waitForDevTools(chrome.stderr);
  const browser = await connect(browserWsUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const targets = await fetch(
    browserWsUrl.replace(/^ws:/, 'http:').replace('/devtools/browser/', '/json/list?browser='),
  );
  const pages = await targets.json();
  const pageInfo = pages.find((item) => item.id === targetId);
  assert.ok(pageInfo?.webSocketDebuggerUrl, 'created page must expose a debugger URL');

  const page = await connect(pageInfo.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Page.navigate', { url: siteUrl });
  await wait(1200);

  await page.send('Runtime.evaluate', {
    expression: `(() => {
      const heading = document.getElementById('论文脉络');
      window.scrollTo(0, heading.offsetTop - 96);
    })()`,
  });
  await wait(300);

  const sectionState = await page.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const toc = document.querySelector('[data-article-toc]');
      const groups = Array.from(toc.querySelectorAll('[data-toc-group]'));
      const activeGroup = toc.querySelector('[data-toc-group][data-toc-active]');
      const activeChildren = Array.from(activeGroup.querySelectorAll('[data-toc-depth="3"]'));
      const methodChildren = activeChildren.filter((link) =>
        /^#(?:5|6)(?:-|$)/.test(link.getAttribute('href') ?? '')
      );
      const inactiveVisibleChildren = groups
        .filter((group) => group !== activeGroup)
        .flatMap((group) => Array.from(group.querySelectorAll('[data-toc-children]')))
        .filter((children) => getComputedStyle(children).display !== 'none');

      return {
        ready: toc.hasAttribute('data-toc-ready'),
        groupCount: groups.length,
        activeGroupCount: groups.filter((group) => group.hasAttribute('data-toc-active')).length,
        activeSectionId: activeGroup?.dataset.tocSectionId,
        activeChildCount: activeChildren.length,
        inactiveVisibleChildCount: inactiveVisibleChildren.length,
        currentHref: toc.querySelector('[aria-current="location"]')?.getAttribute('href'),
        targetHref: methodChildren[1]?.getAttribute('href') ?? methodChildren[0]?.getAttribute('href'),
      };
    })()`,
  });

  const section = sectionState.result.value;
  assert.equal(section.ready, true, 'the hierarchical TOC must enable its progressive disclosure behavior');
  assert.ok(section.groupCount > 1, 'the paper must expose multiple top-level sections');
  assert.equal(section.activeGroupCount, 1, 'exactly one top-level TOC group must be active');
  assert.equal(section.activeSectionId, '论文脉络', 'scrolling to the paper context must activate that TOC group');
  assert.ok(section.activeChildCount >= 5, 'the active paper context must expose its level-three headings');
  assert.equal(section.inactiveVisibleChildCount, 0, 'inactive top-level groups must keep their child lists collapsed');
  assert.equal(section.currentHref, '#论文脉络', 'the current location must initially remain on the level-two heading');
  assert.ok(section.targetHref, 'the active section must expose a child heading for the interaction check');

  await page.send('Runtime.evaluate', {
    expression: `(() => {
      const link = Array.from(
        document.querySelectorAll('[data-toc-group][data-toc-active] [data-toc-depth="3"]')
      ).find((candidate) => candidate.getAttribute('href') === ${JSON.stringify(section.targetHref)});
      const heading = document.getElementById(link.getAttribute('href').slice(1));
      window.scrollTo(0, heading.offsetTop - 96);
    })()`,
  });
  await wait(300);

  const childState = await page.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const toc = document.querySelector('[data-article-toc]');
      const groups = Array.from(toc.querySelectorAll('[data-toc-group]'));
      return {
        activeGroupCount: groups.filter((group) => group.hasAttribute('data-toc-active')).length,
        activeSectionId: toc.querySelector('[data-toc-group][data-toc-active]')?.dataset.tocSectionId,
        currentHref: toc.querySelector('[aria-current="location"]')?.getAttribute('href'),
        currentCount: toc.querySelectorAll('[aria-current="location"]').length,
      };
    })()`,
  });

  const child = childState.result.value;
  assert.equal(child.activeGroupCount, 1, 'a child heading must keep exactly one parent group active');
  assert.equal(child.activeSectionId, '论文脉络', 'a child heading must keep its paper-context parent active');
  assert.equal(child.currentHref, section.targetHref, 'the current location must advance to the visible child heading');
  assert.equal(child.currentCount, 1, 'the TOC must expose one current location to assistive technology');

  if (screenshotPath) {
    const screenshot = await page.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });
    await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
  }

  await browser.send('Target.closeTarget', { targetId });
  browser.socket.close();
  page.socket.close();
  console.log('Article hierarchical TOC check passed.');
} finally {
  chrome.kill('SIGTERM');
}

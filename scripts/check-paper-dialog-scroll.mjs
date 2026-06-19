import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import process from 'node:process';

const siteUrl = process.env.PAPER_SITE_URL ?? 'http://127.0.0.1:4321/papers/';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDevTools = (stream) =>
  new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => {
      reject(new Error(`Chrome DevTools endpoint did not start. stderr: ${stderr}`));
    }, 10_000);

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
  `--user-data-dir=/tmp/paper-dialog-scroll-${process.pid}`,
  'about:blank',
]);

try {
  const browserWsUrl = await waitForDevTools(chrome.stderr);
  const browser = await connect(browserWsUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const targets = await fetch(browserWsUrl.replace(/^ws:/, 'http:').replace('/devtools/browser/', '/json/list?browser='));
  const pages = await targets.json();
  const pageInfo = pages.find((item) => item.id === targetId);
  assert.ok(pageInfo?.webSocketDebuggerUrl, 'created page must expose a debugger URL');

  const page = await connect(pageInfo.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Page.navigate', { url: siteUrl });
  await wait(1200);

  const before = await page.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      window.scrollTo(0, 720);
      document.querySelector('[data-paper-search-open]').click();
      return window.scrollY;
    })()`,
  });

  await wait(200);
  await page.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: 20,
    y: 500,
    deltaX: 0,
    deltaY: 800,
  });
  await wait(300);

  const after = await page.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => ({
      scrollY: window.scrollY,
      dialogOpen: document.querySelector('[data-paper-search-dialog]')?.open === true,
      hasScrollLock: document.documentElement.classList.contains('is-search-locked'),
    }))()`,
  });

  assert.equal(after.result.value.dialogOpen, true, 'search dialog should remain open during the wheel event');
  assert.equal(after.result.value.hasScrollLock, true, 'opening search should mark the document as scroll locked');
  assert.equal(after.result.value.scrollY, before.result.value, 'page scroll position should not change while search is open');

  await browser.send('Target.closeTarget', { targetId });
  browser.socket.close();
  page.socket.close();
  console.log('Paper search dialog scroll lock check passed.');
} finally {
  chrome.kill('SIGTERM');
}

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import process from 'node:process';

const siteUrl =
  process.env.PAPER_SITE_URL ??
  'http://127.0.0.1:4321/papers/2605.27255-pipo-latent-multi-token-prediction/';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDevTools = (stream) =>
  new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`Chrome DevTools endpoint did not start. stderr: ${stderr}`)), 10_000);

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
  `--user-data-dir=/tmp/paper-figure-dialog-${process.pid}`,
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
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Page.navigate', { url: siteUrl });
  await wait(1200);

  const result = await page.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const prose = document.querySelector('.prose');
      const figure = document.querySelector('[data-paper-figure]');
      const trigger = document.querySelector('[data-paper-figure-open]');
      const image = trigger?.querySelector('img');
      const caption = figure?.querySelector('figcaption');
      const dialog = document.querySelector('[data-paper-figure-dialog]');
      const dialogImage = document.querySelector('[data-paper-figure-dialog-image]');
      const dialogCaption = document.querySelector('[data-paper-figure-dialog-caption]');

      const triggerRect = trigger.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();
      const imageAttrs = {
        width: image.getAttribute('width'),
        height: image.getAttribute('height'),
        loading: image.getAttribute('loading'),
        decoding: image.getAttribute('decoding'),
      };

      trigger.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const openState = {
        dialogOpen: dialog.open,
        dialogSrc: dialogImage.getAttribute('src'),
        captionText: dialogCaption.textContent,
        focusOnDialog: document.activeElement === dialog,
        hasVisibleChrome: Boolean(
          document.querySelector('[data-paper-figure-dialog-source]') ||
          document.querySelector('[data-paper-figure-dialog-close]') ||
          document.querySelector('.paper-figure-dialog-head')
        ),
        locked: document.documentElement.classList.contains('is-figure-dialog-open'),
      };

      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const closedState = {
        dialogOpen: dialog.open,
        imageSrcCleared: !dialogImage.hasAttribute('src'),
        focusRestored: document.activeElement === trigger,
        unlocked: !document.documentElement.classList.contains('is-figure-dialog-open'),
      };

      return {
        figureTag: figure?.tagName,
        captionTag: caption?.tagName,
        triggerWidth: triggerRect.width,
        proseWidth: proseRect.width,
        imageAttrs,
        openState,
        closedState,
      };
    })()`,
  });

  const value = result.result.value;
  assert.equal(value.figureTag, 'FIGURE', 'paper image must render as a figure');
  assert.equal(value.captionTag, 'FIGCAPTION', 'paper figure must render a figcaption');
  assert.ok(value.triggerWidth <= value.proseWidth + 1, 'figure image should not overflow the prose column');
  assert.deepEqual(
    value.imageAttrs,
    { width: '793', height: '231', loading: 'lazy', decoding: 'async' },
    'figure image should include stable dimensions and lazy loading hints',
  );
  assert.equal(value.openState.dialogOpen, true, 'clicking a figure should open the image dialog');
  assert.ok(value.openState.dialogSrc.includes('fig-1-pipo-overview.png'), 'dialog should show the clicked image');
  assert.ok(value.openState.captionText.includes('输入侧方法、输出侧方法与 PIPO 的比较'), 'dialog should copy the concise figure caption');
  assert.ok(value.openState.captionText.includes('Image Source'), 'dialog caption should keep image provenance');
  assert.equal(value.openState.focusOnDialog, true, 'dialog should receive focus after opening');
  assert.equal(value.openState.hasVisibleChrome, false, 'dialog should not render a header, source button, or close button');
  assert.equal(value.openState.locked, true, 'opening the dialog should lock page scrolling');
  assert.equal(value.closedState.dialogOpen, false, 'backdrop click should close the dialog');
  assert.equal(value.closedState.imageSrcCleared, true, 'closing should clear the dialog image src');
  assert.equal(value.closedState.focusRestored, true, 'closing should restore focus to the figure trigger');
  assert.equal(value.closedState.unlocked, true, 'closing should unlock page scrolling');

  await browser.send('Target.closeTarget', { targetId });
  browser.socket.close();
  page.socket.close();
  console.log('Paper figure dialog check passed.');
} finally {
  chrome.kill('SIGTERM');
}

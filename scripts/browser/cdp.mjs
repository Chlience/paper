import { spawn } from 'node:child_process';
import process from 'node:process';

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const launchBrowserPage = async ({
  siteUrl,
  profileName,
  width = 1440,
  height = 900,
}) => {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=0',
    `--user-data-dir=/tmp/${profileName}-${process.pid}`,
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
    if (!pageInfo?.webSocketDebuggerUrl) throw new Error('Created page does not expose a debugger URL.');

    const page = await connect(pageInfo.webSocketDebuggerUrl);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await page.send('Page.navigate', { url: siteUrl });
    await wait(1200);

    return {
      page,
      close: async () => {
        try {
          await browser.send('Target.closeTarget', { targetId });
        } finally {
          page.socket.close();
          browser.socket.close();
          chrome.kill('SIGTERM');
        }
      },
    };
  } catch (error) {
    chrome.kill('SIGTERM');
    throw error;
  }
};

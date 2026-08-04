import assert from 'node:assert/strict';
import process from 'node:process';
import { launchBrowserPage, wait } from './browser/cdp.mjs';

const siteUrl = process.env.PAPER_SITE_URL ?? 'http://127.0.0.1:4321/papers/';

let browserSession;
try {
  browserSession = await launchBrowserPage({
    siteUrl,
    profileName: 'paper-dialog-scroll',
    width: 1440,
    height: 900,
  });
  const { page } = browserSession;

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

  console.log('Paper search dialog scroll lock check passed.');
} finally {
  await browserSession?.close();
}

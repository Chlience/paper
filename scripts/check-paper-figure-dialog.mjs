import assert from 'node:assert/strict';
import process from 'node:process';
import { launchBrowserPage } from './browser/cdp.mjs';

const siteUrl =
  process.env.PAPER_SITE_URL ??
  'http://127.0.0.1:4321/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/';

let browserSession;
try {
  browserSession = await launchBrowserPage({
    siteUrl,
    profileName: 'paper-figure-dialog',
    width: 1280,
    height: 900,
  });
  const { page } = browserSession;

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
    { width: '996', height: '441', loading: 'lazy', decoding: 'async' },
    'figure image should include stable dimensions and lazy loading hints',
  );
  assert.equal(value.openState.dialogOpen, true, 'clicking a figure should open the image dialog');
  assert.ok(value.openState.dialogSrc.includes('fig-2-lsa-architecture.png'), 'dialog should show the clicked image');
  assert.ok(value.openState.captionText.includes('LSA 与 CSA 的架构对比'), 'dialog should copy the concise figure caption');
  assert.ok(value.openState.captionText.includes('Image Source'), 'dialog caption should keep image provenance');
  assert.equal(value.openState.focusOnDialog, true, 'dialog should receive focus after opening');
  assert.equal(value.openState.hasVisibleChrome, false, 'dialog should not render a header, source button, or close button');
  assert.equal(value.openState.locked, true, 'opening the dialog should lock page scrolling');
  assert.equal(value.closedState.dialogOpen, false, 'backdrop click should close the dialog');
  assert.equal(value.closedState.imageSrcCleared, true, 'closing should clear the dialog image src');
  assert.equal(value.closedState.focusRestored, true, 'closing should restore focus to the figure trigger');
  assert.equal(value.closedState.unlocked, true, 'closing should unlock page scrolling');

  console.log('Paper figure dialog check passed.');
} finally {
  await browserSession?.close();
}

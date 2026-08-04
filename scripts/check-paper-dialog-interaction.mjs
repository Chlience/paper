import assert from 'node:assert/strict';
import process from 'node:process';
import { launchBrowserPage } from './browser/cdp.mjs';

const siteUrl = process.env.PAPER_SITE_URL ?? 'http://127.0.0.1:4321/papers/';

let browserSession;
try {
  browserSession = await launchBrowserPage({
    siteUrl,
    profileName: 'paper-dialog-interaction',
    width: 1440,
    height: 900,
  });
  const { page } = browserSession;

  const result = await page.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const waitForResultCount = async (expectedCount) => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          const count = document.querySelectorAll('[data-paper-search-result]').length;
          if (count === expectedCount) return;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw new Error(
          \`Timed out waiting for \${expectedCount} search results; received \${document.querySelectorAll(
            '[data-paper-search-result]',
          ).length}.\`,
        );
      };

      window.scrollTo(0, 720);
      const widthBefore = document.documentElement.clientWidth;
      const headerWidthBefore = document.querySelector('.site-header')?.getBoundingClientRect().width ?? 0;
      document.querySelector('[data-paper-search-open]').click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const input = document.querySelector('[data-paper-search-input]');
      input.value = 'flashattention hbm';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForResultCount(2);

      const results = [...document.querySelectorAll('[data-paper-search-result]')];
      results[1].dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
      results[1].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const dialog = document.querySelector('[data-paper-search-dialog]');
      const resultsRoot = document.querySelector('[data-paper-search-results]');
      const smallResultMetrics = {
        dialogClientHeight: dialog.clientHeight,
        dialogScrollHeight: dialog.scrollHeight,
        resultsClientHeight: resultsRoot.clientHeight,
        resultsScrollHeight: resultsRoot.scrollHeight,
        resultsClientWidth: resultsRoot.clientWidth,
        resultsOffsetWidth: resultsRoot.offsetWidth,
        resultsScrollbarGutter: getComputedStyle(resultsRoot).scrollbarGutter,
      };

      input.value = 'rl';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const largeResultMetrics = {
        dialogClientHeight: dialog.clientHeight,
        dialogScrollHeight: dialog.scrollHeight,
        resultsClientHeight: resultsRoot.clientHeight,
        resultsScrollHeight: resultsRoot.scrollHeight,
      };

      return {
        widthBefore,
        headerWidthBefore,
        headerWidthAfter: document.querySelector('.site-header')?.getBoundingClientRect().width ?? 0,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        bodyPaddingRight: getComputedStyle(document.body).paddingRight,
        resultCount: results.length,
        activeIndexes: results
          .filter((item) => item.classList.contains('is-active'))
          .map((item) => Number(item.dataset.index)),
        selectedIndexes: results
          .filter((item) => item.getAttribute('aria-selected') === 'true')
          .map((item) => Number(item.dataset.index)),
        smallResultMetrics,
        largeResultMetrics,
      };
    })()`,
  });

  assert.equal(result.result.value.resultCount, 2, 'flashattention hbm query should produce two results');
  assert.deepEqual(result.result.value.activeIndexes, [1], 'pointer movement should move active highlight to hovered result');
  assert.deepEqual(result.result.value.selectedIndexes, [1], 'aria-selected should follow the active highlight');
  assert.equal(result.result.value.htmlOverflowY, 'hidden', 'opening search should hide the page scrollbar');
  assert.ok(parseFloat(result.result.value.bodyPaddingRight) > 0, 'page content should keep scrollbar width compensation');
  assert.ok(
    Math.abs(result.result.value.headerWidthAfter - result.result.value.headerWidthBefore) <= 1,
    'opening search should not narrow the page content behind the dialog',
  );
  assert.equal(
    result.result.value.smallResultMetrics.dialogScrollHeight,
    result.result.value.smallResultMetrics.dialogClientHeight,
    'dialog should not introduce outer scrolling for short result lists',
  );
  assert.equal(
    result.result.value.smallResultMetrics.resultsScrollHeight,
    result.result.value.smallResultMetrics.resultsClientHeight,
    'short result lists should not scroll inside the results pane',
  );
  assert.equal(
    result.result.value.smallResultMetrics.resultsOffsetWidth,
    result.result.value.smallResultMetrics.resultsClientWidth,
    'short result lists should not reserve an internal scrollbar gutter',
  );
  assert.equal(
    result.result.value.largeResultMetrics.dialogScrollHeight,
    result.result.value.largeResultMetrics.dialogClientHeight,
    'dialog should not introduce outer scrolling for long result lists',
  );
  assert.ok(
    result.result.value.largeResultMetrics.resultsScrollHeight > result.result.value.largeResultMetrics.resultsClientHeight,
    'long result lists should scroll only inside the results pane',
  );

  console.log('Paper search dialog interaction check passed.');
} finally {
  await browserSession?.close();
}

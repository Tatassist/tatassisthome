// Run after `npm run build` with Playwright available. No forms are submitted.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const output = 'homepage-check';
const origin = 'http://127.0.0.1:4321';
await mkdir(output, { recursive: true });
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'pipe' });
let browser;
const report = { viewports: [], interactions: [], failures: [], consoleErrors: [] };
const check = (name, condition) => {
  if (!condition) report.failures.push(name);
};
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert(ready, 'Preview server did not start');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => report.consoleErrors.push(error.message));
  const viewports = [[1440, 1000], [1024, 768], [768, 1024], [600, 900], [390, 844], [320, 720]];
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.th-footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo(0, 0));
    const result = await page.evaluate(() => {
      const images = [...document.images].map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, width: image.naturalWidth, height: image.naturalHeight }));
      const overflow = [...document.querySelectorAll('h1,h2,h3,p,a,summary')].filter(element => {
        if (!element.getClientRects().length || element.closest('[aria-hidden="true"]')) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 100) }));
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1s: document.querySelectorAll('h1').length, images, overflow, fonts: document.fonts.check('700 24px Oswald'), title: document.title };
    });
    report.viewports.push(result);
    check(`${width}px: HTTP status`, response.ok());
    check(`${width}px: horizontal overflow`, result.scrollWidth <= width + 1);
    check(`${width}px: text extends beyond viewport`, result.overflow.length === 0);
    check(`${width}px: one H1`, result.h1s === 1);
    check(`${width}px: loaded images`, result.images.every(image => image.loaded));
    check(`${width}px: heading font loaded`, result.fonts);
    await page.screenshot({ path: `${output}/homepage-${width}.png`, fullPage: true });
    if (width === 1440 || width === 390) await page.screenshot({ path: `${output}/hero-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  const text = await page.locator('body').innerText();
  check('No retired offer price', !text.includes('$49'));
  check('Current editions visible', ['$27', '$47', '$77'].every(price => text.includes(price)));
  const cards = page.locator('.th-edition');
  check('Three editions', await cards.count() === 3);
  const editions = [['essentials', '6'], ['working', '13'], ['complete', '22']];
  for (let i = 0; i < editions.length; i++) {
    const [edition, count] = editions[i];
    check(`${edition}: count`, (await cards.nth(i).innerText()).includes(`${count} numbered tools`));
    const href = await cards.nth(i).locator('a').getAttribute('href');
    check(`${edition}: selected sales route`, new URL(href, origin).pathname === '/lp/booked-artist' && new URL(href, origin).searchParams.get('edition') === edition);
  }
  const questions = page.locator('.th-questions details');
  for (let i = 0; i < await questions.count(); i++) {
    await questions.nth(i).locator('summary').click();
    check(`FAQ ${i + 1} opens`, await questions.nth(i).evaluate(element => element.open));
    await questions.nth(i).locator('summary').press('Enter');
    check(`FAQ ${i + 1} keyboard closes`, !(await questions.nth(i).evaluate(element => element.open)));
  }
  report.interactions.push('All FAQ disclosures open with click and close with keyboard.');
  await page.goto(`${origin}/?utm_source=homepage-test&utm_campaign=artist-launch&email=must-not-forward@example.invalid`, { waitUntil: 'networkidle' });
  const destinations = await page.locator('a[data-attribution]').evaluateAll(links => links.map(link => link.href));
  check('Campaign attribution preserved', destinations.every(href => new URL(href).searchParams.get('utm_source') === 'homepage-test'));
  check('Contact data not forwarded', destinations.every(href => !new URL(href).searchParams.has('email')));
  await page.locator('.th-hero .th-button').click();
  await page.waitForURL('**/lp/before-you-quote*');
  check('Quiz page loads', await page.locator('h1').count() === 1);
  check('Quiz route preserved', new URL(page.url()).pathname.replace(/\/$/, '') === '/lp/before-you-quote');
  report.interactions.push('Hero CTA opens the real booking-check page; whitelisted campaign attribution survives and email does not. No signup or payment is submitted.');
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Explore the system', exact: true }).click();
  check('System anchor works', new URL(page.url()).hash === '#the-system');
  report.interactions.push('System anchor scroll works; all edition links point to the matching current offer.');
  check('No browser exceptions', report.consoleErrors.length === 0);
} catch (error) {
  report.failures.push(error.stack || String(error));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  server.kill('SIGTERM');
}
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;

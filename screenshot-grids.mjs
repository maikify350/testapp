import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// V2 is already default - click Company to sort, then Name
await page.click('.k2-header-text:has-text("COMPANY")');
await page.waitForTimeout(300);
await page.click('.k2-header-text:has-text("NAME")');
await page.waitForTimeout(300);

// Enable Nested View
await page.click('.k2-nested-toggle');
await page.waitForTimeout(500);

await page.screenshot({ path: 'screenshot-v2-nested.png', fullPage: false });
console.log('V2 nested view screenshot taken');

await browser.close();

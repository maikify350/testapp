import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// Switch to TanStack (Kendo-style)
await page.selectOption('#grid-select', 'tanstack');
await page.waitForTimeout(2000);

// Click Company header to sort ascending
await page.click('text=COMPANY');
await page.waitForTimeout(500);

// Click Name header to add second sort
await page.click('text=NAME');
await page.waitForTimeout(500);

await page.screenshot({ path: 'screenshot-tanstack-multisort.png', fullPage: false });
console.log('TanStack multi-sort screenshot taken');

await browser.close();

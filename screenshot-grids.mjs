import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// Switch to TanStack (Kendo-style)
await page.selectOption('#grid-select', 'tanstack');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshot-tanstack-kendo.png', fullPage: false });
console.log('TanStack Kendo-style screenshot taken');

await browser.close();

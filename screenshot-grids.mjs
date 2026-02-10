import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// Switch to TanStack V2
await page.selectOption('#grid-select', 'tanstack-v2');
await page.waitForTimeout(2000);

// Click Company to sort asc, then Name to add second sort
await page.click('.k2-header-text:has-text("COMPANY")');
await page.waitForTimeout(300);
await page.click('.k2-header-text:has-text("NAME")');
await page.waitForTimeout(300);
await page.click('.k2-header-text:has-text("CREATED")');
await page.waitForTimeout(500);

await page.screenshot({ path: 'screenshot-v2-sortzone.png', fullPage: false });
console.log('V2 sort zone screenshot taken');

await browser.close();

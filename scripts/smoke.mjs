import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-swiftshader', '--no-first-run', '--no-default-browser-check'],
});

const page = await browser.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle0' });
await page.waitForSelector('#loading.hidden');
await page.click('[data-zone="nurse"]');
await new Promise((resolve) => setTimeout(resolve, 950));

const selected = await page.$eval('#zone-title', (element) => element.textContent);
if (selected !== '간호사실') throw new Error(`공간 전환 실패: ${selected}`);

const modeSwitchCount = await page.$$eval('[data-mode]', (elements) => elements.length);
if (modeSwitchCount !== 0) throw new Error('본인용/자녀용 전환 버튼이 남아 있습니다');

await page.click('#detail-button');
const isOpen = await page.$eval('#detail-sheet', (element) => element.classList.contains('open'));
if (!isOpen) throw new Error('상세 패널 열기 실패');

await page.screenshot({ path: 'demo-floorplan-unified.png' });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await new Promise((resolve) => setTimeout(resolve, 350));
await page.screenshot({ path: 'demo-floorplan-mobile.png' });

if (errors.length) throw new Error(`브라우저 오류: ${errors.join(' | ')}`);
console.log(JSON.stringify({ ok: true, selected, unifiedMode: true, detailOpen: isOpen, screenshots: ['demo-floorplan-unified.png', 'demo-floorplan-mobile.png'] }));
await browser.close();

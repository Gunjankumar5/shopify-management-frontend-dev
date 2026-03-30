const { chromium } = require('playwright');
(async () => {
  const url = process.env.URL || 'http://localhost:3002/?dev_auth=1';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(e=>console.error('goto err',e.message));
  await page.waitForTimeout(2000);
  // click Export nav item to load ExportPage
  try {
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(2000);
  } catch (e) {
    // ignore
  }
  const content = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    const hot = !!document.querySelector('#hot-export');
    const hotCss = !!document.querySelector('link[href*="handsontable"]');
    const hotJs = !!document.querySelector('script[src*="handsontable"]');
    return {
      title: document.title,
      hostname: window.location.hostname,
      search: window.location.search,
      dev_auth_param: params.get('dev_auth'),
      hot,
      hotCss,
      hotJs,
      body: document.body.innerText.slice(0,2000),
      htmlStart: document.documentElement.innerHTML.slice(0,1000),
    };
  });
  console.log('PAGE SNAPSHOT:', JSON.stringify(content, null, 2));
  await page.screenshot({ path: 'page_debug.png', fullPage: true }).catch(()=>{});
  await browser.close();
})();

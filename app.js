const puppeteer = require('puppeteer');
let elements = [];
let clear;
let cache = {};
let combinations = 0;

(async () => {

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await init(browser, page);

  elements = await getAllElements(page);
  let prevCount = 0;

  while (elements.length < 580) {

    console.time('mixElements');
    await mixAllElementsInLibrary(page);
    console.timeEnd('mixElements');
    console.log('update elements');
    prevCount = elements.length;
    elements = await getAllElements(page);
    console.log('#elements: ' + elements.length)
    if (prevCount === elements.length) {
      console.log('reset cache');
      console.log('=============');
      cache = {};
    }
  }
})();

mixAllElementsInLibrary = async (page) => {

  let actualCount = 0;
  let runCount = 0;

  for (const elementA of elements) {
    for (const elementB of elements) {

      runCount++;
      if (!isInCache(elementA, elementB)) {
        actualCount++;
        combinations++;
        addToCache(elementA, elementB);

        await putElementOnStage(page, elementA);
        await putElementOnStage(page, elementB);
        //wait delay(10);
        await clearWorkspace(page);
      }
    }
  }

  console.log({runCount, actualCount, combinations});
}

isInCache = (elementA, elementB) => cache[elementA] && cache[elementA][elementB];

addToCache = (elementA, elementB) => {
  cache[elementA] = cache[elementA] || {};
  cache[elementA][elementB] = true;

  cache[elementB] = cache[elementB] || {};
  cache[elementB][elementA] = true;
}

init = async(browser, page) => {
  await page.goto('https://littlealchemy.com/');

  await delay(4000);
  await page.waitForSelector('.playButton');
  await page.click('.playButton');
  await delay(1000);

  const sel = '#clearWorkspace';


  await page.evaluate(() => { document.querySelector('#notificationBox').style.display = 'none'; });
}

clearWorkspace = async (page) => {
  await page.click('#clearWorkspace');
}

putElementOnStage = async (page, elementId) => {
  //await page.focus(`#outerLibrary [data-elementid="${elementId}"] img`);

  await page.evaluate((elementId) => {
    document.querySelector(`#outerLibrary [data-elementid="${elementId}"] img`).scrollIntoView();
  }, elementId);
  const e = await page.$(`#outerLibrary [data-elementid="${elementId}"] img`);
  const box = await e.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(100, 200); // move to (100, 200) coordinates
  await page.mouse.up();
}


function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time);
  });
}

getAllElements = async (page) => {
  const sel = '#library .element:not(.finalElement)';

  return await page.evaluate((sel) => {
    let HTMLelements = Array.from(document.querySelectorAll(sel));
    console.log(HTMLElement);
    let elementsNames = HTMLelements.map(element => {
        return element.dataset.elementid;
    })
    return elementsNames;
  }, sel);
}

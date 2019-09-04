import puppeteer, { Browser } from 'puppeteer';
import express from 'express';
import dcipher from 'dcipher';
const hashDetect = require('hash-detector');
let browser: Browser;
const app = express();
const sendMessages = async ({ phone, message }) => {
  const [page] = await browser.pages();
  await page.goto('http://www.afreesms.com/intl/philippines', {
    waitUntil: 'networkidle2'
  });

  const [ids, idsT] = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const ids = inputs.map(({ id }) => id);
    const idsT = textareas.map(({ id }) => id);
    return [ids, idsT];
  });
  console.log(ids, idsT);
  const [, , mobileInputId] = ids;
  const [messageInputId] = idsT;
  console.log(mobileInputId);
  const mobileNumberSelector = `[id="${mobileInputId}"]`;
  const messageSelector = `[id="${messageInputId}"]`;
  await page.waitForSelector(mobileNumberSelector);
  await page.type(mobileNumberSelector, phone);
  await page.waitForSelector(messageSelector);
  await page.type(messageSelector, message);
  await page.waitForSelector('submit');
  await page.click('submit');
  // await browser.close();
  return 'test';
};

app.get('/send', async (req, res) => {
  const { phone, message } = req.query;

  console.log({ phone, message });
  const result = await sendMessages({ phone, message });
  res.send(result);
});
const { PORT = 5000 } = process.env;

const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}`);
    console.log(await hashDetect('97565dfc7ce34b9b8659558d2d6ca6ed'));
    console.log(await dcipher('97565dfc7ce34b9b8659558d2d6ca6ed'));
    browser = await puppeteer.launch({
      headless: false
    });
  });
};

startServer();
process.on('uncaughtException', console.log);
process.on('beforeExit', async () => {
  if (browser) await browser.close();
});

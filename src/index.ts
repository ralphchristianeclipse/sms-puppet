import puppeteer, { Browser } from 'puppeteer';
import express from 'express';
import Tesseract from 'tesseract.js';
import { resolve } from 'dns';

const { TesseractWorker }: any = Tesseract;
const worker = new TesseractWorker();

const getProgress = (img, progress) =>
  new Promise((resolve, reject) =>
    worker
      .recognize(img)
      .progress(progress)
      .then(({ text }) => {
        worker.terminate();
        resolve(text);
      })
      .catch(reject)
  );

const app = express();
const sendMessages = async ({ phone, message }, country = 'philippines') => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://www.afreesms.com/intl/${country}`, {
    waitUntil: 'networkidle2'
  });
  const navigationPromise = page.waitForNavigation();

  const [ids, idsT]: any = await page.evaluate(async () => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const ids = inputs.map(({ id }) => id);
    const idsT = textareas.map(({ id }) => id);

    return [ids, idsT];
  });

  const evaluateCaptchaText = () =>
    page.evaluate(() => {
      const getDataUrlCaptcha = async () => {
        const getImageEl = () =>
          new Promise((resolve, reject) => {
            const captchaImageEl: any = document.querySelector('#captcha');

            const reloadEl: any = document.querySelector(
              "img[alt='Reload the image']"
            );
            reloadEl.click();
            captchaImageEl.onload = () => {
              resolve(captchaImageEl);
            };
            captchaImageEl.onerror = reject;
          });
        const getDataUrl = img => {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          // If the image is not png, the format
          // must be specified here
          return canvas.toDataURL();
        };
        const el = await getImageEl();
        const url = getDataUrl(el);
        return url;
      };
      return getDataUrlCaptcha();
    });
  const getCaptchaText = async () => {
    const url = await evaluateCaptchaText();
    const text: string = (await getProgress(url, console.log)) as string;
    const captchaText = text.slice(0, 6);
    console.log({ captchaText, text });
    if (!text || !captchaText || Number.isNaN(+captchaText)) {
      await evaluateCaptchaText();
    }
    return captchaText;
  };
  const captchaText = await getCaptchaText();
  const [, , mobileInputId, , captchaInputId] = ids;
  const [messageInputId] = idsT;
  const mobileNumberSelector = `[id="${mobileInputId}"]`;
  const messageSelector = `[id="${messageInputId}"]`;
  const captchaSelector = `[id="${captchaInputId}"]`;
  await page.waitForSelector(mobileNumberSelector);
  await page.type(mobileNumberSelector, phone);
  await page.waitForSelector(messageSelector);
  await page.type(messageSelector, message);
  await page.waitForSelector(captchaSelector);
  await page.type(captchaSelector, captchaText);
  await page.waitForSelector('table #submit');
  await page.click('table #submit');
  await navigationPromise;
  await browser.close();
  return captchaText;
};

app.get('/send', async (req, res) => {
  const { phone, message } = req.query;
  try {
    console.log({ phone, message });
    const result = await sendMessages({ phone, message });
    res.send(result);
  } catch (e) {
    res.send({ error: e.message });
  }
});
const { PORT = 5000 } = process.env;

const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};

startServer();
process.on('uncaughtException', console.log);

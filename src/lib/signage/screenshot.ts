import { existsSync } from 'fs';
import type { Browser } from 'puppeteer-core';

/**
 * 素材「轉檔」截圖工具
 *
 * 用真實的無頭 Chromium 渲染素材 HTML（與電視盒/前台 iframe 完全相同的畫面），
 * 再截成 PNG。比 html2canvas 之類的 DOM 重繪還原度高（字體、背景圖、CSS transform 都正確）。
 *
 * 執行環境：
 *   - Vercel / Lambda（Linux serverless）：使用 @sparticuz/chromium 提供的無頭 Chromium。
 *   - 本機開發：使用系統已安裝的 Chrome（@sparticuz/chromium 只附 Linux 二進位，無法在 Windows/macOS 跑）。
 *     可用環境變數 SIGNAGE_CHROME_PATH 指定 chrome.exe 路徑。
 */

// 本機開發時尋找系統 Chrome 的候選路徑（依序檢查，找到即用）
const LOCAL_CHROME_CANDIDATES: string[] = [
  process.env.SIGNAGE_CHROME_PATH || '',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function findLocalChrome(): string | null {
  for (const p of LOCAL_CHROME_CANDIDATES) {
    try {
      if (existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import('puppeteer-core');
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const localPath = findLocalChrome();
  if (!localPath) {
    throw new Error(
      '找不到本機 Chrome，無法截圖。請安裝 Google Chrome，或設定環境變數 SIGNAGE_CHROME_PATH 指向 chrome.exe。',
    );
  }
  return puppeteer.launch({
    executablePath: localPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export interface ShotResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// 電視盒包裝器（_tv.ts）會在頁尾 script 內嵌入設計畫布尺寸：
//   var DESIGN_W = 1080, DESIGN_H = 1528;
// 直接讀這兩個值就能取得該版型的原生畫布尺寸（1920×1080 / 1080×1528 / 1528×1080）。
const DESIGN_RE = /DESIGN_W\s*=\s*(\d+)\s*,\s*DESIGN_H\s*=\s*(\d+)/;

export function detectCanvas(html: string): { width: number; height: number } | null {
  const m = html.match(DESIGN_RE);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!width || !height) return null;
  return { width, height };
}

/**
 * 把指定網址（素材代理 URL）渲染後截成 PNG。
 * @param url  可被 Chromium 直接載入的素材網址（含絕對的靜態資源路徑）
 * @param html 該素材的 HTML 原文，用來偵測設計畫布尺寸
 */
export async function screenshotAssetUrl(url: string, html: string): Promise<ShotResult> {
  const detected = detectCanvas(html);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    // 偵測得到畫布：直接把 viewport 設成原生尺寸。
    // 電視盒 script 會以 min(vw/W, vh/H) 縮放並置中 → viewport=W×H 時 scale=1、offset=0，
    // .frame 剛好填滿 viewport，截圖即為原生解析度、無黑邊、不變形。
    let width = detected?.width ?? 1920;
    let height = detected?.height ?? 1080;
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    // 等網頁字體載入完成，避免字型尚未套用就截圖
    try {
      await page.evaluate(async () => {
        const d = document as unknown as { fonts?: { ready?: Promise<unknown> } };
        if (d.fonts?.ready) await d.fonts.ready;
      });
    } catch {
      /* 某些瀏覽器不支援 document.fonts，略過 */
    }

    if (detected) {
      const buffer = (await page.screenshot({ type: 'png' })) as Buffer;
      return { buffer, width, height };
    }

    // 未偵測到設計畫布（例如直接上傳的 HTML 或流式版面）：
    // 先嘗試量測 .frame 的版型尺寸（transform 不改變 layout box，offsetWidth/Height 仍為設計尺寸）
    const box = await page.evaluate(() => {
      const el = document.querySelector('.frame') as HTMLElement | null;
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        return { w: el.offsetWidth, h: el.offsetHeight };
      }
      return null;
    });

    if (box) {
      width = box.w;
      height = box.h;
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      // 觸發縮放腳本重新置中（scale=1、offset=0）
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await new Promise((r) => setTimeout(r, 200));
      const buffer = (await page.screenshot({ type: 'png' })) as Buffer;
      return { buffer, width, height };
    }

    // 流式版面（如廣告機每日版）：整頁截圖
    const dims = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    const buffer = (await page.screenshot({ type: 'png', fullPage: true })) as Buffer;
    return { buffer, width: dims.w || width, height: dims.h || height };
  } finally {
    await browser.close();
  }
}

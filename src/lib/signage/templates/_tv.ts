/**
 * 電視盒（TV）版包裝器
 *
 * 參考 VIS_世界_電視版（vis_tv）的做法：不改動既有版型的「設計畫布」內容，
 * 只在外層把固定像素的 .frame 改為「依視窗百分比等比縮放並置中」，
 * 讓邊框尺寸由 viewport 百分比決定，而非絕對像素。
 *
 * 做法（純後處理既有 HTML，零風險，不動內容產生邏輯）：
 *   1. 於 <head> 結尾追加一段樣式（最後宣告，覆蓋先前的固定像素規則）：
 *        - html/body 改為 100vw × 100vh、overflow:hidden
 *        - .frame 保持設計尺寸，加上 transform-origin + transform:scale(100vw/W) 作為 CSS 後援
 *   2. 於 </body> 前插入一段 script：依視窗精算 scale=min(vw/W, vh/H)，
 *      並 translate 置中（非 16:9 螢幕自動留邊置中、不裁切、不偏角落）。
 *
 * 不覆蓋背景色：各版型原本的 body 背景（透明或品牌色）保留，
 * 留邊區域即沿用原背景，避免破壞像 vis_edm 這種「背景畫在 body」的版型。
 */

/** 把一份既有 EDM HTML 轉成電視盒等比縮放版 */
export function toTvHtml(html: string, designW: number, designH: number): string {
  const tvStyle = `
    <style>
        /* === 電視盒適配：邊框改用百分比/viewport 縮放，不再用絕對像素 === */
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
        }
        .frame {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            transform-origin: top left !important;
            /* 後援縮放比（以寬度為基準）；實際比例由頁尾 script 依視窗精算後覆寫 */
            transform: scale(calc(100vw / ${designW})) !important;
        }
    </style>`;

  const tvScript = `
    <script>
    /* 電視盒等比縮放：把 ${designW}×${designH} 設計畫布等比縮放並置中，填滿視窗（不裁切） */
    (function () {
        var DESIGN_W = ${designW}, DESIGN_H = ${designH};
        function fitScreen() {
            var c = document.querySelector('.frame');
            if (!c) return;
            var vw = window.innerWidth, vh = window.innerHeight;
            var scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
            var offsetX = (vw - DESIGN_W * scale) / 2;
            var offsetY = (vh - DESIGN_H * scale) / 2;
            c.style.transform =
                'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
        }
        window.addEventListener('resize', fitScreen);
        window.addEventListener('orientationchange', fitScreen);
        window.addEventListener('load', fitScreen);
        if (document.readyState !== 'loading') fitScreen();
        else document.addEventListener('DOMContentLoaded', fitScreen);
    })();
    </script>`;

  let out = html.includes('</head>')
    ? html.replace('</head>', `${tvStyle}\n</head>`)
    : tvStyle + html;
  out = out.includes('</body>')
    ? out.replace('</body>', `${tvScript}\n</body>`)
    : out + tvScript;
  return out;
}

/**
 * 由一個既有的 convert 函式衍生出對應的「電視版」convert 函式：
 * 內容完全相同，只是外層套上等比縮放、檔名加 _TV。
 */
export function makeTvConvert<M, T extends { filename: string; html: string }>(
  base: (meals: M) => T[],
  designW: number,
  designH: number,
): (meals: M) => T[] {
  return (meals: M) =>
    base(meals).map((m) => ({
      ...m,
      filename: m.filename.replace(/\.html$/, '_TV.html'),
      html: toTvHtml(m.html, designW, designH),
    }));
}

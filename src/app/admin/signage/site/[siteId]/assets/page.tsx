'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { matchFilename } from '@/lib/signage/filenameFilter';

interface Asset {
  id: number;
  filename: string;
  blob_url: string;
  description: string | null;
  upload_timestamp: string;
}

interface TemplateMeta {
  key: string;
  displayName: string;
  customer: string;
  description: string;
}

// ===== 重點檢視：從菜單 HTML 解析出可編輯的欄位（餐廳／中文菜名／英文名／圖片／價格） =====
// 作法：用 DOMParser 把整份 HTML 解析成 DOM，找出每道菜的節點並標記 data-focus-id。
// 編輯時只改這些節點的文字／圖片網址，再把整份 DOM 重新序列化，
// 其餘（CSS、頁頭頁尾、script…）都保留在 DOM 中不會遺失。

interface FocusField {
  id: string | null;   // 對應 DOM 節點的 data-focus-id；null = 此版型沒有這個欄位
  value: string;
  editable: boolean;
}
interface FocusRow {
  restaurant: FocusField;
  chinese: FocusField;
  english: FocusField;
  image: FocusField;
  price: FocusField;
}

const EMPTY_FIELD: FocusField = { id: null, value: '', editable: false };
let focusIdCounter = 0;

function assignFocusId(node: Element): string {
  let id = node.getAttribute('data-focus-id');
  if (!id) {
    id = `f${focusIdCounter++}`;
    node.setAttribute('data-focus-id', id);
  }
  return id;
}

// 取節點內第一個「有文字」的 text node（避開像 period-display 那種附加 <span>）
function primaryTextNode(node: Element): Text | null {
  const doc = node.ownerDocument;
  const walker = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let first: Text | null = null;
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (first === null) first = t;
    if (t.nodeValue && t.nodeValue.trim()) return t;
  }
  return first;
}

function readNode(node: Element): string {
  if (node.tagName === 'IMG') return node.getAttribute('src') ?? '';
  const t = primaryTextNode(node);
  return (t?.nodeValue ?? node.textContent ?? '').trim();
}

function writeNode(node: Element, value: string): void {
  if (node.tagName === 'IMG') { node.setAttribute('src', value); return; }
  const t = primaryTextNode(node);
  if (t) t.nodeValue = value;
  else node.textContent = value;
}

function makeField(node: Element | null): FocusField {
  if (!node) return { ...EMPTY_FIELD };
  return { id: assignFocusId(node), value: readNode(node), editable: true };
}

// 在 scope 內找一張「菜色圖片」，排除編號／logo／QR 等裝飾圖
function pickImage(scope: Element): Element | null {
  const imgs = Array.from(scope.querySelectorAll('img'));
  return imgs.find(img => !/badge|number|logo|qr|icon|separator/i.test(img.className || '')) ?? null;
}

function findRestaurantNode(row: Element): Element | null {
  // 1) 列內（spotlight 版型）
  const inRow = row.querySelector('[class*="restaurant-tag"], [class*="restaurant-name"], [class*="restaurant-group-header"]');
  if (inRow) return inRow;
  // 2) 祖先的 restaurant-section（common 版型，餐廳名為整區共用）
  const section = row.closest('[class*="restaurant-section"]');
  if (section) {
    const r = section.querySelector('[class*="restaurant-name"], [class*="restaurant-tag"]');
    if (r) return r;
  }
  // 3) 往前找標題（menu-list 版型用 restaurant-group-header）
  let el: Element | null = row;
  while (el) {
    let prev = el.previousElementSibling;
    while (prev) {
      if (/restaurant/i.test(prev.className || '')) return prev;
      const inner = prev.querySelector('[class*="restaurant"]');
      if (inner) return inner;
      prev = prev.previousElementSibling;
    }
    el = el.parentElement;
  }
  return null;
}

function findImageNode(row: Element): Element | null {
  const inRow = pickImage(row);
  if (inRow) return inRow;
  const section = row.closest('[class*="restaurant-section"], [class*="spotlight-item"], [class*="menu-content"]');
  if (section) {
    const img = pickImage(section);
    if (img) return img;
  }
  return null;
}

// 清單區（menu-list）重建用的結構範本
interface ListTemplates {
  header: Element | null;  // restaurant-group-header 的乾淨複本
  item: Element | null;    // menu-list-item 的乾淨複本
}

const SPOTLIGHT_PRICE_SEL = '[class*="spotlight-price"]:not([class*="prefix"]):not([class*="block"])';

function parseFocusRows(html: string): {
  doc: Document;
  rows: FocusRow[];
  supported: boolean;
  spotlightMode: boolean;
  templates: ListTemplates;
} {
  focusIdCounter = 0;
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const spotlightItems = Array.from(doc.querySelectorAll('[class*="spotlight-item"]'));
  const listItems = Array.from(doc.querySelectorAll('[class*="menu-list-item"]'));
  // 同時有「spotlight 輪播」與「側邊清單」→ 以 spotlight 為資料來源，側邊清單由它重建
  const spotlightMode = spotlightItems.length > 0 && listItems.length > 0;

  const rows: FocusRow[] = [];
  const templates: ListTemplates = { header: null, item: null };

  if (spotlightMode) {
    for (const item of spotlightItems) {
      const nameNode = item.querySelector('[class*="chinese-name"]:not([class*="english"])');
      if (!nameNode) continue;
      rows.push({
        restaurant: makeField(item.querySelector('[class*="restaurant-tag"], [class*="restaurant-name"]')),
        chinese: makeField(nameNode),
        english: makeField(item.querySelector('[class*="english-name"]')),
        image: makeField(pickImage(item)),
        price: makeField(item.querySelector(`${SPOTLIGHT_PRICE_SEL}, [class*="price-number"]`)),
      });
    }
    // 擷取側邊清單的結構範本（去掉 data-focus-id 與 active）
    const headerEl = doc.querySelector('[class*="restaurant-group-header"]');
    templates.header = headerEl ? (headerEl.cloneNode(true) as Element) : null;
    templates.item = listItems[0] ? (listItems[0].cloneNode(true) as Element) : null;
    for (const t of [templates.header, templates.item]) {
      if (!t) continue;
      t.querySelectorAll('[data-focus-id]').forEach(el => el.removeAttribute('data-focus-id'));
      t.removeAttribute('data-focus-id');
      t.classList?.remove('active');
    }
  } else {
    // 泛用解析（單一清單版型）：以每道菜的「中文菜名／品項名」當列錨點
    const nameNodes = Array.from(
      doc.querySelectorAll('[class*="chinese-name"], [class*="item-name"]'),
    ).filter(n => !/english/i.test(n.className || ''));
    const seen = new Set<Element>();
    for (const nameNode of nameNodes) {
      if (seen.has(nameNode)) continue;
      seen.add(nameNode);
      const row =
        (nameNode.closest('[class*="menu-row"], [class*="spotlight-item"], [class*="menu-list-item"]') as Element | null) ||
        nameNode.parentElement!;
      rows.push({
        restaurant: makeField(findRestaurantNode(row)),
        chinese: makeField(nameNode),
        english: makeField(row.querySelector('[class*="english-name"]')),
        image: makeField(findImageNode(row)),
        price: makeField(row.querySelector(`[class*="price-number"], ${SPOTLIGHT_PRICE_SEL}`)),
      });
    }
  }
  return { doc, rows, supported: rows.length > 0, spotlightMode, templates };
}

// 讀一個 spotlight 項目的菜色資料
function readSpotDish(item: Element): { restaurant: string; chinese: string; english: string; price: string } {
  const get = (sel: string) => {
    const n = item.querySelector(sel);
    return n ? readNode(n) : '';
  };
  return {
    restaurant: get('[class*="restaurant-tag"], [class*="restaurant-name"]'),
    chinese: get('[class*="chinese-name"]:not([class*="english"])'),
    english: get('[class*="english-name"]'),
    price: get(`${SPOTLIGHT_PRICE_SEL}, [class*="price-number"]`),
  };
}

// 在清單項目內寫入價格：優先 price-number；否則改 price-block 內的「裸文字」節點（保留 NT$ 前綴）
function setListPrice(li: Element, value: string): void {
  const numEl = li.querySelector('[class*="price-number"]');
  if (numEl) { writeNode(numEl, value); return; }
  const block = li.querySelector('[class*="price-block"], [class*="price"]');
  if (!block) return;
  let textNode: ChildNode | null = null;
  for (const n of Array.from(block.childNodes)) {
    if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) textNode = n; // 取最後一個有內容的直屬文字節點
  }
  if (!textNode) {
    for (const n of Array.from(block.childNodes)) if (n.nodeType === 3) textNode = n;
  }
  if (textNode) textNode.nodeValue = value;
  else block.appendChild(block.ownerDocument.createTextNode(value));
}

// 依目前 spotlight 項目，整段重建側邊清單（menu-list-section）
// → 兩區永遠同步，新增菜色／新餐廳分組都會自動反映
function regenerateMenuList(doc: Document, templates: ListTemplates): void {
  if (!templates.item) return;
  const section =
    doc.querySelector('[class*="menu-list-section"]') ||
    doc.querySelector('[class*="menu-list-item"]')?.parentElement ||
    null;
  if (!section) return;

  const dishes = Array.from(doc.querySelectorAll('[class*="spotlight-item"]')).map(readSpotDish);

  // 品項多時加上 dense（與版型產生器一致：>6 縮小字級避免溢出）
  section.classList?.toggle('dense', dishes.length > 6);

  // 移除現有的分組標題與清單項目（保留其餘節點，如區塊標題）
  section
    .querySelectorAll('[class*="restaurant-group-header"], [class*="menu-list-item"]')
    .forEach(el => el.remove());

  let currentRest: string | null = null;
  dishes.forEach((d, i) => {
    if (d.restaurant !== currentRest) {
      if (templates.header) {
        const h = templates.header.cloneNode(true) as Element;
        writeNode(h, d.restaurant);
        section.appendChild(h);
      }
      currentRest = d.restaurant;
    }
    const li = templates.item!.cloneNode(true) as Element;
    li.classList?.remove('active');
    if (i === 0) li.classList?.add('active');

    const badge = li.querySelector('[class*="number-badge"]:not(img), [class*="item-number"]');
    if (badge) writeNode(badge, String(i + 1));
    const nameEl = li.querySelector('[class*="item-name"]:not([class*="english"]), [class*="chinese-name"]:not([class*="english"])');
    if (nameEl) writeNode(nameEl, d.chinese);
    const engEl = li.querySelector('[class*="english-name"]');
    if (engEl) writeNode(engEl, d.english);
    setListPrice(li, d.price);

    section.appendChild(li);
  });
}

// 把工作用 DOM 序列化回乾淨 HTML（移除暫時的 data-focus-id，保留 DOCTYPE）
function serializeFocusDoc(doc: Document): string {
  const clone = doc.cloneNode(true) as Document;
  clone.querySelectorAll('[data-focus-id]').forEach(el => el.removeAttribute('data-focus-id'));
  const dt = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : '';
  return dt + clone.documentElement.outerHTML;
}

const FOCUS_COLUMNS: { key: keyof FocusRow; label: string; mono?: boolean }[] = [
  { key: 'restaurant', label: '餐廳' },
  { key: 'chinese', label: '中文菜名' },
  { key: 'english', label: '英文名' },
  { key: 'image', label: '圖片網址', mono: true },
  { key: 'price', label: '價格' },
];

export default function SiteAssetsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // 檔名快速篩選關鍵字（依檔名命名邏輯：廠區_餐期_年份-月份-日期）
  const [filterText, setFilterText] = useState('');
  // 檔名排序方向：null＝維持原順序（上傳時間）／asc 升冪／desc 降冪
  const [filenameSort, setFilenameSort] = useState<'asc' | 'desc' | null>(null);
  // 記住上一次點選的列索引，作為 Shift 範圍選取的錨點
  const lastIndexRef = useRef<number | null>(null);

  const [uploadMode, setUploadMode] = useState<'html' | 'json'>('html');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadDetail, setUploadDetail] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON 轉檔版型清單
  const [availableTemplates, setAvailableTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signage/assets?site_id=${siteId}`);
      const json = await res.json();
      if (json.success) setAssets(json.data || []);
      setSelectedIds(new Set());
      lastIndexRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  // 載入可用版型（一次即可）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/signage/templates');
        const json = await res.json();
        if (json.success) {
          setAvailableTemplates(json.data || []);
          setSelectedTemplate(json.default || (json.data?.[0]?.key ?? ''));
        }
      } catch {
        // 取不到就維持空陣列；JSON 分頁會顯示提示
      }
    })();
  }, []);

  const switchMode = (mode: 'html' | 'json') => {
    setUploadMode(mode);
    setUploadResult('');
    setUploadDetail([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !fileInputRef.current?.files?.length) return;
    setUploading(true);
    setUploadResult('');
    setUploadDetail([]);
    try {
      const fd = new FormData();
      fd.append('site_id', siteId);
      Array.from(fileInputRef.current.files).forEach(f => fd.append('file', f));

      let res: Response;
      if (uploadMode === 'json') {
        if (selectedTemplate) fd.append('template', selectedTemplate);
        res = await fetch('/api/signage/assets/convert', { method: 'POST', body: fd });
      } else {
        if (uploadDesc) fd.append('description', uploadDesc);
        res = await fetch('/api/signage/assets/upload', { method: 'POST', body: fd });
      }
      const json = await res.json();
      setUploadResult(json.message || (json.success ? '成功' : '失敗'));

      if (uploadMode === 'json' && json.data) {
        const lines: string[] = [];
        for (const u of json.data.uploaded ?? []) {
          lines.push(`✅ ${u.filename}` + (u.warnings?.length ? `（⚠ ${u.warnings.join('；')}）` : ''));
        }
        for (const f of json.data.failed ?? []) lines.push(`❌ ${f.filename}：${f.error}`);
        setUploadDetail(lines);
      } else if (uploadMode === 'html' && json.data?.failed?.length) {
        setUploadDetail(json.data.failed.map((f: { filename: string; error: string }) => `❌ ${f.filename}：${f.error}`));
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadDesc('');
      await load();
    } catch {
      setUploadResult('上傳失敗：網路錯誤');
    } finally {
      setUploading(false);
    }
  };

  // 套用檔名篩選後的清單
  const filteredAssets = assets.filter(a => matchFilename(a.filename, filterText));
  // 再依檔名排序（以中文筆劃＋數字大小比較：'zh-Hant-u-co-stroke' + numeric）；
  // 選取、全選、Shift 範圍選取與列表渲染皆以此排序後的清單為準
  const displayAssets = filenameSort
    ? [...filteredAssets].sort((a, b) => {
        const r = a.filename.localeCompare(b.filename, 'zh-Hant-u-co-stroke', { numeric: true });
        return filenameSort === 'asc' ? r : -r;
      })
    : filteredAssets;
  const allFilteredSelected = displayAssets.length > 0 && displayAssets.every(a => selectedIds.has(a.id));
  // 點檔名標題循環切換：原順序 → 升冪 → 降冪 → 原順序
  const toggleFilenameSort = () =>
    setFilenameSort(prev => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayAssets.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayAssets.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  // 點檔名／核取方塊時呼叫；按住 Shift 則從上一個錨點到本列整段一併選取
  const selectRow = (index: number, id: number, shiftKey: boolean) => {
    if (shiftKey && lastIndexRef.current !== null) {
      const start = Math.min(lastIndexRef.current, index);
      const end = Math.max(lastIndexRef.current, index);
      const rangeIds = displayAssets.slice(start, end + 1).map(a => a.id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        rangeIds.forEach(rid => next.add(rid));
        return next;
      });
    } else {
      toggleSelect(id);
      lastIndexRef.current = index;
    }
  };

  // 編輯 HTML 跳出視窗
  const [editingAsset, setEditingAsset] = useState<{ id: number; filename: string } | null>(null);
  const [editHtml, setEditHtml] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  // 重點檢視（表格）相關
  const [viewMode, setViewMode] = useState<'table' | 'source'>('table');
  const [focusRows, setFocusRows] = useState<FocusRow[]>([]);
  const [focusSupported, setFocusSupported] = useState(true);
  const focusDocRef = useRef<Document | null>(null);
  const spotlightModeRef = useRef(false);            // 是否為「spotlight＋側邊清單」雙區版型
  const listTemplatesRef = useRef<ListTemplates>({ header: null, item: null });

  // 把工作用 DOM 輸出成 HTML；spotlight 版型先依 spotlight 重建側邊清單再輸出（兩區同步）
  const commitDoc = (): string => {
    const doc = focusDocRef.current;
    if (!doc) return editHtml;
    if (spotlightModeRef.current) regenerateMenuList(doc, listTemplatesRef.current);
    return serializeFocusDoc(doc);
  };

  // 解析 HTML → 表格列；回傳是否成功解析出菜色
  const buildFocus = (html: string): boolean => {
    try {
      const { doc, rows, supported, spotlightMode, templates } = parseFocusRows(html);
      focusDocRef.current = doc;
      spotlightModeRef.current = spotlightMode;
      listTemplatesRef.current = templates;
      setFocusRows(rows);
      setFocusSupported(supported);
      return supported;
    } catch {
      focusDocRef.current = null;
      spotlightModeRef.current = false;
      listTemplatesRef.current = { header: null, item: null };
      setFocusRows([]);
      setFocusSupported(false);
      return false;
    }
  };

  // 解析後，spotlight 版型立即把側邊清單同步成與 spotlight 一致（修正既有資料分歧）
  const buildFocusAndSync = (html: string): boolean => {
    const ok = buildFocus(html);
    setEditHtml(ok && spotlightModeRef.current ? commitDoc() : html);
    return ok;
  };

  const openEdit = async (asset: Asset) => {
    setEditingAsset({ id: asset.id, filename: asset.filename });
    setEditHtml('');
    setEditMsg('');
    setFocusRows([]);
    focusDocRef.current = null;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/signage/assets/${asset.id}`);
      const json = await res.json();
      if (json.success) {
        const ok = buildFocusAndSync(json.data.html ?? '');
        setViewMode(ok ? 'table' : 'source'); // 無法解析就直接顯示原始碼
      } else {
        setEditMsg(json.message || '讀取失敗');
      }
    } catch {
      setEditMsg('讀取失敗：網路錯誤');
    } finally {
      setEditLoading(false);
    }
  };

  // 切換檢視模式；切回表格時重新解析目前的原始碼（吸收手動修改）
  const switchView = (mode: 'table' | 'source') => {
    if (mode === 'table') buildFocusAndSync(editHtml);
    setViewMode(mode);
  };

  // 表格欄位變更：只改對應 DOM 節點，其餘內容保留；同步更新原始碼字串（spotlight 連帶重建側邊清單）
  const handleFocusChange = (rowIndex: number, key: keyof FocusRow, value: string) => {
    const doc = focusDocRef.current;
    if (!doc) return;
    const field = focusRows[rowIndex][key];
    if (!field.id || !field.editable) return;
    const node = doc.querySelector(`[data-focus-id="${field.id}"]`);
    if (node) writeNode(node, value);
    // 共用同一節點（例如同餐廳的餐廳名／圖片）的欄位一起更新顯示
    setFocusRows(prev => prev.map(r => {
      const f = r[key];
      return f.id === field.id ? { ...r, [key]: { ...f, value } } : r;
    }));
    setEditHtml(commitDoc());
  };

  // 新增一組：複製一個「欄位最完整」的現有菜色區塊，清空後接到其後面，再重新解析
  const handleAddRow = () => {
    const doc = focusDocRef.current;
    if (!doc || focusRows.length === 0) return;

    // 優先挑「圖片＋價格都可編輯」的列當範本（spotlight 版型每項自成一塊，最理想）；
    // 取「最後一個」符合的列，讓新列接在該區塊尾端而非中間。
    const lastIndexOf = (pred: (r: FocusRow) => boolean) => {
      for (let i = focusRows.length - 1; i >= 0; i--) if (pred(focusRows[i])) return i;
      return -1;
    };
    let tmplIdx = lastIndexOf(r => !!r.chinese.id && r.image.editable && r.price.editable);
    if (tmplIdx < 0) tmplIdx = lastIndexOf(r => !!r.chinese.id);
    if (tmplIdx < 0) return;

    const nameNode = doc.querySelector(`[data-focus-id="${focusRows[tmplIdx].chinese.id}"]`);
    const container =
      (nameNode?.closest('[class*="spotlight-item"], [class*="menu-row"], [class*="menu-list-item"]') as Element | null) ??
      nameNode?.parentElement ?? null;
    if (!container) return;

    const clone = container.cloneNode(true) as Element;
    clone.querySelectorAll('[data-focus-id]').forEach(el => el.removeAttribute('data-focus-id'));
    clone.removeAttribute('data-focus-id');
    clone.classList?.remove('active');

    // 清空新列的欄位（餐廳僅在「列內含餐廳」的版型會被清空；共用餐廳的版型維持原餐廳）
    const blank = (sel: string) => { const n = clone.querySelector(sel); if (n) writeNode(n as Element, ''); };
    blank('[class*="chinese-name"]:not([class*="english"]), [class*="item-name"]:not([class*="english"])');
    blank('[class*="english-name"]');
    blank('[class*="price-number"], [class*="spotlight-price"]:not([class*="prefix"]):not([class*="block"])');
    blank('[class*="restaurant-tag"], [class*="restaurant-name"], [class*="restaurant-group-header"]');
    const img = pickImage(clone);
    if (img) img.setAttribute('src', '');

    // 接到範本區塊後面（同一個容器內）
    container.after(clone);

    // 重新編號：數字圖（../../pic/numbers/NN.png）依在區塊內的位置更新
    const sameType = Array.from(clone.parentElement?.children ?? []).filter(
      c => c.className && /spotlight-item|menu-row|menu-list-item/.test(c.className),
    );
    const pos = sameType.indexOf(clone) + 1;
    const numImg = clone.querySelector('img[src*="/numbers/"]');
    if (numImg) {
      const src = numImg.getAttribute('src') ?? '';
      numImg.setAttribute('src', src.replace(/(\/numbers\/)\d+/, `$1${String(pos).padStart(2, '0')}`));
    }

    // 輸出（spotlight 版型會連帶重建側邊清單），再重新解析回表格
    const html = commitDoc();
    setEditHtml(html);
    buildFocus(html);
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditingAsset(null);
    setEditHtml('');
    setEditMsg('');
    setFocusRows([]);
    focusDocRef.current = null;
    spotlightModeRef.current = false;
    listTemplatesRef.current = { header: null, item: null };
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    setEditSaving(true);
    setEditMsg('');
    try {
      const res = await fetch(`/api/signage/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: editHtml }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingAsset(null);
        setEditHtml('');
        await load();
      } else {
        setEditMsg(json.message || '儲存失敗');
      }
    } catch {
      setEditMsg('儲存失敗：網路錯誤');
    } finally {
      setEditSaving(false);
    }
  };

  const [convertingMsg, setConvertingMsg] = useState('');
  const [converting, setConverting] = useState(false);
  const handleConvertToPlaylists = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定將選取的 ${selectedIds.size} 個素材各轉成一個播放清單？已存在同名清單會略過。`)) return;
    setConverting(true);
    setConvertingMsg('轉換中...');
    try {
      const res = await fetch('/api/signage/playlists/create-from-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      setConvertingMsg(json.success ? `✅ ${json.message}` : `❌ ${json.message}`);
      if (json.success) setSelectedIds(new Set());
    } catch {
      setConvertingMsg('❌ 網路錯誤');
    } finally {
      setConverting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個素材嗎？`)) return;
    const res = await fetch('/api/signage/assets/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '批次刪除失敗');
  };

  // 轉檔（瀏覽器螢幕快照）：把素材 HTML 截成 PNG 後直接下載
  const [shotId, setShotId] = useState<number | null>(null);
  const handleScreenshot = async (asset: Asset) => {
    setShotId(asset.id);
    try {
      const res = await fetch(`/api/signage/assets/${asset.id}/screenshot`);
      if (!res.ok) {
        let msg = '轉檔失敗';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {
          /* 非 JSON 回應就用預設訊息 */
        }
        alert(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename.replace(/\.html?$/i, '') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('轉檔失敗：網路錯誤');
    } finally {
      setShotId(null);
    }
  };

  // 批次轉檔：逐一截圖選取的素材，於瀏覽器端打包成單一 ZIP 下載。
  // 採「逐一送請求」而非一次請求截多張，避免單一 Serverless 函式逾時、
  // 也避免同時啟動多個 Chromium 造成記憶體不足。
  const [batchShooting, setBatchShooting] = useState(false);
  const [batchMsg, setBatchMsg] = useState('');
  const handleBatchScreenshot = async () => {
    if (selectedIds.size === 0 || batchShooting) return;
    // 依目前列表順序處理選取項目
    const targets = assets.filter(a => selectedIds.has(a.id));
    setBatchShooting(true);
    setBatchMsg(`轉檔中… 0/${targets.length}`);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const failed: string[] = [];
      let done = 0;

      for (const asset of targets) {
        const baseName = asset.filename.replace(/\.html?$/i, '') || `asset_${asset.id}`;
        try {
          const res = await fetch(`/api/signage/assets/${asset.id}/screenshot`);
          if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
              const j = await res.json();
              msg = j.message || msg;
            } catch {
              /* 非 JSON 回應 */
            }
            failed.push(`${baseName}：${msg}`);
          } else {
            const blob = await res.blob();
            // 去重檔名（同名素材接 _2、_3…）
            let name = `${baseName}.png`;
            let n = 2;
            while (usedNames.has(name)) name = `${baseName}_${n++}.png`;
            usedNames.add(name);
            zip.file(name, blob);
          }
        } catch {
          failed.push(`${baseName}：網路錯誤`);
        }
        done++;
        setBatchMsg(`轉檔中… ${done}/${targets.length}`);
      }

      const okCount = usedNames.size;
      if (okCount === 0) {
        setBatchMsg(`❌ 全部失敗（${failed.length} 張）`);
        alert('批次轉檔全部失敗：\n' + failed.join('\n'));
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `素材轉檔_${okCount}張.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setBatchMsg(`✅ 已打包 ${okCount} 張${failed.length ? `，${failed.length} 張失敗` : ''}`);
      if (failed.length) alert('部分素材轉檔失敗：\n' + failed.join('\n'));
    } finally {
      setBatchShooting(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    if (!confirm('確定要刪除此素材嗎？')) return;
    const res = await fetch(`/api/signage/assets/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">素材庫</h1>

      {/* 上傳區 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">上傳素材</h2>
        <div className="flex gap-2 mb-5 border-b border-gray-200">
          <button type="button" onClick={() => switchMode('html')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'html' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            直接上傳 HTML
          </button>
          <button type="button" onClick={() => switchMode('json')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'json' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            上傳 JSON 自動轉檔
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {uploadMode === 'html' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明（選填）</label>
              <input type="text" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
          )}
          {uploadMode === 'json' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
              上傳餐點資料 JSON，系統會自動依「據點＋時段＋日期」轉成菜單 HTML；一個 JSON 含多天會自動拆成多個菜單。
            </div>
          )}
          {uploadMode === 'json' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">選擇版型 *</label>
              {availableTemplates.length === 0 ? (
                <p className="text-sm text-gray-400">尚無可用版型</p>
              ) : (
                <>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    {availableTemplates.map(t => (
                      <option key={t.key} value={t.key}>
                        {t.displayName}（{t.customer}）
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const t = availableTemplates.find(x => x.key === selectedTemplate);
                    return t?.description ? (
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {uploadMode === 'json' ? '選擇 JSON 檔（可一次選多個 .json） *' : '選擇檔案（可一次選多個 .html） *'}
            </label>
            <input ref={fileInputRef} type="file" accept={uploadMode === 'json' ? '.json,application/json' : '.html'} multiple required
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
          </div>
          <button type="submit" disabled={uploading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {uploading ? (uploadMode === 'json' ? '轉檔中...' : '上傳中...') : (uploadMode === 'json' ? '⚙ 轉檔並上傳' : '⬆ 上傳')}
          </button>
          {uploadResult && <p className="text-sm font-medium">{uploadResult}</p>}
          {uploadDetail.length > 0 && (
            <ul className="text-sm space-y-1 bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
              {uploadDetail.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          )}
        </form>
      </div>

      {/* 列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* 檔名快速篩選：直接輸入即時過濾（例：16＝某日、L＝午餐、F3＝廠區，可空白組合） */}
        <div className="relative w-full md:w-96">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="篩選檔名… 例：16（某日）、L（午餐）、F3（廠區）"
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
          />
          {filterText && (
            <button type="button" onClick={() => setFilterText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
              {allFilteredSelected ? '取消全選' : '全選'}
            </button>
            <span className="text-sm text-gray-500">已選 {selectedIds.size} 個</span>
            {filterText && <span className="text-sm text-gray-400">（篩選出 {filteredAssets.length} / {assets.length}）</span>}
            {convertingMsg && <span className="text-sm text-gray-600">{convertingMsg}</span>}
            {batchMsg && <span className="text-sm text-gray-600">{batchMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBatchScreenshot} disabled={selectedIds.size === 0 || batchShooting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              {batchShooting ? '批次轉檔中…' : `批次轉檔 (${selectedIds.size})`}
            </button>
            <button onClick={handleConvertToPlaylists} disabled={selectedIds.size === 0 || converting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              素材轉列表 ({selectedIds.size})
            </button>
            <button onClick={handleBatchDelete} disabled={selectedIds.size === 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              刪除選取項目 ({selectedIds.size})
            </button>
          </div>
        </div>

        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-10" />        {/* 核取方塊 */}
            <col />                          {/* 檔名（佔用剩餘寬度） */}
            <col className="w-40" />        {/* 說明（縮窄） */}
            <col className="w-28" />        {/* 上傳時間 */}
            <col className="w-56" />        {/* 操作（拉寬，容納 4 個按鈕並排） */}
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" onChange={toggleSelectAll} checked={allFilteredSelected} />
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                <button type="button" onClick={toggleFilenameSort}
                  className="inline-flex items-center gap-1 hover:text-cyan-700"
                  title="依檔名（筆劃／數字）排序">
                  檔名
                  <span className="flex flex-col leading-[0.6] text-[9px]">
                    <span className={filenameSort === 'asc' ? 'text-cyan-600' : 'text-gray-300'}>▲</span>
                    <span className={filenameSort === 'desc' ? 'text-cyan-600' : 'text-gray-300'}>▼</span>
                  </span>
                </button>
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">說明</th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">上傳時間</th>
              <th className="px-3 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">尚無素材</td></tr>
            ) : displayAssets.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">沒有符合「{filterText}」的素材</td></tr>
            ) : displayAssets.map((a, idx) => (
              <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.has(a.id) ? 'bg-cyan-50' : ''}`}>
                <td className="px-3 py-3 align-top">
                  <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => {}}
                    onClick={e => selectRow(idx, a.id, e.shiftKey)} />
                </td>
                <td className="px-3 py-3 font-mono text-cyan-700 cursor-pointer select-none break-words align-top"
                  onClick={e => selectRow(idx, a.id, e.shiftKey)}>{a.filename}</td>
                <td className="px-3 py-3 text-gray-600 break-words align-top">{a.description || '—'}</td>
                <td className="px-3 py-3 text-xs text-gray-400 break-words align-top">{new Date(a.upload_timestamp).toLocaleString('zh-TW')}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap align-top">
                  <a href={assetProxyUrl(a.id, a.blob_url)} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline mr-3">預覽</a>
                  <button onClick={() => openEdit(a)} className="text-amber-600 hover:underline mr-3">編輯</button>
                  <button onClick={() => handleScreenshot(a)} disabled={shotId === a.id}
                    className="text-indigo-600 hover:underline mr-3 disabled:opacity-50">
                    {shotId === a.id ? '轉檔中…' : '轉檔'}
                  </button>
                  <button onClick={() => handleDeleteOne(a.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編輯 HTML 跳出視窗 */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeEdit}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                編輯素材 — <span className="font-mono text-cyan-700">{editingAsset.filename}</span>
              </h3>
              <button onClick={closeEdit} disabled={editSaving}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50">×</button>
            </div>

            {/* 檢視模式切換 */}
            <div className="flex gap-2 px-6 pt-4 border-b border-gray-200">
              <button type="button" onClick={() => switchView('table')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${viewMode === 'table' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                重點檢視（餐廳／菜色／圖片／價格）
              </button>
              <button type="button" onClick={() => switchView('source')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${viewMode === 'source' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                完整原始碼
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {editLoading ? (
                <p className="text-center text-gray-400 py-10">載入中...</p>
              ) : viewMode === 'table' ? (
                !focusSupported ? (
                  <div className="text-center text-gray-500 py-10 space-y-2">
                    <p>此版型無法自動解析出菜色欄位。</p>
                    <p className="text-sm">請切換到「完整原始碼」進行編輯。</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                      已自動隱藏 CSS 樣式與頁頭頁尾，只列出菜色內容。修改後按「儲存」即會更新；其餘程式碼會原樣保留。
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 w-10 text-gray-500 font-medium">#</th>
                            {FOCUS_COLUMNS.map(c => (
                              <th key={c.key} className="px-2 py-2 text-left font-medium text-gray-700">{c.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {focusRows.map((r, i) => (
                            <tr key={i} className="border-t border-gray-100 align-top">
                              <td className="px-2 py-2 text-gray-400">{i + 1}</td>
                              {FOCUS_COLUMNS.map(c => {
                                const f = r[c.key];
                                return (
                                  <td key={c.key} className="px-2 py-2">
                                    {f.editable ? (
                                      <div className="space-y-1">
                                        <input
                                          type="text"
                                          value={f.value}
                                          onChange={e => handleFocusChange(i, c.key, e.target.value)}
                                          spellCheck={false}
                                          className={`w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 ${c.mono ? 'font-mono text-xs' : ''}`}
                                        />
                                        {c.key === 'image' && f.value && (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={f.value} alt="" className="h-12 rounded border border-gray-200 object-cover" />
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={handleAddRow}
                      className="inline-flex items-center gap-1 border border-dashed border-cyan-400 text-cyan-700 hover:bg-cyan-50 px-4 py-2 rounded-lg text-sm font-medium">
                      <span className="text-lg leading-none">＋</span> 新增一組（餐廳／菜色／圖片／價格）
                    </button>
                  </div>
                )
              ) : (
                <textarea
                  value={editHtml}
                  onChange={e => setEditHtml(e.target.value)}
                  spellCheck={false}
                  className="w-full h-[60vh] px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs leading-relaxed focus:ring-2 focus:ring-cyan-500 whitespace-pre"
                  wrap="off"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <span className="text-sm font-medium text-red-600">{editMsg}</span>
              <div className="flex items-center gap-2">
                <button onClick={closeEdit} disabled={editSaving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  取消
                </button>
                <button onClick={handleSaveEdit} disabled={editSaving || editLoading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {editSaving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

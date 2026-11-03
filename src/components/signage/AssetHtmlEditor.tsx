'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  // vis_tv 售完功能用 data-number 記住原始編號。重建清單時若只改文字、
  // 沒改這個屬性，播放端會把所有項目的顯示編號蓋回範本上的「1」。
  if (node.hasAttribute('data-number')) node.setAttribute('data-number', value);
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
      t.classList?.remove('active', 'sold-out', 'tap-armed');
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
    li.classList?.remove('active', 'sold-out', 'tap-armed');
    if (i === 0) li.classList?.add('active');

    const badge = li.querySelector('[class*="number-badge"]:not(img), [class*="item-number"]');
    if (badge) {
      const num = String(i + 1);
      writeNode(badge, num);
      badge.setAttribute('data-number', num);
    }
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

const DISH_COLUMNS: { key: Exclude<keyof FocusRow, 'restaurant'>; label: string; mono?: boolean }[] = [
  { key: 'chinese', label: '中文菜名' },
  { key: 'english', label: '英文名' },
  { key: 'image', label: '圖片網址', mono: true },
  { key: 'price', label: '價格' },
];

interface FocusGroup {
  name: string;
  indices: number[];
}

function groupFocusRows(rows: FocusRow[]): FocusGroup[] {
  const groups: FocusGroup[] = [];
  rows.forEach((r, i) => {
    const name = r.restaurant.value;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.indices.push(i);
    else groups.push({ name, indices: [i] });
  });
  return groups;
}

function uniqueRestaurantNames(rows: FocusRow[]): string[] {
  const names: string[] = [];
  for (const r of rows) {
    if (!names.includes(r.restaurant.value)) names.push(r.restaurant.value);
  }
  return names;
}

function isRestaurantNodeShared(rows: FocusRow[], row: FocusRow): boolean {
  if (!row.restaurant.id) return false;
  return rows.filter(r => r.restaurant.id === row.restaurant.id).length > 1;
}

function unusedRestaurantName(rows: FocusRow[]): string {
  const names = new Set(rows.map(r => r.restaurant.value));
  if (!names.has('新餐廳')) return '新餐廳';
  let n = 2;
  while (names.has(`新餐廳 ${n}`)) n++;
  return `新餐廳 ${n}`;
}

function parseFocusPrice(v: string): number {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? Infinity : n;
}

function findRowContainer(doc: Document, row: FocusRow): Element | null {
  const id = row.chinese.id;
  if (!id) return null;
  const nameNode = doc.querySelector(`[data-focus-id="${id}"]`);
  if (!nameNode) return null;
  return (
    (nameNode.closest('[class*="spotlight-item"], [class*="menu-row"], [class*="menu-list-item"]') as Element | null) ??
    nameNode.parentElement
  );
}

function findTemplateRowIndex(rows: FocusRow[]): number {
  const lastIndexOf = (pred: (r: FocusRow) => boolean) => {
    for (let i = rows.length - 1; i >= 0; i--) if (pred(rows[i])) return i;
    return -1;
  };
  let idx = lastIndexOf(r => !!r.chinese.id && r.image.editable && r.price.editable);
  if (idx < 0) idx = lastIndexOf(r => !!r.chinese.id);
  return idx;
}

function reorderContainers(containers: Element[]): boolean {
  if (containers.length === 0) return false;
  const parent = containers[0].parentElement;
  if (!parent || containers.some(c => c.parentElement !== parent)) return false;
  containers.forEach(c => parent.appendChild(c));
  return true;
}

/** 輪播大圖編號與 active 狀態依目前 DOM 順序重編 */
function renumberSpotlightItems(doc: Document): void {
  const items = Array.from(doc.querySelectorAll('[class*="spotlight-item"]'));
  items.forEach((item, i) => {
    item.classList.toggle('active', i === 0);
    const numImg = item.querySelector('img[src*="/numbers/"]');
    if (numImg) {
      const src = numImg.getAttribute('src') ?? '';
      numImg.setAttribute('src', src.replace(/(\/numbers\/)\d+/, `$1${String(i + 1).padStart(2, '0')}`));
    }
  });
}

function writeRestaurantOnRows(doc: Document, rows: FocusRow[], name: string): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.restaurant.id || !row.restaurant.editable) continue;
    if (seen.has(row.restaurant.id)) continue;
    seen.add(row.restaurant.id);
    const node = doc.querySelector(`[data-focus-id="${row.restaurant.id}"]`);
    if (node) writeNode(node, name);
  }
}

function blankDishClone(clone: Element, restaurantName: string): void {
  clone.querySelectorAll('[data-focus-id]').forEach(el => el.removeAttribute('data-focus-id'));
  clone.removeAttribute('data-focus-id');
  clone.classList?.remove('active', 'sold-out', 'tap-armed');
  const blank = (sel: string) => { const n = clone.querySelector(sel); if (n) writeNode(n as Element, ''); };
  blank('[class*="chinese-name"]:not([class*="english"]), [class*="item-name"]:not([class*="english"])');
  blank('[class*="english-name"]');
  blank('[class*="price-number"], [class*="spotlight-price"]:not([class*="prefix"]):not([class*="block"])');
  const restEl = clone.querySelector('[class*="restaurant-tag"], [class*="restaurant-name"], [class*="restaurant-group-header"]');
  if (restEl) writeNode(restEl, restaurantName);
  const img = pickImage(clone);
  if (img) img.setAttribute('src', '');
}

export default function AssetHtmlEditor({
  asset,
  onClose,
  onSaved,
}: {
  asset: { id: number; filename: string } | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  // 編輯 HTML 跳出視窗
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
  const [groupNameDraft, setGroupNameDraft] = useState<{ start: number; value: string } | null>(null);

  const focusGroups = useMemo(() => groupFocusRows(focusRows), [focusRows]);
  const restaurantNames = useMemo(() => uniqueRestaurantNames(focusRows), [focusRows]);

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

  useEffect(() => {
    if (!asset) return;
    let cancelled = false;
    setEditHtml('');
    setEditMsg('');
    setFocusRows([]);
    focusDocRef.current = null;
    setEditLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/signage/assets/${asset.id}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          const ok = buildFocusAndSync(json.data.html ?? '');
          setViewMode(ok ? 'table' : 'source');
        } else {
          setEditMsg(json.message || '讀取失敗');
        }
      } catch {
        if (!cancelled) setEditMsg('讀取失敗：網路錯誤');
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [asset?.id]);

  // 切換檢視模式；切回表格時重新解析目前的原始碼（吸收手動修改）
  const switchView = (mode: 'table' | 'source') => {
    if (mode === 'table') buildFocusAndSync(editHtml);
    setViewMode(mode);
  };

  // 表格欄位變更：只改對應 DOM 節點，其餘內容保留；同步更新原始碼字串（spotlight 連帶重建側邊清單）
  const handleFocusChange = (rowIndex: number, key: Exclude<keyof FocusRow, 'restaurant'>, value: string) => {
    const doc = focusDocRef.current;
    if (!doc) return;
    const field = focusRows[rowIndex][key];
    if (!field.id || !field.editable) return;
    const node = doc.querySelector(`[data-focus-id="${field.id}"]`);
    if (node) writeNode(node, value);
    setFocusRows(prev => prev.map(r => {
      const f = r[key];
      return f.id === field.id ? { ...r, [key]: { ...f, value } } : r;
    }));
    setEditHtml(commitDoc());
  };

  const refreshAfterMutate = () => {
    const doc = focusDocRef.current;
    if (!doc) return;
    renumberSpotlightItems(doc);
    const html = commitDoc();
    setEditHtml(html);
    buildFocus(html);
    setGroupNameDraft(null);
  };

  const applyRowOrder = (ordered: FocusRow[]) => {
    const doc = focusDocRef.current;
    if (!doc) return;
    const containers = ordered
      .map(r => findRowContainer(doc, r))
      .filter((el): el is Element => !!el);
    reorderContainers(containers);
    refreshAfterMutate();
  };

  const cloneDishAfter = (afterRow: FocusRow, restaurantName: string) => {
    const doc = focusDocRef.current;
    if (!doc) return false;
    const tmplIdx = findTemplateRowIndex(focusRows);
    if (tmplIdx < 0) return false;
    const nameNode = doc.querySelector(`[data-focus-id="${focusRows[tmplIdx].chinese.id}"]`);
    const container =
      (nameNode?.closest('[class*="spotlight-item"], [class*="menu-row"], [class*="menu-list-item"]') as Element | null) ??
      nameNode?.parentElement ?? null;
    if (!container) return false;

    const clone = container.cloneNode(true) as Element;
    blankDishClone(clone, restaurantName);

    const afterEl = findRowContainer(doc, afterRow);
    if (afterEl) afterEl.after(clone);
    else container.after(clone);
    return true;
  };

  const handleAddDishToGroup = (group: FocusGroup) => {
    const lastRow = focusRows[group.indices[group.indices.length - 1]];
    if (!cloneDishAfter(lastRow, group.name)) return;
    refreshAfterMutate();
  };

  const handleAddRestaurant = () => {
    if (focusRows.length === 0) return;
    const lastRow = focusRows[focusRows.length - 1];
    if (!cloneDishAfter(lastRow, unusedRestaurantName(focusRows))) return;
    refreshAfterMutate();
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (focusRows.length <= 1) {
      alert('至少需保留一道菜色，無法刪除最後一筆。');
      return;
    }
    const row = focusRows[rowIndex];
    const label = row.chinese.value.trim() || '這道菜';
    if (!confirm(`確定刪除「${label}」？`)) return;
    const doc = focusDocRef.current;
    if (!doc) return;
    findRowContainer(doc, row)?.remove();
    refreshAfterMutate();
  };

  const handleDeleteGroup = (group: FocusGroup) => {
    if (group.indices.length >= focusRows.length) {
      alert('至少需保留一道菜色，無法刪除最後一個餐廳。');
      return;
    }
    const label = group.name.trim() || '未命名餐廳';
    if (!confirm(`確定刪除「${label}」及其 ${group.indices.length} 道菜？`)) return;
    const doc = focusDocRef.current;
    if (!doc) return;
    group.indices.forEach(i => findRowContainer(doc, focusRows[i])?.remove());
    refreshAfterMutate();
  };

  const handleMoveRow = (group: FocusGroup, rowIndex: number, dir: -1 | 1) => {
    const pos = group.indices.indexOf(rowIndex);
    const nextPos = pos + dir;
    if (pos < 0 || nextPos < 0 || nextPos >= group.indices.length) return;
    const nextIndices = [...group.indices];
    [nextIndices[pos], nextIndices[nextPos]] = [nextIndices[nextPos], nextIndices[pos]];
    const order = focusGroups.flatMap(g => (g === group ? nextIndices : g.indices)).map(i => focusRows[i]);
    applyRowOrder(order);
  };

  const handleMoveGroup = (groupIndex: number, dir: -1 | 1) => {
    const nextIndex = groupIndex + dir;
    if (nextIndex < 0 || nextIndex >= focusGroups.length) return;
    const swapped = [...focusGroups];
    [swapped[groupIndex], swapped[nextIndex]] = [swapped[nextIndex], swapped[groupIndex]];
    applyRowOrder(swapped.flatMap(g => g.indices).map(i => focusRows[i]));
  };

  const handleMoveDishToRestaurant = (rowIndex: number, restaurant: string) => {
    if (!restaurant || focusRows[rowIndex].restaurant.value === restaurant) return;
    const doc = focusDocRef.current;
    if (!doc) return;
    writeRestaurantOnRows(doc, [focusRows[rowIndex]], restaurant);
    const remaining = focusRows.filter((_, i) => i !== rowIndex);
    let insertAt = remaining.length;
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i].restaurant.value === restaurant) {
        insertAt = i + 1;
        break;
      }
    }
    const next = [...remaining];
    next.splice(insertAt, 0, focusRows[rowIndex]);
    applyRowOrder(next);
  };

  const handleCommitGroupName = (group: FocusGroup, rawName: string) => {
    const newName = rawName.trim();
    if (!newName || newName === group.name) {
      setGroupNameDraft(null);
      return;
    }
    const doc = focusDocRef.current;
    if (!doc) return;
    const groupRows = group.indices.map(i => focusRows[i]);
    writeRestaurantOnRows(doc, groupRows, newName);

    const nameTaken = focusRows.some((r, i) => !group.indices.includes(i) && r.restaurant.value === newName);
    if (nameTaken) {
      const remaining = focusRows.filter((_, i) => !group.indices.includes(i));
      let insertAt = remaining.length;
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (remaining[i].restaurant.value === newName) {
          insertAt = i + 1;
          break;
        }
      }
      const next = [...remaining];
      next.splice(insertAt, 0, ...groupRows);
      applyRowOrder(next);
      return;
    }
    refreshAfterMutate();
  };

  const handleSortGroupByPrice = (group: FocusGroup) => {
    const sorted = [...group.indices].sort(
      (a, b) => parseFocusPrice(focusRows[a].price.value) - parseFocusPrice(focusRows[b].price.value),
    );
    const order = focusGroups.flatMap(g => (g === group ? sorted : g.indices)).map(i => focusRows[i]);
    applyRowOrder(order);
  };

  const handleSortAllByPrice = () => {
    const order = focusGroups.flatMap(g =>
      [...g.indices].sort(
        (a, b) => parseFocusPrice(focusRows[a].price.value) - parseFocusPrice(focusRows[b].price.value),
      ),
    ).map(i => focusRows[i]);
    applyRowOrder(order);
  };

  const handleAddRestaurantFromDish = (rowIndex: number) => {
    handleMoveDishToRestaurant(rowIndex, unusedRestaurantName(focusRows));
  };

  const closeEdit = () => {
    if (editSaving) return;
    onClose();
    setEditHtml('');
    setEditMsg('');
    setFocusRows([]);
    focusDocRef.current = null;
    spotlightModeRef.current = false;
    listTemplatesRef.current = { header: null, item: null };
    setGroupNameDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!asset) return;
    let html = editHtml;
    const doc = focusDocRef.current;
    if (doc && viewMode === 'table' && focusSupported) {
      if (groupNameDraft) {
        const group = focusGroups.find(g => g.indices[0] === groupNameDraft.start);
        if (group) {
          const newName = groupNameDraft.value.trim();
          if (newName && newName !== group.name) {
            writeRestaurantOnRows(doc, group.indices.map(i => focusRows[i]), newName);
          }
        }
      }
      renumberSpotlightItems(doc);
      html = commitDoc();
      setEditHtml(html);
    }
    setEditSaving(true);
    setEditMsg('');
    try {
      const res = await fetch(`/api/signage/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const json = await res.json();
      if (json.success) {
        setEditHtml('');
        onSaved?.();
        onClose();
      } else {
        setEditMsg(json.message || '儲存失敗');
      }
    } catch {
      setEditMsg('儲存失敗：網路錯誤');
    } finally {
      setEditSaving(false);
    }
  };

  if (!asset) return null;

  return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={closeEdit}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                編輯素材 — <span className="font-mono text-cyan-700">{asset.filename}</span>
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
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-gray-500">
                        菜色隸屬餐廳。改餐廳名稱會同步該組所有菜色；可調整餐廳／菜色順序，修改後按「儲存」才會寫回素材。
                      </p>
                      <button type="button" onClick={handleSortAllByPrice}
                        className="shrink-0 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg">
                        各餐廳內依價格排序
                      </button>
                    </div>

                    {focusGroups.map((group, gi) => {
                      const draft = groupNameDraft?.start === group.indices[0] ? groupNameDraft.value : group.name;
                      const canDeleteGroup = group.indices.length < focusRows.length;
                      return (
                        <section key={`${gi}-${group.indices.join('-')}`} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2 bg-cyan-50 px-3 py-2 border-b border-cyan-100">
                            <span className="text-xs font-medium text-cyan-800 shrink-0">餐廳</span>
                            <input
                              type="text"
                              value={draft}
                              disabled={!focusRows[group.indices[0]]?.restaurant.editable}
                              onFocus={() => setGroupNameDraft({ start: group.indices[0], value: group.name })}
                              onChange={e => setGroupNameDraft({ start: group.indices[0], value: e.target.value })}
                              onBlur={() => handleCommitGroupName(group, draft)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              spellCheck={false}
                              className="min-w-[12rem] flex-1 px-2 py-1 border border-cyan-200 rounded bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="text-xs text-cyan-700">{group.indices.length} 道</span>
                            <div className="flex items-center gap-1 ml-auto">
                              <button type="button" title="餐廳上移" disabled={gi === 0}
                                onClick={() => handleMoveGroup(gi, -1)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-30">
                                上移
                              </button>
                              <button type="button" title="餐廳下移" disabled={gi === focusGroups.length - 1}
                                onClick={() => handleMoveGroup(gi, 1)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-30">
                                下移
                              </button>
                              <button type="button" title="此餐廳依價格由低到高"
                                onClick={() => handleSortGroupByPrice(group)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50">
                                依價格
                              </button>
                              <button type="button" title="刪除此餐廳與所有菜色" disabled={!canDeleteGroup}
                                onClick={() => handleDeleteGroup(group)}
                                className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded bg-white hover:bg-red-50 disabled:opacity-30">
                                刪除餐廳
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 py-2 w-10 text-gray-500 font-medium">#</th>
                                  {DISH_COLUMNS.map(c => (
                                    <th key={c.key} className="px-2 py-2 text-left font-medium text-gray-700">{c.label}</th>
                                  ))}
                                  <th className="px-2 py-2 text-left font-medium text-gray-700 whitespace-nowrap">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.indices.map((rowIndex, di) => {
                                  const r = focusRows[rowIndex];
                                  return (
                                    <tr key={r.chinese.id ?? rowIndex} className="border-t border-gray-100 align-top">
                                      <td className="px-2 py-2 text-gray-400">{rowIndex + 1}</td>
                                      {DISH_COLUMNS.map(c => {
                                        const f = r[c.key];
                                        return (
                                          <td key={c.key} className="px-2 py-2">
                                            {f.editable ? (
                                              <div className="space-y-1">
                                                <input
                                                  type="text"
                                                  value={f.value}
                                                  onChange={e => handleFocusChange(rowIndex, c.key, e.target.value)}
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
                                      <td className="px-2 py-2">
                                        <div className="flex flex-wrap items-center gap-1 min-w-[14rem]">
                                          <button type="button" title="上移" disabled={di === 0}
                                            onClick={() => handleMoveRow(group, rowIndex, -1)}
                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30">
                                            上移
                                          </button>
                                          <button type="button" title="下移" disabled={di === group.indices.length - 1}
                                            onClick={() => handleMoveRow(group, rowIndex, 1)}
                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30">
                                            下移
                                          </button>
                                          {!isRestaurantNodeShared(focusRows, r) && (
                                            <select
                                              value={group.name}
                                              title="移至其他餐廳"
                                              onChange={e => {
                                                const v = e.target.value;
                                                if (v === '__new__') handleAddRestaurantFromDish(rowIndex);
                                                else handleMoveDishToRestaurant(rowIndex, v);
                                              }}
                                              className="max-w-[8rem] px-1 py-1 text-xs border border-gray-300 rounded bg-white"
                                            >
                                              {restaurantNames.map(name => (
                                                <option key={name || '(空白)'} value={name}>{name || '（未命名）'}</option>
                                              ))}
                                              <option value="__new__">＋ 獨立成新餐廳</option>
                                            </select>
                                          )}
                                          <button type="button" title="刪除此菜"
                                            onClick={() => handleDeleteRow(rowIndex)}
                                            className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">
                                            刪除
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                            <button type="button" onClick={() => handleAddDishToGroup(group)}
                              className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-800 text-sm font-medium">
                              <span className="text-lg leading-none">＋</span> 新增菜色到此餐廳
                            </button>
                          </div>
                        </section>
                      );
                    })}

                    <button type="button" onClick={handleAddRestaurant}
                      className="inline-flex items-center gap-1 border border-dashed border-cyan-400 text-cyan-700 hover:bg-cyan-50 px-4 py-2 rounded-lg text-sm font-medium">
                      <span className="text-lg leading-none">＋</span> 新增餐廳
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
  );
}

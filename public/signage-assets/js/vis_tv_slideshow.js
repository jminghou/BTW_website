/**
 * VIS_世界_電視版：左側 spotlight 輪播 + 右側雙擊標示售完。
 * 僅 vis_tv 使用；電腦版 vis3 仍走 spotlight_slideshow.js。
 *
 * 售完狀態以「據點 + 時段 + 日期」為 key 存在 localStorage，
 * 同一餐期內重新載入仍會記住；換另一份菜單（不同餐期／日期）則是全新狀態。
 */
document.addEventListener('DOMContentLoaded', function () {
    const spotlightItems = document.querySelectorAll('.spotlight-item');
    const menuItems = document.querySelectorAll('.menu-list-item');

    if (spotlightItems.length === 0 || menuItems.length === 0) {
        console.warn('vis_tv_slideshow: 找不到輪播或列表項目');
        return;
    }

    const INTERVAL_MS = 2500;
    const DOUBLE_TAP_MS = 800;
    const STORAGE_PREFIX = 'vis_tv_soldout:';

    let currentIndex = 0;
    let timer = null;
    let lastTapIndex = -1;
    let lastTapAt = 0;
    let tapArmedTimer = null;

    function storageKey() {
        const explicit = document.body.getAttribute('data-menu-key');
        if (explicit) return STORAGE_PREFIX + explicit;
        const loc = (document.querySelector('.location') || {}).textContent || '';
        const meal = (document.querySelector('.meal-time') || {}).textContent || '';
        const date = (document.querySelector('.date-text') || {}).textContent || '';
        return STORAGE_PREFIX + [loc, meal, date].map(function (s) { return String(s).trim(); }).join('|');
    }

    function dishName(el) {
        const node = el.querySelector('.item-name');
        return node ? String(node.textContent || '').trim() : '';
    }

    function loadSoldOutNames() {
        try {
            const raw = localStorage.getItem(storageKey());
            const arr = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(arr) ? arr : []);
        } catch (e) {
            return new Set();
        }
    }

    function saveSoldOutNames(nameSet) {
        try {
            localStorage.setItem(storageKey(), JSON.stringify(Array.from(nameSet)));
        } catch (e) {
            // 電視盒若關閉儲存空間則略過，這一輪仍可操作，只是重整後不會記住
        }
    }

    const soldOutNames = loadSoldOutNames();

    function isSoldOut(index) {
        return soldOutNames.has(dishName(menuItems[index]));
    }

    function availableCount() {
        let n = 0;
        for (let i = 0; i < menuItems.length; i++) {
            if (!isSoldOut(i)) n++;
        }
        return n;
    }

    /** 從 fromIndex 往後找下一道未售完；skipSelf 時不包含自己。找不到則 -1。 */
    function findAvailable(fromIndex, skipSelf) {
        const n = spotlightItems.length;
        const start = skipSelf ? 1 : 0;
        for (let step = start; step < n; step++) {
            const i = (fromIndex + step) % n;
            if (!isSoldOut(i)) return i;
        }
        return -1;
    }

    function applySoldOutStyle(index, soldOut) {
        const menu = menuItems[index];
        const spot = spotlightItems[index];
        if (menu) menu.classList.toggle('sold-out', soldOut);
        if (spot) spot.classList.toggle('sold-out', soldOut);

        const badge = menu && menu.querySelector('.item-number-badge');
        if (!badge) return;
        if (!badge.getAttribute('data-number')) {
            badge.setAttribute('data-number', String(badge.textContent || index + 1).trim());
        }
        badge.textContent = soldOut ? '售完' : badge.getAttribute('data-number');
    }

    function restoreSoldOutStyles() {
        for (let i = 0; i < menuItems.length; i++) {
            applySoldOutStyle(i, isSoldOut(i));
        }
    }

    function showSlide(index) {
        if (index < 0 || index >= spotlightItems.length) return;
        spotlightItems.forEach(function (item) { item.classList.remove('active'); });
        menuItems.forEach(function (item) { item.classList.remove('active'); });
        spotlightItems[index].classList.add('active');
        menuItems[index].classList.add('active');
        menuItems[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        currentIndex = index;
    }

    function nextSlide() {
        const next = findAvailable(currentIndex, true);
        if (next < 0) return;
        showSlide(next);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function startTimer() {
        stopTimer();
        if (availableCount() <= 1) return;
        timer = setInterval(nextSlide, INTERVAL_MS);
    }

    function clearTapArmed() {
        menuItems.forEach(function (el) { el.classList.remove('tap-armed'); });
        lastTapIndex = -1;
        lastTapAt = 0;
        if (tapArmedTimer) {
            clearTimeout(tapArmedTimer);
            tapArmedTimer = null;
        }
    }

    function toggleSoldOut(index) {
        const name = dishName(menuItems[index]);
        if (!name) return;

        if (soldOutNames.has(name)) {
            soldOutNames.delete(name);
            applySoldOutStyle(index, false);
        } else {
            soldOutNames.add(name);
            applySoldOutStyle(index, true);
            if (currentIndex === index) {
                const next = findAvailable(index, true);
                if (next >= 0) showSlide(next);
            }
        }
        saveSoldOutNames(soldOutNames);
        startTimer();
    }

    function onItemActivate(index) {
        const now = Date.now();
        if (lastTapIndex === index && now - lastTapAt < DOUBLE_TAP_MS) {
            clearTapArmed();
            toggleSoldOut(index);
            return;
        }
        clearTapArmed();
        lastTapIndex = index;
        lastTapAt = now;
        menuItems[index].classList.add('tap-armed');
        tapArmedTimer = setTimeout(clearTapArmed, DOUBLE_TAP_MS);
    }

    menuItems.forEach(function (el, index) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            onItemActivate(index);
        });
    });

    restoreSoldOutStyles();

    const initial = findAvailable(0, false);
    if (initial >= 0) showSlide(initial);
    startTimer();
});

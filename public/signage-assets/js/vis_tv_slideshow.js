/**
 * VIS_世界_電視版：左側 spotlight 輪播 + 右側雙擊標示售完。
 * 僅 vis_tv 使用；電腦版 vis3 仍走 spotlight_slideshow.js。
 *
 * 售完狀態以「據點 + 時段 + 日期」為 key 存在伺服器，
 * 同一餐期內所有裝置（手機、廣告機）共用；換餐期後是全新狀態。
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
    const POLL_MS = 2000;
    const STORAGE_PREFIX = 'vis_tv_soldout:';

    let currentIndex = 0;
    let timer = null;
    let lastTapIndex = -1;
    let lastTapAt = 0;
    let tapArmedTimer = null;
    let pollTimer = null;
    let persistTimer = null;

    function menuKey() {
        const explicit = document.body.getAttribute('data-menu-key');
        if (explicit) return explicit.trim();
        const loc = (document.querySelector('.location') || {}).textContent || '';
        const meal = (document.querySelector('.meal-time') || {}).textContent || '';
        const date = (document.querySelector('.date-text') || {}).textContent || '';
        return [loc, meal, date].map(function (s) { return String(s).trim(); }).join('|');
    }

    const MENU_KEY = menuKey();

    function storageKey() {
        return STORAGE_PREFIX + MENU_KEY;
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
            // 電視盒若關閉儲存空間則略過
        }
    }

    function namesEqual(a, b) {
        if (a.size !== b.size) return false;
        var ok = true;
        a.forEach(function (n) {
            if (!b.has(n)) ok = false;
        });
        return ok;
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

    function applyRemoteNames(arr) {
        const next = new Set(Array.isArray(arr) ? arr : []);
        if (namesEqual(soldOutNames, next)) return;

        soldOutNames.clear();
        next.forEach(function (n) { soldOutNames.add(n); });
        saveSoldOutNames(soldOutNames);
        restoreSoldOutStyles();

        if (soldOutNames.size > 0 && isSoldOut(currentIndex)) {
            const jump = findAvailable(currentIndex, true);
            if (jump >= 0) showSlide(jump);
        }
        startTimer();
    }

    function apiUrl() {
        return '/api/signage/soldout?key=' + encodeURIComponent(MENU_KEY);
    }

    function fetchSoldOut() {
        if (!MENU_KEY) return;
        fetch(apiUrl(), { cache: 'no-store' })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (json) {
                if (!json || !json.success || !Array.isArray(json.data)) return;
                applyRemoteNames(json.data);
            })
            .catch(function () { /* 離線時維持目前畫面 */ });
    }

    function persistSoldOut() {
        if (!MENU_KEY) return;
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(function () {
            fetch('/api/signage/soldout', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({
                    key: MENU_KEY,
                    items: Array.from(soldOutNames),
                }),
            }).catch(function () { /* 寫入失敗時仍保留本機畫面，下一輪輪詢會再對齊 */ });
        }, 80);
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
        persistSoldOut();
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

    fetchSoldOut();
    pollTimer = setInterval(fetchSoldOut, POLL_MS);
});

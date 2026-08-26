/**
 * VIS_世界_電視版：左側 spotlight 輪播 + 右側雙擊標示售完。
 * 僅 vis_tv 使用；電腦版 vis3 仍走 spotlight_slideshow.js。
 *
 * 售完狀態寫在伺服器，以素材 id（asset:123）為主 key，
 * 同一份菜單的手機與廣告機共用；換一份菜單（不同 asset）即自動重置。
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
    let persistTimer = null;
    let persistAttempt = 0;

    function originPrefix() {
        try {
            return String(location.origin || '');
        } catch (e) {
            return '';
        }
    }

    function menuKey() {
        try {
            var path = String(location.pathname || '');
            var assetMatch = path.match(/\/api\/signage\/asset\/(\d+)/);
            if (assetMatch) return 'asset:' + assetMatch[1];
        } catch (e) {}

        var explicit = document.body.getAttribute('data-menu-key');
        if (explicit) return normalizeKey(explicit);

        var loc = ((document.querySelector('.location') || {}).textContent || '').trim();
        var meal = ((document.querySelector('.meal-time') || {}).textContent || '').trim();
        var date = ((document.querySelector('.date-text') || {}).textContent || '').trim();
        return normalizeKey([loc, meal, date].join('|'));
    }

    function normalizeKey(key) {
        return String(key || '').trim().replace(/(\d{4})[./](\d{1,2})[./](\d{1,2})\s*$/, function (_, y, m, d) {
            var mm = m.length < 2 ? '0' + m : m;
            var dd = d.length < 2 ? '0' + d : d;
            return y + '-' + mm + '-' + dd;
        });
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
        } catch (e) {}
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
        const num = String(index + 1);
        badge.setAttribute('data-number', num);
        badge.textContent = soldOut ? '售完' : num;
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
        return originPrefix() + '/api/signage/soldout?key=' + encodeURIComponent(MENU_KEY);
    }

    function writeUrl() {
        return originPrefix() + '/api/signage/soldout';
    }

    function requestJson(method, url, body, cb) {
        function done(ok, json) {
            if (typeof cb === 'function') cb(ok, json);
        }

        if (typeof fetch === 'function') {
            var opts = { method: method, cache: 'no-store', headers: {} };
            if (body) {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(body);
            }
            fetch(url, opts)
                .then(function (res) {
                    return res.json().then(function (json) {
                        done(res.ok && json && json.success === true, json);
                    }).catch(function () { done(false, null); });
                })
                .catch(function () { done(false, null); });
            return;
        }

        try {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            if (body) xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                var json = null;
                try { json = JSON.parse(xhr.responseText); } catch (e) {}
                done(xhr.status >= 200 && xhr.status < 300 && json && json.success === true, json);
            };
            xhr.send(body ? JSON.stringify(body) : null);
        } catch (e) {
            done(false, null);
        }
    }

    function fetchSoldOut() {
        if (!MENU_KEY) return;
        requestJson('GET', apiUrl(), null, function (ok, json) {
            if (!ok || !json || !Array.isArray(json.data)) return;
            applyRemoteNames(json.data);
        });
    }

    function persistSoldOut() {
        if (!MENU_KEY) return;
        if (persistTimer) clearTimeout(persistTimer);
        persistAttempt = 0;
        persistTimer = setTimeout(sendSoldOut, 50);
    }

    function sendSoldOut() {
        var payload = {
            key: MENU_KEY,
            items: Array.from(soldOutNames),
        };
        requestJson('POST', writeUrl(), payload, function (ok) {
            if (ok) {
                persistAttempt = 0;
                return;
            }
            persistAttempt += 1;
            if (persistAttempt <= 3) {
                persistTimer = setTimeout(sendSoldOut, 400 * persistAttempt);
            }
        });
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
    setInterval(fetchSoldOut, POLL_MS);
});

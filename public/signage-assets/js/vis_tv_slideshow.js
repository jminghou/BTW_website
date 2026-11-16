/**
 * VIS_世界_電視版：左側 spotlight 輪播 + 右側單擊標示售完。
 * 僅 vis_tv 使用；電腦版 vis3 仍走 spotlight_slideshow.js。
 *
 * 售完狀態寫在伺服器，以素材 id（asset:123）為主 key，
 * 同一份菜單的手機與廣告機共用；換一份菜單（不同 asset）即自動重置。
 *
 * 點一下就送出「這道菜要售完／要恢復」的明示狀態，不是在線上做切換。
 * 同一道菜半秒內的第二下會略過，避免一次觸控被當成兩下而立刻取消。
 */
document.addEventListener('DOMContentLoaded', function () {
    const spotlightItems = document.querySelectorAll('.spotlight-item');
    const menuItems = document.querySelectorAll('.menu-list-item');

    if (spotlightItems.length === 0 || menuItems.length === 0) {
        console.warn('vis_tv_slideshow: 找不到輪播或列表項目');
        return;
    }

    const INTERVAL_MS = 2500;
    const POLL_MS = 5000;
    const TAP_GUARD_MS = 500;
    const RETRY_BASE_MS = 500;
    const RETRY_MAX_MS = 8000;
    const RETRY_SLOW_AFTER = 12;
    const RETRY_SLOW_MS = 15000;
    const STORAGE_PREFIX = 'vis_tv_soldout:';

    let currentIndex = 0;
    let timer = null;
    let lastSeenVersion = 0;
    const pendingWrites = Object.create(null);
    const rejectedNames = Object.create(null);
    const lastToggleAt = Object.create(null);

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

    function ensureSyncStyles() {
        if (document.getElementById('vis-tv-sync-style')) return;
        var style = document.createElement('style');
        style.id = 'vis-tv-sync-style';
        style.textContent = [
            '.menu-list-item .soldout-sync {',
            '  display: inline-block;',
            '  align-self: flex-start;',
            '  margin-top: 2px;',
            '  font-size: 16px;',
            '  font-weight: 800;',
            '  line-height: 1.2;',
            '  padding: 2px 8px;',
            '  border-radius: 8px;',
            '  pointer-events: none;',
            '}',
            '.menu-list-item .soldout-sync[data-state="syncing"] {',
            '  color: #7a4b00;',
            '  background: #ffe08a;',
            '}',
            '.menu-list-item .soldout-sync[data-state="failed"] {',
            '  color: #ffffff;',
            '  background: #c62828;',
            '}',
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
    }

    function indicatorState(name) {
        var entry = pendingWrites[name];
        if (entry) {
            if (entry.inFlight) return 'syncing';
            if (entry.failed) return 'failed';
            return 'syncing';
        }
        if (Object.prototype.hasOwnProperty.call(rejectedNames, name)) return 'failed';
        return null;
    }

    function refreshIndicators() {
        for (var i = 0; i < menuItems.length; i++) {
            var el = menuItems[i];
            var name = dishName(el);
            var state = name ? indicatorState(name) : null;
            var badge = el.querySelector('.soldout-sync');
            if (!state) {
                if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
                continue;
            }
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'soldout-sync';
                var info = el.querySelector('.item-info') || el;
                info.appendChild(badge);
            }
            badge.setAttribute('data-state', state);
            badge.textContent = state === 'failed' ? '失敗' : '同步中';
        }
    }

    function hasPending() {
        for (var name in pendingWrites) {
            if (Object.prototype.hasOwnProperty.call(pendingWrites, name)) return true;
        }
        return false;
    }

    function readVersion(json) {
        if (!json || json.version == null || json.version === '') return null;
        var value = json.version;
        if (typeof value === 'string') value = Number(value);
        if (typeof value === 'number' && isFinite(value) && value >= 0) return value;
        return null;
    }

    function commitNames(next) {
        if (namesEqual(soldOutNames, next)) return;
        soldOutNames.clear();
        next.forEach(function (n) { soldOutNames.add(n); });
        saveSoldOutNames(soldOutNames);
        restoreSoldOutStyles();

        if (soldOutNames.size > 0 && isSoldOut(currentIndex)) {
            var jump = findAvailable(currentIndex, true);
            if (jump >= 0) showSlide(jump);
        }
        startTimer();
    }

    /**
     * version 比看過的還舊就丟掉。
     * 還有未完成的寫入時，輪詢整包忽略；自己的寫入回應仍套用，並把還沒寫完的項目蓋回去。
     */
    function applySnapshot(arr, version, fromPoll) {
        if (fromPoll && hasPending()) return;
        if (version == null || version < lastSeenVersion) return;
        lastSeenVersion = version;

        var next = new Set(Array.isArray(arr) ? arr : []);
        if (!fromPoll) {
            for (var name in pendingWrites) {
                if (!Object.prototype.hasOwnProperty.call(pendingWrites, name)) continue;
                if (pendingWrites[name].soldOut) next.add(name);
                else next.delete(name);
            }
        }
        commitNames(next);
        for (var rejected in rejectedNames) {
            if (Object.prototype.hasOwnProperty.call(rejectedNames, rejected)) {
                delete rejectedNames[rejected];
            }
        }
        refreshIndicators();
    }

    function apiUrl() {
        return originPrefix() + '/api/signage/soldout?key=' + encodeURIComponent(MENU_KEY);
    }

    function writeUrl() {
        return originPrefix() + '/api/signage/soldout';
    }

    function requestJson(method, url, body, cb) {
        function done(ok, json, status) {
            if (typeof cb === 'function') cb(ok, json, status || 0);
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
                        done(res.ok && json && json.success === true, json, res.status);
                    }).catch(function () { done(false, null, res.status); });
                })
                .catch(function () { done(false, null, 0); });
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
                done(xhr.status >= 200 && xhr.status < 300 && json && json.success === true, json, xhr.status);
            };
            xhr.send(body ? JSON.stringify(body) : null);
        } catch (e) {
            done(false, null, 0);
        }
    }

    function fetchSoldOut() {
        if (!MENU_KEY) return;
        requestJson('GET', apiUrl(), null, function (ok, json) {
            if (!ok || !json || !Array.isArray(json.data)) return;
            applySnapshot(json.data, readVersion(json), true);
        });
    }

    function retryDelay(attempts) {
        if (attempts > RETRY_SLOW_AFTER) return RETRY_SLOW_MS;
        var delay = RETRY_BASE_MS * Math.pow(2, attempts - 1);
        return Math.min(RETRY_MAX_MS, delay);
    }

    function revertOptimistic(name, sentSoldOut) {
        if (sentSoldOut) soldOutNames.delete(name);
        else soldOutNames.add(name);
        saveSoldOutNames(soldOutNames);
        restoreSoldOutStyles();
        startTimer();
    }

    function pump(name) {
        var entry = pendingWrites[name];
        if (!entry || entry.inFlight) return;
        if (entry.timer) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        entry.inFlight = true;
        entry.failed = false;
        refreshIndicators();
        var sent = entry.soldOut;
        requestJson('POST', writeUrl(), {
            key: MENU_KEY,
            name: name,
            soldOut: sent,
        }, function (ok, json, status) {
            var current = pendingWrites[name];
            if (!current) return;
            current.inFlight = false;
            if (current.soldOut !== sent) {
                current.failed = false;
                pump(name);
                return;
            }
            var version = readVersion(json);
            if (ok && version != null && json && Array.isArray(json.data)) {
                delete pendingWrites[name];
                applySnapshot(json.data, version, false);
                refreshIndicators();
                return;
            }
            current.attempts += 1;
            current.failed = true;
            refreshIndicators();
            if (status >= 400 && status < 500) {
                revertOptimistic(name, sent);
                delete pendingWrites[name];
                rejectedNames[name] = true;
                refreshIndicators();
                return;
            }
            current.timer = setTimeout(function () { pump(name); }, retryDelay(current.attempts));
        });
    }

    function queueWrite(name, soldOut) {
        if (!MENU_KEY) return;
        var entry = pendingWrites[name];
        if (!entry) {
            entry = pendingWrites[name] = {
                soldOut: soldOut,
                attempts: 0,
                timer: null,
                inFlight: false,
                failed: false,
            };
        } else {
            entry.soldOut = soldOut;
            entry.attempts = 0;
            entry.failed = false;
            if (entry.timer) {
                clearTimeout(entry.timer);
                entry.timer = null;
            }
        }
        delete rejectedNames[name];
        refreshIndicators();
        pump(name);
    }

    function restyleName(name) {
        var soldOut = soldOutNames.has(name);
        for (var i = 0; i < menuItems.length; i++) {
            if (dishName(menuItems[i]) === name) applySoldOutStyle(i, soldOut);
        }
    }

    function toggleSoldOut(index) {
        const name = dishName(menuItems[index]);
        if (!name) return;

        var soldOut;
        if (soldOutNames.has(name)) {
            soldOutNames.delete(name);
            soldOut = false;
        } else {
            soldOutNames.add(name);
            soldOut = true;
        }
        restyleName(name);
        if (soldOut && isSoldOut(currentIndex)) {
            const next = findAvailable(index, true);
            if (next >= 0) showSlide(next);
        }
        saveSoldOutNames(soldOutNames);
        startTimer();
        queueWrite(name, soldOut);
    }

    function onItemActivate(index) {
        var name = dishName(menuItems[index]);
        if (!name) return;
        var now = Date.now();
        if (lastToggleAt[name] && now - lastToggleAt[name] < TAP_GUARD_MS) return;
        lastToggleAt[name] = now;
        toggleSoldOut(index);
    }

    menuItems.forEach(function (el, index) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            onItemActivate(index);
        });
    });

    ensureSyncStyles();
    restoreSoldOutStyles();

    const initial = findAvailable(0, false);
    if (initial >= 0) showSlide(initial);
    startTimer();

    fetchSoldOut();
    setInterval(fetchSoldOut, POLL_MS);
});

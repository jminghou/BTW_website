import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

/**
 * 數位看版系統資料庫工具
 * 所有表都以 signage_ 為前綴，避免與官網表衝突
 * 共用官網的 users 表做登入，不另建帳號表
 */

// fetchOptions.cache = 'no-store'：關閉 Next.js 對「資料庫查詢」的 fetch 快取。
// 否則 GET Route Handler 內的 DB 讀取會被框架快取且不自動失效，造成後台清單
// 被凍結在舊快照（曾出現：播放清單只剩 20 筆、排程列表顯示 0 筆、播放器讀到舊內容）。
// 這是讓所有 signage 查詢都即時反映資料庫的單點修正。
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { cache: 'no-store' },
});

// ==================== 初始化 ====================

export async function createSignageTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS signage_regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_sites (
        id SERIAL PRIMARY KEY,
        region_id INTEGER NOT NULL REFERENCES signage_regions(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_screens (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL REFERENCES signage_sites(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        unique_key VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_assets (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES signage_sites(id) ON DELETE SET NULL,
        filename VARCHAR(255) NOT NULL,
        blob_url VARCHAR(500) NOT NULL,
        description VARCHAR(255),
        upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_playlists (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL REFERENCES signage_sites(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_playlist_items (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER NOT NULL REFERENCES signage_playlists(id) ON DELETE CASCADE,
        asset_id INTEGER NOT NULL REFERENCES signage_assets(id) ON DELETE CASCADE,
        duration_seconds INTEGER NOT NULL DEFAULT 10,
        "order" INTEGER NOT NULL DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signage_schedules (
        id SERIAL PRIMARY KEY,
        screen_id INTEGER NOT NULL REFERENCES signage_screens(id) ON DELETE CASCADE,
        playlist_id INTEGER NOT NULL REFERENCES signage_playlists(id) ON DELETE CASCADE,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        days_of_week VARCHAR(50) NOT NULL,
        play_date DATE,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 既有資料庫的相容遷移：日期區間排程（start_date ~ end_date）。
    // CREATE TABLE IF NOT EXISTS 不會為「已存在」的表補欄位，故需 ALTER。
    await sql`ALTER TABLE signage_schedules ADD COLUMN IF NOT EXISTS start_date DATE;`;
    await sql`ALTER TABLE signage_schedules ADD COLUMN IF NOT EXISTS end_date DATE;`;

    // 各廠區的餐期時段設定（一鍵列表轉排程依此判斷餐期對應的播放時間）
    await sql`
      CREATE TABLE IF NOT EXISTS signage_meal_slots (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL REFERENCES signage_sites(id) ON DELETE CASCADE,
        meal_key VARCHAR(4) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (site_id, meal_key)
      );
    `;

    console.log('看版系統資料表建立成功！');
    return { success: true, message: '看版系統資料表建立成功' };
  } catch (error) {
    console.error('建立看版資料表時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Regions ====================

export async function getRegions() {
  try {
    const result = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM signage_regions
      ORDER BY id ASC;
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得區域時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function createRegion(data: { name: string; description?: string }) {
  try {
    const result = await sql`
      INSERT INTO signage_regions (name, description)
      VALUES (${data.name}, ${data.description || null})
      RETURNING id, name, description, created_at, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立區域時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updateRegion(id: number, data: { name?: string; description?: string }) {
  try {
    const existing = await sql`SELECT id FROM signage_regions WHERE id = ${id};`;
    if (existing.length === 0) {
      return { success: false, error: '找不到指定的區域' };
    }
    const result = await sql`
      UPDATE signage_regions SET
        name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新區域時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deleteRegion(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_regions WHERE id = ${id}
      RETURNING id, name;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的區域' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除區域時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Sites ====================

export async function getSites(regionId?: number) {
  try {
    const result = regionId
      ? await sql`
          SELECT s.id, s.region_id, s.name, s.code, s.description, s.created_at, s.updated_at,
                 r.name AS region_name
          FROM signage_sites s
          LEFT JOIN signage_regions r ON s.region_id = r.id
          WHERE s.region_id = ${regionId}
          ORDER BY s.id ASC;
        `
      : await sql`
          SELECT s.id, s.region_id, s.name, s.code, s.description, s.created_at, s.updated_at,
                 r.name AS region_name
          FROM signage_sites s
          LEFT JOIN signage_regions r ON s.region_id = r.id
          ORDER BY s.id ASC;
        `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得廠區時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getSiteById(id: number) {
  try {
    const result = await sql`
      SELECT s.id, s.region_id, s.name, s.code, s.description, r.name AS region_name
      FROM signage_sites s
      LEFT JOIN signage_regions r ON s.region_id = r.id
      WHERE s.id = ${id}
      LIMIT 1;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的廠區' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('取得廠區時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function createSite(data: {
  region_id: number;
  name: string;
  code: string;
  description?: string;
}) {
  try {
    if (!/^[a-zA-Z0-9_]+$/.test(data.code)) {
      return { success: false, error: '廠區代號只能使用英文、數字和底線' };
    }
    const existing = await sql`SELECT id FROM signage_sites WHERE code = ${data.code};`;
    if (existing.length > 0) {
      return { success: false, error: '廠區代號已存在' };
    }
    const result = await sql`
      INSERT INTO signage_sites (region_id, name, code, description)
      VALUES (${data.region_id}, ${data.name}, ${data.code}, ${data.description || null})
      RETURNING id, region_id, name, code, description, created_at, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立廠區時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updateSite(id: number, data: {
  region_id?: number;
  name?: string;
  description?: string;
}) {
  try {
    const existing = await sql`SELECT id FROM signage_sites WHERE id = ${id};`;
    if (existing.length === 0) {
      return { success: false, error: '找不到指定的廠區' };
    }
    const result = await sql`
      UPDATE signage_sites SET
        region_id = COALESCE(${data.region_id ?? null}, region_id),
        name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, region_id, name, code, description, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新廠區時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deleteSite(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_sites WHERE id = ${id}
      RETURNING id, name;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的廠區' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除廠區時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Screens ====================

export async function getScreens(siteId?: number) {
  try {
    const result = siteId
      ? await sql`
          SELECT sc.id, sc.site_id, sc.name, sc.unique_key, sc.description, sc.created_at,
                 s.name AS site_name, s.code AS site_code
          FROM signage_screens sc
          LEFT JOIN signage_sites s ON sc.site_id = s.id
          WHERE sc.site_id = ${siteId}
          ORDER BY sc.id ASC;
        `
      : await sql`
          SELECT sc.id, sc.site_id, sc.name, sc.unique_key, sc.description, sc.created_at,
                 s.name AS site_name, s.code AS site_code
          FROM signage_screens sc
          LEFT JOIN signage_sites s ON sc.site_id = s.id
          ORDER BY sc.id ASC;
        `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得螢幕時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getScreenByKey(uniqueKey: string) {
  try {
    const result = await sql`
      SELECT id, site_id, name, unique_key, description
      FROM signage_screens
      WHERE unique_key = ${uniqueKey}
      LIMIT 1;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的螢幕' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('取得螢幕時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function createScreen(data: {
  site_id: number;
  name: string;
  description?: string;
}) {
  try {
    const uniqueKey = randomUUID();
    const result = await sql`
      INSERT INTO signage_screens (site_id, name, unique_key, description)
      VALUES (${data.site_id}, ${data.name}, ${uniqueKey}, ${data.description || null})
      RETURNING id, site_id, name, unique_key, description, created_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立螢幕時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updateScreen(id: number, data: { name?: string; description?: string }) {
  try {
    const existing = await sql`SELECT id FROM signage_screens WHERE id = ${id};`;
    if (existing.length === 0) {
      return { success: false, error: '找不到指定的螢幕' };
    }
    const result = await sql`
      UPDATE signage_screens SET
        name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, site_id, name, unique_key, description, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新螢幕時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deleteScreen(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_screens WHERE id = ${id}
      RETURNING id, name;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的螢幕' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除螢幕時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Assets ====================

export async function getAssets(siteId?: number) {
  try {
    const result = siteId
      ? await sql`
          SELECT a.id, a.site_id, a.filename, a.blob_url, a.description, a.upload_timestamp,
                 s.name AS site_name, s.code AS site_code
          FROM signage_assets a
          LEFT JOIN signage_sites s ON a.site_id = s.id
          WHERE a.site_id = ${siteId}
          ORDER BY a.upload_timestamp DESC;
        `
      : await sql`
          SELECT a.id, a.site_id, a.filename, a.blob_url, a.description, a.upload_timestamp,
                 s.name AS site_name, s.code AS site_code
          FROM signage_assets a
          LEFT JOIN signage_sites s ON a.site_id = s.id
          ORDER BY a.upload_timestamp DESC;
        `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得素材時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getAssetById(id: number) {
  try {
    const result = await sql`
      SELECT id, site_id, filename, blob_url, description, upload_timestamp
      FROM signage_assets WHERE id = ${id}
      LIMIT 1;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的素材' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('取得素材時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function createAsset(data: {
  site_id: number | null;
  filename: string;
  blob_url: string;
  description?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO signage_assets (site_id, filename, blob_url, description)
      VALUES (${data.site_id}, ${data.filename}, ${data.blob_url}, ${data.description || null})
      RETURNING id, site_id, filename, blob_url, description, upload_timestamp;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立素材時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updateAssetBlobUrl(id: number, blobUrl: string) {
  try {
    const result = await sql`
      UPDATE signage_assets SET blob_url = ${blobUrl}
      WHERE id = ${id}
      RETURNING id, site_id, filename, blob_url;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的素材' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新素材內容時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deleteAsset(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_assets WHERE id = ${id}
      RETURNING id, filename, blob_url;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的素材' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除素材時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function batchDeleteAssets(ids: number[]) {
  try {
    if (ids.length === 0) {
      return { success: false, error: '未提供要刪除的素材 ID' };
    }
    const result = await sql`
      DELETE FROM signage_assets WHERE id = ANY(${ids})
      RETURNING id, filename, blob_url;
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('批次刪除素材時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Playlists ====================

export async function getPlaylists(siteId?: number) {
  try {
    const result = siteId
      ? await sql`
          SELECT p.id, p.site_id, p.name, p.description, p.created_at, p.updated_at,
                 s.name AS site_name
          FROM signage_playlists p
          LEFT JOIN signage_sites s ON p.site_id = s.id
          WHERE p.site_id = ${siteId}
          ORDER BY p.id ASC;
        `
      : await sql`
          SELECT p.id, p.site_id, p.name, p.description, p.created_at, p.updated_at,
                 s.name AS site_name
          FROM signage_playlists p
          LEFT JOIN signage_sites s ON p.site_id = s.id
          ORDER BY p.id ASC;
        `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getPlaylistById(id: number) {
  try {
    const playlist = await sql`
      SELECT id, site_id, name, description, created_at, updated_at
      FROM signage_playlists WHERE id = ${id};
    `;
    if (playlist.length === 0) {
      return { success: false, error: '找不到指定的播放清單' };
    }
    const items = await sql`
      SELECT pi.id, pi.playlist_id, pi.asset_id, pi.duration_seconds, pi."order",
             a.filename, a.blob_url, a.description AS asset_description
      FROM signage_playlist_items pi
      LEFT JOIN signage_assets a ON pi.asset_id = a.id
      WHERE pi.playlist_id = ${id}
      ORDER BY pi."order" ASC;
    `;
    return { success: true, data: { ...playlist[0], items } };
  } catch (error) {
    console.error('取得播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function createPlaylist(data: {
  site_id: number;
  name: string;
  description?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO signage_playlists (site_id, name, description)
      VALUES (${data.site_id}, ${data.name}, ${data.description || null})
      RETURNING id, site_id, name, description, created_at, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updatePlaylist(id: number, data: { name?: string; description?: string }) {
  try {
    const existing = await sql`SELECT id FROM signage_playlists WHERE id = ${id};`;
    if (existing.length === 0) {
      return { success: false, error: '找不到指定的播放清單' };
    }
    const result = await sql`
      UPDATE signage_playlists SET
        name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, site_id, name, description, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deletePlaylist(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_playlists WHERE id = ${id}
      RETURNING id, name;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的播放清單' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function batchDeletePlaylists(ids: number[]) {
  try {
    if (ids.length === 0) {
      return { success: false, error: '未提供要刪除的播放清單 ID' };
    }
    const result = await sql`
      DELETE FROM signage_playlists WHERE id = ANY(${ids})
      RETURNING id, name;
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('批次刪除播放清單時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 一鍵素材轉列表：把該廠區的每個素材各建一個同名播放清單（含 1 個 item）
 * 對應 v2.0 admin.py auto-create-from-assets，但 duration 預設 180 秒。
 * 同名清單已存在則跳過。回傳 { created, skipped }。
 */
/**
 * 將「指定的素材」各建一個同名播放清單（含 1 個 item）。
 * 同廠區已有同名清單者略過；本批次內重複檔名只建一個。
 *
 * 採批次寫入（用 jsonb 一次插入所有清單、再一次插入所有項目），
 * 全程僅約 4 次資料庫往返，與素材數量無關 → 不會因逐筆送指令而逾時。
 */
export async function createPlaylistsFromAssetIds(assetIds: number[], durationSeconds = 180) {
  try {
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return { success: false, error: '未提供要轉換的素材' };
    }
    const dur = Number.isFinite(durationSeconds) && durationSeconds >= 1 ? Math.floor(durationSeconds) : 180;

    const assets = (await sql`
      SELECT id, site_id, filename FROM signage_assets WHERE id = ANY(${assetIds}) ORDER BY filename ASC;
    `) as Array<{ id: number; site_id: number | null; filename: string }>;
    if (assets.length === 0) {
      return { success: false, error: '找不到指定的素材' };
    }

    // 這些素材所屬廠區（一般為同一廠區，仍一般化處理）
    const siteIds = Array.from(new Set(assets.map(a => a.site_id).filter((s): s is number => s != null)));
    const existing = (await sql`
      SELECT site_id, name FROM signage_playlists WHERE site_id = ANY(${siteIds});
    `) as Array<{ site_id: number; name: string }>;
    const existingKey = new Set(existing.map(e => `${e.site_id}|${e.name}`));

    // 過濾：沒有所屬廠區、已存在同名清單、或本批次內重複者 → 略過
    const seen = new Set<string>();
    const toCreate: Array<{ site_id: number; asset_id: number; name: string }> = [];
    let skipped = 0;
    for (const a of assets) {
      if (a.site_id == null) { skipped++; continue; }
      const key = `${a.site_id}|${a.filename}`;
      if (existingKey.has(key) || seen.has(key)) { skipped++; continue; }
      seen.add(key);
      toCreate.push({ site_id: a.site_id, asset_id: a.id, name: a.filename });
    }

    if (toCreate.length === 0) {
      return { success: true, data: { created: 0, skipped, total: assets.length } };
    }

    // 批次插入播放清單（單次往返），用 jsonb 避免陣列字串轉義問題
    const playlistRows = toCreate.map(t => ({
      site_id: t.site_id,
      name: t.name,
      desc: '自動建立自素材: ' + t.name,
    }));
    const inserted = (await sql`
      INSERT INTO signage_playlists (site_id, name, description)
      SELECT (x->>'site_id')::int, x->>'name', x->>'desc'
      FROM jsonb_array_elements(${JSON.stringify(playlistRows)}::jsonb) AS x
      RETURNING id, site_id, name;
    `) as Array<{ id: number; site_id: number; name: string }>;

    const pidByKey = new Map(inserted.map(p => [`${p.site_id}|${p.name}`, p.id]));
    const itemRows = toCreate
      .map(t => ({ playlist_id: pidByKey.get(`${t.site_id}|${t.name}`), asset_id: t.asset_id }))
      .filter((r): r is { playlist_id: number; asset_id: number } => r.playlist_id != null);

    // 批次插入清單項目（單次往返）
    await sql`
      INSERT INTO signage_playlist_items (playlist_id, asset_id, duration_seconds, "order")
      SELECT (x->>'playlist_id')::int, (x->>'asset_id')::int, ${dur}, 0
      FROM jsonb_array_elements(${JSON.stringify(itemRows)}::jsonb) AS x;
    `;

    return { success: true, data: { created: inserted.length, skipped, total: assets.length } };
  } catch (error) {
    console.error('素材轉列表時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 一鍵素材轉列表：把該廠區「所有」素材轉成清單。
 * 改為委派給 createPlaylistsFromAssetIds 的批次寫入版，避免逐筆送指令而逾時。
 */
export async function autoCreatePlaylistsFromAssets(siteId: number, durationSeconds = 180) {
  try {
    const assets = (await sql`
      SELECT id FROM signage_assets WHERE site_id = ${siteId} ORDER BY filename ASC;
    `) as Array<{ id: number }>;
    if (assets.length === 0) {
      return { success: true, data: { created: 0, skipped: 0, total: 0 } };
    }
    return await createPlaylistsFromAssetIds(assets.map(a => a.id), durationSeconds);
  } catch (error) {
    console.error('一鍵素材轉列表時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 取代整份播放清單的項目（刪除舊的、插入新的）
 * 適合用在拖曳排序後一次性更新
 */
export async function replacePlaylistItems(
  playlistId: number,
  items: { asset_id: number; duration_seconds: number; order: number }[],
) {
  try {
    const playlist = await sql`SELECT id FROM signage_playlists WHERE id = ${playlistId};`;
    if (playlist.length === 0) {
      return { success: false, error: '找不到指定的播放清單' };
    }
    await sql`DELETE FROM signage_playlist_items WHERE playlist_id = ${playlistId};`;
    for (const item of items) {
      await sql`
        INSERT INTO signage_playlist_items (playlist_id, asset_id, duration_seconds, "order")
        VALUES (${playlistId}, ${item.asset_id}, ${item.duration_seconds}, ${item.order});
      `;
    }
    return { success: true, data: { playlist_id: playlistId, count: items.length } };
  } catch (error) {
    console.error('更新播放清單項目時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 將同一組素材附加（append）到多個既有播放清單的尾端。
 * 新項目的 order 接續每個清單目前最大的 order 之後，不會動到既有項目。
 */
export async function batchAppendItemsToPlaylists(
  playlistIds: number[],
  items: { asset_id: number; duration_seconds: number }[],
) {
  try {
    if (playlistIds.length === 0 || items.length === 0) {
      return { success: false, error: '未提供清單或素材' };
    }
    const existing = await sql`
      SELECT id FROM signage_playlists WHERE id = ANY(${playlistIds});
    `;
    const validIds = new Set((existing as { id: number }[]).map(r => r.id));
    const targetIds = playlistIds.filter(id => validIds.has(id));
    if (targetIds.length === 0) {
      return { success: false, error: '找不到任何指定的播放清單' };
    }

    let totalInserted = 0;
    for (const pid of targetIds) {
      const maxRow = await sql`
        SELECT COALESCE(MAX("order"), -1) AS max_order
        FROM signage_playlist_items WHERE playlist_id = ${pid};
      `;
      let nextOrder = Number((maxRow[0] as { max_order: number }).max_order) + 1;
      for (const item of items) {
        await sql`
          INSERT INTO signage_playlist_items (playlist_id, asset_id, duration_seconds, "order")
          VALUES (${pid}, ${item.asset_id}, ${item.duration_seconds}, ${nextOrder});
        `;
        nextOrder += 1;
        totalInserted += 1;
      }
    }
    return {
      success: true,
      data: {
        playlist_count: targetIds.length,
        item_count: items.length,
        inserted: totalInserted,
      },
    };
  } catch (error) {
    console.error('批次附加播放項目時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 批次統一修改多個播放清單內「所有項目」的播放秒數。
 * 一次更新所選清單的全部 items，回傳實際異動的清單數與項目筆數。
 */
export async function batchSetPlaylistItemsDuration(
  playlistIds: number[],
  durationSeconds: number,
) {
  try {
    if (playlistIds.length === 0) {
      return { success: false, error: '未提供要更新的播放清單' };
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
      return { success: false, error: '播放秒數必須是大於 0 的數字' };
    }
    const dur = Math.floor(durationSeconds);
    const updated = await sql`
      UPDATE signage_playlist_items
      SET duration_seconds = ${dur}
      WHERE playlist_id = ANY(${playlistIds})
      RETURNING id, playlist_id;
    `;
    const affectedPlaylists = new Set(
      (updated as Array<{ playlist_id: number }>).map(r => r.playlist_id),
    );
    return {
      success: true,
      data: {
        playlist_count: affectedPlaylists.size,
        item_count: updated.length,
        duration_seconds: dur,
      },
    };
  } catch (error) {
    console.error('批次修改播放秒數時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== 餐期時段設定（每廠區） ====================

export interface MealSlot {
  meal_key: 'B' | 'L' | 'D' | 'N';
  start_time: string; // "HH:MM" 或 "HH:MM:SS"
  end_time: string;
  enabled: boolean;
}

const MEAL_ORDER: MealSlot['meal_key'][] = ['B', 'L', 'D', 'N'];
const MEAL_DEFAULTS: Record<MealSlot['meal_key'], { start: string; end: string; enabled: boolean }> = {
  B: { start: '06:00:00', end: '10:00:00', enabled: false },
  L: { start: '10:00:00', end: '15:00:00', enabled: true },
  D: { start: '15:00:00', end: '20:00:00', enabled: true },
  N: { start: '21:00:00', end: '02:00:00', enabled: true }, // 結束<開始 → 跨日
};

async function ensureMealSlotsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS signage_meal_slots (
      id SERIAL PRIMARY KEY,
      site_id INTEGER NOT NULL REFERENCES signage_sites(id) ON DELETE CASCADE,
      meal_key VARCHAR(4) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (site_id, meal_key)
    );
  `;
}

/** 取得某廠區的餐期設定；若尚未設定則先植入預設值 */
export async function getMealSlots(siteId: number) {
  try {
    await ensureMealSlotsTable();
    let rows = await sql`
      SELECT meal_key, start_time, end_time, enabled
      FROM signage_meal_slots WHERE site_id = ${siteId};
    `;
    if (rows.length === 0) {
      for (const key of MEAL_ORDER) {
        const d = MEAL_DEFAULTS[key];
        await sql`
          INSERT INTO signage_meal_slots (site_id, meal_key, start_time, end_time, enabled)
          VALUES (${siteId}, ${key}, ${d.start}, ${d.end}, ${d.enabled})
          ON CONFLICT (site_id, meal_key) DO NOTHING;
        `;
      }
      rows = await sql`
        SELECT meal_key, start_time, end_time, enabled
        FROM signage_meal_slots WHERE site_id = ${siteId};
      `;
    }
    // 依固定順序回傳
    const map = new Map((rows as Array<{ meal_key: string; start_time: string; end_time: string; enabled: boolean }>).map(r => [r.meal_key, r]));
    const ordered = MEAL_ORDER.map(k => {
      const r = map.get(k);
      return {
        meal_key: k,
        start_time: r ? String(r.start_time).substring(0, 5) : MEAL_DEFAULTS[k].start.substring(0, 5),
        end_time: r ? String(r.end_time).substring(0, 5) : MEAL_DEFAULTS[k].end.substring(0, 5),
        enabled: r ? r.enabled : MEAL_DEFAULTS[k].enabled,
      };
    });
    return { success: true, data: ordered };
  } catch (error) {
    console.error('取得餐期設定時發生錯誤：', error);
    return { success: false, error };
  }
}

/** 更新某廠區的餐期設定 */
export async function updateMealSlots(siteId: number, slots: MealSlot[]) {
  try {
    await ensureMealSlotsTable();
    for (const s of slots) {
      if (!MEAL_ORDER.includes(s.meal_key)) continue;
      await sql`
        INSERT INTO signage_meal_slots (site_id, meal_key, start_time, end_time, enabled, updated_at)
        VALUES (${siteId}, ${s.meal_key}, ${s.start_time}, ${s.end_time}, ${s.enabled}, CURRENT_TIMESTAMP)
        ON CONFLICT (site_id, meal_key)
        DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
                      enabled = EXCLUDED.enabled, updated_at = CURRENT_TIMESTAMP;
      `;
    }
    return { success: true };
  } catch (error) {
    console.error('更新餐期設定時發生錯誤：', error);
    return { success: false, error };
  }
}

/** 把「開始-結束」展開成排程時段；結束<=開始視為跨日，拆成兩段 */
function buildSegments(start: string, end: string): { start: string; end: string; nextDay?: boolean }[] {
  const s = start.length === 5 ? `${start}:00` : start;
  const e = end.length === 5 ? `${end}:00` : end;
  if (e > s) return [{ start: s, end: e }];
  // 跨日：當日到 23:59:59 + 隔日 00:00:00 到結束
  return [
    { start: s, end: '23:59:59' },
    { start: '00:00:00', end: e, nextDay: true },
  ];
}

/**
 * 一鍵列表轉排程：依播放清單內素材的檔名自動產生排程
 * 對應 v2.0 admin.py auto_generate_schedules，但時段改讀「各廠區餐期設定」。
 *
 * 檔名格式：*_([BLDN])_(YYYY-MM-DD).html，只處理該廠區「已啟用」的餐期。
 *   時段依 signage_meal_slots；結束<=開始自動跨日拆兩段。
 *   play_date = 檔名日期（跨日段為隔日）；days_of_week = [該日 isoweekday]
 * 為該廠區所有螢幕各建一筆；同 (screen,playlist,days,start,end) 已存在則跳過或補填 play_date。
 */
function isoWeekdayLocal(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return ((dt.getDay() + 6) % 7) + 1; // 1=Mon ... 7=Sun
}

function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function autoGenerateSchedulesFromPlaylists(siteId: number) {
  try {
    // 該廠區所有螢幕
    const screens = await sql`SELECT id FROM signage_screens WHERE site_id = ${siteId};`;
    const screenIds = (screens as Array<{ id: number }>).map(s => s.id);
    if (screenIds.length === 0) {
      return { success: false, error: '此廠區尚無螢幕，請先建立螢幕' };
    }

    // 該廠區的餐期設定 → 建立「啟用餐期 → 時段」對照
    const slotsResult = await getMealSlots(siteId);
    if (!slotsResult.success || !slotsResult.data) {
      return { success: false, error: '無法讀取餐期設定' };
    }
    const slotSegments = new Map<string, { start: string; end: string; nextDay?: boolean }[]>();
    for (const s of slotsResult.data) {
      if (s.enabled) slotSegments.set(s.meal_key, buildSegments(s.start_time, s.end_time));
    }

    // 該廠區所有播放清單內的素材檔名
    const rows = await sql`
      SELECT pi.playlist_id, a.filename
      FROM signage_playlist_items pi
      JOIN signage_assets a ON pi.asset_id = a.id
      JOIN signage_playlists p ON pi.playlist_id = p.id
      WHERE p.site_id = ${siteId};
    `;

    // 該廠區既有排程（用於去重/補填）
    const existingRows = await sql`
      SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time, s.days_of_week, s.play_date
      FROM signage_schedules s
      JOIN signage_screens sc ON s.screen_id = sc.id
      WHERE sc.site_id = ${siteId};
    `;
    const norm = (t: unknown) => String(t).substring(0, 8); // "HH:MM:SS"
    const existingMap = new Map<string, { id: number; play_date: string | null }>();
    for (const e of existingRows as Array<{ id: number; screen_id: number; playlist_id: number; start_time: string; end_time: string; days_of_week: string; play_date: string | null }>) {
      const key = `${e.screen_id}|${e.playlist_id}|${e.days_of_week}|${norm(e.start_time)}|${norm(e.end_time)}`;
      existingMap.set(key, { id: e.id, play_date: e.play_date ? String(e.play_date).substring(0, 10) : null });
    }

    const pattern = /_([BLDN])_(\d{4}-\d{2}-\d{2})\.html$/i;
    let created = 0, updated = 0, skipped = 0;
    const inserts: { screen_id: number; playlist_id: number; start: string; end: string; days: string; play_date: string }[] = [];
    const updates: { id: number; play_date: string }[] = [];

    for (const row of rows as Array<{ playlist_id: number; filename: string }>) {
      const match = row.filename.match(pattern);
      if (!match) continue;
      const slot = match[1].toUpperCase();
      const baseDate = match[2];
      const segments = slotSegments.get(slot); // 只處理已啟用的餐期
      if (!segments) continue;

      for (const seg of segments) {
        const playDate = seg.nextDay ? addOneDay(baseDate) : baseDate;
        const daysJson = JSON.stringify([isoWeekdayLocal(playDate)]);
        for (const screenId of screenIds) {
          const key = `${screenId}|${row.playlist_id}|${daysJson}|${seg.start}|${seg.end}`;
          const existing = existingMap.get(key);
          if (existing) {
            if (existing.play_date === null) {
              updates.push({ id: existing.id, play_date: playDate });
              existing.play_date = playDate;
              updated++;
            } else if (existing.play_date === playDate) {
              skipped++;
            } else {
              inserts.push({ screen_id: screenId, playlist_id: row.playlist_id, start: seg.start, end: seg.end, days: daysJson, play_date: playDate });
              created++;
            }
          } else {
            inserts.push({ screen_id: screenId, playlist_id: row.playlist_id, start: seg.start, end: seg.end, days: daysJson, play_date: playDate });
            existingMap.set(key, { id: -1, play_date: playDate });
            created++;
          }
        }
      }
    }

    // ===== 批次寫入（取代原本逐筆 await，避免上百次往返導致 Serverless 逾時）=====
    // 每筆 INSERT 用 6 個參數、UPDATE 用 2 個參數；Postgres 單次查詢參數上限 65535，
    // 故以 1000 列為一批切塊，把上百次往返收斂成個位數次。
    const CHUNK = 1000;

    // 補填既有排程的 play_date：用 UPDATE ... FROM (VALUES ...) 一次更新多列
    for (let i = 0; i < updates.length; i += CHUNK) {
      const batch = updates.slice(i, i + CHUNK);
      const params: (number | string)[] = [];
      const tuples = batch.map((u, j) => {
        const b = j * 2;
        params.push(u.id, u.play_date);
        return `($${b + 1}::int, $${b + 2}::date)`;
      }).join(', ');
      await sql.query(
        `UPDATE signage_schedules AS s
         SET play_date = v.pd, updated_at = CURRENT_TIMESTAMP
         FROM (VALUES ${tuples}) AS v(vid, pd)
         WHERE s.id = v.vid`,
        params,
      );
    }

    // 新增排程：單一多列 INSERT
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const batch = inserts.slice(i, i + CHUNK);
      const params: (number | string)[] = [];
      const rowsSql = batch.map((ins, j) => {
        const b = j * 6;
        params.push(ins.screen_id, ins.playlist_id, ins.start, ins.end, ins.days, ins.play_date);
        return `($${b + 1}::int, $${b + 2}::int, $${b + 3}::time, $${b + 4}::time, $${b + 5}, $${b + 6}::date)`;
      }).join(', ');
      await sql.query(
        `INSERT INTO signage_schedules (screen_id, playlist_id, start_time, end_time, days_of_week, play_date)
         VALUES ${rowsSql}`,
        params,
      );
    }

    return { success: true, data: { created, updated, skipped } };
  } catch (error) {
    console.error('一鍵列表轉排程時發生錯誤：', error);
    return { success: false, error };
  }
}

// ==================== Schedules ====================

export async function getSchedules(screenId?: number) {
  try {
    const result = screenId
      ? await sql`
          SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time,
                 s.days_of_week, s.play_date, s.start_date, s.end_date, s.created_at,
                 sc.name AS screen_name, p.name AS playlist_name
          FROM signage_schedules s
          LEFT JOIN signage_screens sc ON s.screen_id = sc.id
          LEFT JOIN signage_playlists p ON s.playlist_id = p.id
          WHERE s.screen_id = ${screenId}
          ORDER BY s.id ASC;
        `
      : await sql`
          SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time,
                 s.days_of_week, s.play_date, s.start_date, s.end_date, s.created_at,
                 sc.name AS screen_name, p.name AS playlist_name
          FROM signage_schedules s
          LEFT JOIN signage_screens sc ON s.screen_id = sc.id
          LEFT JOIN signage_playlists p ON s.playlist_id = p.id
          ORDER BY s.id ASC;
        `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得排程時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getSchedulesByScreenKey(uniqueKey: string) {
  try {
    const result = await sql`
      SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time,
             s.days_of_week, s.play_date, s.start_date, s.end_date,
             p.name AS playlist_name, sc.name AS screen_name
      FROM signage_schedules s
      INNER JOIN signage_screens sc ON s.screen_id = sc.id
      INNER JOIN signage_playlists p ON s.playlist_id = p.id
      WHERE sc.unique_key = ${uniqueKey};
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得排程時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function getPlaylistItemsByPlaylistId(playlistId: number) {
  try {
    const result = await sql`
      SELECT pi.id, pi.playlist_id, pi.asset_id, pi.duration_seconds, pi."order",
             a.filename, a.blob_url, a.description
      FROM signage_playlist_items pi
      INNER JOIN signage_assets a ON pi.asset_id = a.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi."order" ASC;
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('取得播放清單項目時發生錯誤：', error);
    return { success: false, error };
  }
}

export interface ScheduleInput {
  screen_id: number;
  playlist_id: number;
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  days_of_week: number[]; // [1,2,3,4,5] 週一到週五
  play_date?: string | null; // 特定單日 "YYYY-MM-DD" 或 null
  start_date?: string | null; // 日期區間起 "YYYY-MM-DD" 或 null
  end_date?: string | null; // 日期區間迄 "YYYY-MM-DD" 或 null
}

export async function createSchedule(data: ScheduleInput) {
  try {
    const daysJson = JSON.stringify(data.days_of_week);
    const result = await sql`
      INSERT INTO signage_schedules (screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date)
      VALUES (${data.screen_id}, ${data.playlist_id}, ${data.start_time}, ${data.end_time},
              ${daysJson}, ${data.play_date || null}, ${data.start_date || null}, ${data.end_date || null})
      RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date, created_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立排程時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function updateSchedule(id: number, data: Partial<ScheduleInput>) {
  try {
    const existing = await sql`SELECT id FROM signage_schedules WHERE id = ${id};`;
    if (existing.length === 0) {
      return { success: false, error: '找不到指定的排程' };
    }
    const daysJson = data.days_of_week ? JSON.stringify(data.days_of_week) : null;
    const result = await sql`
      UPDATE signage_schedules SET
        screen_id = COALESCE(${data.screen_id ?? null}, screen_id),
        playlist_id = COALESCE(${data.playlist_id ?? null}, playlist_id),
        start_time = COALESCE(${data.start_time ?? null}, start_time),
        end_time = COALESCE(${data.end_time ?? null}, end_time),
        days_of_week = COALESCE(${daysJson}, days_of_week),
        play_date = ${data.play_date === undefined ? null : data.play_date},
        start_date = ${data.start_date === undefined ? null : data.start_date},
        end_date = ${data.end_date === undefined ? null : data.end_date},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date, updated_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新排程時發生錯誤：', error);
    return { success: false, error };
  }
}

export async function deleteSchedule(id: number) {
  try {
    const result = await sql`
      DELETE FROM signage_schedules WHERE id = ${id}
      RETURNING id;
    `;
    if (result.length === 0) {
      return { success: false, error: '找不到指定的排程' };
    }
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除排程時發生錯誤：', error);
    return { success: false, error };
  }
}

/**
 * 批次建立排程：一份排程內容套用到多個螢幕
 * 對應 v2.0 的 /api/schedules/batch
 */
export async function batchCreateSchedules(data: {
  screen_ids: number[];
  playlist_id: number;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  play_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}) {
  try {
    if (!data.screen_ids || data.screen_ids.length === 0) {
      return { success: false, error: '未提供要套用的螢幕' };
    }
    const daysJson = JSON.stringify(data.days_of_week);
    const created: unknown[] = [];
    for (const screenId of data.screen_ids) {
      const result = await sql`
        INSERT INTO signage_schedules (screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date)
        VALUES (${screenId}, ${data.playlist_id}, ${data.start_time}, ${data.end_time},
                ${daysJson}, ${data.play_date || null}, ${data.start_date || null}, ${data.end_date || null})
        RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date;
      `;
      created.push(result[0]);
    }
    return { success: true, data: created };
  } catch (error) {
    console.error('批次建立排程時發生錯誤：', error);
    return { success: false, error };
  }
}

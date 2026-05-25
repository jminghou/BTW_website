import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

/**
 * 數位看版系統資料庫工具
 * 所有表都以 signage_ 為前綴，避免與官網表衝突
 * 共用官網的 users 表做登入，不另建帳號表
 */

const sql = neon(process.env.DATABASE_URL!);

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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

// ==================== Schedules ====================

export async function getSchedules(screenId?: number) {
  try {
    const result = screenId
      ? await sql`
          SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time,
                 s.days_of_week, s.play_date, s.created_at,
                 sc.name AS screen_name, p.name AS playlist_name
          FROM signage_schedules s
          LEFT JOIN signage_screens sc ON s.screen_id = sc.id
          LEFT JOIN signage_playlists p ON s.playlist_id = p.id
          WHERE s.screen_id = ${screenId}
          ORDER BY s.id ASC;
        `
      : await sql`
          SELECT s.id, s.screen_id, s.playlist_id, s.start_time, s.end_time,
                 s.days_of_week, s.play_date, s.created_at,
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
             s.days_of_week, s.play_date,
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
  play_date?: string | null; // "YYYY-MM-DD" 或 null
}

export async function createSchedule(data: ScheduleInput) {
  try {
    const daysJson = JSON.stringify(data.days_of_week);
    const result = await sql`
      INSERT INTO signage_schedules (screen_id, playlist_id, start_time, end_time, days_of_week, play_date)
      VALUES (${data.screen_id}, ${data.playlist_id}, ${data.start_time}, ${data.end_time},
              ${daysJson}, ${data.play_date || null})
      RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date, created_at;
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date, updated_at;
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
}) {
  try {
    if (!data.screen_ids || data.screen_ids.length === 0) {
      return { success: false, error: '未提供要套用的螢幕' };
    }
    const daysJson = JSON.stringify(data.days_of_week);
    const created: unknown[] = [];
    for (const screenId of data.screen_ids) {
      const result = await sql`
        INSERT INTO signage_schedules (screen_id, playlist_id, start_time, end_time, days_of_week, play_date)
        VALUES (${screenId}, ${data.playlist_id}, ${data.start_time}, ${data.end_time},
                ${daysJson}, ${data.play_date || null})
        RETURNING id, screen_id, playlist_id, start_time, end_time, days_of_week, play_date;
      `;
      created.push(result[0]);
    }
    return { success: true, data: created };
  } catch (error) {
    console.error('批次建立排程時發生錯誤：', error);
    return { success: false, error };
  }
}

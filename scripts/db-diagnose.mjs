// 資料庫連線診斷工具
// 用途：實際連到 Neon，分類錯誤原因，並「直接驗證是否為連線數耗盡」。
//
// 執行方式（在專案根目錄）：
//   1) 把 Vercel 上那筆 DATABASE_URL 複製出來
//   2) PowerShell:  $env:DATABASE_URL="postgres://..."; node scripts/db-diagnose.mjs
//      或 Git Bash:  DATABASE_URL="postgres://..." node scripts/db-diagnose.mjs
//      也可直接帶參數: node scripts/db-diagnose.mjs "postgres://..."
//
// 注意：請用「未連線池(non-pooling / direct)」與「連線池(-pooler)」兩種 URL 各跑一次，
//       兩者的 host 不同，結果可幫忙區分問題。

import { neon } from '@neondatabase/serverless';

const url = process.argv[2] || process.env.DATABASE_URL;

if (!url) {
  console.error('❌ 沒有提供 DATABASE_URL。請用環境變數或參數帶入連線字串。');
  process.exit(1);
}

// 解析連線字串（遮蔽密碼）
function describeUrl(raw) {
  try {
    const u = new URL(raw);
    return {
      host: u.hostname,
      port: u.port || '(default)',
      database: u.pathname.replace(/^\//, ''),
      user: u.username,
      hasPassword: Boolean(u.password),
      isPooler: u.hostname.includes('-pooler'),
      sslmode: u.searchParams.get('sslmode') || '(未指定)',
    };
  } catch {
    return { parseError: true };
  }
}

const info = describeUrl(url);
console.log('=== 連線目標（密碼已隱藏）===');
console.log(JSON.stringify(info, null, 2));
console.log('');

function classify(err) {
  const code = err && err.code;          // Postgres SQLSTATE
  const msg = (err && err.message) || String(err);
  const lower = msg.toLowerCase();

  // 先看 SQLSTATE（最精準）
  if (code === '28P01' || code === '28000' || lower.includes('password authentication failed')) {
    return {
      tag: '🔑 認證失敗（帳密/角色失效）',
      verdict: '最可能：Vercel↔Neon 整合憑證過期/輪替，DATABASE_URL 已失效。',
      payHelps: '❌ 付錢升級「不會」解決。需重新同步/重設連線字串。',
    };
  }
  if (code === '53300' || lower.includes('too many connections') || lower.includes('remaining connection slots')) {
    return {
      tag: '🚦 連線數耗盡（too many connections）',
      verdict: '確認為連線數/連線池耗盡。',
      payHelps: '✅ 升級方案/提高連線上限「有機會」改善（但仍建議改用 -pooler 連線池）。',
    };
  }
  if (code === '53400') {
    return { tag: '🚦 已達設定上限（configuration_limit_exceeded）', verdict: '資源限制。', payHelps: '✅ 升級可能改善。' };
  }
  if (code === '3D000' || lower.includes('does not exist') && lower.includes('database')) {
    return { tag: '🎯 資料庫名稱不存在', verdict: '連到錯的 db / branch，URL 對不到目標。', payHelps: '❌ 付錢無關，需修正 URL。' };
  }
  if (code === '57P01' || code === '57P03' || lower.includes('cannot connect now') || lower.includes('the database system is')) {
    return { tag: '😴 運算節點喚醒/暫停中', verdict: 'compute 暫停或喚醒失敗（常見於閒置自動暫停）。', payHelps: '部分有關：重試多半可恢復；長期可關閉自動暫停。' };
  }
  if (lower.includes('enotfound') || lower.includes('getaddrinfo') || lower.includes('dns')) {
    return { tag: '🌐 主機名稱解析失敗（ENOTFOUND）', verdict: 'endpoint host 變更/不存在，多半是 branch/專案被換掉或 URL 截斷。', payHelps: '❌ 付錢無關，需更新 host。' };
  }
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('timeout') || lower.includes('terminating connection')) {
    return { tag: '🔌 無法建立連線 / 連線被中止', verdict: 'endpoint 被停用、網路或暫停問題。', payHelps: '視原因而定，先確認 endpoint 狀態。' };
  }
  return { tag: '❓ 其他錯誤', verdict: '需看完整訊息判斷。', payHelps: '先確認錯誤碼再決定。' };
}

async function main() {
  const sql = neon(url);

  // 步驟 1：最基本連線測試
  console.log('=== 步驟 1：基本連線測試 (SELECT now()) ===');
  try {
    const r = await sql`SELECT now() AS now, current_user AS usr, current_database() AS db, version() AS ver`;
    console.log('✅ 連線成功！');
    console.log('   時間 :', r[0].now);
    console.log('   使用者:', r[0].usr);
    console.log('   資料庫:', r[0].db);
    console.log('   版本 :', String(r[0].ver).split(',')[0]);
  } catch (err) {
    const c = classify(err);
    console.log('❌ 連線失敗');
    console.log('   SQLSTATE:', err.code || '(無)');
    console.log('   訊息    :', err.message || String(err));
    console.log('');
    console.log('=== 判讀 ===');
    console.log('   分類    :', c.tag);
    console.log('   研判    :', c.verdict);
    console.log('   升級有效?:', c.payHelps);
    process.exit(2);
  }

  // 步驟 2：直接量測連線數（這一步就是「證實是否連線數耗盡」的關鍵）
  console.log('');
  console.log('=== 步驟 2：實測連線數（證實是否耗盡）===');
  try {
    const limit = await sql`SHOW max_connections`;
    const maxConn = limit[0].max_connections;
    const act = await sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE state = 'active')::int AS active,
        count(*) FILTER (WHERE state = 'idle')::int AS idle,
        count(*) FILTER (WHERE state = 'idle in transaction')::int AS idle_in_tx
      FROM pg_stat_activity
    `;
    const a = act[0];
    const pct = maxConn ? Math.round((a.total / Number(maxConn)) * 100) : 0;
    console.log('   max_connections     :', maxConn);
    console.log('   目前總連線數 total  :', a.total, `(約 ${pct}%)`);
    console.log('   active              :', a.active);
    console.log('   idle                :', a.idle);
    console.log('   idle in transaction :', a.idle_in_tx);
    console.log('');
    if (pct >= 80) {
      console.log('   ⚠️ 連線數接近上限 → 連線數耗盡「成立」，升級/連線池有幫助。');
    } else {
      console.log('   ✅ 連線數遠低於上限 → 連線數「沒有」耗盡。問題不在資源端，付錢升級無法解決。');
      console.log('      （若正式環境仍壞，代表 Vercel 上那筆 DATABASE_URL 與這支腳本用的不同 → 環境變數失效/不一致。）');
    }
  } catch (err) {
    console.log('   （此帳號無法讀取 pg_stat_activity / SHOW，但「能連上」本身就代表不是連線數耗盡。）');
    console.log('   細節:', err.message || String(err));
  }

  console.log('');
  console.log('=== 結論 ===');
  console.log('能跑到這裡代表「用這筆連線字串可以連上資料庫」。');
  console.log('若正式站仍掛 → 病灶在 Vercel 環境變數（值失效/範圍錯/與此不同），不是 Neon 資源耗盡。');
}

main().catch((e) => {
  console.error('腳本未預期錯誤:', e);
  process.exit(99);
});

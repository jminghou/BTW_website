const parseDate = require('postgres-date');

function demo(tz) {
  process.env.TZ = tz;
  console.log('\nTZ=', tz, 'offset=', new Date().getTimezoneOffset());
  for (const s of ['2026-08-11', '2026-08-12']) {
    const d = parseDate(s);
    const iso = d.toISOString();
    const sub = iso.substring(0, 10);
    const taipei = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    console.log(`  DATE ${s} -> ISO ${iso} substring=${sub} taipei=${taipei}`);
  }
}

demo('Asia/Taipei');
demo('UTC');

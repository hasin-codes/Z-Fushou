// Test: verify new from=day&to=day single-day queries and trace heatmap data pipeline

const keytar = require('keytar');

const KEYTAR_SERVICE = 'z-fushou';
const KEYTAR_ACCOUNT = 'desktop-token';
const EDGE_BASE = 'https://aavrbyojxktpewnlssgr.supabase.co/functions/v1';

// Beijing timezone offset helper
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function beijingTodayKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function beijingHourFromUtc(iso) {
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return -1;
  return new Date(value + BEIJING_OFFSET_MS).getUTCHours();
}

function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

async function fetchActivity(token, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${EDGE_BASE}/activity?${qs}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { status: res.status, error: text.slice(0, 300), hours: [], raw: null };
  }
  const body = await res.json();
  const data = body?.ok && body?.data !== undefined ? body.data : body;
  return { status: res.status, hours: data?.hours ?? [], raw: data };
}

async function main() {
  console.log('Reading token from keytar...');
  const token = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
  if (!token) {
    console.error('No token found.');
    process.exit(1);
  }
  console.log('Token found\n');

  const todayKey = beijingTodayKey();
  console.log(`Beijing today: ${todayKey}\n`);

  // Build 7 day keys
  const dayKeys = [];
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(addDays(todayKey, -i));
  }
  console.log('Day keys:', dayKeys.join(', '), '\n');

  // ── Test 0: Compare old vs new query pattern + raw response ──
  console.log('=== Test 0: Compare old (from=day-1&to=day) vs new (from=day&to=day) ===\n');

  const testDay = dayKeys[5]; // yesterday
  const prevDay = addDays(testDay, -1);

  console.log(`Test day: ${testDay}, prev day: ${prevDay}\n`);

  // Old pattern
  console.log(`  OLD: from=${prevDay}&to=${testDay}`);
  const oldR = await fetchActivity(token, { from: prevDay, to: testDay });
  console.log(`  status=${oldR.status}, entries=${oldR.hours.length}, raw keys=${oldR.raw ? Object.keys(oldR.raw).join(',') : 'N/A'}`);
  if (oldR.hours.length > 0) {
    console.log(`  first: ${JSON.stringify(oldR.hours[0])}`);
    console.log(`  last:  ${JSON.stringify(oldR.hours[oldR.hours.length - 1])}`);
    console.log(`  hour type: ${typeof oldR.hours[0].hour}`);
  }
  console.log(`  total_unique_users: ${oldR.raw?.total_unique_users ?? 'N/A'}`);
  console.log();

  // New pattern
  console.log(`  NEW: from=${testDay}&to=${testDay}`);
  const newR = await fetchActivity(token, { from: testDay, to: testDay });
  console.log(`  status=${newR.status}, entries=${newR.hours.length}, raw keys=${newR.raw ? Object.keys(newR.raw).join(',') : 'N/A'}`);
  if (newR.hours.length > 0) {
    console.log(`  first: ${JSON.stringify(newR.hours[0])}`);
    console.log(`  last:  ${JSON.stringify(newR.hours[newR.hours.length - 1])}`);
    console.log(`  hour type: ${typeof newR.hours[0].hour}`);
  }
  console.log(`  total_unique_users: ${newR.raw?.total_unique_users ?? 'N/A'}`);

  // Dump full raw response for new pattern to see exactly what comes back
  console.log(`\n  Full raw response (NEW pattern):`);
  console.log(JSON.stringify(newR.raw, null, 2).slice(0, 1000));

  // Also dump old pattern raw
  console.log(`\n  Full raw response (OLD pattern):`);
  console.log(JSON.stringify(oldR.raw, null, 2).slice(0, 1000));

  console.log('\n');

  // ── Test 2: Simulate full heatmap pipeline ──
  console.log('\n=== Test 2: Simulate heatmap pipeline (from=day&to=day) ===\n');

  let grandTotal = 0;
  for (const day of dayKeys) {
    const r = await fetchActivity(token, { from: day, to: day });

    if (r.error) {
      console.log(`${day}: ERROR — all zeros`);
      continue;
    }

    const buckets = new Array(24).fill(0);
    for (const h of r.hours) {
      if (typeof h.hour === 'string') {
        const hourNum = beijingHourFromUtc(h.hour);
        if (hourNum >= 0 && hourNum < 24) {
          buckets[hourNum] += h.message_count || 0;
        }
      }
    }

    const dayTotal = buckets.reduce((a, b) => a + b, 0);
    grandTotal += dayTotal;

    const nonZero = buckets.reduce((c, v) => c + (v > 0 ? 1 : 0), 0);
    console.log(`${day}: ${dayTotal} msgs, ${nonZero}/24 non-zero hours`);
    console.log(`  [${buckets.join(', ')}]`);
  }

  console.log(`\nGrand total: ${grandTotal} messages across 7 days`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

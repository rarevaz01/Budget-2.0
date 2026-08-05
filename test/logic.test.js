const test = require('node:test');
const assert = require('node:assert/strict');
const Logic = require('../logic.js');
const {
  fmt, numVal, strip, reduceToTopWithRest, getPeriodCats, getPeriodBudget,
  monthKey, defaultMonthData, defaultCalendarLabel, nextColor, contrastTextColor,
  pol, arc, P
} = Logic;

// ---- fmt / numVal / strip ----

test('fmt formats with a non-breaking-space thousands separator and rounds', () => {
  assert.equal(fmt(197604), '197 604');
  assert.equal(fmt(0), '0');
  assert.equal(fmt(1234.6), '1 235');
  assert.equal(fmt(undefined), '0');
});

test('numVal parses numbers, ignoring nbsp/spaces/percent', () => {
  assert.equal(numVal('197 604'), 197604);
  assert.equal(numVal('50%'), 50);
  assert.equal(numVal(''), 0);
  assert.equal(numVal('abc'), 0);
});

test('strip keeps digits/dot and drops leading zeros', () => {
  assert.equal(strip('0123'), '123');
  assert.equal(strip('12.34руб'), '12.34');
  assert.equal(strip(''), '');
});

// ---- reduceToTopWithRest (top-5 + "Остальные" grouping used by the donut chart) ----

test('reduceToTopWithRest returns items unchanged when at or below the limit', () => {
  const items = [{name: 'A', amount: 100}, {name: 'B', amount: 50}];
  assert.deepEqual(reduceToTopWithRest(items, 5, '#999'), items);
});

test('reduceToTopWithRest groups everything past the top 5 into "Остальные"', () => {
  // mirrors the reported screenshot: 5 named categories + 3 smaller ones merged
  // (each "rest" item stays below the 5th-place amount so the top 5 don't shuffle)
  const items = [
    {name: 'Дом', amount: 90832},
    {name: 'Развлечения', amount: 28309},
    {name: 'Здоровье', amount: 21331},
    {name: 'Транспорт', amount: 20608},
    {name: 'Кафе и рестораны', amount: 11312},
    {name: 'Спорт', amount: 9000},
    {name: 'Образование', amount: 9000},
    {name: 'Подарки', amount: 7212},
  ];
  const result = reduceToTopWithRest(items, 5, '#999');
  assert.equal(result.length, 6);

  const other = result.find(c => c.isOther);
  assert.ok(other, '"Остальные" slice should be present');
  assert.equal(other.name, 'Остальные');
  assert.equal(other.col, '#999');
  assert.equal(other.amount, 9000 + 9000 + 7212);

  const top5 = result.filter(c => !c.isOther).map(c => c.name);
  assert.deepEqual(top5, ['Дом', 'Развлечения', 'Здоровье', 'Транспорт', 'Кафе и рестораны']);

  // the sum shown across all tiles/ring slices must equal the true total spend
  const trueTotal = items.reduce((s, c) => s + c.amount, 0);
  const displayedTotal = result.reduce((s, c) => s + c.amount, 0);
  assert.equal(displayedTotal, trueTotal);
});

test('reduceToTopWithRest omits the "Остальные" bucket when its sum is zero', () => {
  // 7 items (> limit+1) so grouping actually kicks in, with the trailing two at zero
  const items = [
    {name: 'A', amount: 10}, {name: 'B', amount: 9}, {name: 'C', amount: 8},
    {name: 'D', amount: 7}, {name: 'E', amount: 6},
    {name: 'F', amount: 0}, {name: 'G', amount: 0},
  ];
  const result = reduceToTopWithRest(items, 5, '#999');
  assert.equal(result.length, 5);
  assert.ok(!result.some(c => c.isOther));
});

// ---- getPeriodBudget / getPeriodCats ----

function makeStore() {
  return {
    current: '2026-08',
    months: {
      '2026-07': {
        B: 60000,
        C: [{n: 'Дом', a: 20000, col: '#1', h: [
          {a: 5000, d: '2026-07-30T10:00:00.000Z'},
        ]}],
      },
      '2026-08': {
        B: 100000,
        C: [
          {n: 'Дом', a: 40000, col: '#1', h: [{a: 40000, d: '2026-08-01T10:00:00.000Z'}]},
          {n: 'Еда', a: 20000, col: '#2', h: [{a: 20000, d: '2026-08-02T10:00:00.000Z'}]},
        ],
      },
    },
  };
}

test('getPeriodBudget("month") returns the current month budget', () => {
  assert.equal(getPeriodBudget('month', makeStore()), 100000);
});

test('getPeriodBudget("year") sums budgets of every month in the current year', () => {
  assert.equal(getPeriodBudget('year', makeStore()), 60000 + 100000);
});

test('getPeriodBudget("week") prorates each month\'s budget by number of days in the window', () => {
  const now = new Date('2026-08-02T12:00:00.000Z'); // window: 2026-07-27..2026-08-02
  const budget = getPeriodBudget('week', makeStore(), now);
  const expected = (60000 / 31) * 5 + (100000 / 31) * 2; // 5 days of July + 2 days of August
  assert.ok(Math.abs(budget - expected) < 1e-6, `expected ~${expected}, got ${budget}`);
});

test('getPeriodCats("month") only reflects the current month\'s categories', () => {
  const cats = getPeriodCats('month', makeStore(), '#muted');
  assert.deepEqual(cats.map(c => c.name).sort(), ['Дом', 'Еда']);
});

test('getPeriodCats("year") sums category totals across the current year', () => {
  const cats = getPeriodCats('year', makeStore(), '#muted');
  assert.equal(cats.find(c => c.name === 'Дом').amount, 20000 + 40000);
});

test('getPeriodCats("week") sums history entries within the last 7 days across all months', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');
  const cats = getPeriodCats('week', makeStore(), '#muted', now);
  assert.equal(cats.find(c => c.name === 'Дом').amount, 5000 + 40000);
});

// ---- misc helpers ----

test('monthKey formats YYYY-MM with zero padding', () => {
  assert.equal(monthKey(new Date(2026, 0, 15)), '2026-01');
  assert.equal(monthKey(new Date(2026, 10, 1)), '2026-11');
});

test('defaultCalendarLabel converts a month key into a Russian label', () => {
  assert.equal(defaultCalendarLabel('2026-08'), 'Август 2026');
  assert.equal(defaultCalendarLabel('custom-key'), '');
});

test('defaultMonthData starts with zero budget and ten preset categories', () => {
  const m = defaultMonthData();
  assert.equal(m.B, 0);
  assert.equal(m.C.length, 10);
  assert.deepEqual(m.hiddenC, []);
  assert.deepEqual(m.IN, []);
});

test('nextColor picks the first unused palette color', () => {
  const used = P.slice(0, 3).map(col => ({col}));
  assert.equal(nextColor(used), P[3]);
});

test('nextColor cycles the palette once every color is taken', () => {
  const used = P.map(col => ({col}));
  assert.equal(nextColor(used), P[used.length % P.length]);
});

test('contrastTextColor picks dark text on light backgrounds and vice versa', () => {
  assert.equal(contrastTextColor('#ffffff'), '#170B33');
  assert.equal(contrastTextColor('#000000'), '#FFFFFF');
  assert.equal(contrastTextColor('rgb(10,10,10)'), '#FFFFFF');
});

// ---- SVG arc geometry ----

test('pol converts polar coordinates around a center point', () => {
  const p = pol(150, 150, 100, 0); // 0 deg points along +x
  assert.ok(Math.abs(p.x - 250) < 1e-9);
  assert.ok(Math.abs(p.y - 150) < 1e-9);
});

test('arc clamps a near-full 360deg sweep to avoid a degenerate SVG path', () => {
  const d = arc(150, 150, 100, -90, 270);
  assert.ok(d.startsWith('M '));
  assert.ok(!d.includes('NaN'));
});

// ---- expense add/delete/undo arithmetic (mirrors addExpense/deleteExpense in index.html) ----

test('adding then deleting an expense returns the category to its original amount', () => {
  const category = {n: 'Дом', a: 1000, h: []};
  function addExpense(cat, amount) {
    cat.a = (parseFloat(cat.a) || 0) + amount;
    const entry = {a: amount, d: new Date().toISOString()};
    cat.h.push(entry);
    return entry;
  }
  function deleteExpense(cat, entry) {
    const idx = cat.h.indexOf(entry);
    cat.h.splice(idx, 1);
    cat.a = (parseFloat(cat.a) || 0) - (parseFloat(entry.a) || 0);
  }

  const entry = addExpense(category, 500);
  assert.equal(category.a, 1500);
  assert.equal(category.h.length, 1);

  deleteExpense(category, entry);
  assert.equal(category.a, 1000);
  assert.equal(category.h.length, 0);
});

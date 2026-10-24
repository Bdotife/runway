// Runway core: types, language parsing (stands in for the LLM) and the
// deterministic budget engine. Every figure shown in the app comes from here.

export type Freq = "week" | "month" | "term";
export type Cost = { name: string; cat: string; amount: number; freq: Freq };
export type Entry = {
  id: string;
  kind: "spend" | "income";
  amount: number;
  cat: string;
  date: string;
  note?: string;
  freq?: "once" | "week" | "month";
  t: number;
};
export type Instalment = { due: string; amount: number; paid: boolean };
export type DebtType = "pay3" | "pay4" | "overdraft" | "loan";
export type Debt = {
  id: string;
  provider: string;
  type: DebtType;
  label: string;
  principal: number;
  apr: number;
  free: number;
  start: string;
  instalments: Instalment[];
  total: number;
  interest: number;
};
export type Profile = { opening: number; nextAmount: number; nextDate: string; periodStart: string; costs: Cost[] };
export type Account = { name: string; uni: string; year: string; email: string; invite?: string; pw?: string };
export type Draft = { balance: any; nextAmount: any; nextDate: string | null; costs: any[] };
export type ChatMsg = { who: "bot" | "me"; text: string };
export type State = {
  session: boolean;
  account: Account | null;
  partner: string | null;
  consent: { ai: boolean; data: boolean };
  chat: ChatMsg[];
  draft: Draft | null;
  profile: Profile | null;
  entries: Entry[];
  debts: Debt[];
  baseline: number;
  studentLoan: { borrowed: number; salary: number };
  notify: boolean;
  tipBnpl: boolean;
  tipSeen: boolean;
};

export const STORAGE_KEY = "runway-next-v1";
const DAY = 864e5;

export const fresh = (): State => ({
  session: false,
  account: null,
  partner: null,
  consent: { ai: false, data: false },
  chat: [],
  draft: null,
  profile: null,
  entries: [],
  debts: [],
  baseline: 0,
  studentLoan: { borrowed: 16540, salary: 30000 },
  notify: true,
  tipBnpl: false,
  tipSeen: false,
});

/* ---------- constants ---------- */
export const CHIPS = [
  "Can I spend £30 on a night out?",
  "Spent £12 on food",
  "I bought a £900 laptop with Klarna pay in 3",
  "I’ve started a part-time job earning £50 a week",
  "Spent £1,500 on a laptop and course equipment",
  "Should I buy Tesla shares?",
];
export const LALA =
  "I’ve got £5,400 available now. My next maintenance payment is £3,200 on 8 January. Rent is £650 a month, food is £55 a week and I spend around £30 a month on gym.";
export const PARTNERS: Record<string, string> = {
  NATWEST: "NatWest",
  NATIONWIDE: "Nationwide",
  UCL: "UCL",
  HSBC: "HSBC",
  SANTANDER: "Santander",
  LLOYDS: "Lloyds",
};
export const UNI_PARTNERS: Record<string, string> = { "University College London (UCL)": "UCL" };
export const UNIS = [
  "University College London (UCL)", "King’s College London", "Imperial College London", "London School of Economics (LSE)",
  "Queen Mary University of London", "University of Manchester", "University of Leeds", "University of Birmingham",
  "University of Bristol", "University of Nottingham", "University of Sheffield", "University of Warwick",
  "University of Liverpool", "Newcastle University", "Durham University", "University of Exeter",
  "University of Southampton", "University of York", "Lancaster University", "Loughborough University",
  "University of the West of England (UWE)", "University of Oxford", "University of Cambridge", "University of Edinburgh",
  "University of Glasgow", "Queen’s University Belfast", "Cardiff University", "Swansea University",
  "Aberystwyth University", "Bangor University", "University of Wales Trinity Saint David",
];
export const YEARS = ["1st year", "2nd year", "3rd year", "4th year or above", "Postgraduate", "Apprenticeship"];
export const EXTRA_CATS = ["Going out", "Food", "Course & tech", "Transport", "Clothes", "Subscriptions", "Other"];

/* ---------- helpers ---------- */
export const today0 = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const iso = (d: Date | number | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const parseIso = (s: string) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const fmtDate = (d: Date | string) =>
  (typeof d === "string" ? parseIso(d) : new Date(d)).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const uid = () => Math.random().toString(36).slice(2, 9);
export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export function gbp(n: number, pence = false) {
  const neg = n < -0.004;
  n = Math.abs(n || 0);
  const dp = pence || (n < 100 && Math.abs(n - Math.round(n)) > 0.004);
  const s = dp
    ? n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(n).toLocaleString("en-GB");
  return (neg ? "−" : "") + "£" + s;
}
export const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[£,\s]/g, ""));
  return isFinite(n) ? n : NaN;
};
export const normCode = (v: string) => String(v || "").trim().toUpperCase().replace(/\s+/g, "");

export async function hashPw(pw: string) {
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("runway:" + pw));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    let x = 7;
    for (const c of "runway:" + pw) x = (x * 31 + c.charCodeAt(0)) | 0;
    return "h" + x;
  }
}

/** Where a person should be, given what they have done so far. */
export function nextPath(s: State) {
  if (!s.session) return s.account?.pw ? "/signin" : "/signup";
  if (!(s.consent.ai && s.consent.data)) return "/onboarding/consent";
  if (!s.profile) {
    const d = s.draft;
    return d && d.balance != null && d.nextAmount != null && d.nextDate ? "/onboarding/confirm" : "/onboarding/setup";
  }
  return "/home";
}

/* ---------- language parsing ---------- */
const CAT_WORDS: [string, RegExp][] = [
  ["Rent", /\brent\b|landlord|halls/],
  ["Going out", /night out|going out|\bclub|\bpub\b|drinks|\bbar\b|party|cinema|\bgig|out tonight|friends/],
  ["Food", /food|grocer|tesco|aldi|lidl|sainsbury|asda|lunch|dinner|breakfast|meal|coffee|takeaway|snack/],
  ["Gym", /\bgym\b/],
  ["Bills", /phone|bill|utilit|electric|wifi|internet/],
  ["Transport", /uber|train|\bbus\b|taxi|travel|transport|petrol|railcard/],
  ["Course & tech", /laptop|book|course|equipment|stationery|printer|calculator|tablet|ipad/],
  ["Subscriptions", /netflix|spotify|subscription|prime|disney/],
  ["Clothes", /coat|clothes|jacket|shoes|trainers|hoodie|jeans/],
];
export function catOf(t: string) {
  t = String(t).toLowerCase();
  for (const [c, r] of CAT_WORDS) if (r.test(t)) return c;
  return "Other";
}
type Amt = { v: number; i: number; end: number };
export function amounts(t: string): Amt[] {
  const out: Amt[] = [];
  const re = /£\s?(\d[\d,]*(?:\.\d{1,2})?)(k\b)?|(\d[\d,]*(?:\.\d{1,2})?)\s?(?:pounds|quid)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    let v = parseFloat((m[1] || m[3]).replace(/,/g, ""));
    if (m[2]) v *= 1000;
    out.push({ v, i: m.index, end: re.lastIndex });
  }
  const tn = t.search(/\ba tenner\b/i);
  if (tn >= 0) out.push({ v: 10, i: tn, end: tn + 8 });
  const fv = t.search(/\ba fiver\b/i);
  if (fv >= 0) out.push({ v: 5, i: fv, end: fv + 7 });
  return out.sort((a, b) => a.i - b.i);
}
export function freqAfter(t: string, end: number): Freq | null {
  const s = t.slice(end, end + 30).toLowerCase();
  if (/^\s*(a|per|each|every|\/)\s*(week|wk)|^\s*weekly/.test(s)) return "week";
  if (/^\s*(a|per|each|every|\/)\s*(month|mo\b)|^\s*monthly/.test(s)) return "month";
  if (/^\s*(a|per|each|every)\s*term|^\s*termly/.test(s)) return "term";
  return null;
}
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export function parseDate(t: string) {
  let d: number, mo: number;
  const m = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);
  if (m) {
    d = +m[1];
    mo = MONTHS.indexOf(m[2].toLowerCase());
  } else {
    const m2 = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/i);
    if (!m2) return null;
    mo = MONTHS.indexOf(m2[1].toLowerCase());
    d = +m2[2];
  }
  const t0 = today0();
  let dt = new Date(t0.getFullYear(), mo, d);
  if (dt <= t0) dt = new Date(t0.getFullYear() + 1, mo, d);
  return iso(dt);
}
export function parseSetup(text: string): Draft {
  const lo = text.toLowerCase();
  const am = amounts(text);
  const r: Draft = { balance: null, nextAmount: null, nextDate: parseDate(text), costs: [] };
  const used = new Set<number>();
  const kw =
    /(rent|food|groceries|gym|phone(?: bill)?|bills?|utilities|transport|travel|netflix|spotify|subscriptions?|going out|nights? out|bus pass|insurance)/g;
  am.forEach((a, k) => {
    const f = freqAfter(text, a.end);
    if (!f) return;
    const before = lo.slice(Math.max(0, a.i - 32), a.i);
    const after = lo.slice(a.end, a.end + 40);
    let label: string | null = null;
    const bm = [...before.matchAll(kw)];
    if (bm.length) label = bm[bm.length - 1][1];
    else {
      const m2 = after.match(/\b(?:on|for)\s+(?:the\s+|my\s+)?([a-z][a-z ]{1,18}?)(?:[,.]|$|\s+and\b)/);
      if (m2) label = m2[1].trim();
    }
    if (!label) return;
    used.add(k);
    const c = catOf(label);
    r.costs.push({ name: cap(label), cat: c === "Other" ? cap(label) : c, amount: a.v, freq: f });
  });
  am.forEach((a, k) => {
    if (used.has(k) || r.nextAmount != null) return;
    const ctx = lo.slice(Math.max(0, a.i - 50), a.end + 4);
    if (
      /next|maintenance|instal|payment|lands|loan/.test(ctx) &&
      /\bon\b|\d{1,2}(st|nd|rd|th)?\s+[a-z]{3}|[a-z]{3}\s+\d/.test(lo.slice(a.end, a.end + 30))
    ) {
      r.nextAmount = a.v;
      used.add(k);
    }
  });
  am.forEach((a, k) => {
    if (used.has(k) || r.balance != null) return;
    r.balance = a.v;
    used.add(k);
  });
  return r;
}
export type Intent = "resource" | "debt" | "afford" | "income" | "spend";
export function intent(t: string): Intent {
  const lo = t.toLowerCase();
  if (/invest|shares|stocks?\b|crypto|bitcoin|pension|mortgage|\bisa\b|trading/.test(lo)) return "resource";
  if (
    /klarna|clearpay|paypal (?:pay|credit)|laybuy|bnpl|buy now pay later|pay in (?:3|three|4|four)|overdraft|took (?:out )?a loan|loan from|borrowed|credit card/.test(
      lo
    )
  )
    return "debt";
  if (/can i|could i|afford|should i|is it ok|ok to spend|enough for/.test(lo)) return "afford";
  if (/earn|job|got paid|income|wage|salary|bursary|paid me|refund|birthday money/.test(lo)) return "income";
  if (/spent|spend|bought|buy|paid|cost|£|\d/.test(lo)) return "spend";
  return "resource";
}
export const guessCat = (q: string, def: string) => {
  const c = catOf(q);
  return c === "Other" ? def : c;
};
export function debtGuess(q: string, amt: number | "") {
  const lo = q.toLowerCase();
  let type: DebtType = "loan",
    provider = "Loan";
  if (/klarna/.test(lo)) { type = "pay3"; provider = "Klarna"; }
  else if (/paypal/.test(lo)) { type = "pay3"; provider = "PayPal"; }
  else if (/clearpay/.test(lo)) { type = "pay4"; provider = "Clearpay"; }
  else if (/laybuy/.test(lo)) { type = "pay4"; provider = "Laybuy"; }
  else if (/overdraft/.test(lo)) { type = "overdraft"; provider = "Overdraft"; }
  else if (/pay in (3|three)/.test(lo)) { type = "pay3"; provider = "Pay in 3"; }
  else if (/pay in (4|four)/.test(lo)) { type = "pay4"; provider = "Pay in 4"; }
  if (/pay in (4|four)/.test(lo)) type = "pay4";
  if (/pay in (3|three)/.test(lo) && type !== "overdraft") type = "pay3";
  const m = lo.match(/(laptop|phone|tablet|ipad|coat|trainers|headphones|textbooks?|books?|desk|bike|tv|console|jacket|camera)/);
  return {
    provider,
    type,
    amount: amt === "" ? "" : String(amt),
    label: m ? cap(m[1]) : "",
    start: iso(today0()),
    apr: type === "overdraft" ? "39.9" : type === "loan" ? "19.9" : "",
    months: "12",
    free: type === "overdraft" ? "500" : "",
  };
}

/* ---------- budget engine ---------- */
export function weekly(c: { amount: any; freq: string }) {
  const a = num(c.amount) || 0;
  return c.freq === "week" ? a : c.freq === "month" ? (a * 12) / 52 : c.freq === "term" ? a / 13 : a / 52;
}
export function buildDebt(d: any): Debt {
  const amt = num(d.amount) || 0;
  const start = parseIso(d.start || iso(today0()));
  const ins: { due: string; amount: number }[] = [];
  if (d.type === "pay3") for (let i = 0; i < 3; i++) ins.push({ due: iso(addDays(start, 30 * i)), amount: round2(amt / 3) });
  else if (d.type === "pay4") for (let i = 0; i < 4; i++) ins.push({ due: iso(addDays(start, 14 * i)), amount: round2(amt / 4) });
  else if (d.type === "loan") {
    const n = Math.max(1, Math.round(num(d.months) || 12)),
      r = (num(d.apr) || 0) / 100 / 12;
    const pay = r ? (amt * r) / (1 - Math.pow(1 + r, -n)) : amt / n;
    for (let i = 1; i <= n; i++) ins.push({ due: iso(addDays(start, 30 * i)), amount: round2(pay) });
  }
  if (ins.length && d.type !== "loan") {
    const diff = round2(amt - ins.reduce((a, b) => a + b.amount, 0));
    ins[ins.length - 1].amount = round2(ins[ins.length - 1].amount + diff);
  }
  const total = ins.reduce((a, b) => a + b.amount, 0);
  return {
    id: uid(),
    provider: d.provider || "Debt",
    type: d.type,
    label: d.label || "",
    principal: amt,
    apr: num(d.apr) || 0,
    free: num(d.free) || 0,
    start: d.start,
    instalments: ins.map((x) => ({ ...x, paid: false })),
    total: round2(total),
    interest: round2(Math.max(0, total - amt)),
  };
}
export type Status = "ok" | "tight" | "over";
export function compute(s: State, extraEntries: Partial<Entry>[] = [], extraDebts: Debt[] = []) {
  const P = s.profile!;
  const t0 = today0();
  const start = parseIso(P.periodStart);
  const next = parseIso(P.nextDate);
  const totalWeeks = Math.max(1, (+next - +start) / (7 * DAY));
  const wl = Math.max(1, (+next - +t0) / (7 * DAY));
  const weekIdx = Math.min(Math.ceil(totalWeeks) - 1, Math.max(0, Math.floor((+t0 - +start) / (7 * DAY))));
  const weekStart = addDays(start, weekIdx * 7);
  const entries = (s.entries as Partial<Entry>[]).concat(extraEntries);
  const debts = s.debts.concat(extraDebts);
  const committed = new Set(P.costs.map((c) => c.cat));
  let spends = 0,
    incomes = 0,
    freeWeek = 0,
    futureIncome = 0;
  const spentPeriod: Record<string, number> = {},
    spentWeek: Record<string, number> = {};
  for (const e of entries) {
    const d = parseIso(e.date!);
    if (e.kind === "income") {
      if (e.freq === "once") incomes += e.amount!;
      else {
        const w = e.freq === "week" ? e.amount! : (e.amount! * 12) / 52;
        const from = Math.max(+t0, +d);
        futureIncome += w * Math.max(0, (+next - from) / (7 * DAY));
      }
      continue;
    }
    spends += e.amount!;
    spentPeriod[e.cat!] = (spentPeriod[e.cat!] || 0) + e.amount!;
    if (d >= weekStart) {
      spentWeek[e.cat!] = (spentWeek[e.cat!] || 0) + e.amount!;
      // one-offs bigger than a week's spending money are spread across the remaining weeks
      if (!committed.has(e.cat!) && !(s.baseline > 0 && e.amount! > s.baseline)) freeWeek += e.amount!;
    }
  }
  let debtOut = 0;
  for (const db of debts)
    for (const ins of db.instalments) {
      const d = parseIso(ins.due);
      if (d >= start && d <= next) debtOut += ins.amount;
    }
  const available = P.opening + incomes + futureIncome - spends - debtOut;
  let reserved = 0;
  for (const c of P.costs) reserved += Math.max(0, weekly(c) * totalWeeks - (spentPeriod[c.cat] || 0));
  const free = available - reserved;
  const allowance = (free + freeWeek) / wl;
  const left = allowance - freeWeek;
  const nextWeek = (free - Math.max(left, 0)) / Math.max(1, wl - 1);
  const need = P.costs.reduce((a, c) => a + weekly(c), 0);
  const coveredWeeks =
    free >= 0 ? totalWeeks : need > 0 ? Math.max(0, (+t0 - +start) / (7 * DAY) + Math.max(0, available) / need) : 0;
  let status: Status = "ok";
  if (free < 0) status = "over";
  else if (left < 0 || nextWeek < s.baseline * 0.8) status = "tight";
  return { totalWeeks, wl, weekIdx, weekStart, available, free, allowance, left, nextWeek, status, spentWeek, freeWeek, coveredWeeks, need, next, start, debtOut, due: t0 >= next };
}
export type Result = ReturnType<typeof compute>;

/** Cash actually held now (for rolling over to a new period). */
export function cashNow(s: State) {
  const P = s.profile!;
  let c = P.opening;
  for (const e of s.entries) {
    if (e.kind === "income") {
      if (e.freq === "once") c += e.amount;
    } else c -= e.amount;
  }
  const start = parseIso(P.periodStart),
    t0 = today0();
  for (const d of s.debts)
    for (const i of d.instalments) {
      const dd = parseIso(i.due);
      if (dd >= start && dd <= t0) c -= i.amount;
    }
  return c;
}
export const repayMonthly = (salary: number) => Math.max(0, ((salary - 25000) * 0.09) / 12);

import { onMounted, reactive, ref, computed } from 'vue'
import initSqlJs from 'sql.js'

type SqlExecResult = {
  columns: string[]
  values: unknown[][]
}

type DatabaseLike = {
  exec: (sql: string) => SqlExecResult[]
  close: () => void
}

type Exercise = {
  id: string
  title: string
  prompt: string
  sql: string
}

const SQL_WASM_PATH = `${import.meta.env.BASE_URL}sql-wasm.wasm`
const DEFAULT_DB_PATH = `${import.meta.env.BASE_URL}sf_accounting.db`
const INSTRUCTOR_PIN = '7425'
const MAX_SEED = 100

export function useSqlLab() {
  const dbUrl = ref('')
  const seedInput = ref(1)
  const currentSeed = ref(1)
  const instructorMode = ref(false)

  const editorText = ref(`-- Try me:
SELECT name, type
FROM sqlite_master
WHERE type IN ('table','view')
ORDER BY name;`)

  const schemaText = ref('(no database loaded)')
  const lastResults = ref<SqlExecResult[]>([])
  const resultError = ref('')
  const hasRunOnce = ref(false)

  const exercises = ref<Exercise[]>([])
  const expandedExpected = reactive<Record<string, boolean>>({})
  const exerciseStatus = reactive<Record<string, string>>({})

  let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null
  let db: DatabaseLike | null = null
  let originalBytes: Uint8Array | null = null

  function getProgress(seed: number) {
    try {
      const all = JSON.parse(
        localStorage.getItem('sf_progress') || '{}',
      ) as Record<string, Record<string, boolean>>
      return all[String(seed)] || {}
    } catch {
      return {}
    }
  }

  function setProgress(seed: number, map: Record<string, boolean>) {
    const all = JSON.parse(
      localStorage.getItem('sf_progress') || '{}',
    ) as Record<string, Record<string, boolean>>
    all[String(seed)] = map
    localStorage.setItem('sf_progress', JSON.stringify(all))
  }

  const solvedCount = computed(() => {
    const p = getProgress(currentSeed.value)
    return exercises.value.reduce((n, ex) => n + (p[ex.id] ? 1 : 0), 0)
  })

  async function initSql() {
    try {
      SQL = await initSqlJs({
        locateFile: () => SQL_WASM_PATH,
      })

      try {
        await fetchDb(DEFAULT_DB_PATH, true)
      } catch (e) {
        schemaText.value =
          '(tip) Put sf_accounting.db in public/ or load a file manually.'
        resultError.value = `DB load failed: ${(e as Error).message}`
      }
    } catch (e) {
      resultError.value = `sql.js init failed: ${(e as Error).message}`
      schemaText.value = '(sql.js failed to initialize)'
    }
  }

  async function fetchDb(url: string, silent = false) {
    if (!SQL) return

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch DB: ${res.status}`)

    const buf = await res.arrayBuffer()
    originalBytes = new Uint8Array(buf)
    openDb(originalBytes)

    if (!silent) {
      console.log(`Database loaded from: ${url}`)
    }
  }

  function openDb(bytes: Uint8Array) {
    if (!SQL) return

    if (db) db.close()

    db = new SQL.Database(new Uint8Array(bytes)) as unknown as DatabaseLike
    renderSchema()
    lastResults.value = []
    resultError.value = ''
    hasRunOnce.value = false
    buildExercises(seedInput.value)
  }

  function resetDb() {
    if (!originalBytes) return
    openDb(originalBytes)
  }

  function renderSchema() {
    if (!db) {
      schemaText.value = '(no database)'
      return
    }

    try {
      const tbls = db.exec(`
        SELECT name, type, sql
        FROM sqlite_master
        WHERE type IN ('table','view')
        ORDER BY type DESC, name ASC;
      `)

      const firstTable = tbls[0]
      if (!firstTable) {
        schemaText.value = '(empty schema)'
        return
      }

      const out: string[] = []
      firstTable.values.forEach((row) => {
        const [name, type, sql] = row as [string, string, string]
        out.push(`-- ${String(type).toUpperCase()}: ${name}\n${sql};\n`)
      })

      schemaText.value = out.join('\n')
    } catch (e) {
      schemaText.value = `Failed to read schema: ${(e as Error).message}`
    }
  }

  function runSql() {
    if (!db) return

    hasRunOnce.value = true
    resultError.value = ''
    lastResults.value = []

    const sql = editorText.value.trim()
    if (!sql) return

    try {
      lastResults.value = db.exec(sql)
    } catch (e) {
      resultError.value = `Error: ${(e as Error).message}`
      lastResults.value = []
    }
  }

  async function handleDbFileChange(files: File[] | File | null) {
    const file =
      Array.isArray(files) ? files[0]
      : files instanceof File ? files
      : null

    if (!file) return

    const buf = await file.arrayBuffer()
    originalBytes = new Uint8Array(buf)
    openDb(originalBytes)
  }

  async function loadDefaultDb() {
    await fetchDb(DEFAULT_DB_PATH)
  }

  async function loadDbFromUrl() {
    const url = dbUrl.value.trim()
    if (!url) return
    await fetchDb(url)
  }

  function makeRng(seed: number) {
    let s = (seed >>> 0) || 1
    return function () {
      s = (1664525 * s + 1013904223) >>> 0
      return s / 0x100000000
    }
  }

  function choice<T>(rng: () => number, arr: T[]): T {
    if (arr.length === 0) {
      throw new Error('choice called with empty array')
    }
    return arr[Math.floor(rng() * arr.length)]!
  }

  function intBetween(rng: () => number, a: number, b: number) {
    return a + Math.floor(rng() * (b - a + 1))
  }

  function execFirstResult(sqlText: string): { columns: string[]; rows: unknown[][] } {
    if (!db) return { columns: [], rows: [] }

    const res = db.exec(sqlText)
    const first = res[0]
    if (!first) return { columns: [], rows: [] }

    return { columns: first.columns, rows: first.values }
  }

  function normalizeCell(x: unknown) {
    if (x === null || x === undefined) return null
    if (typeof x === 'number' && Number.isFinite(x)) return Number(x.toFixed(6))
    return String(x)
  }

  function normalizeResult(r: { columns: string[]; rows: unknown[][] }) {
    return {
      columns: r.columns.map((c) => c.toLowerCase()),
      rows: r.rows
        .map((row) => row.map(normalizeCell))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    }
  }

  function equalResults(
    a: { columns: string[]; rows: unknown[][] },
    b: { columns: string[]; rows: unknown[][] },
  ) {
    if (a.columns.length !== b.columns.length) return false
    if ([...a.columns].sort().join('|') !== [...b.columns].sort().join('|')) return false
    if (a.rows.length !== b.rows.length) return false

    for (let i = 0; i < a.rows.length; i += 1) {
      if (JSON.stringify(a.rows[i]) !== JSON.stringify(b.rows[i])) return false
    }

    return true
  }

  function buildExercises(seed: number) {
    if (!db) {
      exercises.value = []
      return
    }

    currentSeed.value = Math.min(Math.max(Number(seed) || 1, 1), MAX_SEED)
    seedInput.value = currentSeed.value

    const rng = makeRng(currentSeed.value)

    const stations = execFirstResult(
      `SELECT DISTINCT station FROM sf_ledger WHERE station IS NOT NULL ORDER BY station;`,
    ).rows.map((r) => r[0] as string).filter(Boolean)

    const months = execFirstResult(
      `SELECT DISTINCT substr(je_date,1,7) AS ym FROM sf_ledger ORDER BY ym;`,
    ).rows.map((r) => r[0] as string).filter(Boolean)

    const vendors = execFirstResult(
      `SELECT party_id, name FROM sf_parties WHERE kind='Vendor' ORDER BY party_id;`,
    ).rows as [number, string][]

    if (!stations.length || !months.length || !vendors.length) {
      exercises.value = []
      return
    }

    const station = choice(rng, stations)
    const ymA = choice(rng, months)
    const laterMonths = months.filter((m) => m >= ymA)
    const ymB = laterMonths.length ? choice(rng, laterMonths) : ymA
    const currency = rng() < 0.2 ? 'SOL' : 'CRD'
    const topN = intBetween(rng, 3, 5)
    const vendor = choice(rng, vendors)
    const cutMonth = choice(rng, months)

    const maxSlice = Math.min(4, months.length)
    const minSlice = Math.min(2, maxSlice)
    const sliceLen = intBetween(rng, minSlice, maxSlice)

    const startIdx = intBetween(rng, 0, Math.max(0, months.length - sliceLen))
    const chosenSlice = months.slice(startIdx, startIdx + sliceLen)

    exercises.value = [
      {
        id: `q1_${currentSeed.value}`,
        title: `Cargo revenue at ${station} between ${ymA} and ${ymB} in ${currency}`,
        prompt: `Return a single row with column cargo_rev showing total cargo revenue (account 4000) at station "${station}" where je_date between '${ymA}-01' and '${ymB}-31' and currency='${currency}'.`,
        sql: `
SELECT ROUND(SUM(CASE WHEN account_no=4000 THEN credit - debit ELSE 0 END),2) AS cargo_rev
FROM sf_ledger
WHERE station = '${station}'
  AND currency = '${currency}'
  AND je_date BETWEEN '${ymA}-01' AND '${ymB}-31';`,
      },
      {
        id: `q2_${currentSeed.value}`,
        title: `Top ${topN} vendors by total AP payments in ${cutMonth}`,
        prompt: `List the top ${topN} vendors by payments (doc_type='PAYMENT') in month ${cutMonth}. Columns: party_id, total_paid (descending).`,
        sql: `
SELECT party_id, ROUND(SUM(CASE WHEN account_no=1000 THEN credit - debit END),2) AS total_paid
FROM sf_ledger
WHERE doc_type='PAYMENT'
  AND substr(je_date,1,7)='${cutMonth}'
GROUP BY party_id
ORDER BY total_paid DESC, party_id
LIMIT ${topN};`,
      },
      {
        id: `q3_${currentSeed.value}`,
        title: `Duplicate payments for vendor ${vendor[1]} (${vendor[0]})`,
        prompt: `Find duplicate payments to vendor ${vendor[1]} (party_id=${vendor[0]}) where the same (date, amount) occurs more than once. Columns: je_date, amount, dup_count.`,
        sql: `
WITH pay AS (
  SELECT je_date,
         ROUND(SUM(CASE WHEN account_no=1000 THEN credit - debit END),2) AS amount
  FROM sf_ledger
  WHERE doc_type='PAYMENT' AND party_id=${vendor[0]}
  GROUP BY je_date, doc_id
)
SELECT je_date, amount, COUNT(*) AS dup_count
FROM pay
GROUP BY je_date, amount
HAVING COUNT(*) > 1
ORDER BY dup_count DESC, je_date;`,
      },
      {
        id: `q4_${currentSeed.value}`,
        title: `Gross margin over ${sliceLen} month(s): ${chosenSlice.join(', ')}`,
        prompt: `Return ym, cargo_rev, cogs, gross_margin for months in (${chosenSlice.join(', ')}).`,
        sql: `
WITH m AS (
  SELECT substr(je_date,1,7) AS ym,
         SUM(CASE WHEN account_no=4000 THEN credit - debit ELSE 0 END) AS cargo_rev,
         SUM(CASE WHEN account_no=5000 THEN debit - credit ELSE 0 END) AS cogs
  FROM sf_ledger
  WHERE substr(je_date,1,7) IN (${chosenSlice.map((m) => `'${m}'`).join(',')})
  GROUP BY substr(je_date,1,7)
)
SELECT ym,
       ROUND(cargo_rev,2) AS cargo_rev,
       ROUND(cogs,2) AS cogs,
       ROUND(cargo_rev - cogs,2) AS gross_margin
FROM m
ORDER BY ym;`,
      },
      {
        id: `q5_${currentSeed.value}`,
        title: `Weekend manual JEs in ${ymA}`,
        prompt: `List weekend MANUAL_JE entries in ${ymA} with columns: je_id, je_date, total_debit, total_credit.`,
        sql: `
SELECT je_id, je_date,
       ROUND(SUM(debit),2) AS total_debit,
       ROUND(SUM(credit),2) AS total_credit
FROM sf_ledger
WHERE doc_type='MANUAL_JE'
  AND substr(je_date,1,7)='${ymA}'
  AND strftime('%w', je_date) IN ('0','6')
GROUP BY je_id, je_date
ORDER BY je_date, je_id;`,
      },
    ]
  }

  function checkExercise(exerciseId: string) {
    const ex = exercises.value.find((x) => x.id === exerciseId)
    if (!ex) return

    try {
      const student = normalizeResult(execFirstResult(editorText.value))
      const answer = normalizeResult(execFirstResult(ex.sql))

      if (equalResults(student, answer)) {
        exerciseStatus[ex.id] = 'correct'
        const progress = getProgress(currentSeed.value)
        progress[ex.id] = true
        setProgress(currentSeed.value, progress)
      } else {
        exerciseStatus[ex.id] = '❌ Not quite. Check filters, columns, or grouping.'
        const progress = getProgress(currentSeed.value)
        progress[ex.id] = false
        setProgress(currentSeed.value, progress)
      }
    } catch (e) {
      exerciseStatus[ex.id] = `Error: ${(e as Error).message}`
    }
  }

  function toggleExpected(id: string) {
    expandedExpected[id] = !expandedExpected[id]
  }

  function expectedText(ex: Exercise) {
    const res = execFirstResult(ex.sql)
    const cols = res.columns
    const rows = res.rows.slice(0, 100)

    let text = `-- SQL\n${ex.sql.trim()}\n\n-- Expected (${rows.length} row(s))\n`
    text += `${cols.join('\t')}\n`
    for (const row of rows) {
      text += `${row.map((v) => (v === null ? 'NULL' : String(v))).join('\t')}\n`
    }
    return text
  }

  async function copySql(sql: string) {
    await navigator.clipboard.writeText(sql.trim())
  }

  function toggleInstructorMode() {
    const pin = prompt('Enter instructor PIN:')
    if (pin === INSTRUCTOR_PIN) {
      instructorMode.value = !instructorMode.value
    } else {
      alert('Incorrect PIN.')
    }
  }

  function exportAnswerKey() {
    const lines: string[] = []
    lines.push(['seed', 'qid', 'title', 'sql', 'columns', 'rows_json'].join(','))

    exercises.value.forEach((ex) => {
      const res = execFirstResult(ex.sql)
      const cols = JSON.stringify(res.columns)
      const rows = JSON.stringify(res.rows)

      const row = [
        currentSeed.value,
        ex.id,
        `"${(ex.title || '').replace(/"/g, '""')}"`,
        `"${(ex.sql || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${cols.replace(/"/g, '""')}"`,
        `"${rows.replace(/"/g, '""')}"`,
      ].join(',')

      lines.push(row)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `answer_key_seed_${currentSeed.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  onMounted(async () => {
    await initSql()
  })

  return {
    dbUrl,
    seedInput,
    currentSeed,
    instructorMode,
    editorText,
    schemaText,
    lastResults,
    resultError,
    hasRunOnce,
    exercises,
    expandedExpected,
    exerciseStatus,
    solvedCount,
    loadDefaultDb,
    resetDb,
    loadDbFromUrl,
    handleDbFileChange,
    buildExercises,
    toggleInstructorMode,
    runSql,
    renderSchema,
    exportAnswerKey,
    checkExercise,
    toggleExpected,
    copySql,
    expectedText,
  }
}
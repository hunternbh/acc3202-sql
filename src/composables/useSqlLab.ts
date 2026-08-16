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
const MAX_SEED = 50

export function useSqlLab() {
  const dbUrl = ref('')
  const studentName = ref(localStorage.getItem('sf_student_name') || '')
  const nameError = ref('')
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
    if (studentName.value.trim()) {
      generateExercises()
    } else {
      exercises.value = []
    }
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

  function firstNameToSeed(name: string) {
    const normalized = name
      .trim()
      .toLocaleLowerCase()
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')

    let hash = 0
    for (const character of normalized) {
      hash = (Math.imul(hash, 31) + (character.codePointAt(0) || 0)) >>> 0
    }

    return (hash % MAX_SEED) + 1
  }

  function generateExercises() {
    const name = studentName.value.trim()
    if (!name) {
      nameError.value = 'Enter your first name to generate your questions.'
      exercises.value = []
      return
    }

    nameError.value = ''
    studentName.value = name
    localStorage.setItem('sf_student_name', name)
    buildExercises(firstNameToSeed(name))
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

    Object.keys(exerciseStatus).forEach((key) => delete exerciseStatus[key])
    Object.keys(expandedExpected).forEach((key) => delete expandedExpected[key])

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
    const summaryStation = choice(rng, stations)
    const ymA = choice(rng, months)
    const laterMonths = months.filter((m) => m >= ymA)
    const ymB = laterMonths.length ? choice(rng, laterMonths) : ymA
    const currency = rng() < 0.2 ? 'SOL' : 'CRD'
    const topN = intBetween(rng, 3, 5)
    const cutMonth = choice(rng, months)

    const questionSet: Exercise[] = [
      {
        id: `q1_${currentSeed.value}`,
        title: `Aggregate cargo revenue at ${station}`,
        prompt: `Practice SUM inside a business filter. Return one column named cargo_rev with total cargo revenue (account 4000) at station "${station}" from ${ymA} through ${ymB}, using ${currency}.`,
        sql: `
SELECT SUM(credit - debit) AS cargo_rev
FROM sf_ledger
WHERE station = '${station}'
  AND currency = '${currency}'
  AND account_no = 4000
  AND je_date BETWEEN '${ymA}-01' AND '${ymB}-31';`,
      },
      {
        id: `q2_${currentSeed.value}`,
        title: `Top ${topN} vendors in ${cutMonth}`,
        prompt: `Practice COUNT and SUM with a join. List the top ${topN} vendors paid in ${cutMonth}. Return vendor_name, payment_count, and total_paid, sorted by total_paid descending.`,
        sql: `
SELECT p.name AS vendor_name,
       COUNT(DISTINCT l.doc_id) AS payment_count,
       SUM(l.credit - l.debit) AS total_paid
FROM sf_ledger AS l
JOIN sf_parties AS p ON p.party_id = l.party_id
WHERE l.doc_type='PAYMENT'
  AND l.account_no=1000
  AND l.je_date BETWEEN '${cutMonth}-01' AND '${cutMonth}-31'
GROUP BY l.party_id, p.name
ORDER BY total_paid DESC, vendor_name
LIMIT ${topN};`,
      },
      {
        id: `q3_${currentSeed.value}`,
        title: `Station activity summary for ${summaryStation}`,
        prompt: `Practice COUNT, MIN, MAX, and AVG inside a grouped accounting summary. For station "${summaryStation}" from ${ymA} through ${ymB}, return account_no, entry_count, min_debit, max_credit, and avg_debit. Sort by account_no.`,
        sql: `
SELECT account_no,
       COUNT(*) AS entry_count,
       MIN(debit) AS min_debit,
       MAX(credit) AS max_credit,
       AVG(debit) AS avg_debit
FROM sf_ledger
WHERE station='${summaryStation}'
  AND je_date BETWEEN '${ymA}-01' AND '${ymB}-31'
GROUP BY account_no
ORDER BY account_no;`,
      },
    ]

    for (let i = questionSet.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      ;[questionSet[i], questionSet[j]] = [questionSet[j]!, questionSet[i]!]
    }

    exercises.value = questionSet
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
    studentName,
    nameError,
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
    generateExercises,
    runSql,
    renderSchema,
    exportAnswerKey,
    checkExercise,
    toggleExpected,
    copySql,
    expectedText,
  }
}

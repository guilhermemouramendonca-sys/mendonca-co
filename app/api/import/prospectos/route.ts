import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

const SHEET_ID = "1vRatQNNIEaFjULZgiM9cguL_EtojchuBRpiMk426goM"
const SHEET_TAB = encodeURIComponent("🎯 Leads Qualificados")

function normalizarPrioridade(p: string): string {
  const stars = (p.match(/⭐/g) ?? []).length
  const up = p.toUpperCase()
  if (stars >= 3 || up.includes("ALTÍSSIM") || up.includes("ALTISSIM")) return "altissima"
  if (stars >= 2 || up.includes("ALTO") || up.includes("ALTA")) return "alta"
  if (stars >= 1 || up.includes("MÉDI") || up.includes("MEDIA") || up.includes("MÉDIO")) return "media"
  if (up.includes("BAIX")) return "baixa"
  return "media"
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = []
  let inQuote = false
  let cell = ""
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cell += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === "," && !inQuote) {
      cells.push(cell)
      cell = ""
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells
}

function limparInstagram(v: string | undefined): string | null {
  if (!v) return null
  const clean = v.replace(/^'/, "").trim()
  const lower = clean.toLowerCase()
  if (!clean || ["nao possui", "não possui", "nao tem", "não tem", "n/a", "-", "sem instagram"].includes(lower)) return null
  return clean
}

export async function POST(req: NextRequest) {
  // Verificar sessão autenticada
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const service = createServiceClient()

  // Verificar se já existe dados (evitar re-import acidental)
  const { count } = await service.from("prospectos").select("id", { count: "exact", head: true })
  const jaTemDados = (count ?? 0) > 0

  // Buscar CSV da planilha pública
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB}`
  let csvText: string
  try {
    const resp = await fetch(csvUrl, { next: { revalidate: 0 } })
    if (!resp.ok) return NextResponse.json({ error: `Falha ao buscar planilha: ${resp.status}` }, { status: 502 })
    csvText = await resp.text()
  } catch (e) {
    return NextResponse.json({ error: "Erro de rede ao buscar planilha" }, { status: 502 })
  }

  const linhas = csvText.split("\n").filter(l => l.trim())
  // Primeira linha é o cabeçalho — pular
  const dataLinhas = linhas.slice(1)

  const records = dataLinhas
    .map(linha => {
      const r = parseCSVLine(linha)
      const num = parseInt(r[0] ?? "")
      const nome = r[2]?.trim()
      if (!nome || isNaN(num)) return null

      return {
        numero: num,
        prioridade: normalizarPrioridade(r[1] ?? ""),
        nome,
        telefone: r[3]?.trim() || null,
        instagram: limparInstagram(r[4]),
        email: r[5]?.trim() || null,
        segmento: r[6]?.trim() || null,
        faturamento: r[7]?.trim() || null,
        origem: r[8]?.trim() || null,
        obs_planilha: r[9]?.trim() || null,
        status: "novo",
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (records.length === 0) {
    return NextResponse.json({ ok: false, error: "Nenhum registro válido encontrado" }, { status: 400 })
  }

  // Inserir em batches de 500
  const BATCH = 500
  let importado = 0

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = jaTemDados
      ? await service.from("prospectos").upsert(batch, { onConflict: "numero", ignoreDuplicates: false })
      : await service.from("prospectos").insert(batch)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, importado }, { status: 500 })
    }
    importado += batch.length
  }

  return NextResponse.json({ ok: true, importado, total: records.length, jaAtualizado: jaTemDados })
}

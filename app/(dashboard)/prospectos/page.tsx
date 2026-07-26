"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type Status = "novo" | "abordado" | "respondeu" | "descartado" | "convertido"

type Prospecto = {
  id: string
  numero: number | null
  prioridade: string | null
  nome: string
  telefone: string | null
  instagram: string | null
  email: string | null
  segmento: string | null
  faturamento: string | null
  origem: string | null
  obs_planilha: string | null
  status: Status
  data_abordagem: string | null
  notas: string | null
  lead_id: string | null
}

type Stats = { total: number; novo: number; abordado: number; respondeu: number; descartado: number; convertido: number }

const STATUS_LABELS: Record<Status, string> = {
  novo: "Novo",
  abordado: "Abordado",
  respondeu: "Respondeu",
  descartado: "Descartado",
  convertido: "Convertido",
}

const STATUS_CORES: Record<Status, string> = {
  novo: "bg-gray-100 text-gray-600",
  abordado: "bg-blue-100 text-blue-700",
  respondeu: "bg-green-100 text-green-700",
  descartado: "bg-red-100 text-red-600",
  convertido: "bg-amber-100 text-amber-700",
}

const PRIORIDADE_DOT: Record<string, string> = {
  altissima: "bg-red-600",
  alta: "bg-orange-500",
  media: "bg-amber-400",
  média: "bg-amber-400",
  baixa: "bg-gray-300",
}

const POR_PAGINA = 50

export default function ProspectosPage() {
  const supabase = createClient()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, novo: 0, abordado: 0, respondeu: 0, descartado: 0, convertido: 0 })
  const [segmentos, setSegmentos] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState("")
  const [buscaInput, setBuscaInput] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("")
  const [filtroSegmento, setFiltroSegmento] = useState<string>("")
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("")
  const [pagina, setPagina] = useState(1)
  const [totalFiltrado, setTotalFiltrado] = useState(0)
  const [editandoNota, setEditandoNota] = useState<string | null>(null)
  const [notaTexto, setNotaTexto] = useState("")
  const [convertendo, setConvertendo] = useState<Prospecto | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  // Debounce busca
  useEffect(() => {
    const t = setTimeout(() => setBusca(buscaInput), 400)
    return () => clearTimeout(t)
  }, [buscaInput])

  // Reset página ao mudar filtros
  useEffect(() => { setPagina(1) }, [busca, filtroStatus, filtroSegmento, filtroPrioridade])

  // Carrega stats e segmentos (apenas 1 vez, ou quando status muda)
  const carregarMeta = useCallback(async () => {
    const [total, novo, abordado, respondeu, descartado, convertido, segs] = await Promise.all([
      supabase.from("prospectos").select("id", { count: "exact", head: true }),
      supabase.from("prospectos").select("id", { count: "exact", head: true }).eq("status", "novo"),
      supabase.from("prospectos").select("id", { count: "exact", head: true }).eq("status", "abordado"),
      supabase.from("prospectos").select("id", { count: "exact", head: true }).eq("status", "respondeu"),
      supabase.from("prospectos").select("id", { count: "exact", head: true }).eq("status", "descartado"),
      supabase.from("prospectos").select("id", { count: "exact", head: true }).eq("status", "convertido"),
      supabase.from("prospectos").select("segmento").not("segmento", "is", null).limit(25000),
    ])
    setStats({
      total: total.count ?? 0,
      novo: novo.count ?? 0,
      abordado: abordado.count ?? 0,
      respondeu: respondeu.count ?? 0,
      descartado: descartado.count ?? 0,
      convertido: convertido.count ?? 0,
    })
    if (segs.data) {
      setSegmentos(Array.from(new Set(segs.data.map(r => r.segmento).filter(Boolean))).sort() as string[])
    }
  }, [supabase])

  useEffect(() => { carregarMeta() }, [carregarMeta])

  // Carrega página atual
  const carregar = useCallback(async () => {
    setCarregando(true)
    let query = supabase
      .from("prospectos")
      .select("*", { count: "exact" })
      .order("numero", { ascending: true, nullsFirst: false })
      .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)

    if (filtroStatus) query = query.eq("status", filtroStatus)
    if (filtroSegmento) query = query.eq("segmento", filtroSegmento)
    if (filtroPrioridade) query = query.ilike("prioridade", filtroPrioridade)
    if (busca.trim()) {
      query = query.or(
        `nome.ilike.%${busca.trim()}%,instagram.ilike.%${busca.trim()}%,email.ilike.%${busca.trim()}%,segmento.ilike.%${busca.trim()}%`
      )
    }

    const { data, count } = await query
    setProspectos((data as Prospecto[]) ?? [])
    setTotalFiltrado(count ?? 0)
    setCarregando(false)
  }, [supabase, pagina, filtroStatus, filtroSegmento, filtroPrioridade, busca])

  useEffect(() => { carregar() }, [carregar])

  async function atualizarStatus(id: string, novoStatus: Status) {
    const oldStatus = prospectos.find(p => p.id === id)?.status
    const updates: Record<string, unknown> = { status: novoStatus }
    if (novoStatus === "abordado" && !prospectos.find(p => p.id === id)?.data_abordagem) {
      updates.data_abordagem = new Date().toISOString().split("T")[0]
    }
    await supabase.from("prospectos").update(updates).eq("id", id)
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, ...updates as Partial<Prospecto> } : p))
    if (oldStatus && oldStatus !== novoStatus) {
      setStats(prev => ({ ...prev, [oldStatus]: prev[oldStatus] - 1, [novoStatus]: prev[novoStatus] + 1 }))
    }
  }

  async function salvarNota(id: string) {
    await supabase.from("prospectos").update({ notas: notaTexto }).eq("id", id)
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, notas: notaTexto } : p))
    setEditandoNota(null)
    setNotaTexto("")
  }

  async function converterParaLead() {
    if (!convertendo) return
    setSalvando(true)
    const { data: lead } = await supabase.from("leads").insert({
      nome: convertendo.nome,
      email: convertendo.email ?? "",
      whatsapp: convertendo.telefone,
      instagram: convertendo.instagram,
      tipo_servico: convertendo.segmento,
      canal: "lista_prospectos",
      etapa: "novo",
    }).select("id").single()

    if (lead) {
      await supabase.from("prospectos").update({ status: "convertido", lead_id: lead.id }).eq("id", convertendo.id)
      setProspectos(prev => prev.map(p => p.id === convertendo.id ? { ...p, status: "convertido", lead_id: lead.id } : p))
      setStats(prev => ({
        ...prev,
        [convertendo.status]: Math.max(0, prev[convertendo.status] - 1),
        convertido: prev.convertido + 1,
      }))
    }
    setSalvando(false)
    setConvertendo(null)
  }

  async function importarPlanilha() {
    setImportando(true)
    setImportMsg(null)
    try {
      const resp = await fetch("/api/import/prospectos", { method: "POST" })
      const data = await resp.json()
      if (data.ok) {
        setImportMsg({ ok: true, texto: `${data.importado.toLocaleString("pt-BR")} contatos importados com sucesso!` })
        await carregarMeta()
        await carregar()
      } else {
        setImportMsg({ ok: false, texto: data.error ?? "Erro desconhecido" })
      }
    } catch {
      setImportMsg({ ok: false, texto: "Erro de rede ao importar" })
    }
    setImportando(false)
  }

  const totalPaginas = Math.ceil(totalFiltrado / POR_PAGINA)

  const statsConfig = [
    { label: "Total", valor: stats.total, cor: "text-[#0D2B2E]", filtro: null },
    { label: "Novos", valor: stats.novo, cor: "text-gray-500", filtro: "novo" },
    { label: "Abordados", valor: stats.abordado, cor: "text-blue-600", filtro: "abordado" },
    { label: "Responderam", valor: stats.respondeu, cor: "text-green-600", filtro: "respondeu" },
    { label: "Descartados", valor: stats.descartado, cor: "text-red-500", filtro: "descartado" },
    { label: "Convertidos", valor: stats.convertido, cor: "text-amber-600", filtro: "convertido" },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B2E]">Base de Prospecção</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.total.toLocaleString("pt-BR")} contatos{stats.total === 0 ? " — importe a planilha para começar" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {importMsg && (
            <span className={`text-sm font-medium ${importMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {importMsg.ok ? "✓ " : "✗ "}{importMsg.texto}
            </span>
          )}
          <button
            onClick={importarPlanilha}
            disabled={importando}
            className="flex items-center gap-2 bg-[#0D2B2E] text-[#C9A84C] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1a3f43] transition-colors disabled:opacity-60"
          >
            {importando ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full inline-block" />
                Importando...
              </>
            ) : (
              <>↓ Importar planilha</>
            )}
          </button>
        </div>
      </div>

      {/* Stats clicáveis */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statsConfig.map(s => (
          <button
            key={s.label}
            onClick={() => s.filtro && setFiltroStatus(filtroStatus === s.filtro ? "" : s.filtro)}
            className={`bg-white rounded-lg border p-3 text-center transition-all ${
              s.filtro && filtroStatus === s.filtro
                ? "border-[#C9A84C] shadow-sm ring-1 ring-[#C9A84C]"
                : "border-gray-200 hover:border-gray-300"
            } ${s.filtro ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className={`text-xl font-bold ${s.cor}`}>{s.valor.toLocaleString("pt-BR")}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar nome, @instagram, email..."
          value={buscaInput}
          onChange={e => setBuscaInput(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-[#C9A84C]"
        />
        <select
          value={filtroSegmento}
          onChange={e => setFiltroSegmento(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
        >
          <option value="">Todos os segmentos</option>
          {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filtroPrioridade}
          onChange={e => setFiltroPrioridade(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
        >
          <option value="">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="média">Média</option>
          <option value="media">Média (sem acento)</option>
          <option value="baixa">Baixa</option>
        </select>
        {(buscaInput || filtroStatus || filtroSegmento || filtroPrioridade) && (
          <button
            onClick={() => { setBuscaInput(""); setBusca(""); setFiltroStatus(""); setFiltroSegmento(""); setFiltroPrioridade("") }}
            className="text-sm text-red-400 hover:text-red-600 px-1"
          >
            ✕ Limpar
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">
          {totalFiltrado.toLocaleString("pt-BR")} de {stats.total.toLocaleString("pt-BR")}
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">P</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Segmento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Faturamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prospectos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      {stats.total === 0
                        ? "Nenhum prospecto importado. Crie a tabela e importe via Supabase Studio."
                        : "Nenhum resultado para os filtros aplicados."}
                    </td>
                  </tr>
                ) : prospectos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {/* Prioridade */}
                    <td className="px-4 py-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${PRIORIDADE_DOT[p.prioridade?.toLowerCase() ?? ""] ?? "bg-gray-200"}`}
                        title={p.prioridade ?? "sem prioridade"}
                      />
                    </td>
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 leading-tight">{p.nome}</div>
                      {p.email && <div className="text-xs text-gray-400 mt-0.5">{p.email}</div>}
                    </td>
                    {/* Segmento */}
                    <td className="px-4 py-3 text-xs text-gray-600">{p.segmento ?? "—"}</td>
                    {/* Faturamento */}
                    <td className="px-4 py-3 text-xs text-gray-500">{p.faturamento ?? "—"}</td>
                    {/* Contato */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.telefone && (
                          <a
                            href={`https://wa.me/55${p.telefone.replace(/\D/g, "")}`}
                            target="_blank" rel="noreferrer"
                            className="text-[#25D366] hover:opacity-70" title={p.telefone}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        {p.instagram && (
                          <a
                            href={p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace(/^@/, "")}`}
                            target="_blank" rel="noreferrer"
                            className="text-pink-500 hover:opacity-70" title={p.instagram}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={e => atualizarStatus(p.id, e.target.value as Status)}
                        className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer border-0 outline-none ${STATUS_CORES[p.status]}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) =>
                          <option key={v} value={v}>{l}</option>
                        )}
                      </select>
                    </td>
                    {/* Nota */}
                    <td className="px-4 py-3 max-w-[160px]">
                      {editandoNota === p.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            autoFocus
                            value={notaTexto}
                            onChange={e => setNotaTexto(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") salvarNota(p.id)
                              if (e.key === "Escape") setEditandoNota(null)
                            }}
                            className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Nota..."
                          />
                          <button onClick={() => salvarNota(p.id)} className="text-green-600 text-xs font-bold shrink-0">✓</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditandoNota(p.id); setNotaTexto(p.notas ?? "") }}
                          className="text-xs text-left w-full truncate"
                        >
                          {p.notas
                            ? <span className="text-gray-600">{p.notas}</span>
                            : <span className="text-gray-300 italic">+ nota</span>}
                        </button>
                      )}
                    </td>
                    {/* Ação */}
                    <td className="px-4 py-3">
                      {p.status === "convertido" ? (
                        <span className="text-xs text-amber-600 font-medium">✓ Lead</span>
                      ) : p.status !== "descartado" ? (
                        <button
                          onClick={() => setConvertendo(p)}
                          className="text-xs bg-[#0D2B2E] text-[#C9A84C] px-3 py-1.5 rounded-full hover:bg-[#1a3f43] transition-colors whitespace-nowrap font-medium"
                        >
                          → Lead
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Página {pagina} de {totalPaginas} · mostrando {((pagina - 1) * POR_PAGINA) + 1}–{Math.min(pagina * POR_PAGINA, totalFiltrado)} de {totalFiltrado.toLocaleString("pt-BR")}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal converter em lead */}
      {convertendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#0D2B2E] mb-1">Converter em lead</h2>
            <p className="text-sm text-gray-500 mb-4">
              Será adicionado ao CRM com etapa &ldquo;Novo&rdquo; e canal &ldquo;Lista de Prospecção&rdquo;.
            </p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm space-y-1.5 mb-6">
              <div className="font-semibold text-gray-800">{convertendo.nome}</div>
              {convertendo.telefone && <div className="text-gray-500">📱 {convertendo.telefone}</div>}
              {convertendo.email && <div className="text-gray-500">✉️ {convertendo.email}</div>}
              {convertendo.instagram && <div className="text-gray-500">📷 {convertendo.instagram}</div>}
              {convertendo.segmento && <div className="text-gray-500">🏷️ {convertendo.segmento}</div>}
              {convertendo.faturamento && <div className="text-gray-500">💰 {convertendo.faturamento}</div>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConvertendo(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={converterParaLead}
                disabled={salvando}
                className="flex-1 bg-[#C9A84C] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#b8943f] transition-colors disabled:opacity-60"
              >
                {salvando ? "Criando..." : "Criar lead →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

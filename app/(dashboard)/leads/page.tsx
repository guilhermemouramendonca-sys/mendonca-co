"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { KanbanColuna } from "@/components/kanban/kanban-coluna";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { LeadModal } from "@/components/kanban/lead-modal";
import { ModalGanhoPerca } from "@/components/kanban/modal-ganho-perda";
import { GerarUTM } from "@/components/kanban/gerar-utm";
import { Button } from "@/components/ui/button";
import {
  Plus, LayoutGrid, TrendingDown, Link2, List, Calendar,
  Search, X, MessageCircle, ChevronRight, Clock, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLUNAS, type Etapa, type Lead } from "@/lib/crm/tipos";
import { cn, daysSince, formatDate } from "@/lib/utils";

export type { Etapa, Lead };

const ETAPAS_FUNIL: Etapa[] = ["novo", "contato", "diagnostico", "proposta", "negociacao", "ganho"];

type View = "kanban" | "funil" | "lista" | "agenda";

const TIPOS_SERVICO_LABELS: Record<string, string> = {
  mentoria_3d: "Mentoria 3D",
  palestra: "Palestra",
  diagnostico_board: "Diag. Board",
  mentoria_expressa: "M. Expressa",
};

const CANAL_LABELS: Record<string, string> = {
  indicacao: "Indicação", linkedin: "LinkedIn", instagram: "Instagram",
  youtube: "YouTube", organico: "Orgânico", evento: "Evento",
  google: "Google Ads", whatsapp_ativo: "WA Ativo", email_frio: "E-mail Frio",
};

// ── Agenda helpers ──────────────────────────────────────────────────
type AgendaGrupo = { label: string; cor: string; leads: Lead[] };

function agruparAgenda(leads: Lead[]): AgendaGrupo[] {
  const hoje = new Date().toISOString().split("T")[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const em7d   = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const comData   = leads.filter((l) => l.data_proxima_acao);
  const semData   = leads.filter((l) => !l.data_proxima_acao);
  const atrasados = comData.filter((l) => l.data_proxima_acao! < hoje);
  const paraHoje  = comData.filter((l) => l.data_proxima_acao === hoje);
  const paraAmanha= comData.filter((l) => l.data_proxima_acao === amanha);
  const proxSemana= comData.filter((l) => l.data_proxima_acao! > amanha && l.data_proxima_acao! <= em7d);

  return [
    { label: "Atrasados",         cor: "#C0392B", leads: atrasados },
    { label: "Hoje",              cor: "#E67E22", leads: paraHoje },
    { label: "Amanhã",            cor: "#C9A84C", leads: paraAmanha },
    { label: "Próximos 7 dias",   cor: "#2980B9", leads: proxSemana },
    { label: "Sem data agendada", cor: "#6B6B6B", leads: semData },
  ].filter((g) => g.leads.length > 0);
}

// ── Linha da lista ──────────────────────────────────────────────────
function LeadRow({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const col    = COLUNAS.find((c) => c.id === lead.etapa);
  const dias   = daysSince(lead.atualizado_em);
  const alerta = dias > 7;
  const hoje   = new Date().toISOString().split("T")[0];
  const acaoAtrasada = lead.data_proxima_acao && lead.data_proxima_acao < hoje;

  return (
    <tr onClick={onClick} className="border-b border-[#E8D5A3]/30 hover:bg-bg cursor-pointer transition-colors group">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-text-main group-hover:text-gold transition-colors">{lead.nome}</p>
        {lead.empresa && <p className="text-xs text-text-muted">{lead.empresa}</p>}
      </td>
      <td className="px-4 py-3">
        {col && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ backgroundColor: col.cor + "20", color: col.cor }}>
            {col.label}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-text-muted hidden md:table-cell">
        {lead.tipo_servico ? (TIPOS_SERVICO_LABELS[lead.tipo_servico] ?? lead.tipo_servico) : "—"}
      </td>
      <td className="px-4 py-3 text-xs font-mono-data text-text-muted hidden lg:table-cell">
        {lead.valor_estimado ? `R$ ${lead.valor_estimado.toLocaleString("pt-BR")}` : "—"}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {lead.proxima_acao ? (
          <div>
            <p className={cn("text-xs", acaoAtrasada ? "text-danger font-medium" : "text-text-main")}>{lead.proxima_acao}</p>
            {lead.data_proxima_acao && (
              <p className={cn("text-[10px] mt-0.5", acaoAtrasada ? "text-danger" : "text-text-muted")}>
                {acaoAtrasada ? `Atrasada ${Math.ceil((Date.now() - new Date(lead.data_proxima_acao + "T00:00:00").getTime()) / 86400000)}d` : formatDate(lead.data_proxima_acao)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-text-muted/40">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={cn("text-xs font-medium", alerta ? "text-danger" : "text-text-muted")}>
          {dias === 0 ? "Hoje" : `${dias}d`}
          {alerta && <AlertCircle size={11} className="inline ml-1" />}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        {lead.whatsapp && (
          <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}!`)}`}
            target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline">
            <MessageCircle size={12} />
          </a>
        )}
      </td>
    </tr>
  );
}

// ── Card de agenda ──────────────────────────────────────────────────
function AgendaCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const col  = COLUNAS.find((c) => c.id === lead.etapa);
  const hoje = new Date().toISOString().split("T")[0];
  const atrasada = lead.data_proxima_acao && lead.data_proxima_acao < hoje;

  return (
    <div onClick={onClick}
      className="bg-surface border border-[#E8D5A3]/50 rounded-btn p-4 cursor-pointer hover:border-gold/40 hover:shadow-sm transition-all flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-text-main truncate">{lead.nome}</p>
          {lead.empresa && <span className="text-xs text-text-muted shrink-0">· {lead.empresa}</span>}
        </div>
        {lead.proxima_acao && (
          <p className={cn("text-sm", atrasada ? "text-danger" : "text-text-main")}>{lead.proxima_acao}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {col && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: col.cor + "20", color: col.cor }}>{col.label}</span>
          )}
          {lead.data_proxima_acao && (
            <span className={cn("text-[10px] flex items-center gap-1", atrasada ? "text-danger font-semibold" : "text-text-muted")}>
              <Clock size={10} />
              {atrasada
                ? `Atrasada ${Math.ceil((Date.now() - new Date(lead.data_proxima_acao + "T00:00:00").getTime()) / 86400000)}d`
                : formatDate(lead.data_proxima_acao)}
            </span>
          )}
          {lead.tipo_servico && (
            <span className="text-[10px] text-text-muted hidden sm:block">
              {TIPOS_SERVICO_LABELS[lead.tipo_servico] ?? lead.tipo_servico}
            </span>
          )}
        </div>
      </div>
      {lead.whatsapp && (
        <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}, tudo bem?`)}`}
          target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-[#25D366]/10 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/20 transition-colors shrink-0">
          <MessageCircle size={14} /> WhatsApp
        </a>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [novoLeadEtapa, setNovoLeadEtapa] = useState<Etapa | null>(null);
  const [view, setView]     = useState<View>("kanban");
  const [showUTM, setShowUTM] = useState(false);
  const [modalGanhoPerda, setModalGanhoPerda] = useState<{ lead: Lead; tipo: "ganho" | "perdido" } | null>(null);

  // Filtros
  const [busca,          setBusca]          = useState("");
  const [filtroServico,  setFiltroServico]  = useState("");
  const [filtroCanal,    setFiltroCanal]    = useState("");
  const [filtroEtapa,    setFiltroEtapa]    = useState("");

  const supabase = createClient();
  const sensors  = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("leads").select("*").order("criado_em", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  // ── Leads filtrados ────────────────────────────────────────────────
  const leadsAtivos = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return leads.filter((l) => {
      if (q && !l.nome.toLowerCase().includes(q) && !(l.empresa ?? "").toLowerCase().includes(q)) return false;
      if (filtroServico && l.tipo_servico !== filtroServico) return false;
      if (filtroCanal   && l.canal !== filtroCanal)          return false;
      if (filtroEtapa   && l.etapa !== filtroEtapa)          return false;
      return true;
    });
  }, [leads, busca, filtroServico, filtroCanal, filtroEtapa]);

  // Leads que aparecem no pipeline (sem ganho/perdido — mas os filtros acima se aplicam)
  const leadsPipeline = useMemo(() =>
    leadsAtivos.filter((l) => !["ganho", "perdido"].includes(l.etapa)), [leadsAtivos]);

  function getLeadsByEtapa(etapa: Etapa) {
    return leadsAtivos.filter((l) => l.etapa === etapa);
  }

  // Opções de filtro (só as que existem nos dados)
  const servicosDisponiveis = useMemo(() =>
    Array.from(new Set(leads.map((l) => l.tipo_servico).filter(Boolean))) as string[], [leads]);
  const canaisDisponiveis   = useMemo(() =>
    Array.from(new Set(leads.map((l) => l.canal).filter(Boolean))) as string[], [leads]);

  const temFiltroAtivo = busca || filtroServico || filtroCanal || filtroEtapa;

  function limparFiltros() {
    setBusca(""); setFiltroServico(""); setFiltroCanal(""); setFiltroEtapa("");
  }

  // ── DnD ──────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId    = active.id as string;
    const novaEtapa = over.id as Etapa;
    if (!COLUNAS.find((c) => c.id === novaEtapa)) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === novaEtapa) return;
    if (novaEtapa === "ganho" || novaEtapa === "perdido") {
      setModalGanhoPerda({ lead, tipo: novaEtapa });
      return;
    }
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, etapa: novaEtapa } : l));
    await supabase.from("leads").update({ etapa: novaEtapa, atualizado_em: new Date().toISOString() }).eq("id", leadId);
  }

  async function confirmarGanhoPerda(lead: Lead, tipo: "ganho" | "perdido", dados: Record<string, string>) {
    const update: Record<string, unknown> = { etapa: tipo, atualizado_em: new Date().toISOString(), ...dados };
    if (tipo === "ganho")   update.data_ganho = new Date().toISOString().split("T")[0];
    if (tipo === "perdido") update.data_perda = new Date().toISOString().split("T")[0];
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, etapa: tipo, ...dados } : l));
    await supabase.from("leads").update(update).eq("id", lead.id);
    setModalGanhoPerda(null);
  }

  const activeLead = leads.find((l) => l.id === activeId);

  // ── Métricas (usa todos os leads, não filtrado) ───────────────────
  const totalValor = leads
    .filter((l) => l.etapa !== "perdido")
    .reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
  const receitaPonderada = leads
    .filter((l) => l.etapa !== "perdido")
    .reduce((s, l) => {
      const prob = COLUNAS.find((c) => c.id === l.etapa)?.prob ?? 0;
      return s + (l.valor_estimado ?? 0) * (prob / 100);
    }, 0);
  const maxLeads = Math.max(...ETAPAS_FUNIL.map((e) => getLeadsByEtapa(e).length), 1);

  // ── Views config ─────────────────────────────────────────────────
  const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "kanban",  label: "Kanban",  icon: <LayoutGrid size={13} /> },
    { id: "funil",   label: "Funil",   icon: <TrendingDown size={13} /> },
    { id: "lista",   label: "Lista",   icon: <List size={13} /> },
    { id: "agenda",  label: "Agenda",  icon: <Calendar size={13} /> },
  ];

  // Para a view agenda, leads relevantes = abertos e com ação OU sem ação
  const leadsAgenda = useMemo(() =>
    leadsAtivos.filter((l) => !["ganho", "perdido"].includes(l.etapa)), [leadsAtivos]);
  const gruposAgenda = useMemo(() => agruparAgenda(leadsAgenda), [leadsAgenda]);

  // Para lista: leads ganhos/perdidos incluídos (todos filtrados)
  const [sortLista, setSortLista] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "criado_em", dir: "desc" });

  const leadsLista = useMemo(() => {
    return [...leadsAtivos].sort((a, b) => {
      const { col, dir } = sortLista;
      let va: string | number = "";
      let vb: string | number = "";
      if (col === "nome")          { va = a.nome ?? ""; vb = b.nome ?? ""; }
      else if (col === "empresa")  { va = a.empresa ?? ""; vb = b.empresa ?? ""; }
      else if (col === "etapa")    { va = a.etapa ?? ""; vb = b.etapa ?? ""; }
      else if (col === "valor")    { va = a.valor_estimado ?? 0; vb = b.valor_estimado ?? 0; }
      else if (col === "acao")     { va = a.data_proxima_acao ?? "9999"; vb = b.data_proxima_acao ?? "9999"; }
      else if (col === "criado_em"){ va = a.criado_em; vb = b.criado_em; }
      else if (col === "atualizado"){ va = a.atualizado_em; vb = b.atualizado_em; }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [leadsAtivos, sortLista]);

  function toggleSort(col: string) {
    setSortLista((p) => p.col === col ? { col, dir: p.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  }

  function SortIcon({ col }: { col: string }) {
    if (sortLista.col !== col) return <span className="text-text-muted/30 ml-1">↕</span>;
    return <span className="text-gold ml-1">{sortLista.dir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">CRM / Pipeline</h1>
          <p className="text-text-muted mt-1 text-sm">Pipeline comercial da Mendonça & Co</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-[#E8D5A3] overflow-hidden">
            {VIEWS.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === v.id ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setShowUTM(true)}><Link2 size={16} /> Gerar UTM</Button>
          <Button onClick={() => setNovoLeadEtapa("novo")}><Plus size={16} /> Novo Lead</Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "No pipeline",        value: leadsPipeline.length,  suffix: " leads" },
          { label: "Valor total",        value: `R$ ${totalValor.toLocaleString("pt-BR")}`,         suffix: "" },
          { label: "Receita ponderada",  value: `R$ ${Math.round(receitaPonderada).toLocaleString("pt-BR")}`, suffix: "" },
          { label: "Ganhos este mês",    value: leads.filter((l) => l.etapa === "ganho" && l.data_ganho?.startsWith(new Date().toISOString().slice(0, 7))).length, suffix: " fechados" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-[#E8D5A3]/50 rounded-card p-4">
            <p className="text-xs text-text-muted mb-1">{kpi.label}</p>
            <p className="text-xl font-semibold text-text-main font-mono-data">{kpi.value}{kpi.suffix}</p>
          </div>
        ))}
      </div>

      {/* ── Barra de busca + filtros ── */}
      <div className="bg-surface border border-[#E8D5A3]/50 rounded-card p-3 mb-5 flex flex-wrap items-center gap-2">
        {/* Busca */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou empresa..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-bg border border-[#E8D5A3]/60 rounded-btn outline-none focus:ring-2 focus:ring-gold/30 text-text-main placeholder:text-text-muted/50" />
        </div>

        {/* Filtro serviço */}
        <select value={filtroServico} onChange={(e) => setFiltroServico(e.target.value)}
          className="h-9 px-3 text-sm bg-bg border border-[#E8D5A3]/60 rounded-btn outline-none focus:ring-2 focus:ring-gold/30 text-text-main">
          <option value="">Todos os serviços</option>
          {servicosDisponiveis.map((s) => (
            <option key={s} value={s}>{TIPOS_SERVICO_LABELS[s] ?? s}</option>
          ))}
        </select>

        {/* Filtro canal */}
        <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)}
          className="h-9 px-3 text-sm bg-bg border border-[#E8D5A3]/60 rounded-btn outline-none focus:ring-2 focus:ring-gold/30 text-text-main">
          <option value="">Todos os canais</option>
          {canaisDisponiveis.map((c) => (
            <option key={c} value={c}>{CANAL_LABELS[c] ?? c}</option>
          ))}
        </select>

        {/* Filtro etapa */}
        <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}
          className="h-9 px-3 text-sm bg-bg border border-[#E8D5A3]/60 rounded-btn outline-none focus:ring-2 focus:ring-gold/30 text-text-main">
          <option value="">Todas as etapas</option>
          {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        {/* Limpar */}
        {temFiltroAtivo && (
          <button onClick={limparFiltros}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-colors px-2 py-1.5">
            <X size={13} /> Limpar
          </button>
        )}

        {/* Contador */}
        {temFiltroAtivo && (
          <span className="text-xs text-gold font-medium ml-auto">
            {leadsAtivos.length} de {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── KANBAN ── */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max">
              {COLUNAS.map((col) => (
                <KanbanColuna key={col.id} coluna={col} leads={getLeadsByEtapa(col.id)}
                  onClickLead={setSelectedLead} onNovoLead={() => setNovoLeadEtapa(col.id)} />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? <KanbanCard lead={activeLead} onClick={() => {}} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* ── FUNIL ── */}
      {view === "funil" && (
        <div className="max-w-3xl mx-auto space-y-2">
          {ETAPAS_FUNIL.map((etapa, idx) => {
            const col        = COLUNAS.find((c) => c.id === etapa)!;
            const leadsEtapa = getLeadsByEtapa(etapa);
            const prox       = ETAPAS_FUNIL[idx + 1] ? getLeadsByEtapa(ETAPAS_FUNIL[idx + 1]).length : null;
            const conv       = idx > 0 && getLeadsByEtapa(ETAPAS_FUNIL[idx - 1]).length > 0
              ? Math.round((leadsEtapa.length / getLeadsByEtapa(ETAPAS_FUNIL[idx - 1]).length) * 100)
              : null;
            const valorEtapa = leadsEtapa.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
            const largura    = Math.max(30, Math.round((leadsEtapa.length / maxLeads) * 100));
            return (
              <div key={etapa}>
                <div className="flex items-center gap-3">
                  <div className="w-36 text-right">
                    <p className="text-xs font-medium text-text-main">{col.label}</p>
                    {conv !== null && <p className="text-[10px] text-text-muted">conv. {conv}%</p>}
                  </div>
                  <div className="flex-1">
                    <div className="rounded-btn px-4 py-3 flex items-center justify-between transition-all"
                      style={{ width: `${largura}%`, backgroundColor: col.cor + "20", borderLeft: `3px solid ${col.cor}`, minWidth: 200 }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: col.cor }}>{leadsEtapa.length}</span>
                        <span className="text-xs text-text-muted">leads</span>
                      </div>
                      {valorEtapa > 0 && (
                        <span className="text-xs font-mono-data text-text-muted">R$ {valorEtapa.toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  {prox !== null && leadsEtapa.length > 0 && (
                    <ChevronRight size={14} className="text-text-muted rotate-90 -mb-2" />
                  )}
                </div>
                {idx < ETAPAS_FUNIL.length - 1 && <div className="ml-36 pl-3 h-2" />}
              </div>
            );
          })}
          <div className="mt-6 pt-6 border-t border-[#E8D5A3]/50">
            <div className="flex items-center gap-3">
              <div className="w-36 text-right"><p className="text-xs font-medium text-danger">Perdidos</p></div>
              <div className="flex-1">
                <div className="bg-danger/10 border-l-2 border-danger rounded-btn px-4 py-3 flex items-center gap-3" style={{ minWidth: 200 }}>
                  <span className="text-lg font-bold text-danger">{getLeadsByEtapa("perdido").length}</span>
                  <span className="text-xs text-text-muted">leads perdidos</span>
                </div>
              </div>
            </div>
            {getLeadsByEtapa("perdido").length > 0 && (
              <div className="ml-36 pl-3 mt-3 grid grid-cols-3 gap-2">
                {Object.entries(
                  getLeadsByEtapa("perdido").reduce((acc, l) => {
                    const k = l.categoria_perda ?? "outro";
                    acc[k] = (acc[k] ?? 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([cat, count]) => (
                  <div key={cat} className="bg-surface border border-[#E8D5A3]/50 rounded-btn px-3 py-2">
                    <p className="text-xs font-medium text-text-main capitalize">{cat.replace(/_/g, " ")}</p>
                    <p className="text-lg font-bold text-danger">{count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LISTA ── */}
      {view === "lista" && (
        <div className="bg-surface border border-[#E8D5A3]/50 rounded-card overflow-hidden">
          {leadsLista.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-16">Nenhum lead encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8D5A3]/50 bg-bg">
                    {[
                      { col: "nome",       label: "Nome / Empresa" },
                      { col: "etapa",      label: "Etapa" },
                      { col: "servico",    label: "Serviço",   hidden: "md" },
                      { col: "valor",      label: "Valor",     hidden: "lg" },
                      { col: "acao",       label: "Próx. Ação",hidden: "lg" },
                      { col: "atualizado", label: "Contato",   right: true },
                    ].map((h) => (
                      <th key={h.col}
                        onClick={() => h.col !== "servico" && toggleSort(h.col)}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap select-none",
                          h.col !== "servico" && "cursor-pointer hover:text-text-main transition-colors",
                          h.hidden === "md" && "hidden md:table-cell",
                          h.hidden === "lg" && "hidden lg:table-cell",
                          h.right && "text-right",
                        )}>
                        {h.label}{h.col !== "servico" && <SortIcon col={h.col} />}
                      </th>
                    ))}
                    <th className="px-4 py-3 hidden sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {leadsLista.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AGENDA ── */}
      {view === "agenda" && (
        <div className="space-y-6">
          {gruposAgenda.length === 0 ? (
            <div className="text-center py-20 text-text-muted">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum lead com ação agendada.</p>
              <p className="text-xs mt-1">Adicione uma "Próxima ação" nos leads para que apareçam aqui.</p>
            </div>
          ) : (
            gruposAgenda.map((grupo) => (
              <div key={grupo.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: grupo.cor }} />
                  <h3 className="text-sm font-semibold text-text-main">{grupo.label}</h3>
                  <span className="text-xs text-text-muted">({grupo.leads.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {grupo.leads.map((lead) => (
                    <AgendaCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modais ── */}
      {(selectedLead || novoLeadEtapa) && (
        <LeadModal lead={selectedLead} etapaInicial={novoLeadEtapa}
          onClose={() => { setSelectedLead(null); setNovoLeadEtapa(null); }}
          onSave={carregar}
          onGanhoPerda={(lead, tipo) => {
            setSelectedLead(null); setNovoLeadEtapa(null);
            setModalGanhoPerda({ lead, tipo });
          }} />
      )}
      {modalGanhoPerda && (
        <ModalGanhoPerca lead={modalGanhoPerda.lead} tipo={modalGanhoPerda.tipo}
          onClose={() => setModalGanhoPerda(null)} onConfirmar={confirmarGanhoPerda} />
      )}
      {showUTM && <GerarUTM onClose={() => setShowUTM(false)} />}
    </div>
  );
}

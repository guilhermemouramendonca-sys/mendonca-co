"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, LayoutGrid, TrendingDown, Link2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLUNAS, type Etapa, type Lead } from "@/lib/crm/tipos";

export type { Etapa, Lead };

const ETAPAS_FUNIL: Etapa[] = ["novo", "contato", "diagnostico", "proposta", "negociacao", "ganho"];

type View = "kanban" | "funil";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [novoLeadEtapa, setNovoLeadEtapa] = useState<Etapa | null>(null);
  const [view, setView] = useState<View>("kanban");
  const [showUTM, setShowUTM] = useState(false);
  const [modalGanhoPerda, setModalGanhoPerda] = useState<{ lead: Lead; tipo: "ganho" | "perdido" } | null>(null);
  const supabase = createClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("leads").select("*").order("criado_em", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  function getLeadsByEtapa(etapa: Etapa) {
    return leads.filter((l) => l.etapa === etapa);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
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
    const update: Record<string, unknown> = {
      etapa: tipo,
      atualizado_em: new Date().toISOString(),
      ...dados,
    };
    if (tipo === "ganho") update.data_ganho = new Date().toISOString().split("T")[0];
    if (tipo === "perdido") update.data_perda = new Date().toISOString().split("T")[0];

    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, etapa: tipo, ...dados } : l));
    await supabase.from("leads").update(update).eq("id", lead.id);
    setModalGanhoPerda(null);
  }

  const activeLead = leads.find((l) => l.id === activeId);

  // Métricas funil
  const totalValor = leads
    .filter((l) => l.etapa !== "perdido")
    .reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0);
  const receitaPonderada = leads
    .filter((l) => l.etapa !== "perdido")
    .reduce((sum, l) => {
      const prob = COLUNAS.find((c) => c.id === l.etapa)?.prob ?? 0;
      return sum + (l.valor_estimado ?? 0) * (prob / 100);
    }, 0);
  const maxLeads = Math.max(...ETAPAS_FUNIL.map((e) => getLeadsByEtapa(e).length), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">CRM / Pipeline</h1>
          <p className="text-text-muted mt-1">Pipeline comercial da Mendonça & Co</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex rounded-btn border border-[#E8D5A3] overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "kanban" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setView("funil")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "funil" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              <TrendingDown size={14} /> Funil
            </button>
          </div>
          <Button variant="secondary" onClick={() => setShowUTM(true)}>
            <Link2 size={16} /> Gerar UTM
          </Button>
          <Button onClick={() => setNovoLeadEtapa("novo")}>
            <Plus size={16} /> Novo Lead
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total no pipeline", value: leads.filter(l => !["ganho","perdido"].includes(l.etapa)).length, suffix: " leads" },
          { label: "Valor total pipeline", value: `R$ ${totalValor.toLocaleString("pt-BR")}`, suffix: "" },
          { label: "Receita ponderada", value: `R$ ${Math.round(receitaPonderada).toLocaleString("pt-BR")}`, suffix: "" },
          { label: "Ganhos este mês", value: leads.filter(l => l.etapa === "ganho" && l.data_ganho?.startsWith(new Date().toISOString().slice(0,7))).length, suffix: " fechados" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-[#E8D5A3]/50 rounded-card p-4">
            <p className="text-xs text-text-muted mb-1">{kpi.label}</p>
            <p className="text-xl font-semibold text-text-main font-mono-data">{kpi.value}{kpi.suffix}</p>
          </div>
        ))}
      </div>

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max">
              {COLUNAS.map((col) => (
                <KanbanColuna
                  key={col.id}
                  coluna={col}
                  leads={getLeadsByEtapa(col.id)}
                  onClickLead={setSelectedLead}
                  onNovoLead={() => setNovoLeadEtapa(col.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? <KanbanCard lead={activeLead} onClick={() => {}} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* FUNIL VIEW */}
      {view === "funil" && (
        <div className="max-w-3xl mx-auto space-y-2">
          {ETAPAS_FUNIL.map((etapa, idx) => {
            const col = COLUNAS.find((c) => c.id === etapa)!;
            const leadsEtapa = getLeadsByEtapa(etapa);
            const prox = ETAPAS_FUNIL[idx + 1] ? getLeadsByEtapa(ETAPAS_FUNIL[idx + 1]).length : null;
            const conv = idx > 0 && getLeadsByEtapa(ETAPAS_FUNIL[idx - 1]).length > 0
              ? Math.round((leadsEtapa.length / getLeadsByEtapa(ETAPAS_FUNIL[idx - 1]).length) * 100)
              : null;
            const valorEtapa = leadsEtapa.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
            const largura = Math.max(30, Math.round((leadsEtapa.length / maxLeads) * 100));

            return (
              <div key={etapa}>
                <div className="flex items-center gap-3">
                  <div className="w-36 text-right">
                    <p className="text-xs font-medium text-text-main">{col.label}</p>
                    {conv !== null && (
                      <p className="text-[10px] text-text-muted">conv. {conv}%</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className="rounded-btn px-4 py-3 flex items-center justify-between transition-all"
                      style={{
                        width: `${largura}%`,
                        backgroundColor: col.cor + "20",
                        borderLeft: `3px solid ${col.cor}`,
                        minWidth: 200,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: col.cor }}>{leadsEtapa.length}</span>
                        <span className="text-xs text-text-muted">leads</span>
                      </div>
                      {valorEtapa > 0 && (
                        <span className="text-xs font-mono-data text-text-muted">
                          R$ {valorEtapa.toLocaleString("pt-BR")}
                        </span>
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

          {/* Perdidos */}
          <div className="mt-6 pt-6 border-t border-[#E8D5A3]/50">
            <div className="flex items-center gap-3">
              <div className="w-36 text-right">
                <p className="text-xs font-medium text-danger">Perdidos</p>
              </div>
              <div className="flex-1">
                <div className="bg-danger/10 border-l-2 border-danger rounded-btn px-4 py-3 flex items-center gap-3" style={{ minWidth: 200 }}>
                  <span className="text-lg font-bold text-danger">{getLeadsByEtapa("perdido").length}</span>
                  <span className="text-xs text-text-muted">leads perdidos</span>
                </div>
              </div>
            </div>
            {/* Motivos de perda */}
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

      {/* Modais */}
      {(selectedLead || novoLeadEtapa) && (
        <LeadModal
          lead={selectedLead}
          etapaInicial={novoLeadEtapa}
          onClose={() => { setSelectedLead(null); setNovoLeadEtapa(null); }}
          onSave={carregar}
          onGanhoPerda={(lead, tipo) => {
            setSelectedLead(null);
            setNovoLeadEtapa(null);
            setModalGanhoPerda({ lead, tipo });
          }}
        />
      )}

      {modalGanhoPerda && (
        <ModalGanhoPerca
          lead={modalGanhoPerda.lead}
          tipo={modalGanhoPerda.tipo}
          onClose={() => setModalGanhoPerda(null)}
          onConfirmar={confirmarGanhoPerda}
        />
      )}

      {showUTM && <GerarUTM onClose={() => setShowUTM(false)} />}
    </div>
  );
}

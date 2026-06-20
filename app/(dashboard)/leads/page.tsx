"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColuna } from "@/components/kanban/kanban-coluna";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { LeadModal } from "@/components/kanban/lead-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Etapa = "novo" | "contato" | "diagnostico" | "proposta" | "negociacao" | "fechado" | "perdido";

export type Lead = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp?: string;
  cargo?: string;
  como_encontrou?: string;
  origem: string;
  etapa: Etapa;
  tipo_servico?: string;
  valor_estimado?: number;
  proxima_acao?: string;
  data_proxima_acao?: string;
  motivo_perda?: string;
  criado_em: string;
  atualizado_em: string;
};

const COLUNAS: { id: Etapa; label: string; cor: string }[] = [
  { id: "novo", label: "Novo Lead", cor: "#6B6B6B" },
  { id: "contato", label: "Contato Realizado", cor: "#C9A84C" },
  { id: "diagnostico", label: "Diagnóstico Agendado", cor: "#2D6A4F" },
  { id: "proposta", label: "Proposta Enviada", cor: "#0D2B2E" },
  { id: "negociacao", label: "Em Negociação", cor: "#E9C46A" },
  { id: "fechado", label: "Fechado", cor: "#2D6A4F" },
  { id: "perdido", label: "Perdido", cor: "#C1121F" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [novoLeadEtapa, setNovoLeadEtapa] = useState<Etapa | null>(null);
  const supabase = createClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregarLeads(); }, []);

  async function carregarLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }

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

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, etapa: novaEtapa } : l));

    await supabase
      .from("leads")
      .update({ etapa: novaEtapa, atualizado_em: new Date().toISOString() })
      .eq("id", leadId);
  }

  const activeLead = leads.find((l) => l.id === activeId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">CRM / Leads</h1>
          <p className="text-text-muted mt-1">Pipeline comercial da Mendonça & Co</p>
        </div>
        <Button onClick={() => setNovoLeadEtapa("novo")}>
          <Plus size={16} />
          Novo Lead
        </Button>
      </div>

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

      {(selectedLead || novoLeadEtapa) && (
        <LeadModal
          lead={selectedLead}
          etapaInicial={novoLeadEtapa}
          onClose={() => { setSelectedLead(null); setNovoLeadEtapa(null); }}
          onSave={carregarLeads}
        />
      )}
    </div>
  );
}

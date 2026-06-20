"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";
import { Plus } from "lucide-react";
import type { Lead, Etapa } from "@/lib/crm/tipos";

type Props = {
  coluna: { id: Etapa; label: string; cor: string; prob: number };
  leads: Lead[];
  onClickLead: (lead: Lead) => void;
  onNovoLead: () => void;
};

export function KanbanColuna({ coluna, leads, onClickLead, onNovoLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });

  const totalValor = leads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
  const receitaPonderada = leads.reduce((s, l) => s + (l.valor_estimado ?? 0) * (coluna.prob / 100), 0);

  return (
    <div className="w-72 flex-shrink-0">
      {/* Header */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coluna.cor }} />
            <span className="text-sm font-semibold text-text-main">{coluna.label}</span>
            <span className="text-xs text-text-muted bg-[#E8D5A3]/40 px-1.5 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>
          <button
            onClick={onNovoLead}
            className="text-text-muted hover:text-gold transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        {totalValor > 0 && (
          <div className="flex items-center gap-3 pl-4">
            <span className="text-[10px] font-mono-data text-text-muted">
              R$ {totalValor.toLocaleString("pt-BR")}
            </span>
            {coluna.prob > 0 && coluna.prob < 100 && (
              <span className="text-[10px] text-text-muted">
                ≈ R$ {Math.round(receitaPonderada).toLocaleString("pt-BR")} pond.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`min-h-32 rounded-card p-2 space-y-2 transition-colors ${
          isOver ? "bg-gold/10 border-2 border-dashed border-gold" : "bg-[#E8D5A3]/20"
        }`}
      >
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onClick={() => onClickLead(lead)} />
        ))}

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-text-muted">
            Nenhum lead aqui
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";
import { Plus } from "lucide-react";
import type { Lead, Etapa } from "@/app/(dashboard)/leads/page";

type Props = {
  coluna: { id: Etapa; label: string; cor: string };
  leads: Lead[];
  onClickLead: (lead: Lead) => void;
  onNovoLead: () => void;
};

export function KanbanColuna({ coluna, leads, onClickLead, onNovoLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });

  return (
    <div className="w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
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

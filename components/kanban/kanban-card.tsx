"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar } from "lucide-react";
import { daysSince } from "@/lib/utils";
import type { Lead } from "@/app/(dashboard)/leads/page";
import { cn } from "@/lib/utils";

const TIPO_LABELS: Record<string, string> = {
  mentoria_3d: "Mentoria 3D",
  palestra: "Palestra",
  diagnostico_board: "Diag. Board",
  mentoria_expressa: "M. Expressa",
};

type Props = {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
};

export function KanbanCard({ lead, onClick, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });

  const dias = daysSince(lead.atualizado_em);
  const alerta = dias > 7;

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "bg-surface rounded-btn p-3 border border-[#E8D5A3]/50 cursor-pointer hover:border-gold/50 hover:shadow-sm transition-all select-none",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-text-main leading-tight">{lead.nome}</p>
          {lead.empresa && (
            <p className="text-xs text-text-muted mt-0.5">{lead.empresa}</p>
          )}
        </div>
        {alerta && <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {lead.tipo_servico && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            {TIPO_LABELS[lead.tipo_servico] ?? lead.tipo_servico}
          </Badge>
        )}
        {lead.valor_estimado && (
          <span className="text-[10px] font-mono-data text-text-muted">
            R$ {lead.valor_estimado.toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {lead.proxima_acao && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-text-muted">
          <Calendar size={10} />
          <span className="truncate">{lead.proxima_acao}</span>
        </div>
      )}

      <div className="mt-2 text-[10px] text-text-muted">
        {alerta ? (
          <span className="text-danger font-medium">{dias}d sem contato</span>
        ) : (
          <span>{dias === 0 ? "Hoje" : `${dias}d atrás`}</span>
        )}
      </div>
    </div>
  );
}

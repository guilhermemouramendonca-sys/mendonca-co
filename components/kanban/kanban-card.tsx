"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CalendarCheck } from "lucide-react";
import { daysSince } from "@/lib/utils";
import type { Lead } from "@/lib/crm/tipos";
import { cn } from "@/lib/utils";

const TIPO_LABELS: Record<string, string> = {
  mentoria_3d: "Mentoria 3D",
  palestra: "Palestra",
  diagnostico_board: "Diag. Board",
  mentoria_expressa: "M. Expressa",
};

const UTM_LABELS: Record<string, string> = {
  youtube: "YT",
  instagram: "IG",
  linkedin: "LI",
  substack: "SUB",
  whatsapp: "WA",
  indicacao: "IND",
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

  const fechamentoPrevisto = lead.data_fechamento_prevista
    ? new Date(lead.data_fechamento_prevista + "T00:00:00")
    : null;
  const diasParaFechamento = fechamentoPrevisto
    ? Math.ceil((fechamentoPrevisto.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const fechamentoAtrasado = diasParaFechamento !== null && diasParaFechamento < 0;

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
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-main leading-tight truncate">{lead.nome}</p>
          {lead.empresa && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{lead.empresa}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {lead.utm_source && (
            <span className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {UTM_LABELS[lead.utm_source] ?? lead.utm_source.toUpperCase()}
            </span>
          )}
          {alerta && <AlertCircle size={14} className="text-danger" />}
        </div>
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

      {fechamentoPrevisto && (
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[10px]",
          fechamentoAtrasado ? "text-danger" : "text-text-muted"
        )}>
          <CalendarCheck size={10} />
          <span>
            {fechamentoAtrasado
              ? `Fechamento atrasado ${Math.abs(diasParaFechamento!)}d`
              : diasParaFechamento === 0
              ? "Fechar hoje"
              : `Fechar em ${diasParaFechamento}d`}
          </span>
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

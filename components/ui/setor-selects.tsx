"use client";

import { Label } from "@/components/ui/label";
import { CATEGORIAS, SEGMENTOS } from "@/lib/benchmarks/categorias";

interface SetorSelectsProps {
  categoria: string;
  segmento: string;
  faturamento: string;
  onCategoria: (v: string) => void;
  onSegmento: (v: string) => void;
  onFaturamento: (v: string) => void;
  className?: string;
}

const selectCls =
  "w-full h-10 px-3 rounded-btn border border-[#E8D5A3]/50 bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30";

export function SetorSelects({
  categoria, segmento, faturamento,
  onCategoria, onSegmento, onFaturamento,
  className,
}: SetorSelectsProps) {
  return (
    <div className={className}>
      <div className="space-y-1.5">
        <Label>Setor / Categoria</Label>
        <select value={categoria} onChange={(e) => onCategoria(e.target.value)} className={selectCls}>
          <option value="">Selecionar (opcional)</option>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 mt-4">
        <Label>Segmento</Label>
        <select value={segmento} onChange={(e) => onSegmento(e.target.value)} className={selectCls}>
          <option value="">Selecionar (opcional)</option>
          {SEGMENTOS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 mt-4">
        <Label>Faturamento anual</Label>
        <select value={faturamento} onChange={(e) => onFaturamento(e.target.value)} className={selectCls}>
          <option value="">Selecionar (opcional)</option>
          <option value="micro">Até R$360K/ano (MEI/Micro)</option>
          <option value="pequena">R$360K a R$4,8M/ano (Pequena)</option>
          <option value="media">R$4,8M a R$300M/ano (Média)</option>
          <option value="grande">Acima de R$300M/ano (Grande)</option>
        </select>
      </div>
    </div>
  );
}

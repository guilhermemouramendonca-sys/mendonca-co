"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Lead } from "@/lib/crm/tipos";
import { Trophy, XCircle, X } from "lucide-react";

const CATEGORIAS_PERDA = [
  { id: "preco", label: "Preço alto" },
  { id: "concorrente", label: "Escolheu concorrente" },
  { id: "timing", label: "Timing ruim" },
  { id: "sem_budget", label: "Sem budget" },
  { id: "sem_fit", label: "Sem fit" },
  { id: "nao_respondeu", label: "Não respondeu" },
  { id: "outro", label: "Outro motivo" },
];

type Props = {
  lead: Lead;
  tipo: "ganho" | "perdido";
  onClose: () => void;
  onConfirmar: (lead: Lead, tipo: "ganho" | "perdido", dados: Record<string, string>) => void;
};

export function ModalGanhoPerca({ lead, tipo, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valorFechado, setValorFechado] = useState(lead.valor_estimado?.toString() ?? "");
  const [dataGanho, setDataGanho] = useState(new Date().toISOString().split("T")[0]);

  const isGanho = tipo === "ganho";

  const podeConfirmar = isGanho
    ? motivo.trim().length > 0
    : motivo.trim().length > 0 && categoria.length > 0;

  function confirmar() {
    if (!podeConfirmar) return;
    const dados: Record<string, string> = isGanho
      ? { motivo_ganho: motivo, valor_fechado: valorFechado, data_ganho: dataGanho }
      : { motivo_perda: motivo, categoria_perda: categoria };
    onConfirmar(lead, tipo, dados);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-card shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isGanho
              ? <Trophy className="text-[#2D6A4F]" size={22} />
              : <XCircle className="text-danger" size={22} />}
            <div>
              <h2 className="font-display text-xl font-bold text-text-main">
                {isGanho ? "Negócio Ganho!" : "Negócio Perdido"}
              </h2>
              <p className="text-xs text-text-muted">{lead.nome} · {lead.empresa}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {isGanho ? (
            <>
              <div className="space-y-1.5">
                <Label>Valor fechado (R$) *</Label>
                <Input
                  type="number"
                  value={valorFechado}
                  onChange={(e) => setValorFechado(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de fechamento</Label>
                <Input type="date" value={dataGanho} onChange={(e) => setDataGanho(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>O que foi decisivo para fechar? *</Label>
                <textarea
                  className="w-full rounded-btn border border-[#E8D5A3] bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                  placeholder="Ex: preço competitivo, fit com o serviço, urgência do cliente..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Categoria de perda *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS_PERDA.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoria(cat.id)}
                      className={`px-3 py-2 rounded-btn text-xs font-medium text-left border transition-colors ${
                        categoria === cat.id
                          ? "bg-danger/10 border-danger text-danger"
                          : "border-[#E8D5A3] text-text-muted hover:text-text-main hover:border-[#C9A84C]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Detalhes do motivo *</Label>
                <textarea
                  className="w-full rounded-btn border border-[#E8D5A3] bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                  placeholder="Descreva o que levou à perda desse negócio..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            onClick={confirmar}
            disabled={!podeConfirmar}
            style={isGanho ? { backgroundColor: "#2D6A4F" } : { backgroundColor: "#C1121F" }}
          >
            {isGanho ? "Confirmar ganho" : "Registrar perda"}
          </Button>
        </div>
      </div>
    </div>
  );
}

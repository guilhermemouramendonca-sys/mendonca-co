"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Perspectiva = "Financeira" | "Clientes" | "Processos Internos" | "Aprendizado";

export type BscIndicador = {
  id: string;
  cliente_id: string;
  perspectiva: Perspectiva;
  nome: string;
  objetivo_estrategico: string;
  meta: number;
  resultado_atual: number;
  unidade: string;
  tendencia: "melhora" | "estavel" | "piora";
};

const PERSPECTIVAS: { key: Perspectiva; emoji: string; descricao: string; cor: string }[] = [
  { key: "Financeira",        emoji: "💰", descricao: "Crescimento e lucratividade",  cor: "#27AE60" },
  { key: "Clientes",          emoji: "🤝", descricao: "Satisfação e retenção",         cor: "#2980B9" },
  { key: "Processos Internos",emoji: "⚙️",  descricao: "Eficiência e qualidade",       cor: "#8E44AD" },
  { key: "Aprendizado",       emoji: "📚", descricao: "Pessoas, cultura e inovação",   cor: "#C9A84C" },
];

const TENDENCIA_ICONS = {
  melhora: TrendingUp,
  estavel: Minus,
  piora: TrendingDown,
};
const TENDENCIA_CORES = { melhora: "#27AE60", estavel: "#C9A84C", piora: "#C0392B" };

const EMPTY: Omit<BscIndicador, "id" | "cliente_id"> = {
  perspectiva: "Financeira",
  nome: "",
  objetivo_estrategico: "",
  meta: 100,
  resultado_atual: 0,
  unidade: "%",
  tendencia: "estavel",
};

function semaforo(meta: number, atual: number): string {
  if (meta <= 0) return "#95A5A6";
  const pct = (atual / meta) * 100;
  if (pct >= 90) return "#27AE60";
  if (pct >= 70) return "#C9A84C";
  return "#C0392B";
}

export default function BSCTab({ clienteId, indicadores, onRefresh }: {
  clienteId: string; indicadores: BscIndicador[]; onRefresh: () => void;
}) {
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<BscIndicador | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [salvando, setSalvando] = useState(false);

  function abrirNovo(perspectiva?: Perspectiva) {
    setEditando(null);
    setForm({ ...EMPTY, perspectiva: perspectiva ?? "Financeira" });
    setModalAberto(true);
  }

  function abrirEditar(ind: BscIndicador) {
    setEditando(ind);
    setForm({ perspectiva: ind.perspectiva, nome: ind.nome, objetivo_estrategico: ind.objetivo_estrategico, meta: ind.meta, resultado_atual: ind.resultado_atual, unidade: ind.unidade, tendencia: ind.tendencia });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    if (editando) {
      await supabase.from("bsc_indicadores").update(form).eq("id", editando.id);
    } else {
      await supabase.from("bsc_indicadores").insert({ ...form, cliente_id: clienteId });
    }
    setSalvando(false);
    setModalAberto(false);
    onRefresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir indicador?")) return;
    await supabase.from("bsc_indicadores").delete().eq("id", id);
    onRefresh();
  }

  async function atualizarAtual(id: string, valor: number) {
    await supabase.from("bsc_indicadores").update({ resultado_atual: valor }).eq("id", id);
    onRefresh();
  }

  // Score geral por perspectiva
  function scorePersp(persp: Perspectiva): number {
    const inds = indicadores.filter((i) => i.perspectiva === persp);
    if (inds.length === 0) return 0;
    const pcts = inds.map((i) => Math.min(100, i.meta > 0 ? (i.resultado_atual / i.meta) * 100 : 0));
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  const scoreGeral = PERSPECTIVAS.length > 0
    ? Math.round(PERSPECTIVAS.reduce((s, p) => s + scorePersp(p.key), 0) / PERSPECTIVAS.length)
    : 0;

  return (
    <div>
      {/* Score geral */}
      {indicadores.length > 0 && (
        <div className="flex items-center gap-6 mb-8 p-5 bg-surface rounded-card border border-[#E8D5A3]/50">
          <div className="text-center">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">BSC Geral</p>
            <p className="font-mono-data text-4xl font-bold" style={{ color: semaforo(100, scoreGeral) }}>{scoreGeral}%</p>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-3">
            {PERSPECTIVAS.map((p) => {
              const s = scorePersp(p.key);
              const n = indicadores.filter((i) => i.perspectiva === p.key).length;
              return (
                <div key={p.key} className="text-center">
                  <p className="text-lg mb-1">{p.emoji}</p>
                  <p className="text-xs text-text-muted leading-tight">{p.key}</p>
                  {n > 0 ? (
                    <p className="font-mono-data text-lg font-bold mt-1" style={{ color: semaforo(100, s) }}>{s}%</p>
                  ) : (
                    <p className="text-xs text-text-muted/50 mt-1">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid 2x2 de perspectivas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERSPECTIVAS.map((persp) => {
          const inds = indicadores.filter((i) => i.perspectiva === persp.key);
          return (
            <div key={persp.key} className="bg-surface rounded-card border border-[#E8D5A3]/50 overflow-hidden">
              {/* Header da perspectiva */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8D5A3]/30" style={{ borderLeftWidth: 3, borderLeftColor: persp.cor }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{persp.emoji}</span>
                    <h3 className="font-display text-base font-semibold text-text-main">{persp.key}</h3>
                  </div>
                  <p className="text-xs text-text-muted">{persp.descricao}</p>
                </div>
                <button
                  onClick={() => abrirNovo(persp.key)}
                  className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded transition-colors"
                  title="Adicionar indicador"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Indicadores */}
              <div className="p-4">
                {inds.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4 opacity-60">Nenhum indicador. <button onClick={() => abrirNovo(persp.key)} className="text-gold hover:underline">Adicionar</button></p>
                ) : (
                  <div className="space-y-4">
                    {inds.map((ind) => {
                      const pct = ind.meta > 0 ? Math.min(100, (ind.resultado_atual / ind.meta) * 100) : 0;
                      const cor = semaforo(ind.meta, ind.resultado_atual);
                      const TendIcon = TENDENCIA_ICONS[ind.tendencia];
                      return (
                        <div key={ind.id}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                                <p className="text-sm font-medium text-text-main truncate">{ind.nome}</p>
                              </div>
                              {ind.objetivo_estrategico && (
                                <p className="text-[10px] text-text-muted ml-3.5 mt-0.5 truncate">{ind.objetivo_estrategico}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <TendIcon size={13} style={{ color: TENDENCIA_CORES[ind.tendencia] }} />
                              <button onClick={() => abrirEditar(ind)} className="p-1 text-text-muted hover:text-text-main rounded transition-colors"><Pencil size={11} /></button>
                              <button onClick={() => excluir(ind.id)} className="p-1 text-text-muted hover:text-danger rounded transition-colors"><Trash2 size={11} /></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <input
                                type="number"
                                value={ind.resultado_atual}
                                onChange={(e) => atualizarAtual(ind.id, Number(e.target.value))}
                                className="w-16 h-6 text-xs text-center rounded border border-[#E8D5A3] bg-bg text-text-main focus:outline-none focus:ring-1 focus:ring-gold/30"
                              />
                              <span className="text-[10px] text-text-muted">/{ind.meta} {ind.unidade}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {indicadores.length === 0 && (
        <div className="text-center py-8 text-text-muted mt-4">
          <p className="text-sm">Clique em <strong>+</strong> em qualquer perspectiva para adicionar um indicador.</p>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8D5A3]/30">
              <h2 className="font-display text-xl font-semibold text-text-main">{editando ? "Editar indicador" : "Novo indicador BSC"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Perspectiva</Label>
                <select value={form.perspectiva} onChange={(e) => setForm({ ...form, perspectiva: e.target.value as Perspectiva })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                  {PERSPECTIVAS.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.key}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome do indicador *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Receita recorrente (MRR)" />
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo estratégico</Label>
                <Input value={form.objetivo_estrategico} onChange={(e) => setForm({ ...form, objetivo_estrategico: e.target.value })} placeholder="Ex: Aumentar lucratividade" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Meta</Label>
                  <Input type="number" value={form.meta} onChange={(e) => setForm({ ...form, meta: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Resultado atual</Label>
                  <Input type="number" value={form.resultado_atual} onChange={(e) => setForm({ ...form, resultado_atual: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="% R$ un" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tendência</Label>
                <div className="flex gap-2">
                  {(["melhora", "estavel", "piora"] as const).map((t) => {
                    const Icon = TENDENCIA_ICONS[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, tendencia: t })}
                        className={`flex-1 py-2 rounded-btn text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${form.tendencia === t ? "border-transparent text-white" : "border-[#E8D5A3]/50 text-text-muted hover:text-text-main"}`}
                        style={form.tendencia === t ? { backgroundColor: TENDENCIA_CORES[t] } : {}}
                      >
                        <Icon size={12} /> {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.nome.trim()}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

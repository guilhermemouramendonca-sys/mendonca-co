"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Target, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type KeyResult = {
  id: string;
  descricao: string;
  meta: number;
  atual: number;
  unidade: string;
};

export type OKR = {
  id: string;
  cliente_id: string;
  ciclo: string;
  objetivo: string;
  responsavel: string;
  prazo: string | null;
  key_results: KeyResult[];
  status: "em_andamento" | "concluido" | "cancelado";
};

const STATUS_LABELS: Record<string, string> = { em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado" };
const STATUS_CORES: Record<string, string> = { em_andamento: "#C9A84C", concluido: "#27AE60", cancelado: "#95A5A6" };

function newKR(): KeyResult {
  return { id: crypto.randomUUID(), descricao: "", meta: 100, atual: 0, unidade: "%" };
}

const EMPTY_OKR = {
  ciclo: "Q3 2025", objetivo: "", responsavel: "", prazo: null as string | null,
  key_results: [newKR()], status: "em_andamento" as OKR["status"],
};

function progressoOKR(krs: KeyResult[]): number {
  if (krs.length === 0) return 0;
  const pcts = krs.map((kr) => Math.min(100, kr.meta > 0 ? (kr.atual / kr.meta) * 100 : 0));
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

function corProgresso(pct: number): string {
  if (pct >= 70) return "#27AE60";
  if (pct >= 40) return "#C9A84C";
  return "#C0392B";
}

export default function OKRsTab({ clienteId, okrs, onRefresh }: {
  clienteId: string; okrs: OKR[]; onRefresh: () => void;
}) {
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<OKR | null>(null);
  const [form, setForm] = useState(EMPTY_OKR);
  const [salvando, setSalvando] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  function abrirNovo() { setEditando(null); setForm({ ...EMPTY_OKR, key_results: [newKR()] }); setModalAberto(true); }
  function abrirEditar(okr: OKR) {
    setEditando(okr);
    setForm({ ciclo: okr.ciclo, objetivo: okr.objetivo, responsavel: okr.responsavel, prazo: okr.prazo, key_results: okr.key_results, status: okr.status });
    setModalAberto(true);
  }

  function updateKR(idx: number, field: keyof KeyResult, value: string | number) {
    const krs = [...form.key_results];
    krs[idx] = { ...krs[idx], [field]: value };
    setForm({ ...form, key_results: krs });
  }

  function addKR() { setForm({ ...form, key_results: [...form.key_results, newKR()] }); }
  function removeKR(idx: number) { setForm({ ...form, key_results: form.key_results.filter((_, i) => i !== idx) }); }

  async function salvar() {
    if (!form.objetivo.trim()) return;
    setSalvando(true);
    const payload = { ...form, cliente_id: clienteId };
    if (editando) {
      await supabase.from("okrs").update(form).eq("id", editando.id);
    } else {
      await supabase.from("okrs").insert(payload);
    }
    setSalvando(false);
    setModalAberto(false);
    onRefresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este OKR?")) return;
    await supabase.from("okrs").delete().eq("id", id);
    onRefresh();
  }

  async function atualizarProgresso(okrId: string, krId: string, atual: number) {
    const okr = okrs.find((o) => o.id === okrId);
    if (!okr) return;
    const krs = okr.key_results.map((kr) => kr.id === krId ? { ...kr, atual } : kr);
    await supabase.from("okrs").update({ key_results: krs }).eq("id", okrId);
    onRefresh();
  }

  // Agrupar por ciclo
  const porCiclo: Record<string, OKR[]> = {};
  for (const o of okrs) {
    if (!porCiclo[o.ciclo]) porCiclo[o.ciclo] = [];
    porCiclo[o.ciclo].push(o);
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={abrirNovo}><Plus size={15} /> Novo OKR</Button>
      </div>

      {okrs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhum OKR cadastrado.</p>
          <Button onClick={abrirNovo}><Plus size={15} /> Criar primeiro OKR</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(porCiclo).sort(([a], [b]) => b.localeCompare(a)).map(([ciclo, lista]) => {
            const mediaGeral = Math.round(lista.reduce((s, o) => s + progressoOKR(o.key_results), 0) / lista.length);
            return (
              <div key={ciclo}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-display text-lg font-semibold text-text-main">{ciclo}</h3>
                  <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2 max-w-32">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${mediaGeral}%`, backgroundColor: corProgresso(mediaGeral) }} />
                  </div>
                  <span className="text-sm font-mono-data font-semibold" style={{ color: corProgresso(mediaGeral) }}>{mediaGeral}%</span>
                </div>
                <div className="space-y-3">
                  {lista.map((okr) => {
                    const pct = progressoOKR(okr.key_results);
                    const isExpanded = expandido === okr.id;
                    return (
                      <div key={okr.id} className="bg-surface rounded-card border border-[#E8D5A3]/50 overflow-hidden">
                        {/* Header */}
                        <div
                          className="flex items-start gap-4 p-4 cursor-pointer"
                          onClick={() => setExpandido(isExpanded ? null : okr.id)}
                        >
                          {/* Progress circle */}
                          <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border-2 relative"
                            style={{ borderColor: corProgresso(pct) }}>
                            <span className="text-xs font-mono-data font-bold" style={{ color: corProgresso(pct) }}>{pct}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-text-main">{okr.objetivo}</p>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {okr.responsavel}
                                  {okr.prazo && ` · até ${new Date(okr.prazo).toLocaleDateString("pt-BR")}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: STATUS_CORES[okr.status], backgroundColor: STATUS_CORES[okr.status] + "20" }}>
                                  {STATUS_LABELS[okr.status]}
                                </span>
                                <span className="text-[10px] text-text-muted ml-1">{okr.key_results.length} KR{okr.key_results.length !== 1 ? "s" : ""}</span>
                              </div>
                            </div>
                            {/* KR mini bars */}
                            {!isExpanded && (
                              <div className="flex gap-1 mt-2">
                                {okr.key_results.slice(0, 6).map((kr) => {
                                  const p = Math.min(100, kr.meta > 0 ? (kr.atual / kr.meta) * 100 : 0);
                                  return (
                                    <div key={kr.id} className="flex-1 bg-[#E8D5A3]/30 rounded-full h-1.5">
                                      <div className="h-1.5 rounded-full" style={{ width: `${p}%`, backgroundColor: corProgresso(p) }} />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <button onClick={(e) => { e.stopPropagation(); abrirEditar(okr); }} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded transition-colors"><Pencil size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); excluir(okr.id); }} className="p-1.5 text-text-muted hover:text-danger hover:bg-bg rounded transition-colors"><Trash2 size={13} /></button>
                            {isExpanded ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
                          </div>
                        </div>

                        {/* Key Results expandidos */}
                        {isExpanded && (
                          <div className="border-t border-[#E8D5A3]/30 px-4 pb-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mt-4 mb-3">Key Results</p>
                            <div className="space-y-4">
                              {okr.key_results.map((kr) => {
                                const p = Math.min(100, kr.meta > 0 ? (kr.atual / kr.meta) * 100 : 0);
                                return (
                                  <div key={kr.id}>
                                    <div className="flex items-center justify-between mb-1.5 gap-4">
                                      <p className="text-sm text-text-main flex-1">{kr.descricao}</p>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <input
                                          type="number"
                                          value={kr.atual}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => atualizarProgresso(okr.id, kr.id, Number(e.target.value))}
                                          className="w-16 h-7 text-xs text-center rounded border border-[#E8D5A3] bg-bg text-text-main focus:outline-none focus:ring-1 focus:ring-gold/30"
                                        />
                                        <span className="text-xs text-text-muted">/ {kr.meta} {kr.unidade}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: corProgresso(p) }} />
                                      </div>
                                      <span className="text-xs font-mono-data w-8 text-right" style={{ color: corProgresso(p) }}>{Math.round(p)}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8D5A3]/30">
              <h2 className="font-display text-xl font-semibold text-text-main">{editando ? "Editar OKR" : "Novo OKR"}</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label>Objetivo *</Label>
                <Input value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} placeholder="Ex: Aumentar a satisfação dos clientes ao nível mais alto" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Ciclo</Label>
                  <Input value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} placeholder="Q3 2025" />
                </div>
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome" />
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo</Label>
                  <Input type="date" value={form.prazo ?? ""} onChange={(e) => setForm({ ...form, prazo: e.target.value || null })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OKR["status"] })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Key Results */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Key Results</Label>
                  <button onClick={addKR} className="text-xs text-gold hover:underline flex items-center gap-1"><Plus size={12} /> Adicionar KR</button>
                </div>
                <div className="space-y-3">
                  {form.key_results.map((kr, idx) => (
                    <div key={kr.id} className="bg-bg rounded-btn p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-data text-text-muted w-5">KR{idx + 1}</span>
                        <Input
                          value={kr.descricao}
                          onChange={(e) => updateKR(idx, "descricao", e.target.value)}
                          placeholder="Descrição do resultado-chave"
                          className="flex-1"
                        />
                        {form.key_results.length > 1 && (
                          <button onClick={() => removeKR(idx)} className="text-text-muted hover:text-danger flex-shrink-0"><Trash2 size={13} /></button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                        <span className="text-xs text-text-muted">Atual:</span>
                        <Input type="number" value={kr.atual} onChange={(e) => updateKR(idx, "atual", Number(e.target.value))} className="w-20" />
                        <span className="text-xs text-text-muted">Meta:</span>
                        <Input type="number" value={kr.meta} onChange={(e) => updateKR(idx, "meta", Number(e.target.value))} className="w-20" />
                        <Input value={kr.unidade} onChange={(e) => updateKR(idx, "unidade", e.target.value)} placeholder="%" className="w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.objetivo.trim()}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { cn };

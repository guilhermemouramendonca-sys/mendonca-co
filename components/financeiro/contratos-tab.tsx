"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export type Contrato = {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  tipo: "retainer" | "projeto" | "avulso";
  descricao: string;
  valor_mensal: number;
  valor_total: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: "ativo" | "pausado" | "encerrado" | "cancelado";
  observacoes: string | null;
  criado_em: string;
};

type Cliente = { id: string; nome: string };

const TIPO_LABELS: Record<string, string> = { retainer: "Retainer mensal", projeto: "Projeto", avulso: "Avulso" };
const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", pausado: "Pausado", encerrado: "Encerrado", cancelado: "Cancelado" };
const STATUS_CORES: Record<string, string> = { ativo: "#27AE60", pausado: "#C9A84C", encerrado: "#95A5A6", cancelado: "#C0392B" };
const TIPO_CORES: Record<string, string> = { retainer: "#0D2B2E", projeto: "#2980B9", avulso: "#8E44AD" };

const EMPTY = {
  cliente_id: "",
  tipo: "retainer" as Contrato["tipo"],
  descricao: "",
  valor_mensal: 0,
  valor_total: null as number | null,
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: null as string | null,
  status: "ativo" as Contrato["status"],
  observacoes: null as string | null,
};

export default function ContratosTab({ contratos, clientes, onRefresh }: {
  contratos: Contrato[]; clientes: Cliente[]; onRefresh: () => void;
}) {
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Contrato | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativo");

  function abrirNovo() { setEditando(null); setForm({ ...EMPTY, cliente_id: clientes[0]?.id ?? "" }); setModalAberto(true); }
  function abrirEditar(c: Contrato) {
    setEditando(c);
    setForm({ cliente_id: c.cliente_id, tipo: c.tipo, descricao: c.descricao, valor_mensal: c.valor_mensal, valor_total: c.valor_total, data_inicio: c.data_inicio, data_fim: c.data_fim, status: c.status, observacoes: c.observacoes });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.cliente_id || !form.descricao.trim()) return;
    setSalvando(true);
    if (editando) {
      await supabase.from("contratos").update(form).eq("id", editando.id);
    } else {
      await supabase.from("contratos").insert(form);
    }
    setSalvando(false);
    setModalAberto(false);
    onRefresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir contrato?")) return;
    await supabase.from("contratos").delete().eq("id", id);
    onRefresh();
  }

  const filtrados = filtroStatus === "todos" ? contratos : contratos.filter((c) => c.status === filtroStatus);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {["ativo", "pausado", "encerrado", "todos"].map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${filtroStatus === s ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main border border-[#E8D5A3]/50"}`}
            >
              {s === "todos" ? "Todos" : STATUS_LABELS[s]}
              <span className="ml-1.5 opacity-60">({s === "todos" ? contratos.length : contratos.filter((c) => c.status === s).length})</span>
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={abrirNovo}><Plus size={15} /> Novo contrato</Button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhum contrato encontrado.</p>
          <Button onClick={abrirNovo}><Plus size={15} /> Criar contrato</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => {
            const diasRestantes = c.data_fim
              ? Math.ceil((new Date(c.data_fim).getTime() - Date.now()) / 86400000)
              : null;
            const alertaVencimento = diasRestantes !== null && diasRestantes <= 30 && c.status === "ativo";
            return (
              <div key={c.id} className={`bg-surface rounded-card border p-5 ${alertaVencimento ? "border-warning/50" : "border-[#E8D5A3]/50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: TIPO_CORES[c.tipo] }}>
                        {TIPO_LABELS[c.tipo]}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: STATUS_CORES[c.status], backgroundColor: STATUS_CORES[c.status] + "20" }}>
                        {STATUS_LABELS[c.status]}
                      </span>
                      {alertaVencimento && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-warning bg-warning/10">
                          ⚠ Vence em {diasRestantes} dias
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-text-main">{c.cliente_nome}</p>
                    <p className="text-sm text-text-muted">{c.descricao}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      <span>Início: {formatDate(c.data_inicio)}</span>
                      {c.data_fim && <span>Fim: {formatDate(c.data_fim)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.tipo === "retainer" && (
                      <p className="font-mono-data text-lg font-bold text-text-main">{formatCurrency(c.valor_mensal)}<span className="text-xs text-text-muted font-normal">/mês</span></p>
                    )}
                    {c.valor_total && (
                      <p className="font-mono-data text-sm text-text-muted">Total: {formatCurrency(c.valor_total)}</p>
                    )}
                    <div className="flex gap-1 justify-end mt-2">
                      <button onClick={() => abrirEditar(c)} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => excluir(c.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-bg rounded transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8D5A3]/30">
              <h2 className="font-display text-xl font-semibold text-text-main">{editando ? "Editar contrato" : "Novo contrato"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">Selecionar cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Contrato["tipo"] })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Contrato["status"] })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição *</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Mentoria executiva mensal — CEO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{form.tipo === "retainer" ? "Valor mensal (R$)" : "Valor (R$)"}</Label>
                  <Input type="number" value={form.valor_mensal || ""} onChange={(e) => setForm({ ...form, valor_mensal: Number(e.target.value) })} placeholder="0" />
                </div>
                {form.tipo !== "retainer" && (
                  <div className="space-y-1.5">
                    <Label>Valor total (R$)</Label>
                    <Input type="number" value={form.valor_total ?? ""} onChange={(e) => setForm({ ...form, valor_total: e.target.value ? Number(e.target.value) : null })} placeholder="0" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Término (opcional)</Label>
                  <Input type="date" value={form.data_fim ?? ""} onChange={(e) => setForm({ ...form, data_fim: e.target.value || null })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value || null })} placeholder="Notas, condições especiais..." rows={2} className="w-full px-3 py-2 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
            </div>
            <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.cliente_id || !form.descricao.trim()}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
